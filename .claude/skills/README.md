# Marketing skills for BeautyWallet

These skills are copied from **[coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)** (MIT license, see `LICENSE-marketingskills`), updated to commit `1f83744` (2026-11-11). Only the skills that fit BeautyWallet were copied (24 of 53).
Since 2026-11-15 the **founder-skill** pack (MIT, Jake Schincariol, see `LICENSE-founder-skill`) is here too: 11 `founder-*` skills with their Python tools (Python 3.8+, nothing to install). They write their working files to `founder/` in the repo root. Any Claude session opened in this repo can use them.

**Every skill reads `.agents/product-marketing.md` first.** That file holds BeautyWallet's real context: audience, pain, voice, rules. Keep it up to date when strategy changes. The Persian strategy is in `docs/strategy/`, and the playbook that maps these skills to BeautyWallet is `docs/strategy/08-marketing-playbook.md`.

| Skill | Use it for |
| --- | --- |
| `product-marketing` | Updating `.agents/product-marketing.md` |
| `customer-research` | Mining Ninisite, Digikala/Khanoumi reviews and Instagram comments; «switch» interviews |
| `social` | Instagram Reels scripts, carousels, the content calendar |
| `content-strategy` | Which topics to cover next and why |
| `copywriting` | Bio, pinned post, store listing, app copy (always in Persian) |
| `influencer-marketing` | Choosing and briefing micro-influencers (5k–20k) |
| `community-marketing` | A Telegram or Bale group for users |
| `referrals` | «Invite a friend» and the Private invite loop |
| `onboarding` | The first session and the aha moment |
| `paywalls` | Diamond moments (already: value first, ask before the next result) |
| `offers` | Founding-member offer, Private tier |
| `launch` | Cafe Bazaar / Myket launch, ORB framework |
| `aso` | Store title, keywords and screenshots |
| `marketing-psychology` | Honest persuasion and its limits |
| `marketing-plan` | A full AARRR plan; its 17-section current-state rubric scored BeautyWallet in `docs/strategy/13-brand-and-marketing-path.md` |
| `marketing-ideas` | 139 tactics when the obvious channels are done |
| `cro` | The checkout sheet, the site's first screen, the calm-program pay moment |
| `pricing` | Diamond packs and «ولت پلاس» (see `docs/strategy/12-revenue-model-v2.md`) |
| `analytics` | What to count in `/admin/l2` and `/admin/marketing`; rates only over closed windows |
| `churn-prevention` | «ولت پلاس» renewals and people who stop ticking |
| `lead-magnets`, `free-tools` | Free checks as acquisition (e.g. «پوستت چیه؟» quiz) |
| `sms` | Wording of the manual SMS texts (owner sends them; never automate) |
| `video` | Reels production, screen recordings of the app |
| `founder-board` | Three published-framework lenses (offers, monopoly, product) that score the idea and vote |
| `founder-competitors` | Direct and indirect competitors, with linked facts |
| `founder-consumer` | A simulated buyer panel (objections and wording; buy rates are an upper bound, never quotes) |
| `founder-pricing` | Van Westendorp price range from price answers (real interviews preferred) |
| `founder-offer` | The offer stack (founding member, first purchase) |
| `founder-cfo` | Unit economics and the most we can pay per customer |
| `founder-marketing` | Positioning, channels, 30-day calendar, ten hooks |
| `founder-brand` | Name checks, promise, voice, look, first five touchpoints |
| `founder-ops`, `founder-launch`, `founder-plan` | Operations, a dated launch countdown, the compiled plan |
| **`beautywallet-weekly`** (our own) | **The weekly data loop:** read `data/marketing/latest.json`, find the biggest drop, write the next content pack and report in Persian |

## Adapting for Iran and BeautyWallet

The originals are written for US SaaS. Keep these differences in mind:
- Instagram, Telegram and Bale replace LinkedIn and X.
- Cafe Bazaar and Myket replace the App Store and Google Play.
- Card-to-card replaces Stripe.
- Trademark checks: Iran's register (`iripo.ssaa.ir`), not USPTO/EUIPO, unless a foreign market is planned.
- The US SMS laws (TCPA) don't apply, but our own rule does: **never send or schedule SMS**.
- BeautyWallet's honesty rules (`README.md` §3) override any tactic in these skills. In particular: no fake scarcity, no fake social proof, no guilt.
