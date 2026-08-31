#!/usr/bin/env python3
"""Update vendored front-end dependencies in this Jekyll site.

Downloads pinned versions of the third-party assets that are served locally
(rather than from a CDN) and rewrites them in place. Every download's SHA-256
hash is verified against the value recorded in ASSETS, so an upstream change
can never slip in silently: to update a dependency, bump its pinned version
and refresh the recorded hash after review.

Intended to be run from GitHub Actions on a schedule; a companion workflow
turns any changes into a pull request.

Usage:
    python3 scripts/update_dependencies.py
"""

import hashlib
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)

JS_DELIVR = "https://cdn.jsdelivr.net/npm"
GF_CSS = "https://fonts.googleapis.com/css2"
URL_RE = re.compile(r"src:\s*url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)")


def fetch(url: str) -> bytes:
    """Download a URL and return its bytes."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def write_if_changed(path: Path, data: bytes) -> bool:
    """Write `data` to `path`; return True if the file changed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_bytes() == data:
        return False
    path.write_bytes(data)
    return True


# --------------------------------------------------------------------------- #
# Static assets served from jsDelivr (npm)
# --------------------------------------------------------------------------- #

ASSETS = [
    # (remote path on jsDelivr, local destination, expected sha256)
    # Versions are pinned and each download is verified against its hash in
    # update_static_assets(), so a change upstream is always caught.
    # CSS is fetched by scripts/fetch-vendor-css.js (run via `npm run purge`),
    # which is the single source of truth for Bootstrap/Font Awesome CSS URLs.
    ("@fortawesome/fontawesome-free@7.3.1/webfonts/fa-solid-900.woff2",
     "fonts/fontawesome/v7/fa-solid-900.woff2",
     "24e5fae26b41c08b2df81c91669f5aaae71d81a84a4713fc56b5c621b78dd456"),
    ("@fortawesome/fontawesome-free@7.3.1/webfonts/fa-brands-400.woff2",
     "fonts/fontawesome/v7/fa-brands-400.woff2",
     "ff66d1cfb67dbe3da432bbe36572cabfa4eef0e591303c2cba111474ba1d15bc"),
    ("@highlightjs/cdn-assets@11.12.0/highlight.min.js",
     "js/highlight.min.js",
     "8ab71eb09c51f501e5e25157d9cff100e46cc29bcbfc744d0b746d451fca7f53"),
    ("simple-jekyll-search@1.10.0/dest/simple-jekyll-search.min.js",
     "js/jekyll-search.js",
     "89e51cb40aef5dad896b0c3bbbe3b28eacc1a4e5b4e04f4ad7b0733fcaabc553"),
    ("mathjax@4.1.3/tex-svg.js",
     "js/mathjax/tex-svg.js",
     "23c036deccc0f2374834a47e4032e452419f3ac027bf17e17c104e2746b19f4c"),
]


def update_static_assets() -> bool:
    changed = False
    for remote, local, expected_sha256 in ASSETS:
        data = fetch(f"{JS_DELIVR}/{remote}")
        actual = hashlib.sha256(data).hexdigest()
        if actual != expected_sha256:
            raise RuntimeError(
                f"Checksum mismatch for {remote}:\n"
                f"  expected {expected_sha256}\n"
                f"  got      {actual}\n"
                "Update the pinned version and recorded hash in ASSETS, "
                "then re-run."
            )
        if write_if_changed(ROOT / local, data):
            print(f"  updated  {local}")
            changed = True
        else:
            print(f"  up to date  {local}")
    return changed


# --------------------------------------------------------------------------- #
# Google Fonts (latin subset only, self-hosted)
# --------------------------------------------------------------------------- #

FONTS = [
    # (display name, css output name, directory, css2 family params)
    ("Open Sans", "google-open-sans.css", "open-sans",
     "Open+Sans:ital,wght@0,300;0,400;0,700;1,300;1,400"),
    ("Montserrat", "google-montserrat.css", "montserrat", "Montserrat"),
    ("Anonymous Pro", "google-anonymous-pro.css", "anonymous-pro",
     "Anonymous+Pro:wght@400;700"),
]


def split_blocks(css: str):
    """Yield (subset_name, block_text) pairs from a Google css2 response."""
    current_name = None
    current = []
    for line in css.splitlines():
        stripped = line.strip()
        if stripped.startswith("/*") and stripped.endswith("*/"):
            if current_name is not None and current:
                yield current_name, "\n".join(current)
            current_name = stripped[2:-2].strip()
            current = []
        else:
            current.append(line)
    if current_name is not None and current:
        yield current_name, "\n".join(current)


def update_fonts() -> bool:
    changed = False
    for family, css_name, directory, params in FONTS:
        css = fetch(f"{GF_CSS}?family={params}&display=swap").decode("utf-8")

        # Google returns the subset comment once per requested weight/style,
        # so there can be several "latin" blocks. Collect them all rather than
        # letting the last one overwrite the rest.
        latin_blocks = []
        for name, block in split_blocks(css):
            if name == "latin":
                latin_blocks.append(block)
        if not latin_blocks:
            print(f"  ! no latin subset returned for {family}; skipping")
            continue
        latin = "\n".join(latin_blocks)

        rewritten = []
        for line in latin.splitlines():
            match = URL_RE.search(line)
            if not match:
                rewritten.append(line)
                continue
            font_url = match.group(1)
            # URL like https://fonts.gstatic.com/s/opensans/v44/file.woff2
            parts = font_url.split("/")
            version, filename = parts[-2], parts[-1]
            local_path = (
                f"../../fonts/googlefonts/{directory}/{version}/{filename}"
            )
            data = fetch(font_url)
            dest = ROOT / "fonts" / "googlefonts" / directory / version / filename
            if write_if_changed(dest, data):
                changed = True
            rewritten.append(line.replace(font_url, local_path))

        output = "\n".join(rewritten).rstrip() + "\n"
        if write_if_changed(ROOT / "css" / "googlefonts" / css_name,
                            output.encode("utf-8")):
            print(f"  updated  css/googlefonts/{css_name} ({family})")
            changed = True
        else:
            print(f"  up to date  css/googlefonts/{css_name} ({family})")
    return changed


# --------------------------------------------------------------------------- #

def main() -> int:
    print("Updating vendored dependencies...")
    changed = update_static_assets()
    changed = update_fonts() or changed
    print("Done. Changes detected." if changed else "Done. No changes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
