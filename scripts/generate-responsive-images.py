#!/usr/bin/env python3
"""Build WebP sizes for active catalog/home images, preserving the originals.

Run from any directory with Python 3 and Pillow installed:
    python scripts/generate-responsive-images.py

Only local raster images referenced by data/image-overrides.js or index.html and
larger than 100,000 bytes are included. SVGs and unused/older images are skipped.
The JSON manifest maps original URLs to dimensioned variants and can be used to
build srcset attributes. Filenames include the encoded content hash so a new
image cannot reuse an older cached response.
"""

from __future__ import annotations

import argparse
from hashlib import sha256
from html.parser import HTMLParser
from io import BytesIO
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

from PIL import Image, ImageOps


WIDTHS = (320, 640, 960)
RASTER_EXTENSIONS = {".png", ".webp", ".jpg", ".jpeg"}
# Keep the established full-size photograph for this product's enlarged view.
# Small catalog and phone views still receive the existing responsive sizes.
ORIGINAL_LARGE_CANDIDATES = {"./assets/neopigg-1-reference-v28.webp": 640}


class ImageSources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sources: set[str] = set()

    def handle_starttag(self, tag, attrs):
        if tag == "img":
            source = dict(attrs).get("src")
            if source:
                self.sources.add(source)


def original_urls(root: Path) -> list[str]:
    """Read the active overrides, excluding the examples in JS comments."""
    overrides = (root / "data" / "image-overrides.js").read_text(encoding="utf-8")
    match = re.search(
        r"window\.AGROCENTRO_IMAGE_OVERRIDES\s*=\s*\{(.*?)\}\s*;",
        overrides,
        flags=re.DOTALL,
    )
    if not match:
        raise ValueError("AGROCENTRO_IMAGE_OVERRIDES was not found")
    sources = set(re.findall(r"\d+\s*:\s*[\"']([^\"']+)[\"']", match[1]))
    parser = ImageSources()
    parser.feed((root / "index.html").read_text(encoding="utf-8"))
    sources.update(parser.sources)
    return sorted(sources)


def generate(root: Path, quality: int, min_bytes: int) -> dict:
    output_dir = root / "assets" / "responsive"
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for url in original_urls(root):
        parsed = urlsplit(url)
        if parsed.scheme or parsed.netloc:
            continue
        relative_path = Path(unquote(parsed.path.removeprefix("./").lstrip("/")))
        source = (root / relative_path).resolve()
        if not source.is_relative_to(root / "assets"):
            continue
        if source.suffix.lower() not in RASTER_EXTENSIONS:
            continue
        if not source.is_file():
            raise FileNotFoundError(f"Active image is missing: {source}")
        if source.stat().st_size <= min_bytes or source.is_relative_to(output_dir):
            continue
        original_bytes = source.read_bytes()
        with Image.open(BytesIO(original_bytes)) as opened:
            # Honor camera orientation; retain alpha and use an RGB mode WebP supports.
            original = ImageOps.exif_transpose(opened)
            mode = "RGBA" if original.has_transparency_data else "RGB"
            original = original.convert(mode)
            original_url = "./" + relative_path.as_posix()
            max_variant_width = ORIGINAL_LARGE_CANDIDATES.get(original_url)
            requested_widths = (width for width in WIDTHS
                                if max_variant_width is None or width <= max_variant_width)
            widths = sorted({min(width, original.width) for width in requested_widths})
            variants = []
            for width in widths:
                height = max(1, round(original.height * width / original.width))
                resized = original.resize((width, height), Image.Resampling.LANCZOS)
                encoded = BytesIO()
                # Sharp text and logos benefit from high quality. Alpha is lossless.
                options = dict(format="WEBP", quality=quality, method=6, exact=True)
                if opened.info.get("icc_profile"):
                    options["icc_profile"] = opened.info["icc_profile"]
                resized.save(encoded, **options)
                data = encoded.getvalue()
                digest = sha256(data).hexdigest()[:12]
                filename = f"{source.stem}-{width}w-{digest}.webp"
                target = output_dir / filename
                target.write_bytes(data)
                variants.append({
                    "src": "./" + target.relative_to(root).as_posix(),
                    "width": width,
                    "height": height,
                    "bytes": len(data),
                })
            if max_variant_width is not None and original.width > max_variant_width:
                variants.append({
                    "src": original_url,
                    "width": original.width,
                    "height": original.height,
                    "bytes": len(original_bytes),
                })
            manifest["./" + relative_path.as_posix()] = {
                "width": original.width,
                "height": original.height,
                "bytes": len(original_bytes),
                "sha256": sha256(original_bytes).hexdigest(),
                "quality": quality,
                "variants": variants,
            }
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--quality", type=int, default=88)
    parser.add_argument("--min-bytes", type=int, default=100_000)
    parser.add_argument("--external-manifest", type=Path)
    args = parser.parse_args()
    if not 1 <= args.quality <= 100:
        parser.error("--quality must be between 1 and 100")
    if args.min_bytes < 0:
        parser.error("--min-bytes must be nonnegative")
    root = args.root.resolve()
    manifest = generate(root, args.quality, args.min_bytes)
    text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    manifest_path = root / "data" / "responsive-images.js"
    manifest_path.write_text(
        "// Generated by scripts/generate-responsive-images.py; do not edit by hand.\n"
        "window.AGROCENTRO_RESPONSIVE_IMAGES="
        + json.dumps(manifest, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    if args.external_manifest:
        args.external_manifest.write_text(text, encoding="utf-8")
    originals = sum(item["bytes"] for item in manifest.values())
    print(f"Generated {sum(len(item['variants']) for item in manifest.values())} variants "
          f"for {len(manifest)} active images; originals unchanged ({originals:,} bytes).")
    if originals:
        for index, requested_width in enumerate(WIDTHS):
            total = sum(item["variants"][min(index, len(item["variants"]) - 1)]["bytes"]
                        for item in manifest.values())
            print(f"Up to {requested_width}px: {total:,} bytes; "
                  f"{100 * (1 - total / originals):.1f}% fewer than originals.")
    print(f"Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
