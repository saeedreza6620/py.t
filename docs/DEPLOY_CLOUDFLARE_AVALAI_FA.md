# راه‌اندازی BeautyWallet روی Cloudflare رایگان با لیارا یا AvalAI

نتیجه: سایت مستقل روی `https://beautywallet.<نام-حساب>.workers.dev`، با جست‌وجوی زنده قیمت، تخفیف و قسط از طریق AvalAI. بدون خرید دامنه و هاست.

## ۱. AvalAI
1. در chat.avalai.ir ثبت‌نام کن و اعتبار بخش **API / توسعه‌دهندگان** را شارژ کن (اشتراک چت کافی نیست).
2. یک کلید API بساز. **کلید را در هیچ چت، فایل یا گیت نگذار.**
3. در فهرست مدل‌های حسابت، این شناسه‌ها را پیدا کن: `gemini-3.8-flash`، `gemini-3.1-flash-lite`، `gpt-5.6-luna`، `gpt-5.6-sol`. هر کدام نبود، نزدیک‌ترینش را یادداشت کن.

## ۲. GitHub
1. یک حساب GitHub بساز.
2. یک مخزن **خصوصی** خالی به نام `beautywallet` بساز.
3. سورس این بسته (پوشه `source`) در آن قرار می‌گیرد؛ Claude می‌تواند با اجازه تو آن را push کند.

## ۳. Cloudflare
1. در dash.cloudflare.com حساب رایگان بساز.
2. **Storage & Databases → D1 → Create database** با نام `beautywallet-db`. شناسه (Database ID) آن را کپی کن. این شناسه رمز نیست.
3. **Workers & Pages → Create → Import a repository** → مخزن `beautywallet` را وصل کن.
   - Project name: `beautywallet`
   - Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm build`
   - Deploy command: `node scripts/cf-deploy.mjs`
   - Build variables:
     - `CLOUDFLARE_D1_DATABASE_ID` = شناسه D1 از قدم ۲
     - `NODE_VERSION` = `22`
4. Deploy را بزن. اسکریپت ابتدا جدول‌های دیتابیس را می‌سازد و بعد سایت را منتشر می‌کند. هر Deploy بعدی فقط تغییرات تازه دیتابیس را اعمال می‌کند.

## ۴. تنظیمات Worker (Settings → Variables and Secrets)
**Secret** (رمزدار):
| نام | مقدار |
|---|---|
| `AVALAI_API_KEY` | کلید AvalAI |
| `ADMIN_PASSWORD_HASH` | هش رمز مدیریت (روش پایین) |
| `ADMIN_SESSION_KEY` | یک رشته تصادفی طولانی |
| `AUTH_HASH_KEY` | یک رشته تصادفی طولانی دیگر؛ بعداً عوضش نکن |

**Text** (معمولی):
`AI_PROVIDER=avalai`، `AI_MODEL=gemini-3.8-flash`، `AI_MODEL_LIGHT=gemini-3.1-flash-lite`، `AI_MODEL_ECONOMY=gemini-3.1-flash-lite`، `AI_MODEL_REVIEW=gemini-3.8-flash`، `AI_MODEL_COMPLEX=gpt-5.6-sol`، `AI_MODEL_SEARCH=gpt-5.6-luna`

ساخت رشته تصادفی و هش رمز، بدون ارسال به هیچ‌جا: در مرورگر کامپیوتر خودت Console را باز کن (F12) و بنویس:
```js
crypto.randomUUID()+crypto.randomUUID()
```
```js
(async p=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(p)))].map(b=>b.toString(16).padStart(2,'0')).join(''))('رمز-مدیریت-خودت')
```

## ارائه‌دهنده لیارا (به‌جای AvalAI)
کد هر سه را پشتیبانی می‌کند: لیارا، AvalAI و Netarz. برای لیارا در قدم ۴ این‌ها را بگذار:

**Secret:** `LIARA_API_KEY` = کلیدی که در پنل لیارا ساختی.

**Text:**
| نام | مقدار |
|---|---|
| `AI_PROVIDER` | `liara` |
| `AI_BASE_URL` | آدرس اتصال پروژه از پنل لیارا (همان آدرس پایه؛ اگر انتهایش `/chat/completions` داشت مهم نیست، کد حذفش می‌کند) |
| `AI_MODEL_SEARCH` | مدل جست‌وجو با پسوند `:online`، مثلاً `openai/gpt-4.1-mini:online` |
| `AI_MODEL_LIGHT` و `AI_MODEL_ECONOMY` | یک مدل ارزان از فهرست پنل، مثلاً Gemini Flash-Lite |
| `AI_MODEL` و `AI_MODEL_REVIEW` | مدل معمولی، مثلاً `openai/gpt-4.1-mini` یا Gemini Flash |
| `AI_MODEL_COMPLEX` | مدل قوی، فقط برای روتین‌های پیچیده |

شناسه دقیق مدل‌ها را از فهرست مدل‌های پلن خودت در پنل لیارا کپی کن؛ مدل‌ها به پلن بستگی دارند.
با لیارا همه درخواست‌ها از مسیر Chat Completions می‌روند. جست‌وجوی زنده با پسوند `:online` انجام می‌شود و لینک منبع از پاسخ مدل خوانده می‌شود.

## ۵. سه تست واقعی
روی آدرس workers.dev:
1. پیام «سلام» در دستیار ← پاسخ کوتاه یعنی کلید و مدل سبک کار می‌کنند.
2. بررسی یک ضدآفتاب کاتالوگ برای پوست چرب ← مُهر نتیجه، بعد «💸 قیمت، تخفیف و قسط زنده» ← لینک فروشگاه یعنی جست‌وجوی وب کار می‌کند.
3. روتین با رتینول + آزلائیک + لایه محافظ تحریک‌شده ← بررسی عمیق.

اگر خطا دیدی: Workers → beautywallet → Logs. پیام‌هایی مثل `status: 401` (کلید)، `402` (اعتبار)، `404 model` (نام مدل) را ببین. کلید را در گزارش خطا کپی نکن.

## نکته‌ها
- دسترسی کاربران ایرانی به `workers.dev` را قبل از دعوت تست‌کننده‌ها از اینترنت ایرانی بررسی کن.
- ارسال پیامک ورود (Kavenegar) اختیاری است؛ بدون آن، داده کاربر روی دستگاه خودش می‌ماند.
- کلید Netarz لازم نیست؛ اگر روزی خواستی برگردی، `AI_PROVIDER=netarz` و `NETARZ_API_KEY` کافی است.
