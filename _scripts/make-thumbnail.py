#!/usr/bin/env python3
"""
Take the thumbnail for a game on the Games page: a screenshot of the game in
a headless Firefox, cropped to the title and the top of the board, and saved
as assets/images/games/<slug>.webp (240 x 180).

    python3 _scripts/make-thumbnail.py fia                  one game
    python3 _scripts/make-thumbnail.py ludo fia reversi     several games
    python3 _scripts/make-thumbnail.py tic-tac-toe --moves "[0, 4, 1, 3, 2].forEach(i => document.querySelectorAll('.square')[i].click())"

--moves is JavaScript that runs after the game has started, before the
screenshot, so the board doesn't have to be empty. It can use the game's own
functions, like play(row, col).

How it works:

  1. Makes a page from pages/games/<slug>.html: the site's style.css, the
     game's css and js from the front matter, and the HTML in <div class="game">.
     That is the real game page, without the site header and footer.
  2. Serves it on localhost from a temporary folder with links to css/ and
     assets/, so paths like /assets/fonts/... work, as on the site.
  3. Takes a screenshot 560 pixels wide with firefox --headless, with a new
     empty profile, so nothing old comes from a cache.
  4. Finds the white game card on the grey page, cuts out a 460 x 345 area
     centered on it from just below its top edge, and makes it 240 x 180.
     The same size for every game, so the titles are the same size too. A card
     narrower than 460 pixels, like Tic Tac Toe's, is cut at its own width.

Needs: Python 3, PyYAML and Pillow (apt install python3-yaml python3-pil),
and Firefox.
"""

import argparse
import functools
import http.server
import re
import shutil
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

import yaml
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/images/games"

WINDOW = (560, 800)          # the browser window, in pixels
CROP_WIDTH = 460             # the part of the card to keep, 4:3, or less if the card is narrower
CROP_TOP = 12                # pixels below the top of the card
THUMBNAIL = (240, 180)
PAGE_COLOR = "#f0f0f0"       # the grey around the card


def read_page(slug):
    """The front matter (a dict) and the HTML of a game's page."""
    path = ROOT / "pages/games" / f"{slug}.html"
    if not path.is_file():
        sys.exit(f"{slug}: there is no pages/games/{slug}.html")
    match = re.match(r"^---\n(.*?)\n---\n(.*)$", path.read_text(encoding="utf-8"), re.S)
    if not match:
        sys.exit(f"{path}: no front matter")
    return yaml.safe_load(match.group(1)) or {}, match.group(2)


def test_page(slug, moves):
    """The game on a page of its own, without the site header and footer."""
    front, body = read_page(slug)
    body = body.replace("{{ site.baseurl }}", "")
    lines = [
        "<!DOCTYPE html>",
        '<html lang="en">',
        "<head>",
        '  <meta charset="utf-8">',
        '  <link rel="stylesheet" href="/css/style.css">',
    ]
    lines += [f'  <link rel="stylesheet" href="{href}">' for href in front.get("css") or []]
    lines += [
        f"  <style>body {{ margin: 0; background-color: {PAGE_COLOR}; }}</style>",
        "</head>",
        "<body>",
        '<div class="game">',
        body,
        "</div>",
    ]
    lines += [f'<script src="{src}"></script>' for src in front.get("js") or []]
    if moves:
        lines += ["<script>", moves, "</script>"]
    lines += ["</body>", "</html>", ""]
    return "\n".join(lines)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def screenshot(slug, moves, folder):
    """Serve the test page and take a screenshot of it. Returns the PNG path."""
    site = folder / "site"
    site.mkdir()
    (site / "css").symlink_to(ROOT / "css")
    (site / "assets").symlink_to(ROOT / "assets")
    (site / "index.html").write_text(test_page(slug, moves), encoding="utf-8")

    handler = functools.partial(QuietHandler, directory=str(site))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    png = folder / f"{slug}.png"
    profile = folder / "profile"
    profile.mkdir()
    try:
        subprocess.run(
            ["firefox", "--headless", "--no-remote", "--profile", str(profile),
             "--window-size", f"{WINDOW[0]},{WINDOW[1]}",
             "--screenshot", str(png), f"http://127.0.0.1:{server.server_port}/index.html"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
    finally:
        server.shutdown()
    if not png.is_file():
        sys.exit(f"{slug}: Firefox didn't take a screenshot")
    return png


def crop(png):
    """Cut out the title and the top of the board, 240 x 180."""
    image = Image.open(png).convert("RGB")
    width, height = image.size
    white = (255, 255, 255)

    # The card's left and right edge, on a line through its middle part.
    y = 200
    xs = [x for x in range(width) if image.getpixel((x, y)) == white]
    if not xs:
        sys.exit(f"{png.name}: no white game card in the screenshot")
    left, right = xs[0], xs[-1]

    # The card's top edge, in its padding just inside the left edge.
    x = left + 10
    top = next((y for y in range(height) if image.getpixel((x, y)) == white), None)
    if top is None:
        sys.exit(f"{png.name}: can't find the top of the game card")

    # Never wider than the card, or the grey page and the card's soft edge
    # show at the sides.
    crop_width = min(CROP_WIDTH, right - left + 1 - 4)
    center = (left + right) // 2
    box = (center - crop_width // 2, top + CROP_TOP,
           center + crop_width // 2, top + CROP_TOP + crop_width * THUMBNAIL[1] // THUMBNAIL[0])
    return image.crop(box).resize(THUMBNAIL, Image.LANCZOS)


def main():
    parser = argparse.ArgumentParser(description="Take the Games page thumbnail for one or more games.")
    parser.add_argument("slugs", nargs="+", help="games, as in pages/games/<slug>.html")
    parser.add_argument("--moves", help="JavaScript to run before the screenshot, for one game")
    args = parser.parse_args()
    if args.moves and len(args.slugs) > 1:
        sys.exit("--moves is for one game at a time")
    if not shutil.which("firefox"):
        sys.exit("needs Firefox: apt install firefox")

    for slug in args.slugs:
        read_page(slug)   # stop early on a wrong slug
        with tempfile.TemporaryDirectory() as folder:
            png = screenshot(slug, args.moves, Path(folder))
            thumbnail = crop(png)
        target = OUT / f"{slug}.webp"
        thumbnail.save(target, quality=85)
        print(f"{slug:26} {target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
