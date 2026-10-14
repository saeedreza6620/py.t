#!/usr/bin/env python3
"""Static acceptance checks for Beauty Wallet v5.0.0 pilot."""

from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent


class Parser(HTMLParser):
    pass


def require(condition, message):
    if not condition:
        raise AssertionError(message)


html = (ROOT / "index.html").read_text(encoding="utf-8")
js = (ROOT / "app.js").read_text(encoding="utf-8")
css = (ROOT / "styles.css").read_text(encoding="utf-8")
dataset = (ROOT / "dataset.js").read_text(encoding="utf-8")

Parser().feed(html)
require('lang="fa"' in html and 'dir="rtl"' in html, "Persian RTL document metadata is missing")
require("Vazirmatn" in css, "Local Persian font is not configured")
require("vendor/face_mesh/face_mesh.js" in html, "Local Face Mesh script is missing")

required_ids = {
    "reference-photo-input",
    "reference-photo-preview",
    "reference-photo-consent",
    "lock-reference-photo",
    "replace-reference-photo",
    "delete-reference-photo",
    "photo-lock-state",
    "photo-quality-message",
    "outcome-photo-input",
    "outcome-photo-preview",
    "outcome-photo-consent",
    "lock-outcome-photo",
    "outcome-photo-lock-state",
    "wallet-id",
    "wallet-photo-list",
    "routine-insight",
    "share-wallet",
    "share-photo",
    "city-select",
    "catalog-match",
    "routine-checkins",
    "routine-done",
    "load-demo-profile",
    "product-gtin",
    "scan-barcode-photo",
    "barcode-photo-input",
    "barcode-status",
    "package-photo-input",
    "package-photo-status",
}
for element_id in required_ids:
    require(f'id="{element_id}"' in html, f"Missing UI element: {element_id}")

panels = [int(value) for value in re.findall(r'data-panel="(\d+)"', html)]
require(panels == [1, 2, 3, 4, 5], f"Unexpected before-purchase panel sequence: {panels}")

js_checks = {
    "version": 'const V="5.0.0-pilot"',
    "indexeddb": "indexedDB.open",
    "local face mesh": 'engine:"mediapipe_local"',
    "quality gate": 'qualityGateVersion:"photo-gate-1.0"',
    "consent": 'consentVersion:"photo-consent-1.0"',
    "hash": 'crypto.subtle.digest("SHA-256"',
    "lock event": 'photoEvent("ReferencePhotoLocked"',
    "replace event": 'photoEvent("ReferencePhotoReplaced"',
    "delete event": 'photoEvent("ReferencePhotoDeleted"',
    "optional decision photo link": "referencePhotoId:referencePhotoMeta?.photoId||null",
    "start-use link": "referencePhotoId:d.referencePhotoId",
    "timeout": "مدل لندمارک در زمان مناسب پاسخ نداد",
    "stale analysis guard": "token!==photoAnalysisToken",
    "wallet identity": "function walletIdentity()",
    "outcome lock event": 'photoEvent("OutcomePhotoLocked"',
    "outcome comparison gate": 'qualityGateVersion:"outcome-photo-gate-1.0"',
    "result photo link": "outcomePhotoId:outcomePhotoMeta.photoId",
    "share snapshot": "async function shareSnapshotHtml()",
    "photo sharing opt-in": "includesPhoto:$('#share-photo').checked",
    "unknown product queue": 'status:\'queued_identity_resolution\'',
    "demo exclusion": "excludedFromPilotMetrics",
    "barcode fallback": "BarcodeDetector",
    "package evidence": "PackageEvidenceCaptured",
}
for name, needle in js_checks.items():
    require(needle in js, f"Missing JavaScript control: {name}")

require("referencePhoto:referencePhotoMeta" in js, "Photo metadata is not present in export")
require("routineCheckins:checkins()" in js, "Routine check-ins are not present in export")
require("abstainSource" in js and "product_data" in js and "user_context" in js, "Abstention reasons are not separated")
require("preDecision" in html and "preDecisionConfidence" in html, "Before-decision pilot fields are missing")
require("decisionChanged" in js and "pilotSessionId" in js and "completedAt" in js, "Pilot completion metrics are missing")
require("window.BW_IRAN_DATASET" in dataset and dataset.count("recommendationEligible:false") == 1, "Local Iran dataset is missing")
require(dataset.count("priority:") == 15 and "priority:15" in dataset, "Expected 15-item candidate catalog is missing")
require(dataset.count("pilotEligible:true") == 5, "Expected exactly five Gate A pilot products")
require(dataset.count("observedAt:") == 5, "Five dated Gate A prices are missing")
require("blob:pendingPhoto.file" in js, "Raw photo is not written to IndexedDB")
require("referencePhotoBlob" not in js, "Raw photo must not be added to JSON export")
require(".face-frame img[hidden]{display:none}" in css, "Hidden preview regression guard is missing")

model_dir = ROOT / "vendor" / "face_mesh"
required_model_files = [
    "face_mesh.js",
    "face_mesh.binarypb",
    "face_mesh_solution_packed_assets.data",
    "face_mesh_solution_wasm_bin.wasm",
]
for filename in required_model_files:
    path = model_dir / filename
    require(path.is_file() and path.stat().st_size > 0, f"Missing/empty model asset: {filename}")

print("PASS: Beauty Wallet v5.0.0 pilot static acceptance checks")
