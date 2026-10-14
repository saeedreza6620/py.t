# Architecture and source map

## Actual stack
TypeScript, React 19.2.6, Vinext 1.0.0-beta.5 / Vite 8.0.13, Cloudflare Worker, Cloudflare D1 binding DB, Drizzle ORM 0.45.2. Next-compatible app routes exist; this is NOT an ordinary standalone Next.js deployment. package.json + pnpm-lock.yaml are authoritative. No R2 binding is enabled.

## Two frontend surfaces
The public main experience is public/index.html, synchronized from public/legacy/index.html by scripts/sync-public-entry.mjs. It uses a /legacy/ base and the legacy JS/CSS/assets. app/ provides API routes, React /assistant and /admin. Preserve both surfaces: changing only app/page.tsx may not change the visible main experience. Old pilot/reference files are retained as source history, not automatically the active UI.

PWA assets: public/legacy/manifest.webmanifest, sw.js, install-app.js, local icons/assets. Root and legacy cache-version strings are currently v66. Fonts and icons are local assets. Inspect existing references before renaming paths. iOS home-screen additions use apple-touch-icon; Android uses manifest icons. A browser cannot force iOS one-click installation. Existing home-screen bookmarks can cache old icons.

## Request pipeline
1. UI passes message, analysisType, purchaseCheck, product identity and reviewContext
2. Server validates origin/payload; ensures anonymous user or session; enforces rate limit
3. Shared reviewContext whitelists user profile and selected products
4. Personal memory, catalog record, verified offers and knowledge context are retrieved from D1
5. Dataset quality identifies missing variant, INCI, mapping, source comparison and review status
6. Deterministic policy checks medical urgency, registered UL excess, duplicate purchase and actual available budget facts
7. Routing selects economical / normal / deep model; evidence search may run separately
8. Model receives relevant profile, policy, curated rules, lexical RAG and real retrieved evidence
9. Server parses per-product routine_plan, applies response guards and records decision/usage/sources
10. UI displays short text/action cards; source metadata remains in backend where applicable

## Key modules
- app/api/assistant/route.ts: orchestration, context, provider request, guard, persistence
- assistant/review-context.ts, browser-context.ts, public/legacy/review-context.js: shared personal input
- assistant/decision-policy.ts: deterministic policy + model routing
- assistant/chat-review.ts: Chat Completions adapters + Gemini evidence search
- assistant/knowledge.ts and knowledge-registry.ts: prompts and curated source/rule registry
- assistant/retrieval.ts and resources/starter.ts: source documents/chunks and lexical ranking
- assistant/dataset-quality.ts / dataset-store.ts / resources/product-dataset.json: product quality gates and versioned dataset
- assistant/supplement-dose.ts: numeric dose calculation and reference limits
- assistant/routine-plan.ts: validated per-product action block
- assistant/response-trust.ts: decision guards and cited-source checks
- assistant/product-links.ts: filters real cited seller URLs, not proof of stock/authenticity
- assistant/human-review.ts: request queue and admin reply; not an always-staffed service
- app/site-sessions.ts / phone-auth.ts: admin, visitor, SMS session logic
- app/api/me/route.ts: persistence and profile history
- app/admin/: authenticated management, CSV, usage, sources, dataset and human review

## Three contexts
Knowledge: curated source-backed information and published documents. Personal: only the requesting user's profile/routine/budget/history. Market: dated validated offers or temporary searched evidence. Never promote a scraped result/user opinion to a scientific rule automatically.

## Data quality behavior
The seed contains 87 product identities/source hints, 33 ingredient entries, 11 rule drafts. None of these product seed records satisfies the full formula-ready gate. Product quality requires exact variant + market/formula version + raw INCI + two distinct source URLs with manually checked agreement + complete reviewed mapping + reviewer/date. Six-month recheck is an internal policy, not a universal scientific standard.
Dataset publication does not make draft records verified. Admin imports whole version JSON; publish/rollback selects an active version. Preserve raw INCI. Slashes and botanical parentheses are not blindly split.

## Runtime tables outside Drizzle migrations
ensureRetrieval: bw_knowledge_documents, bw_knowledge_chunks + index.
ensureDataset: bw_product_dataset.
ensureHumanReviews: bw_human_reviews.
These are created lazily by their source modules. Include these initialization paths in a clean restore, not just db/schema.ts. No database row export is included in this handoff.
