#!/usr/bin/env python3
"""
Turn the games and apps listed in _data/extensions.yml into browser extensions
for Firefox (they also load in Chrome and Edge).

For every app it writes a folder and a zip into _extensions/:

    _extensions/<slug>/          load this in about:debugging to test
        manifest.json            name, version, icons, what the toolbar button does
        index.html               the app's page, without the site header and footer
        background.js            only for apps that open in a tab
        game-keys.js             only for games, stops arrow keys from scrolling
        icons/icon-*.png         toolbar and add-on icons, an emoji on a dark tile
        assets/..., css/...      copies of the site files the app uses
        vendor/bootstrap...      Bootstrap, extensions may not load it from a CDN
    _extensions/<slug>.zip       upload this to addons.mozilla.org

The site files keep their paths from the site, so /assets/8-ball/8-ball.js in
the page points to the copy inside the extension and nothing has to be rewritten.
_extensions/ starts with an underscore, so Jekyll leaves it out of the site.

index.html is made from the app's normal page, the same way as the PWA
(see _scripts/make-pwa.py), so the page stays the one place to edit.
Run this script again after changing a page, an app's files or the list:

    python3 _scripts/make-extension.py            all apps
    python3 _scripts/make-extension.py 8-ball     only some apps

Extensions are stricter than web pages. The script stops with an error for
things Firefox would block: inline <script> blocks, onclick="..." attributes,
eval(), and scripts or styles loaded from other sites.

Needs the same as make-pwa.py: Python 3, PyYAML and Pillow
(apt install python3-yaml python3-pil fonts-noto-color-emoji).
The first run downloads Bootstrap once into _extensions/vendor/.
"""

import base64
import hashlib
import importlib.util
import json
import re
import shutil
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_extensions"
VENDOR = OUT / "vendor"

# Reuse the page reading, cleaning and icon drawing from the PWA script.
# No __pycache__ folder in _scripts/ for it.
sys.dont_write_bytecode = True
_spec = importlib.util.spec_from_file_location("make_pwa", ROOT / "_scripts/make-pwa.py")
pwa = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(pwa)

DOMAIN = "anderswik.se"              # used in the add-on id: <slug>@anderswik.se
DEFAULT_VERSION = "1.0"
DEFAULT_WIDTH = 360                  # popup width in pixels, Firefox allows up to 800
MIN_FIREFOX = "140.0"                # first version that reads data_collection_permissions

# Files in an app folder that only the PWA uses.
PWA_FILES = {"app.html", "sw.js", "manifest.webmanifest", "standalone.html",
             "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"}

ICON_SIZES = [16, 32, 48, 96, 128]

# The same as the inline script in _layouts/game.html. Extensions don't run
# inline scripts, so it is its own file.
GAME_KEYS_JS = """\
// Stop the arrow keys and space from scrolling the page while playing.
// The same as the script in _layouts/game.html.
document.addEventListener("keydown", function (event) {
    const scrollKeys = [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    const tag = event.target.tagName;
    const isFormField = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tag);

    if (scrollKeys.includes(event.key) && !isFormField) {
        event.preventDefault();
    }
});
"""

BACKGROUND_JS = """\
// Clicking the toolbar button opens the app in a new tab.
// Firefox has "browser", Chrome and Edge only "chrome".
const api = typeof browser !== "undefined" ? browser : chrome;

api.action.onClicked.addListener(function () {
    api.tabs.create({ url: api.runtime.getURL("index.html") });
});
"""


# --- Bootstrap --------------------------------------------------------------

def vendor_file(url, integrity):
    """Download a CDN file once, check it against its integrity hash, return the local path."""
    path = VENDOR / url.rsplit("/", 1)[1]
    if not path.is_file():
        print(f"downloading {url}")
        VENDOR.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(url) as response:
            data = response.read()
        algorithm, expected = integrity.split("-", 1)
        actual = base64.b64encode(hashlib.new(algorithm, data).digest()).decode()
        if actual != expected:
            sys.exit(f"{url}: the download does not match its integrity hash")
        path.write_bytes(data)
    return path


# --- Checks -----------------------------------------------------------------

def check_html(slug, body):
    """Stop on HTML that Firefox would block in an extension page."""
    problems = []
    if re.search(r"<script\b(?![^>]*\bsrc=)[^>]*>", body):
        problems.append("an inline <script> block, move it to a .js file")
    handler = re.search(r"\son[a-z]+\s*=", body)
    if handler:
        problems.append(f"an inline event handler ({handler.group(0).strip()}...), use addEventListener in the .js file")
    if "javascript:" in body:
        problems.append("a javascript: link")
    if re.search(r"<(?:script|link)\b[^>]*(?:src|href)=[\"']https?://", body):
        problems.append("a script or stylesheet from another site, copy it into the site instead")
    if problems:
        sys.exit(f"{slug}: the page has " + "; ".join(problems))


def check_js(slug, path):
    text = path.read_text(encoding="utf-8", errors="replace")
    if re.search(r"\beval\s*\(|\bnew\s+Function\s*\(", text):
        sys.exit(f"{slug}: {path.relative_to(ROOT)} uses eval() or new Function(), which extensions block")
    if re.search(r"\b(?:fetch|XMLHttpRequest)\b", text) and re.search(r"https?://", text):
        print(f"  note: {path.relative_to(ROOT)} talks to the network, check that it also works offline")


# --- Writing the extension --------------------------------------------------

def referenced_files(text):
    """Site paths like /assets/... or /css/... in a page, stylesheet or script."""
    return set(re.findall(r"""["'(](/(?:assets|css|images)/[^"'()\s?#]+)""", text))


def page_html(name, css, js, body, is_game, uses_bootstrap_js, width):
    lines = [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '  <meta charset="utf-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1">',
        f'  <title>{name}</title>',
        '  <link rel="icon" href="/icons/icon-32.png" type="image/png">',
        '  <link rel="stylesheet" href="/vendor/bootstrap.min.css">',
        '  <link rel="stylesheet" href="/css/style.css">',
    ]
    lines += [f'  <link rel="stylesheet" href="{href}">' for href in css]
    lines += [
        '  <style>',
        '    /* Without the site header the games would touch the top of the window. */',
        '    .game { padding-block: 16px; }',
    ]
    if width:
        lines.append(f'    /* A popup is as big as its content, so give it a width. */')
        lines.append(f'    body {{ width: {width}px; }}')
    lines += [
        '  </style>',
        '</head>',
        '<body>',
        body,
        '',
    ]
    if is_game:
        lines.append('<script src="/game-keys.js"></script>')
    lines += [f'<script src="{src}"></script>' for src in js]
    if uses_bootstrap_js:
        lines.append('<script src="/vendor/bootstrap.bundle.min.js"></script>')
    lines += ['</body>', '</html>', '']
    return "\n".join(lines)


def build(app):
    slug = app["slug"]
    page_path = ROOT / app["page"]
    folder = OUT / slug
    zip_path = OUT / f"{slug}.zip"

    front, html = pwa.read_page(page_path)
    name = app.get("name") or front.get("title") or slug
    css = front.get("css") or []
    js = front.get("js") or []
    is_game = front.get("layout") == "game"
    in_tab = app.get("open") == "tab"
    width = None if in_tab else app.get("width", DEFAULT_WIDTH)

    body = pwa.app_body(page_path, front, html)
    check_html(slug, body)
    uses_bootstrap_js = bool(re.search(r"data-bs-|accordion|collapse", body))

    # Start from an empty folder, so files that were removed from the app go too.
    if folder.exists():
        shutil.rmtree(folder)
    folder.mkdir(parents=True)

    # Site files: the app's folder, the page's css and js, the site stylesheet
    # and fonts, and anything they point to, with the same paths as on the site.
    wanted = {
        "/" + str(path.relative_to(ROOT))
        for path in (ROOT / "assets" / slug).rglob("*")
        if path.is_file() and path.name not in PWA_FILES
    } if (ROOT / "assets" / slug).is_dir() else set()
    wanted |= set(css) | set(js) | set(pwa.SITE_FILES) | referenced_files(body)

    copied = set()
    while wanted:
        href = wanted.pop()
        if href in copied:
            continue
        source = ROOT / href.lstrip("/")
        # A folder, from code like "/assets/memory/images/" + name: take all of it.
        if href.endswith("/") and source.is_dir():
            copied.add(href)
            wanted |= {"/" + str(path.relative_to(ROOT)) for path in source.rglob("*")
                       if path.is_file() and path.name not in PWA_FILES} - copied
            continue
        if not source.is_file():
            sys.exit(f"{slug}: {href} does not exist")
        target = folder / href.lstrip("/")
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        copied.add(href)
        if source.suffix in (".css", ".js", ".html", ".svg"):
            wanted |= referenced_files(source.read_text(encoding="utf-8", errors="replace")) - copied
        if source.suffix == ".js":
            check_js(slug, source)

    # Bootstrap
    (folder / "vendor").mkdir()
    shutil.copy2(vendor_file(*pwa.BOOTSTRAP_CSS), folder / "vendor/bootstrap.min.css")
    if uses_bootstrap_js:
        shutil.copy2(vendor_file(*pwa.BOOTSTRAP_JS), folder / "vendor/bootstrap.bundle.min.js")

    # Icons
    (folder / "icons").mkdir()
    for size in ICON_SIZES:
        # The smallest toolbar icons get a bigger emoji, or it can't be seen.
        scale = 0.78 if size <= 32 else 0.62
        pwa.make_icon(app["emoji"], None if size <= 32 else app.get("label"), size, True, scale) \
            .save(folder / f"icons/icon-{size}.png", optimize=True)

    # index.html and the small scripts
    (folder / "index.html").write_text(
        page_html(name, css, js, body, is_game, uses_bootstrap_js, width), encoding="utf-8")
    if is_game:
        (folder / "game-keys.js").write_text(GAME_KEYS_JS, encoding="utf-8")
    if in_tab:
        (folder / "background.js").write_text(BACKGROUND_JS, encoding="utf-8")

    # manifest.json
    action = {
        "default_title": name,
        "default_icon": {"16": "icons/icon-16.png", "32": "icons/icon-32.png"},
    }
    if not in_tab:
        action["default_popup"] = "index.html"
    manifest = {
        "manifest_version": 3,
        "name": name,
        "version": str(app.get("version", DEFAULT_VERSION)),
        "description": app.get("description") or f"{name} from {DOMAIN}.",
        "homepage_url": f"https://www.{DOMAIN}{front.get('permalink', '/')}",
        "icons": {str(size): f"icons/icon-{size}.png" for size in ICON_SIZES},
        "action": action,
    }
    if in_tab:
        # Firefox reads "scripts", Chrome and Edge read "service_worker".
        manifest["background"] = {"scripts": ["background.js"], "service_worker": "background.js"}
    manifest["browser_specific_settings"] = {
        "gecko": {
            "id": f"{slug}@{DOMAIN}",
            "strict_min_version": MIN_FIREFOX,
            # addons.mozilla.org asks every new add-on what data it collects.
            "data_collection_permissions": {"required": ["none"]},
        }
    }
    (folder / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # The zip for addons.mozilla.org, with manifest.json at the top.
    files = sorted(path for path in folder.rglob("*") if path.is_file())
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(folder))

    print(f"{slug:26} {len(files):3} files  {'tab  ' if in_tab else 'popup'}  {name}")


def main():
    apps = yaml_load(ROOT / "_data/extensions.yml")
    wanted = set(sys.argv[1:])
    unknown = wanted - {app["slug"] for app in apps}
    if unknown:
        sys.exit(f"not in _data/extensions.yml: {', '.join(sorted(unknown))}")
    for app in apps:
        if not wanted or app["slug"] in wanted:
            build(app)


def yaml_load(path):
    return pwa.yaml.safe_load(path.read_text(encoding="utf-8")) or []


if __name__ == "__main__":
    main()
