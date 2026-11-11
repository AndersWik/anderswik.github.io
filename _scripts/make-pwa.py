#!/usr/bin/env python3
"""
Turn the games and apps listed in _data/pwa.yml into Progressive Web Apps.

For every app it writes into assets/<slug>/:

    app.html               the app's page, without the site header and footer
    manifest.webmanifest   name, icons and colors, makes the page installable
    sw.js                  service worker, saves the files so the app works offline
    images/icon-*.png      app icons, an emoji on a dark tile

app.html is made from the app's normal page (front matter css and js, and the
HTML after the front matter), so the page stays the one place to edit.
Run this script again after changing a page, an app's files or the list:

    python3 _scripts/make-pwa.py            all apps
    python3 _scripts/make-pwa.py blackjack  only some apps

The cache name in sw.js is a hash of the app's files. When a file changes the
name changes, and installed apps download the new version by themselves.

Needs: Python 3, PyYAML and Pillow (apt install python3-yaml python3-pil),
and the Noto Color Emoji font (apt install fonts-noto-color-emoji).
"""

import hashlib
import json
import re
import sys
from pathlib import Path

import yaml
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]

EMOJI_FONT = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
LABEL_FONT = ROOT / "assets/fonts/Ubuntu/Ubuntu-Bold.ttf"

TILE_COLOR = (27, 29, 33, 255)      # the site's dark header color
LABEL_COLOR = (232, 180, 85, 255)   # the site's accent color
THEME_COLOR = "#1b1d21"
BACKGROUND_COLOR = "#f3f4f6"

# The same Bootstrap as _includes/head.html and _layouts/default.html.
BOOTSTRAP_CSS = ("https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
                 "sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH")
BOOTSTRAP_JS = ("https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
                "sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz")

# Site files every app uses: the site stylesheet and the fonts it loads.
SITE_FILES = [
    "/css/style.css",
    "/assets/fonts/Ubuntu/Ubuntu-Regular.ttf",
    "/assets/fonts/Ubuntu/Ubuntu-Medium.ttf",
    "/assets/fonts/Ubuntu/Ubuntu-Bold.ttf",
]

# Files in an app folder that are not part of the app.
SKIP_FILES = {"sw.js", "standalone.html", "favicon.ico"}

ICONS = {
    # file name: (size, tile with rounded corners?, emoji size)
    "icon-192.png": (192, True, 0.62),
    "icon-512.png": (512, True, 0.62),
    # Android cuts maskable icons to its own shape, so no corners and more room.
    "icon-maskable-512.png": (512, False, 0.5),
    # iPhone rounds the corners itself and needs a tile without transparency.
    "apple-touch-icon.png": (180, False, 0.58),
}


# --- Reading the page -------------------------------------------------------

def read_page(path):
    """Return the front matter (a dict) and the HTML after it."""
    text = path.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not match:
        sys.exit(f"{path}: no front matter")
    return yaml.safe_load(match.group(1)) or {}, match.group(2)


def app_body(path, front, html):
    """The page HTML, cleaned up to stand on its own."""
    # The links to the tutorial don't belong in the app.
    html = re.sub(r'\s*<p[^>]*>\s*<a href="/tutorials/[^"]*">How to build this \w+</a>\s*</p>', "", html)
    html = html.replace("{{ site.baseurl }}", "")
    if "{{" in html or "{%" in html:
        sys.exit(f"{path}: has Liquid tags the script can't handle")
    html = html.strip()
    if front.get("layout") == "game":
        html = '<div class="game">\n' + html + "\n</div>"
    return html


# --- Icons ------------------------------------------------------------------

def make_icon(emoji, label, size, rounded, scale):
    """An emoji, and optionally a short label below it, on a dark tile."""
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(icon)
    if rounded:
        draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.22), fill=TILE_COLOR)
    else:
        draw.rectangle((0, 0, size, size), fill=TILE_COLOR)

    # Color emoji only exist in size 109, so draw it there and scale it.
    picture = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(picture).text((80, 80), emoji, font=ImageFont.truetype(EMOJI_FONT, 109),
                                 embedded_color=True, anchor="mm")
    box = picture.getbbox()
    if box is None:
        sys.exit(f"emoji {emoji!r} is not in the emoji font")
    picture = picture.crop(box)

    largest = size * scale * (0.8 if label else 1)
    ratio = largest / max(picture.size)
    picture = picture.resize((round(picture.width * ratio), round(picture.height * ratio)), Image.LANCZOS)
    center_y = size * (0.42 if label else 0.5)
    icon.alpha_composite(picture, (round((size - picture.width) / 2), round(center_y - picture.height / 2)))

    if label:
        font = ImageFont.truetype(str(LABEL_FONT), round(size * scale * 0.27))
        draw.text((size / 2, center_y + largest * 0.5 + size * scale * 0.3), label,
                  font=font, fill=LABEL_COLOR, anchor="ms")

    return icon if rounded else icon.convert("RGB")


# --- Writing the app --------------------------------------------------------

def page_head(name, css, uses_bootstrap_js):
    lines = [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '  <meta charset="utf-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1">',
        f'  <title>{name}</title>',
        '',
        '  <!-- Makes this page an installable app, see _scripts/make-pwa.py. -->',
        '  <link rel="manifest" href="manifest.webmanifest">',
        f'  <meta name="theme-color" content="{THEME_COLOR}">',
        '  <link rel="icon" href="images/icon-192.png" type="image/png">',
        '  <!-- iPhone and iPad read these instead of the manifest. -->',
        '  <link rel="apple-touch-icon" href="images/apple-touch-icon.png">',
        f'  <meta name="apple-mobile-web-app-title" content="{name}">',
        '',
        f'  <link rel="stylesheet" href="{BOOTSTRAP_CSS[0]}" integrity="{BOOTSTRAP_CSS[1]}" crossorigin="anonymous">',
        '  <link rel="stylesheet" href="/css/style.css">',
    ]
    lines += [f'  <link rel="stylesheet" href="{href}">' for href in css]
    lines += [
        '  <style>',
        '    /* Without the site header the games would touch the top of the screen. */',
        '    .game { padding-block: 16px; }',
        '  </style>',
        '</head>',
    ]
    return "\n".join(lines)


def page_scripts(js, uses_bootstrap_js):
    lines = [f'<script src="{src}"></script>' for src in js]
    if uses_bootstrap_js:
        lines.append(f'<script src="{BOOTSTRAP_JS[0]}" integrity="{BOOTSTRAP_JS[1]}" crossorigin="anonymous"></script>')
    lines += [
        '<script>',
        '  // The service worker saves the app so it also works offline.',
        '  if ("serviceWorker" in navigator) {',
        '    navigator.serviceWorker.register("sw.js");',
        '  }',
        '</script>',
    ]
    return "\n".join(lines)


SERVICE_WORKER = """\
/*
 * Service worker for {name}. Made by _scripts/make-pwa.py, don't edit by hand.
 *
 * On install it saves every file the app needs in a cache. After that the app
 * loads from the cache, so it works without a connection. The cache name is a
 * hash of the files, so a new version of the app gets a new cache.
 */

const CACHE = "{cache}";

const FILES = {files};

// Save all files when the worker is installed.
self.addEventListener("install", function (event) {{
    event.waitUntil(
        caches.open(CACHE)
            .then(function (cache) {{ return cache.addAll(FILES); }})
            .then(function () {{ return self.skipWaiting(); }})
    );
}});

// Delete the caches of older versions.
self.addEventListener("activate", function (event) {{
    event.waitUntil(
        caches.keys()
            .then(function (names) {{
                return Promise.all(names
                    .filter(function (name) {{ return name.startsWith("{slug}-") && name !== CACHE; }})
                    .map(function (name) {{ return caches.delete(name); }}));
            }})
            .then(function () {{ return self.clients.claim(); }})
    );
}});

// Answer from the cache first, and only go to the network for anything else.
// The address of the app may have ?values in it, so they are ignored.
self.addEventListener("fetch", function (event) {{
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request, {{ ignoreSearch: true }}).then(function (cached) {{
            return cached || fetch(event.request);
        }})
    );
}});
"""


def build(app):
    slug = app["slug"]
    page_path = ROOT / app["page"]
    folder = ROOT / "assets" / slug

    front, html = read_page(page_path)
    name = app.get("name") or front.get("title") or slug
    short_name = app.get("short_name") or name
    css = front.get("css") or []
    js = front.get("js") or []
    body = app_body(page_path, front, html)
    uses_bootstrap_js = bool(re.search(r"data-bs-|accordion|collapse", body))

    # Icons
    (folder / "images").mkdir(parents=True, exist_ok=True)
    for file_name, (size, rounded, scale) in ICONS.items():
        make_icon(app["emoji"], app.get("label"), size, rounded, scale).save(folder / "images" / file_name, optimize=True)

    # app.html
    page = "\n".join([
        page_head(name, css, uses_bootstrap_js),
        '<body>',
        body,
        '',
        page_scripts(js, uses_bootstrap_js),
        '</body>',
        '</html>',
        '',
    ])
    (folder / "app.html").write_text(page, encoding="utf-8")

    # manifest.webmanifest
    manifest = {
        "name": name,
        "short_name": short_name,
        "id": "./app.html",
        "start_url": "./app.html",
        "scope": "./",
        "display": "standalone",
        "background_color": BACKGROUND_COLOR,
        "theme_color": THEME_COLOR,
        "icons": [
            {"src": "images/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "images/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "images/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (folder / "manifest.webmanifest").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Files to cache: everything in the app folder, the page's css and js
    # (they may live in another folder) and the site files.
    local = sorted(
        "/" + str(path.relative_to(ROOT))
        for path in folder.rglob("*")
        if path.is_file() and path.name not in SKIP_FILES
    )
    for href in css + js + SITE_FILES:
        if href not in local:
            local.append(href)
    for href in local:
        if not (ROOT / href.lstrip("/")).is_file():
            sys.exit(f"{slug}: {href} does not exist")

    digest = hashlib.sha1()
    for href in local:
        digest.update(href.encode())
        digest.update((ROOT / href.lstrip("/")).read_bytes())

    files = local + [BOOTSTRAP_CSS[0]] + ([BOOTSTRAP_JS[0]] if uses_bootstrap_js else [])
    (folder / "sw.js").write_text(SERVICE_WORKER.format(
        name=name,
        slug=slug,
        cache=f"{slug}-{digest.hexdigest()[:10]}",
        files=json.dumps(files, indent=4),
    ), encoding="utf-8")

    print(f"{slug:26} {len(files):3} files  {name}")


def main():
    apps = yaml.safe_load((ROOT / "_data/pwa.yml").read_text(encoding="utf-8"))
    wanted = set(sys.argv[1:])
    unknown = wanted - {app["slug"] for app in apps}
    if unknown:
        sys.exit(f"not in _data/pwa.yml: {', '.join(sorted(unknown))}")
    for app in apps:
        if not wanted or app["slug"] in wanted:
            build(app)


if __name__ == "__main__":
    main()
