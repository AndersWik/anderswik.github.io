#!/usr/bin/env python3
"""
Draw placeholder icons for the apps in _data/pwa.yml and _data/extensions.yml:
the app's emoji, and its optional label, on a dark tile.

The icons go into assets/<slug>/images/, and make-pwa.py and make-extension.py
use whatever icons are there. So this script is only for apps that don't have
icons yet. Replace the placeholders with your own pictures whenever you like,
with the same file names and sizes:

    icon-192.png            192 x 192, rounded tile
    icon-512.png            512 x 512, rounded tile, also used for the extension
    icon-maskable-512.png   512 x 512, square, picture in the middle 80 percent
    apple-touch-icon.png    180 x 180, square, no transparency

Apps that are only extensions (not in pwa.yml) only get icon-512.png.

    python3 _scripts/make-icons.py                every app that has no icons yet
    python3 _scripts/make-icons.py fia ludo       only these apps
    python3 _scripts/make-icons.py --force fia    draw them again, over the old ones

It never draws over an icon that is already there, unless you add --force.

Needs: Python 3, PyYAML and Pillow (apt install python3-yaml python3-pil),
and the Noto Color Emoji font (apt install fonts-noto-color-emoji).
"""

import sys
from pathlib import Path

import yaml
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]

EMOJI_FONT = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
LABEL_FONT = ROOT / "assets/fonts/Ubuntu/Ubuntu-Bold.ttf"

TILE_COLOR = (27, 29, 33, 255)      # the site's dark header color
LABEL_COLOR = (232, 180, 85, 255)   # the site's accent color

ICONS = {
    # file name: (size, tile with rounded corners?, emoji size)
    "icon-192.png": (192, True, 0.62),
    "icon-512.png": (512, True, 0.62),
    # Android cuts maskable icons to its own shape, so no corners and more room.
    "icon-maskable-512.png": (512, False, 0.5),
    # iPhone rounds the corners itself and needs a tile without transparency.
    "apple-touch-icon.png": (180, False, 0.58),
}

# The icons an extension needs, see make-extension.py.
EXTENSION_ICONS = ["icon-512.png"]


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


def load(name):
    return yaml.safe_load((ROOT / "_data" / name).read_text(encoding="utf-8")) or []


def main():
    args = sys.argv[1:]
    force = "--force" in args
    wanted = [arg for arg in args if arg != "--force"]

    # Every app once, with the files it needs. The PWA list comes first, so
    # its emoji and label win if an app is in both lists.
    apps = {}
    for app in load("pwa.yml"):
        apps[app["slug"]] = (app, list(ICONS))
    for app in load("extensions.yml"):
        apps.setdefault(app["slug"], (app, EXTENSION_ICONS))

    unknown = set(wanted) - set(apps)
    if unknown:
        sys.exit(f"not in _data/pwa.yml or _data/extensions.yml: {', '.join(sorted(unknown))}")

    for slug, (app, files) in apps.items():
        if wanted and slug not in wanted:
            continue
        folder = ROOT / "assets" / slug / "images"
        todo = [name for name in files if force or not (folder / name).is_file()]
        if not todo:
            if wanted:
                print(f"{slug:26} has its icons, add --force to draw them again")
            continue
        if "emoji" not in app:
            sys.exit(f"{slug}: no emoji in the list to draw an icon from")
        folder.mkdir(parents=True, exist_ok=True)
        for name in todo:
            size, rounded, scale = ICONS[name]
            make_icon(app["emoji"], app.get("label"), size, rounded, scale).save(folder / name, optimize=True)
        print(f"{slug:26} drew {', '.join(todo)}")


if __name__ == "__main__":
    main()
