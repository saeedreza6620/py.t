"""Correct mismatched v6 imagery without changing product order or IDs."""

from pathlib import Path
import json


root = Path(__file__).resolve().parents[1]
page = root / "dist/index.html"
html = page.read_text()
start = html.index("const PRODUCTS=") + len("const PRODUCTS=")
end = html.index(";", start)
catalog = json.loads(html[start:end])
by_id = {item["id"]: item for item in catalog}

sensibio = by_id["bioderma-dry"]
sensibio.update({
    "en": "Bioderma Sensibio H2O Micellar Water · 250 ml",
    "image": "https://www.bioderma.jp/cdn/shop/files/BIO_prd001_SS-h2o-250mL_28703ACN.png?v=1779321339&width=800",
    "source": "https://www.bioderma.jp/products/sensibio-h2o",
    "originalImageUrl": "https://www.bioderma.jp/cdn/shop/files/BIO_prd001_SS-h2o-250mL_28703ACN.png?v=1779321339&width=2000",
    "imageOfficial": True,
})

foam = by_id["centella-teatree"]
asset_name = "skin1004-teatrica-white-edited.png"
assert (root / "dist/assets" / asset_name).is_file(), "Edited photo asset missing"
foam.update({"image": "./assets/" + asset_name, "imageOfficial": False, "editedImage": True})

# The earlier card showed a different AXIS-Y SKU. Keep the requested item in
# the catalog; don't show a wrong package or claim its formula is verified.
axis = by_id["axisy-ahabha"]
axis.update({
    "en": "AXIS-Y AHA+BHA · exact product awaiting confirmation",
    "verified": False,
    "image": "",
    "imageOfficial": False,
    "source": "",
    "originalImageUrl": "",
})

html = html[:start] + json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + html[end:]
page.write_text(html)
print("Corrected three product records; 34 IDs preserved")
