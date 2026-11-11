# BeautyWallet (بیوتی‌ولت) — README for the next developer or AI

> **Strategy (Persian):** `docs/strategy/` (positioning, moat, customers, Instagram, revenue, premium, SMS, decision log).
> **Android app / signed APK:** read `android-app/README.md` (build on GitHub, signing secrets, stores).
> **Start with `docs/HANDOFF.md`** (Persian: current state v144, rules, decisions, open tasks, traps). **Read this whole file before changing anything.** Then read `docs/PROCESS.md`, `docs/PAYMENTS.md` (Persian: diamonds, chat paywall, card-to-card end to end) (Persian: the product journey, the customer's «job», the diamond model, the medical boundary, what to do next) and `BACKUP.md` (Persian: how it was built, how to rebuild, how to change it).
> Owner: Saeedreza Barzkar (founder). Talk to him in **Persian**.

BeautyWallet is a Persian skincare web app (installable PWA). It checks a product against **her own skin and routine** before she buys. It also gives her:
- a daily routine with reminders
- an encrypted skin-photo journal
- follow-ups on how each product worked (day 3, week 2, week 4…)
- a skin chat assistant
- a wallet of «الماس» (diamonds) used for paid checks

Live: site `https://beautywallet.liara.run/` · app `https://beautywallet.liara.run/legacy/` · admin `/admin`.

---

## 1. Where the real product lives

This repository started as a Next/vinext starter. **That starter (`app/`, `components/`, `db/`, `drizzle/`, `vite.config.ts` …) is NOT what runs in production.** What runs:

| Path | Role |
| --- | --- |
| `lite/` | **The production server** (Node 22, no framework, no npm dependencies) and the built static files in `lite/public/`. This is what Liara runs. |
| `lite/server.mjs` | All public HTTP routes, AI calls, sign-in, payments, static files. |
| `lite/admin.mjs` | Owner panel `/admin/*`. |
| `lite/*.mjs` | Modules:<br>`bank` — diamonds, card-to-card<br>`cloud` — her data under her phone number<br>`vault` — encrypted photos<br>`push` — web push<br>`studio` — messages and SMS<br>`skinchat` — assistant<br>`journeys`, `carekpi`, `kpi`, `insights`, `retention` — analytics<br>`layer2` — tagged records and city weather<br>`paybot` — optional bot receipts |
| `claude/` | **Source** of the app layers added on top of the base app: `sweet.js/css`, `followup.js`, `skin-journal.js`, `gem-chat.js`, `cloud-sync.js`, `inbox.js`, `layer1.js`, `claude-bridge.js`, and `claude/site/` (the public website). |
| `public/legacy/` | The base app the `claude/` layers are applied onto. |
| `assistant/` | TypeScript review/catalog engine (used by the tests and bundled into `bw-review.js`). |
| `scripts/` | Build scripts and tests. |
| `.github/workflows/liara.yml` | Quality gate and deploy to Liara on every push to `main` that touches `lite/**`. |

## 2. Build → test → deploy (the only correct order)

```bash
# 1. edit files in claude/ (or public/legacy/, lite/*.mjs)
# 2. apply the app layers with a NEW version number (bumps the service-worker cache so installed phones update):
node scripts/apply-sweet-ui.mjs 137
node scripts/build-lite.mjs                 # writes lite/public — commit it
# 3. the 7 gate tests — ALL must pass (they also run in CI):
npm i --no-save typescript@5.9.3
for t in skin-fit catalog-review catalog-routine bank explain catalog-quality keep-user-data; do node scripts/test-$t.mjs || echo "FAIL $t"; done
# 4. run locally and look at it (Playwright, 400px wide):
cd lite && DATA_DIR=/tmp/bwdata PORT=3917 ADMIN_TOKEN=test node server.mjs   # app: http://localhost:3917/legacy/
# 5. commit + push to main → GitHub Actions deploys to Liara (~2 min). Retry the push if GitHub returns a 500.
```

**Bridge gotcha:** `claude/claude-bridge.js` intercepts `fetch('/api/…')` in the browser. Every **new** server API must be added to its pass-through line. Note that its path regex `[A-Za-z/_-]` does not match digits.

## 3. Rules that must never be broken

1. **Never lose a user's saved data on an update.** That covers her name, routine, morning/night choices, reminder times, profile, follow-up answers, skin photos and every change she made.
   - Only ADD new localStorage keys. Never rename or delete existing ones.
   - Never call `localStorage.clear`, `indexedDB.deleteDatabase` or unregister the service worker.
   - The service worker may delete only its own `bw-static-*` / `bw-complete-*` caches.
   - Keep the IndexedDB name `bw-skin-journal` / store `photos`.
   - The cloud key lists in `lite/cloud.mjs` and `claude/cloud-sync.js` must stay identical.
   - `scripts/test-keep-user-data.mjs` enforces all of this.
2. **No secrets** in code, the repo, chat, screenshots or logs. Keys live only in Liara environment variables and GitHub Actions secrets. Never ask the owner to paste a key. The repository is **private** since 2026-11-11, but keys, card numbers and users' phone numbers still never go into git.
3. **Never schedule or send SMS/messages to users.** The owner sends SMS himself from the Faraz SMS panel. Only prepare texts and lists for him.
4. **Honesty in the product:**
   - No promises of unbuilt features.
   - No fabricated data, reviews, testimonials or links.
   - No "human review" unless a real person does it.
   - No romantic or dependency framing.
   - Never claim the assistant analyses photos (it does not).
   - No statistic shown to users under 10 samples.
5. **Verdicts are decisive and personal** to her skin type and routine. Revenue or commission must never influence a verdict.
6. **Never ask users for an ingredient list or a back-of-box photo.** Find the product by name with strong search, or ask for its link.
7. **The assistant never sends users elsewhere to search** (Instagram, YouTube…). When she names a concern, give one concrete step for today.
8. **Catalog:**
   - No prices.
   - New products need an image and the owner's approval.
   - The catalog grows only from users' own checks.
   - AI credit is spent only on real user actions — never on cron or background jobs.
9. **The card number** is entered only by the owner, in the admin panel.
10. **Updates reach installed users** through the in-app refresh (version bump), never by sending them a link.
11. **Tone:** warm and gentle (Persian «با ناز»), never phrases that make her feel judged.
12. **Before shipping:** pass the gate tests and verify with Playwright. Then tell the owner plainly what could not be tested for real (live AI, SMS, push, real payment, camera, iPhone).

## 4. Configuration (names only — values are in Liara)

- **AI:**
  - `LIARA_API_KEY` (or `AI_API_KEY`), `AI_BASE_URL`
  - Models: `AI_MODEL`, `AI_MODEL_LIGHT`, `AI_MODEL_COMPLEX`, `AI_MODEL_SEARCH`, `AI_MODEL_CHAT(_SEARCH)`, `AI_MODEL_RESEARCH(_FALLBACK)`
  - Search depth: `WEB_RESULTS`, `RESEARCH_DEEP`
- **Admin:** `ADMIN_TOKEN`
- **Data:** `DATA_DIR=/data` (a Liara disk — without it data is wiped on deploy), `PUBLIC_URL`, `HOURLY_LIMIT`, `DAILY_LIMIT`, `VAULT_MAX_PHOTOS`, `VAULT_MAX_TOTAL_MB`
- **SMS:**
  - Sign-in codes (Kavenegar): `KAVENEGAR_API_KEY`, `KAVENEGAR_TEMPLATE`, `KAVENEGAR_SENDER`
  - Messages (Faraz / IranPayamak, `api.iranpayamak.com`, header `Api-Key`): `FARAZ_API_KEY`, `FARAZ_SENDER`, `FARAZ_PATTERN`, `FARAZ_PATTERN_SENDER`, `FARAZ_BASE`
- **Payments:** `PAY_SMS_TOKEN` (bank deposit SMS from the owner's Android phone), `PAY_LINK_SECRET`
- **Optional:**
  - Bot receipts: `BALE_BOT_TOKEN`, `BALE_CHAT_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
  - Affiliate: `AFF_DIGIKALA`, `AFF_KHANOUMI`
  - Push: `PUSH_CONTACT`
- **GitHub Actions:**
  - Secret: `LIARA_API_TOKEN`
  - Optional variables: `LIARA_APP_NAME` (default `beautywallet`), `LIARA_PLATFORM` (default `node`)

## 5. Useful places

- **Admin panel:**
  - `/admin` — KPI, pending card-to-card orders, journeys
  - `/admin/care` — daily-care dashboard and alarms
  - `/admin/l2` — layer-2 data readiness
  - `/admin/studio` — in-app messages and SMS
- **Health:** `/healthz` (shows `version`, `ai`, `admin`, `disk`).
- **Docs:** `BACKUP.md` (Persian, full rebuild guide) · `docs/` (older notes; `LIARA_TEST_FA.md`, `MODELS_AND_SECRETS.md` are partly historical).
- **History:** `git log` — every release commit starts with `vNNN:` and explains what changed and why.

## 6. Current state (v143, 2026-11-10) — summary in `docs/HANDOFF.md`; browser checks in `scripts/e2e/`

- About 20 real users; nobody has bought a subscription yet.
- Payment is card-to-card, approved in `/admin`.
- The Faraz SMS API key returns 401 from the code, so the owner sends SMS manually.
- v136 added:
  - authenticity via TTAC/Titak
  - a framed camera with a light check
  - «since you started X»
  - reaction photos
  - a monthly skin report (free preview)
  - a progress film
  - a city weather tip
  - tagged layer-2 records
- Not yet verified on real phones: camera, barcode scan, live weather from Liara, film on iPhone.
- v137 added «پوستم به هم ریخته», a calm program (`claude/calm.js`):
  - red-flag triage → doctor
  - suspects from her routine start dates and follow-ups
  - simple routine; daily 0–3 scores
  - forearm ROAT test (two suspects at once), then a face re-try one at a time for 4 days
  - result + «پرونده‌ی پوست من» (`bw_skin_passport`), warned on every later product check
  - paid with diamonds (`cfg.calmPrice`, default 3) when the skin has calmed: `/api/calm/unlock`
  - entry points: welcome choice, home chip, bad follow-up answer, chat offer `open_calm`
  - Timings and sources are in the header comment of `claude/calm.js`.
- v138–v139:
  - Calm program: validated 0–10 itch/burn questions; infection red flags. The forearm test is free; she pays `cfg.calmPrice` (3 💎) to open the full result (ingredient group, her other products with that group, alternatives, skin record).
  - Refill: not worked → «N alternatives» for `cfg.altPrice` (1 💎); worked → TTAC authenticity of the new package.
  - First screen: «پک شخصی روتین» (request to a human consultant via support) and گیفت‌یار cards.
  - Reminders: server retries failed pushes (+2/+5/+15 min) and marks them sent only on success; the service worker renews a rotated push subscription (`pushsubscriptionchange`); the app re-syncs once a day. Morning notifications start with «صبحت بخیر».
  - Speed: the installed app opens from the service-worker cache at once (it used to wait up to 12 s for the network); static files are served with brotli/gzip.
  - Rule kept: diamonds are asked right after value is felt and before the next result is shown — never only at the very end.
- v140: supplements hidden from the app (code in `claude/` and her saved `bw_supplements_v1` kept).
- v141: «امروز» home for a returning user (`claude/today.js`): one card with this slot's three routine ticks (same `bw_track_YYYY-MM-DD` keys as the routine tab), a habit-strength ring computed like Loop Habit Tracker (a missed day lowers it a little, never resets), one «waiting for you» item (calm-program day or photo day), four quick actions. No guilt, no streak loss. New users still get the «امروز اومدی چیکار کنیم؟» welcome.
- v142: token (diamond) revenue model — see **`docs/PAYMENTS.md`**. Skin chat: `chatFree` gift messages once per person, then 1 diamond opens `chatPerGem` messages (her question is kept and answered right after paying; warning-sign messages are always free). Checkout page like a real shop (summary, buyer, method, purchase rules) → card-to-card with a one-off amount, last 4 digits, optional tracking number and receipt photo (`DATA/receipts/`, admin-only at `/admin/receipt?ref=`). The step that was waiting continues on its own after the instant diamond. Purchase funnel on `/admin/l2`. Prices editable in the admin panel.
- v143: no flash of the old base screen on open. `scripts/apply-sweet-ui.mjs` puts a small gem cover in `<head>`/`<body>` of `public/legacy/index.html`; `sweet.js` adds `html.bw-ready` when its UI is in place (the cover also lifts by itself after 6 s).
- v144: **Android app** (`android-app/`, Capacitor 7, package `ir.beautywallet.app`) that opens the live site and schedules routine reminders ON THE PHONE (work offline). APK built by `.github/workflows/android.yml`; signing keys only in GitHub secrets. iPhone stays the home-screen web app with a gentle install nudge. Full guide: **`docs/ANDROID.md`**.

