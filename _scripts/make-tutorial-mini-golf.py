#!/usr/bin/env python3
"""
Make the Mini Golf tutorial from the game itself, so the two never differ:

    assets/tutorials/mini-golf.html         the finished game as one page
    pages/tutorials/06-13-mini-golf.html    the tutorial

Run it after changing assets/mini-golf/mini-golf.js, levels.js or the
tutorial text:

    python3 _scripts/make-tutorial-mini-golf.py

The tutorial text is in _scripts/templates/mini-golf-tutorial.html. Write the
text there, never in pages/tutorials/06-13-mini-golf.html, which is written
over every time. The template has markers that are filled in from the game:

    @@css@@          the CSS of the finished page
    @@fn:name@@      the function called name, from levels.js or mini-golf.js
    @@level:2@@      hole number 3 from LEVELS (counting from 0)
    @@complete@@     the whole finished page

Code you write straight into the template, like the pointer events in step 8,
is checked too: every JavaScript example must be in the game word for word,
or the script stops and says which one is wrong.

Needs: Python 3.
"""

import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEVELS_JS = ROOT / "assets/mini-golf/levels.js"
GAME_JS = ROOT / "assets/mini-golf/mini-golf.js"
TEMPLATE = ROOT / "_scripts/templates/mini-golf-tutorial.html"
FINISHED = ROOT / "assets/tutorials/mini-golf.html"
TUTORIAL = ROOT / "pages/tutorials/06-13-mini-golf.html"

# The same look as assets/mini-golf/mini-golf.css, for a page of its own.
CSS = """body {
    font-family: sans-serif;
    max-width: 800px;
    margin: 40px auto;
    padding: 0 16px;
}

body {
    background-color: #2e7d32;
}

canvas {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 0 auto;
    border: 10px solid #5d4037;
    border-radius: 10px;
    box-sizing: border-box;
    cursor: crosshair;
    /* Dragging on a phone putts instead of scrolling the page. */
    touch-action: none;
}"""


def indent(text, spaces):
    """Indent every line that isn't empty."""
    return "\n".join((" " * spaces + line) if line.strip() else "" for line in text.split("\n"))


def finished_page(levels, game):
    """The whole game in one HTML file, with the CSS and the JavaScript inside."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mini Golf</title>
  <style>
{indent(CSS, 4)}
  </style>
</head>
<body>
  <canvas id="gameCanvas" width="800" height="400"></canvas>

  <script>
{indent(levels, 4)}

{indent(game, 4)}
  </script>
</body>
</html>
"""


def function_source(name, code):
    """From "function name(" to the "}" at the start of a line that ends it."""
    match = re.search(r"^function " + re.escape(name) + r"\(.*?^\}", code, re.S | re.M)
    if not match:
        sys.exit(f"@@fn:{name}@@: there is no function {name} in the game")
    return match.group(0)


def level_source(number, levels):
    """One hole from LEVELS, without the indentation it has inside the list."""
    holes = re.findall(r"^    \{\n.*?^    \}", levels, re.S | re.M)
    if number >= len(holes):
        sys.exit(f"@@level:{number}@@: there are only {len(holes)} holes")
    return "\n".join(line[4:] for line in holes[number].split("\n"))


def check_examples(tutorial, code):
    """Every JavaScript example in the tutorial must be in the game."""
    examples = re.findall(r'<pre><code class="language-javascript">(.*?)</code></pre>', tutorial, re.S)
    for example in examples:
        # Examples can show several pieces with an empty line between them.
        for piece in html.unescape(example).split("\n\n"):
            piece = piece.rstrip(",")
            # Holes are shown less indented, and the L-shape is one line of a hole.
            if piece.startswith(("{\n    name:", "course: [[")):
                continue
            if piece not in code:
                first_line = piece.split("\n")[0]
                sys.exit(f"{TEMPLATE.name}: this example is not in the game:\n    {first_line}")


def main():
    levels = LEVELS_JS.read_text(encoding="utf-8").rstrip("\n")
    game = GAME_JS.read_text(encoding="utf-8").rstrip("\n")
    code = levels + "\n" + game

    page = finished_page(levels, game)
    FINISHED.write_text(page, encoding="utf-8")

    tutorial = TEMPLATE.read_text(encoding="utf-8")
    tutorial = tutorial.replace("@@css@@", html.escape(CSS, quote=False))
    tutorial = re.sub(r"@@fn:(\w+)@@",
                      lambda m: html.escape(function_source(m.group(1), code), quote=False), tutorial)
    tutorial = re.sub(r"@@level:(\d+)@@",
                      lambda m: html.escape(level_source(int(m.group(1)), levels), quote=False), tutorial)
    tutorial = tutorial.replace("@@complete@@", html.escape(page.rstrip("\n"), quote=False))

    leftover = re.search(r"@@[^@\n]*@@", tutorial)
    if leftover:
        sys.exit(f"{TEMPLATE.name}: unknown marker {leftover.group(0)}")
    check_examples(tutorial, code)

    TUTORIAL.write_text(tutorial, encoding="utf-8")
    print(f"wrote {FINISHED.relative_to(ROOT)}")
    print(f"wrote {TUTORIAL.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
