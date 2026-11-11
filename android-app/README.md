# BeautyWallet Android app — build a signed APK fast

> For the next AI or developer. Talk to the owner (Saeedreza) in **Persian**. The full Persian guide is `docs/ANDROID.md`. The store listing is `docs/STORE_LISTING.md`.

## What this is

- A Capacitor 7 shell, package **`ir.beautywallet.app`**. **Never change it** after the first store release.
- It opens the live site `https://beautywallet.liara.run/legacy/`, so site updates need **no new APK**.
- `claude/native.js` (in the site) schedules routine reminders **on the phone** with LocalNotifications. They work offline.
- The `android/` folder is **not** in the repo. CI generates it every build with `npm run prepare-android`:
  1. `cap add android`
  2. icons from `assets/`
  3. `patch-android.mjs`: permissions, status-bar icon, versionCode from `GITHUB_RUN_NUMBER`, signing from env
  4. `cap sync`

## Build (always on GitHub, never locally)

The Claude sandbox has no Android SDK, and it cannot download Actions artifacts (the blob host is blocked).

| Goal | Do this |
| --- | --- |
| Test APK | Push a change under `android-app/**`, or Actions → **Android APK** → Run workflow. Without the signing secrets you get `BeautyWallet-N-debug.apk` |
| Signed APK (stores) | Same workflow. When the 4 secrets below exist, it builds `BeautyWallet-N.apk` with `assembleRelease` |
| Check result | `gh run list -L 1 --workflow android.yml`, then `gh api repos/saeedreza6620/py.t/actions/runs/<id>/artifacts` |

The owner downloads the APK from the run page → **Artifacts**. Artifacts are kept 30 days.

## Signing (one time, done by the OWNER only)

**Never** ask the owner for the password or the key, and never put them in chat, code or logs.

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_PASSWORD` | the owner's password (8+ characters) |
| `ANDROID_KEY_PASSWORD` | the same password (PKCS12) |
| `ANDROID_KEY_ALIAS` | `beautywallet` |
| `ANDROID_KEYSTORE_BASE64` | the keystore as base64 |

**Easy path, no Java on the owner's PC:**
1. Make the repo **private**.
2. Add the first 3 secrets.
3. Actions → **Android signing key (one time)** → Run (`.github/workflows/android-key.yml`).
   - It refuses to run if the repo is public or a key already exists.
   - It returns a 1-day artifact `beautywallet-signing-key`.
4. Paste `ANDROID_KEYSTORE_BASE64.txt` from that artifact into the 4th secret.
5. Keep the zip in 2 safe places and delete the artifact.
6. Run **Android APK** again.

**Status as of v145 (2026-11-11):**
- Debug APKs build fine (runs #2 and #3).
- The repo became **private** on 2026-11-11. The owner can now run the one-time key workflow; until the 4 secrets exist, builds are debug.
- The sandbox cannot list secrets (that GitHub path is blocked), so ask the owner whether the 4 secrets exist; never ask for their values.

**If the key is lost:** the app can no longer be updated in Cafe Bazaar / Myket, and only a new package name would help. **Never generate a second key** if one exists.

## Publishing

- Cafe Bazaar and Myket: the owner uploads the signed APK with the text and screenshots from `docs/STORE_LISTING.md` and `docs/store/`.
- Privacy policy: `https://beautywallet.liara.run/privacy.html`.
- Google Play is not practical for an Iranian developer.
- Open question for the owner: the stores' rules on paying for diamonds outside their gateway (card-to-card).
- iPhone: there is no app. Users add the web app to the home screen in Safari. `native.js` shows an install nudge.

## Changing the app

| Change | Where |
| --- | --- |
| Reminders, nudges, anything inside the app | `claude/native.js`, `claude/followup.js` (`NAT()`), then the normal site release (root `README.md` §2). **No new APK needed** |
| Permissions, icons, name, version, site URL | `patch-android.mjs`, `assets/`, `capacitor.config.json`, `package.json` (`version` = versionName). A new APK is needed |
| Browser test without a phone | `scripts/e2e/android-native.cjs` (mock Capacitor bridge) |
| Real-phone checklist before store release | `docs/ANDROID.md` §8. The key check: a reminder must arrive in airplane mode |

Workflow files: `.github/workflows/android.yml` (build) and `.github/workflows/android-key.yml` (one-time key).

`android-actions/setup-android` must keep `packages: 'platform-tools'`. Its old default `tools` no longer exists and breaks the build.
