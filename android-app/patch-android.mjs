// Runs after `npx cap add android` (in CI): permissions for on-time reminders, the small notification icon,
// version numbers from the CI run, and release signing from GitHub secrets (never from the repo).
import fs from 'node:fs';
import path from 'node:path';

const A = path.resolve('android');
const app = path.join(A, 'app');
const must = (f) => { if (!fs.existsSync(f)) throw new Error('missing ' + f + ' — run `npx cap add android` first'); return f; };

// 1) AndroidManifest: notifications (Android 13+), exact alarms (Android 12+), re-schedule after reboot
const manPath = must(path.join(app, 'src/main/AndroidManifest.xml'));
let man = fs.readFileSync(manPath, 'utf8');
for (const p of ['android.permission.POST_NOTIFICATIONS', 'android.permission.SCHEDULE_EXACT_ALARM', 'android.permission.RECEIVE_BOOT_COMPLETED', 'android.permission.WAKE_LOCK']) {
  if (!man.includes(p)) man = man.replace('</manifest>', `    <uses-permission android:name="${p}" />\n</manifest>`);
}
fs.writeFileSync(manPath, man);

// 2) small white icon shown in the status bar for reminders (a gem outline)
const dr = path.join(app, 'src/main/res/drawable');
fs.mkdirSync(dr, { recursive: true });
fs.writeFileSync(path.join(dr, 'ic_stat_bw.xml'), `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="64" android:viewportHeight="64">
  <path android:fillColor="#FFFFFFFF" android:pathData="M14,22L24,10H40L50,22L32,54Z"/>
</vector>
`);

// 3) version from CI (each build installs over the previous one) + release signing from env
const gPath = must(path.join(app, 'build.gradle'));
let g = fs.readFileSync(gPath, 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const code = Math.max(1, parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10));
g = g.replace(/versionCode\s+\d+/, `versionCode ${code}`).replace(/versionName\s+"[^"]*"/, `versionName "${pkg.version}"`);
if (!g.includes('BW_KEYSTORE')) {
  g = g.replace(/android\s*\{/, `android {
    signingConfigs {
        release {
            def ks = System.getenv("BW_KEYSTORE")
            if (ks != null && new File(ks).exists()) {
                storeFile new File(ks)
                storePassword System.getenv("BW_KEYSTORE_PASSWORD")
                keyAlias System.getenv("BW_KEY_ALIAS")
                keyPassword System.getenv("BW_KEY_PASSWORD")
            }
        }
    }`);
  g = g.replace(/buildTypes\s*\{\s*release\s*\{/, `buildTypes {
        release {
            if (System.getenv("BW_KEYSTORE") != null && new File(System.getenv("BW_KEYSTORE")).exists()) { signingConfig signingConfigs.release }`);
}
fs.writeFileSync(gPath, g);
console.log('patched: manifest permissions, ic_stat_bw, versionCode', code, 'versionName', pkg.version, 'signing', !!process.env.BW_KEYSTORE);
