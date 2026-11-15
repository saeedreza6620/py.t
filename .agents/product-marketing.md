# Product marketing context — BeautyWallet (بیوتی‌ولت)

> Read first by every marketing skill in `.claude/skills/` (product-marketing format).
> Sources: `docs/strategy/` (Persian) and real data from the owner. Last update: 2026-11-15 (v148; brand and marketing path in `docs/strategy/13-brand-and-marketing-path.md`).
> **Talk to the owner (Saeedreza) in Persian. All customer-facing copy is Persian, warm and gentle («با ناز»).**

## 1. Product overview

- **What it is:** a Persian skincare app: web app and Android app (`ir.beautywallet.app`). It checks a product against **her own skin type and routine** before she buys, and answers decisively with buy, wait or don't buy.
- **Also does:**
  - daily routine with on-time reminders (offline on Android)
  - «امروز» habit screen
  - «پوستم به هم ریخته» calm program, which finds the culprit with a forearm test
  - encrypted skin-photo journal
  - follow-ups on whether each product worked
  - authenticity check via TTAC/Titak
  - skin chat assistant
  - gift helper
- **Business model:** diamonds (tokens).
  - Free value comes first. Diamonds are asked right before the next result.
  - Revenue model v2 (v148, `docs/strategy/12-revenue-model-v2.md`):
    - first purchase 3 💎 = 49k toman (once per person), 10 💎 = 189k, 30 💎 = 449k
    - «ولت پلاس» 199k/month: 15 💎, daily-care reports, fair caps
    - assistant: 5 gift messages, then 1 💎 = a 24-hour pass (up to 20 messages)
    - full forearm-test result = 3 💎; after «نخر» the first alternative is free, the rest 1 💎
    - daily care: 4-week report 2 💎, routine tune 2 💎, season routine 1 💎 (only with enough data)
  - Live prices are in the admin panel.
  - Payment: card-to-card only. No gateway.
- **Live:** `https://beautywallet.liara.run/legacy/` (app) · `https://beautywallet.liara.run/` (site).

## 2. Target audience

- Iranian women, mostly 18–35, who buy skincare online (Instagram shops, Digikala, Khanoumi) and are afraid of wasting money or buying fakes.
- **Entry customer (highest pain, highest willingness to pay):** started a new product a few days ago, and now her skin broke out, went red or burns. She doesn't know which product caused it.
- **Second:** about to buy an expensive product and afraid it won't suit her or isn't genuine.
- **Future premium segment:** affluent women in north Tehran. Their need is time, trust and certainty («بیوتی‌ولت پرایوت»: a real human consultant, shelf review, authenticity, skin record). Not built yet; test manually first.

## 3. Problems & pain points (her words)

- «یه محصول تازه زدم، پوستم به هم ریخت، نمی‌دونم کدوم بود و الان چیکار کنم.»
- «این همه پول دادم، نمی‌دونم اصله یا تقلبی.»
- «اصلاً به پوست من می‌خوره؟»
- «نشونم بده این همه پول و زحمت جواب داده.»
- Owner insight: users want a **simple question and an easy answer**. The science (penetration modeling) stays behind the curtain.

## 4. Jobs to be done

1. Before buying: «کمکم کن پولم هدر نره و گول نخورم.» (rare)
2. **Skin flared up: «بگو کدوم بوده و الان چیکار کنم.» (entry point)**
3. Does it work: «نشونم بده جواب داده.» (retention)

## 5. Competitive landscape

- **Shops and Instagram sellers** sell products, so they can't credibly say «don't buy».
- **Influencers** are paid by brands.
- **Foreign apps** have models we compared:
  - Yuka, SkinSort, TroveSkin: subscription
  - Think Dirty: lifetime purchase
  - Curology: problem program
  - Hwahae: buy-at-need
- None of these is Persian, knows the Iranian market and counterfeits, or takes rial card-to-card.

## 6. Differentiation (why us)

- **Counter-positioning:** «بیوتی‌ولت طرف خریداره. ما چیزی نمی‌فروشیم؛ می‌گیم چی نخری.» No brand money, no commission, and revenue never affects a verdict.
- **The founder:** a biomedical and computational engineer working in drug-delivery modeling. Possible proof assets: measured pH of products and verified formulas from brand representatives.
- **Personal answers:** based on her own skin, routine and history. Not generic.
- **A real human behind it,** and real privacy (encrypted photos; data never sold).

## 7. Objections & anti-personas

- Objections:
  - «یه اپ دیگه؟ وقت ندارم.»
  - «از کجا معلوم راست می‌گی؟»
  - «کارت‌به‌کارت امن نیست.»
  - «من که دکتر نمی‌خوام.»
- Answers:
  - one-tap «امروز»
  - honesty: no fake reviews, and we say «don't buy»
  - instant diamond after paying, plus a human checks
  - we are not a doctor; we help you choose, and send red flags to a doctor
- Anti-personas:
  - people wanting diagnosis or treatment
  - injection or aesthetic procedures (out of scope)
  - bargain hunters who only want a price comparison (no prices in our catalog)

## 8. Switching dynamics

- **Push:** wasted money, a broken-out face, fear of fakes, contradictory Instagram advice.
- **Pull:** a decisive personal answer, and finding the culprit.
- **Habit:** asking friends or sellers, buying what influencers show.
- **Anxiety:** «another app»; paying by card-to-card.

## 9. Customer language

**Verbatim from Ninisite thread titles (research round 1, 2026-11-11; see `docs/strategy/09-customer-research.md`):**
- Reaction (7 threads, high confidence): «زدم صورتم پر جوش شد !کمک!» · «صورتمو داغون کرد😑» · «با روتین پوستی جوش زدم😢» · «حساسیت پوستی بر اثر ضد جوش…کمک» · «الان شدید قرمز شده چه کنم😭» · «چه غلطی کردما». Two of seven were *anti-acne* products that caused acne.
- Not knowing her skin (7 threads, high): «اصن نمیدونم دهیدراته است یا چه مرگشه پوستم» · «کسی اینجا راجب پوست چرب چیزی میدونه؟؟؟» · «چی بخرم» · «من پوست خوب میخوااام😐🥲». A thread «اگه سوالی راجب پوست دارید درخدمتم» has 20+ pages: people take help from a knowledgeable stranger.
- Fakes and scams (medium-high): «این کرم اصل یا تقلبی؟؟؟» · «سرم کلاه رفته چیکارکنم 😭».

- Words she uses: پوستم به هم ریخت، جوش زدم، قرمز شد، می‌سوزه، اصله؟، تقلبیه؟، به پوستم می‌خوره؟، روتین صبح و شب، آبرسان، ضدآفتاب، پوست چرب و خشک و حساس.
- Words to avoid in copy:
  - medical diagnosis words
  - «تضمینی»
  - anything romantic or dependency-building

## 10. Brand voice

- Warm, gentle, a bit playful («با ناز»). Emojis like 💜 🫂 🌸 are fine.
- Never judging; no guilt («your streak is gone» is banned).
- Honest:
  - no promises of unbuilt things
  - no fake data, reviews or testimonials
  - «human review» only when a human really does it
- Mornings start with «صبحت بخیر».

## 10b. Brand promise and tagline (proposed 2026-11-15; final call is joint)

- Promise: «ما طرف توییم؛ قبل از اینکه پولت هدر بره یا پوستت اذیت بشه، رُک می‌گیم. حتی اگه جوابمون «نخر» باشه.»
- Tagline: «طرف خریدار» (alternatives: «اول با پوستت بسنج، بعد بخر» · «ما چیزی نمی‌فروشیم؛ می‌گیم چی نخری»).
- Voice: warm «با ناز» · blunt and honest · calming, never alarming.
- Logo: «الماسِ تیک» (`brand/logo/`), not final yet. Text colours: `#15384B`, `#4A30C2`; `#E2669F` only for decoration or large text (contrast 3.2 on white).
- 2026-11-15: Shaghayegh (co-founder, brand and marketing) left. Until a new brand/marketing co-founder joins (`docs/team/cofounder-recruiting-form.md`), Saeedreza owns brand and marketing; content is made without anyone's face on camera unless he chooses (`docs/strategy/14-instagram-solo.md`).

## 11. Proof points (only real ones)

- Calm-program questions are based on dermatology references: ROAT forearm test, itch NRS 0–10, red flags from HSE.
- An authenticity check uses the official TTAC code.
- **No statistic is shown to users under 10 samples.** Today there are about 24 users and no confirmed purchase yet, so there are no social-proof numbers to use.

## 12. Goals (next 90 days)

**45-day focus (2026-11-15 → 2026-12-18, `13-brand-and-marketing-path.md`):** all marketing opens one door, «پوستم به هم ریخته». Success line by 28 Azar 1405: 30 calm-program starts from Instagram/forums, 6 paid at the result (20%), 5 real interviews. No paid ads until those numbers exist.


1. First paid diamond purchases. Measure the funnel in `/admin/l2`.
2. 30 completed calm programs, with a day-30 follow-up.
3. Instagram: 4 Reels a week across four pillars (کدوم بود؟ / نخر / اصله؟ / آزمایشگاه بیوتی‌ولت), with the CTA «comment پوستم».
4. Android app in Cafe Bazaar and Myket (after the signing key).
5. 5 founding members (manual offer), and later 10 Private members.

## 13. Hard rules for any marketing work

- **Never send or schedule SMS.** Only prepare texts and lists; the owner sends from the Faraz panel.
- **No users' phone numbers in git.** The live list is in `/admin`.
- **No secrets anywhere.**
- **Don't bash brands by name.** Talk about ingredients, combinations and skin types, or show measured numbers.
- **No giveaways for followers.** No fake before/after photos.

## 14. Learnings

- Research round 1 (2026-11-11): «skin flared up» is the strongest, most frequent pain (confirms the entry point). Many users don't know their skin type, so «check against your skin» needs help knowing the skin first. A new hook: «ضد جوش زدی، جوش زدی؟». Forum helpers are trusted, so a transparent founder presence on Ninisite is a validated channel.

- 14 of 19 early users never checked a product. The welcome choice and the «امروز» screen were built for this.
- The owner reported a flash of the old base screen when the app opened; fixed in v143.
- Supplements were hidden (medical risk, focus). Injections were rejected. Perfume is parked: highest willingness to pay; manual test only.
- 2026-11-15: scored 32/80 on the marketing-plan current-state rubric: strong positioning, messaging and product; near-zero launch, published content, conversion data and proof. The Offers lens says the main gap is the buyer's belief it will work (proof), not price.
