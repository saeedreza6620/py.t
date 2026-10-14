# نسخه آزمایشی بیوتی‌ولت روی لیارا (تست ۱۰ نفره و جمع‌آوری بازخورد)

پوشه `lite/` یک سرور Node کوچک و بدون وابستگی است:
- همان اپ کامل (`public/legacy` + ظاهر جدید) را نشان می‌دهد و روی گوشی نصب‌شدنی است (PWA).
- کلید هوش مصنوعی فقط روی سرور است؛ مرورگر کاربر هیچ کلیدی نمی‌بیند.
- `POST /api/ai` → لیارا AI؛ برای قیمت/تخفیف/قسط زنده مدل `:online` استفاده می‌شود.
- `POST /api/feedback` → بازخورد کاربر در `DATA_DIR/feedback.jsonl`.
- `GET /admin/feedback?token=ADMIN_TOKEN` → صفحه بازخوردها؛ با `&format=csv` خروجی اکسل.
- محدودیت: هر IP ساعتی ۴۰ درخواست، کل روز ۶۰۰ (با `HOURLY_LIMIT` و `DAILY_LIMIT` قابل تغییر).

## ساخت دوباره فایل‌های اپ
```
node scripts/apply-sweet-ui.mjs <نسخه>
node scripts/build-lite.mjs
```
خروجی در `lite/public` است و باید کامیت شود (لیارا همین پوشه را مستقیم اجرا می‌کند).

## راه‌اندازی در لیارا (یک بار)
1. کنسول لیارا ← ایجاد برنامه ← **Node.js** ← نام مثلاً `beautywallet` ← کوچک‌ترین پلن.
2. برنامه ← **تنظیمات ← متغیرهای محیطی**:
   | نام | مقدار |
   |---|---|
   | `LIARA_API_KEY` | کلید لیارا AI (فقط همین‌جا) |
   | `AI_BASE_URL` | `https://ai.liara.ir/api/<شناسه پروژه>/v1` (اختیاری؛ پیش‌فرض همین پروژه است) |
   | `AI_MODEL` | `google/gemini-2.5-flash` |
   | `AI_MODEL_LIGHT` | `openai/gpt-4o-mini` |
   | `AI_MODEL_COMPLEX` | `openai/gpt-4.1` |
   | `AI_MODEL_SEARCH` | `openai/gpt-4.1-mini:online` |
   | `ADMIN_TOKEN` | یک رمز طولانی تصادفی، فقط برای صفحه بازخورد |
   | `DATA_DIR` | (اختیاری) مسیر دیسک، مثلاً `/data` |

   `AI_PROVIDER`، `AI_MODEL_ECONOMY` و `AI_MODEL_REVIEW` برای این نسخه لازم نیستند؛ بودنشان ضرری ندارد.
3. (پیشنهادی) **دیسک**: یک دیسک کوچک بساز و به `/data` وصل کن و `DATA_DIR=/data` بگذار؛ وگرنه بازخوردها با هر استقرار تازه پاک می‌شوند.
4. حساب کاربری ← **کلیدهای API** ← یک توکن بساز.
5. گیت‌هاب ← مخزن ← Settings ← Secrets and variables ← Actions:
   - Secret: `LIARA_API_TOKEN` = همان توکن مرحله ۴
   - Variable (اگر نام برنامه چیز دیگری است): `LIARA_APP_NAME`
6. Actions ← «Deploy lite to Liara» ← Run workflow. از این به بعد هر تغییری در `lite/` خودکار منتشر می‌شود.

## بعد از انتشار
- آدرس: `https://<نام برنامه>.liara.run/legacy/`
- سلامت: `/healthz` باید `{"ok":true,"ai":true}` بدهد.
- بازخوردها: `/admin/feedback?token=<ADMIN_TOKEN>`
- هیچ کلیدی را در چت، کد یا مخزن نگذار.
