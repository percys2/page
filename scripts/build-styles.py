#!/usr/bin/env python3
"""Build immutable CSS bundles in css/dist/ without changing the CSS cascade.

Edit the stylesheets in css/, then run this script: it writes one hashed bundle per
page, points each page's <link> at its new bundle, removes the previous bundles and
records the result in css/dist/styles-manifest.json. vercel.json caches css/dist/.

Run with --download-fonts once to refresh the locally hosted Google Fonts files.
Subsequent builds run offline.
"""

import argparse
import gzip
import hashlib
import json
from pathlib import Path
import re
import sys
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
CSS_DIR = ROOT / "css"
DIST_DIR = CSS_DIR / "dist"
FONT_CSS = CSS_DIR / "font-manrope.css"
FONT_METADATA = ROOT / "assets/fonts/manrope-metadata.json"
GOOGLE_CSS_URL = (
    "https://fonts.googleapis.com/css2?"
    "family=Manrope:wght@400;500;600;700;800&display=swap"
)
FONT_LICENSE_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
)

# Preserve the linked stylesheet order of each page, including final overrides.
PAGE_SOURCES = {
    "index.html": [
        "site.css", "catalog-cutouts.css", "catalog-navigation.css",
        "marketing.css", "mobile.css", "brand.css", "visual-polish.css",
    ],
    "products.html": [
        "products.css", "site.css", "catalog-cutouts.css", "catalog-navigation.css",
        "marketing.css", "mobile.css", "product-detail.css", "brand.css",
        "visual-polish.css",
    ],
    "contact.html": [
        "site.css", "marketing.css", "mobile.css", "brand.css",
        "visual-polish.css",
    ],
    "guia-de-uso.html": [
        "site.css", "usage-guide.css", "marketing.css", "mobile.css",
        "brand.css", "visual-polish.css",
    ],
}


def fetch(url):
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=30) as response:
        return response.read()


def download_fonts():
    """Retain Google's weight and unicode declarations; download each URL once."""
    source_css = fetch(GOOGLE_CSS_URL).decode("utf-8")
    faces = []
    for match in re.finditer(
        r"/\*\s*(latin(?:-ext)?)\s*\*/\s*(@font-face\s*\{[^}]+\})",
        source_css,
    ):
        subset, css = match.groups()
        source = re.search(r"url\((https://[^)]+\.woff2)\)", css)
        weight = re.search(r"font-weight:\s*([0-9]+)\s*;", css)
        if source and weight:
            faces.append((subset, int(weight.group(1)), source.group(1), css))
    expected = {(subset, weight) for subset in ("latin", "latin-ext")
                for weight in (400, 500, 600, 700, 800)}
    if {(subset, weight) for subset, weight, _, _ in faces} != expected:
        raise ValueError("Google Fonts response does not contain all expected Latin weights")

    downloads = {}
    for subset, _, url, _ in faces:
        if url in downloads:
            continue
        data = fetch(url)
        if not data.startswith(b"wOF2"):
            raise ValueError(f"Invalid WOFF2 font returned for {subset}")
        digest = hashlib.sha256(data).hexdigest()[:12]
        path = f"assets/fonts/manrope-{subset}-{digest}.woff2"
        downloads[url] = {"subset": subset, "path": path, "data": data}
    # The font license travels with the font files in the source repository.
    license_data = fetch(FONT_LICENSE_URL)
    if b"SIL OPEN FONT LICENSE" not in license_data:
        raise ValueError("Unexpected font license response")

    font_dir = ROOT / "assets/fonts"
    font_dir.mkdir(parents=True, exist_ok=True)
    for asset in downloads.values():
        (ROOT / asset["path"]).write_bytes(asset["data"])
    (font_dir / "OFL-Manrope.txt").write_bytes(license_data)
    output = ["/* Locally hosted Manrope. License: assets/fonts/OFL-Manrope.txt. */"]
    for subset, _, source, css in faces:
        local_css = css.replace(source, "/" + downloads[source]["path"])
        output.append(f"/* {subset} */\n{local_css}")
    FONT_CSS.write_text("\n\n".join(output) + "\n", encoding="utf-8")
    metadata = {
        "source_css": GOOGLE_CSS_URL,
        "license": "assets/fonts/OFL-Manrope.txt",
        "assets": [{"source": source, "subset": asset["subset"],
                    "path": asset["path"], "bytes": len(asset["data"])}
                   for source, asset in downloads.items()],
        "preload_latin": next(asset["path"] for asset in downloads.values()
                              if asset["subset"] == "latin"),
    }
    FONT_METADATA.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")


def build():
    fonts_present = FONT_CSS.is_file() and FONT_METADATA.is_file()
    metadata = json.loads(FONT_METADATA.read_text()) if fonts_present else {}
    if fonts_present:
        for asset in metadata["assets"]:
            if not (ROOT / asset["path"]).is_file():
                raise FileNotFoundError(f"Missing local font: {asset['path']}")
    manifest = {
        "font_css": rel(FONT_CSS) if fonts_present else None,
        "preload_latin": metadata.get("preload_latin"),
        "pages": {},
    }
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    for page, originals in PAGE_SOURCES.items():
        sources = ([FONT_CSS] if fonts_present else []) + [CSS_DIR / name for name in originals]
        sections = ["/* Generated by scripts/build-styles.py; edit the source stylesheets in css/. */\n"]
        for source in sources:
            content = source.read_text(encoding="utf-8")
            # These top-level rules need special treatment when concatenating;
            # stop rather than silently modifying their meaning or URL base.
            if re.search(r"^\s*@(charset|import)\b", content, flags=re.MULTILINE):
                raise ValueError(f"Cannot safely concatenate @charset/@import in {rel(source)}")
            # Bundles live in css/dist/: relative URLs would point to the wrong folder.
            if re.search(r"url\(\s*[\"']?\.", content):
                raise ValueError(f"Use absolute /assets/ URLs in {rel(source)}")
            sections.append(f"\n/* Source: {rel(source)} */\n{content}\n")
        data = "".join(sections).encode("utf-8")
        digest = hashlib.sha256(data).hexdigest()[:12]
        bundle = DIST_DIR / f"styles-{Path(page).stem}-{digest}.css"
        bundle.write_bytes(data)
        manifest["pages"][page] = {
            "bundle": rel(bundle),
            "sources": [rel(source) for source in sources],
            "bytes": len(data),
            "gzip_bytes": len(gzip.compress(data, mtime=0)),
            "sha256": hashlib.sha256(data).hexdigest(),
        }
        link_page(page, rel(bundle))
    current = {ROOT / entry["bundle"] for entry in manifest["pages"].values()}
    for old in DIST_DIR.glob("styles-*.css"):
        if old not in current:
            old.unlink()
    (DIST_DIR / "styles-manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return manifest


def rel(path):
    return path.relative_to(ROOT).as_posix()


def link_page(page, bundle):
    """Point the page's stylesheet link at its new bundle."""
    file = ROOT / page
    stem = re.escape(Path(page).stem)
    html, count = re.subn(rf'href="css/dist/styles-{stem}-[0-9a-f]{{12}}\.css"',
                          f'href="{bundle}"', file.read_text(encoding="utf-8"))
    if count != 1:
        raise ValueError(f"{page}: expected one stylesheet link to css/dist/styles-{Path(page).stem}-*.css")
    file.write_text(html, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--download-fonts", action="store_true",
                        help="Refresh locally hosted Manrope from Google Fonts")
    args = parser.parse_args()
    if args.download_fonts:
        try:
            download_fonts()
        except Exception as error:
            print(f"Font download failed; retaining existing fonts if available: {error}",
                  file=sys.stderr)
    print(json.dumps(build(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
