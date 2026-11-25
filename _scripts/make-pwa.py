#!/usr/bin/env python3
"""
Turn the games and apps listed in _data/pwa.yml into Progressive Web Apps.

For every app it writes into assets/<slug>/:

    app.html               the app's page, without the site header and footer
    manifest.webmanifest   name, icons and colors, makes the page installable
    sw.js                  service worker, saves the files so the app works offline

The icons are the ones already in assets/<slug>/images/: icon-192.png,
icon-512.png, icon-maskable-512.png and apple-touch-icon.png. Draw your own,
or make placeholders from the app's emoji with _scripts/make-icons.py.

app.html is made from the app's normal page (front matter css and js, and the
HTML after the front matter), so the page stays the one place to edit.
Run this script again after changing a page, an app's files or the list:

    python3 _scripts/make-pwa.py            all apps
    python3 _scripts/make-pwa.py blackjack  only some apps

The cache name in sw.js is a hash of the app's files. When a file changes the
name changes, and installed apps download the new version by themselves.

Needs: Python 3 and PyYAML (apt install python3-yaml).
"""

import hashlib
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]

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

# The icons every app needs in assets/<slug>/images/.
ICONS = ["icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"]


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
    html = re.sub(r'\s*<section class="game-tutorials[^"]*">.*?</section>', "", html, flags=re.S)
    html = html.replace("{{ site.baseurl }}", "")
    if "{{" in html or "{%" in html:
        sys.exit(f"{path}: has Liquid tags the script can't handle")
    html = html.strip()
    if front.get("layout") == "game":
        html = '<div class="game">\n' + html + "\n</div>"
    return html


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

    # Icons: use the ones in the app's folder, never draw over them.
    missing = [name for name in ICONS if not (folder / "images" / name).is_file()]
    if missing:
        sys.exit(f"{slug}: no {', '.join(missing)} in assets/{slug}/images/, "
                 f"draw your own or run: python3 _scripts/make-icons.py {slug}")

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
