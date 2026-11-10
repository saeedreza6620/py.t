# End-to-end checks (Playwright, local only)

These are the browser checks used before each release. They run against a **local** server. They never touch the live site, real money or real SMS.

```bash
# 0. build first (see the root README): node scripts/apply-sweet-ui.mjs <ver> && node scripts/build-lite.mjs
OUT=/tmp/bw-e2e; mkdir -p $OUT

# 1. a fake AI so the chat answers without a key or credit (port 3999)
node scripts/e2e/mock-ai.mjs &

# 2. the server with test-only settings (never real keys)
cd lite && DATA_DIR=/tmp/bw-e2e-data PORT=3917 ADMIN_TOKEN=testtoken123 \
  AI_BASE_URL=http://localhost:3999/v1 LIARA_API_KEY=fakekey node server.mjs &
cd ..

# 3. for the payment test only: a FAKE card number and small chat limits, set through the admin form
curl -s -c /tmp/ck.txt -o /dev/null "localhost:3917/admin?token=testtoken123"
curl -s -b /tmp/ck.txt -o /dev/null -X POST localhost:3917/admin/config -H 'Origin: http://localhost:3917' \
  --data-urlencode cardNumber=6037990000000000 --data-urlencode cardHolder=تست --data-urlencode cardBank=تست \
  --data-urlencode chatFree=2 --data-urlencode chatPerGem=10 --data-urlencode chatGemPrice=1 --data-urlencode payAdvance=1
python3 -c "from PIL import Image;Image.new('RGB',(900,1400),(240,240,250)).save('$OUT/rcpt.jpg')"

# 4. the checks (each prints what it saw; screenshots go to $OUT)
NODE_PATH=$(npm root -g) node scripts/e2e/today-home.cjs $OUT         # v141 «امروز» home: ticks sync with the routine tab, calm day, data kept
NODE_PATH=$(npm root -g) node scripts/e2e/chat-pay-checkout.cjs $OUT  # v142 gift messages → paywall → checkout → card → last 4 + receipt → chat continues
NODE_PATH=$(npm root -g) node scripts/e2e/no-flash-on-open.cjs $OUT   # v143 the old base screen never shows while opening (throttled CPU and network)
```

## What the output should show

`today-home.cjs`:
- `routine tab shows tick: true`
- `went to calm card` with the same day number as the today card
- `errors: []`

`chat-pay-checkout.cjs`:
- `pay btn: true`
- `safety answered` (warning signs are always free)
- `no tick → قوانین خرید رو تیک بزن`
- `after pay → chat last: جواب …`
- `chat state … "paid":9`
- `user data kept: true`

`no-flash-on-open.cjs`:
- only `cover` and then `ready`
- `OLDVISIBLE` can appear for a new user. It is a known false alarm: the old element sits under the welcome screen and is not visible. Check the screenshot.

Always also run the 7 gate tests from the root README.
