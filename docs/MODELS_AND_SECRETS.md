# Models and private configuration

**v68: providers liara | avalai | netarz.** Liara: `AI_PROVIDER=liara`, secret `LIARA_API_KEY`, `AI_BASE_URL` = project URL (required), Chat Completions only, live search via `:online` model suffix (default search model `openai/gpt-4.1-mini:online`). Previously default: AvalAI (`AI_PROVIDER=avalai`, secret `AVALAI_API_KEY`, base `https://api.avalai.ir/v1`, search model `gpt-5.6-luna` via the Responses `web_search` tool). Netarz remains supported with `AI_PROVIDER=netarz` + `NETARZ_API_KEY`. Toman cost estimates are only computed for Netarz. Deployment guide: docs/DEPLOY_CLOUDFLARE_AVALAI_FA.md. A live AvalAI call has NOT been verified from this environment; only a local stub of its API.


Nonsecret values last applied to v66:
```
AI_PROVIDER=netarz
AI_BASE_URL=https://netarz.ir/api/ai/v1
AI_MODEL=gemini-3.8-flash
AI_MODEL_LIGHT=gemini-3.5-flash-lite
AI_MODEL_ECONOMY=gemini-3.5-flash-lite
AI_MODEL_REVIEW=gemini-3.8-flash
AI_MODEL_COMPLEX=gpt-5.6-sol
AI_MODEL_SEARCH=gpt-4.1-mini
```
AI_MODEL_SPECIALIST was removed to stop the previous Fable trigger. No provider access is guaranteed by model catalog presence. Verify provider availability/capabilities and billing at execution time. Do not substitute an expensive fallback silently or retry billable requests repeatedly.

Gemini uses /chat/completions with low/minimal reasoning_effort, not the OpenAI-only Responses route. When evidence search is required, a separate /responses web_search call runs first with GPT-4.1 mini; its usage is logged separately. Sol uses /responses with deeper reasoning. This is routing, not a clinical consensus panel or model fine-tuning.

Required private names:
- NETARZ_API_KEY: server provider API credential
- ADMIN_PASSWORD_HASH: lowercase SHA-256 hex of the chosen admin password, matching current implementation
- ADMIN_SESSION_KEY: random private HMAC signing key
- AUTH_HASH_KEY: private HMAC key for SMS/user identity hashing where those routes are used
- KAVENEGAR_API_KEY, KAVENEGAR_TEMPLATE, OWNER_PHONE: optional SMS feature configuration; phone value is private

None of the values above are included. Use secure environment/hosting secret settings. Never put real secrets in examples, public assets, logs, screenshots or a Git commit. Current admin password hashing is plain SHA-256, not a password-hardening KDF; list this for a security review before scaling rather than claim enterprise-grade authentication.

Last actual live tests, 13 October 2026:
- Gemini Flash-Lite greeting: provider returned 403 / kyc_required; Site returned error, no fabricated answer
- GPT-4.1 mini evidence search for routine: provider returned 403 / kyc_required
- Sol was configured for deep review; a successful live Sol review in v66 was NOT verified
Resolve Netarz account KYC/support access first. Wallet balance and project budget are separate and cannot fix KYC. Keep error messages useful to the owner; do not leak credentials to users.
