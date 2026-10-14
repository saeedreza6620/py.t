"""Split the unchanged v6 photo and font payloads into browser-cacheable assets."""

from pathlib import Path
import base64
import hashlib
import re


root = Path(__file__).resolve().parents[1]
html_path = root / "dist/index.html"
assets = root / "dist/assets"
assets.mkdir(exist_ok=True)
html = html_path.read_text(encoding="utf-8")
pattern = re.compile(r"data:(image|font)/(png|jpeg|webp|ttf);base64,([A-Za-z0-9+/=]+)")
seen = {}
count = {"image": 0, "font": 0}


def store_asset(match):
    whole = match.group(0)
    if whole in seen:
        return seen[whole]
    kind, ext, encoded = match.groups()
    contents = base64.b64decode(encoded, validate=True)
    digest = hashlib.sha256(contents).hexdigest()[:16]
    filename = f"{kind}-{digest}.{ 'jpg' if ext == 'jpeg' else ext }"
    location = assets / filename
    if not location.exists():
        location.write_bytes(contents)
    count[kind] += 1
    seen[whole] = f"./assets/{filename}"
    return seen[whole]


html = pattern.sub(store_asset, html)
html_path.write_text(html, encoding="utf-8")
print(f"{count['image']} images; {count['font']} fonts; {len(html.encode())} byte HTML")
