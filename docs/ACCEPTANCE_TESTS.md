# Validation checklist

Run existing tests from source with installed dependencies:
```sh
node node_modules/typescript/bin/tsc --noEmit --pretty false
node scripts/test-chat-review.mjs
node scripts/test-decision-policy.mjs
node scripts/test-dataset-quality.mjs
node scripts/test-routine-plan.mjs
node scripts/test-review-safety.mjs
node scripts/test-response-trust.mjs
node scripts/test-personal-response.mjs
node scripts/test-answer-view.mjs
node scripts/test-knowledge.mjs
node scripts/test-product-links.mjs
node scripts/test-human-review.mjs
corepack pnpm build
```
Mock provider tests deliberately print quota/empty/truncated error cases. They do not prove real provider access.

End-to-end checks after proper private configuration:
- Main root and /legacy assets render; /assistant and /admin routes are preserved
- Anonymous first use works; private profile persists and is recovered only for its user
- Two separate users cannot read/edit each other's profile, messages or human-review records
- Oily skin + dry-skin-labelled cream: separate fit from interaction; never claim certain acne solely from label
- Irritated barrier + selected nonprescription exfoliant: give a specific per-product action, not just simplify routine
- Formula unknown: research exact variant; do not return no interactions as a safety clearance
- Ingredient alias ambiguity, differing variant, expired source and missing reviewer prevent verification
- Supplements: known dose/units, UL versus RDA, age/form restrictions, no false overdose from duplicate names alone
- Gemini normal route + separate search succeed and log each usage; explicit deep request uses Sol and returns nontruncated text
- Provider 401/403/402/429/timeout becomes useful error; no fabricated good result or hidden expensive retry
- Admin APIs deny unauthenticated calls; Secret values never appear in response/CSV
- Human-review request/reply respects user ownership and makes no false expert claim
- 320, 375, 390, 430, 768 px: RTL, contrast, bottom nav, no horizontal overflow
- Android manifest icons; iOS apple-touch-icon; offline cache upgrade; installation is browser-dependent

The 24 workbook scenarios are proposed audit cases, not completed clinical validation. Log expected/actual outcomes and error layer: coverage, mapping, rule, explanation or infrastructure.
