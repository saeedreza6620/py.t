# Actual status and remaining work

## Verified in prior work
v66 published successfully; source commit recorded in PROJECT_STATE.json. TypeScript noEmit and selected mock tests passed. D1 table bw_product_dataset existed after the real request. Spreadsheet cached status: 87 records, 0 fully-ready, 85 incomplete, 2 blocked; 33 ingredient drafts and 11 rule drafts. ZIP exports source and documentation only.

## Unresolved / not established
1. Provider KYC blocks actual Gemini and evidence-search calls. Do not claim the assistant operational until a real end-to-end call succeeds.
2. Product formula coverage is incomplete. Source URLs and product photos are clues, not verified INCI. No qualified scientific review was performed on all formulas/rules.
3. Search evidence is model-collected, not a universal exact-variant parser. Two searches can miss pages. Citation presence does not prove a claim or matching formula.
4. RAG is lexical top-chunk ranking, not vector embeddings and not training. Some legacy knowledge remains separate from newer published-source paths.
5. Dataset rule candidates currently filter class matches; full conditions (time, if_any/min, if_none, personal state) are NOT a complete deterministic rule interpreter. Draft R009/R010 have contradictory presence/missing messages. Do not mass-publish the drafts.
6. Alias/parser handles comma/semicolon/newline/(and) and preserves slash/parentheses. Real INCI normalization and mixed punctuation need a larger validated corpus. Unknown/ambiguous tokens block verification.
7. Dataset UI imports JSON, not native XLSX. Convert reviewed workbook using scripts/workbook-to-dataset.py (requires openpyxl). Publication is explicit admin action. The Excel alone is not auto-synced with D1.
8. Photo-based exact-INCI extraction/OCR is NOT active in the main product-review API; do not promise a screenshot automatically provides the full formula. Pilot camera assets do not establish a clinically validated face analyzer.
9. Per-product unverified keep actions are downgraded to verify by the server. This protects against false approval but can reduce usefulness until formula coverage improves.
10. Human review exists as a queue and manual admin response. Actual team availability, expert credentials and response SLA are not established.
11. Full paid-token/postpaid invoice model discussed earlier is NOT established as working server billing. Current table inventory has usage logs, not proven production invoice/token ledger. Do not claim payments or affiliate contracts operational without audit.
12. Affiliate commissions/contracts with Khanoumi/Digikala are not established. A purchase URL is not an affiliate contract, proof of authenticity, current price or stock guarantee.
13. All-device font/icon/PWA behavior and expert scientific accuracy have NOT been exhaustively verified. Old iOS shortcuts can retain old icons. Push delivery when app is closed is not proven by an in-app reminder record.
14. Admin password scheme, payload schema strictness, source trust validation, audit history and concurrency need review before production growth.

## Priorities
Resolve legitimate provider access → test actual review with a known profile → validate exact formulas for the test users' products → implement full condition-aware rule evaluation and scientific review → evaluate end-to-end responses → improve breadth.
Do not disguise limitations by adding more prompt text, fake source references or claims of human review.
