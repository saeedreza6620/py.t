// Gate: an update must never lose what a user saved — her name, routine, morning/night choices,
// reminder times, profile, follow-up answers or skin photos. Fails the deploy if a change would:
//  - wipe browser storage (localStorage.clear / indexedDB.deleteDatabase / unregistering the service worker)
//  - let the service worker delete anything but its own static-file caches
//  - rename the photo database or the storage keys the app reads (old data would be orphaned)
//  - let the phone's cloud copy and the server's list of saved keys drift apart
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
let bad=0;const fail=m=>{console.error('✗ '+m);bad++};const ok=m=>console.log('✓ '+m);

// 1) nothing wipes storage
const files=[...fs.readdirSync(path.join(root,'claude')).filter(f=>f.endsWith('.js')).map(f=>'claude/'+f),
  ...fs.readdirSync(path.join(root,'public/legacy')).filter(f=>f.endsWith('.js')).map(f=>'public/legacy/'+f)];
const WIPE=[/localStorage\.clear\s*\(/,/indexedDB\.deleteDatabase\s*\(/,/serviceWorker[\s\S]{0,80}\.unregister\s*\(/,/storage\.clear\s*\(\s*\)/];
for(const f of files){const s=read(f);for(const re of WIPE)if(re.test(s))fail(`${f} wipes user storage (${re})`)}
if(!bad)ok('no code wipes localStorage, IndexedDB or the service worker');

// 2) the service worker only deletes its own static caches
const sw=read('public/legacy/sw.js');
const dels=[...sw.matchAll(/caches\.delete\(/g)].length,guarded=[...sw.matchAll(/\/\^bw-\(static\|complete\)-\/\.test\(/g)].length;
if(dels>guarded)fail('sw.js deletes caches without the /^bw-(static|complete)-/ guard');else ok('service worker deletes only bw-static/bw-complete caches');
const sweet=read('claude/sweet.js');
if(/caches\.delete/.test(sweet)&&!/\^bw-\(static\|complete\)-/.test(sweet))fail('sweet.js update deletes caches without the static-cache guard');else ok('in-app update deletes only static caches');

// 3) the photo database and the keys the app reads keep their names
const sj=read('claude/skin-journal.js');
if(!/DBN='bw-skin-journal'/.test(sj)||!/STORE='photos'/.test(sj))fail("skin photos database renamed (must stay 'bw-skin-journal' / 'photos')");else ok('skin photo database name unchanged');
const MUST=['bw_reg','bw_check_products','bw_check_times','bw_fu_notif','bw_fu_answers','bw_profile_v1_full','bw_life','bw_device'];
const app=files.map(read).join('\n');
for(const k of MUST)if(!app.includes(`'${k}'`)&&!app.includes(`"${k}"`))fail(`the app no longer reads '${k}' — saved data under that name would be lost`);
ok('core storage keys still read by the app');

// 4) the phone's cloud copy and the server agree on what is saved
const srv=read('lite/cloud.mjs'),cli=read('claude/cloud-sync.js');
const list=s=>{const m=s.match(/(?:CLOUD_KEYS|KEYS)=\[([^\]]+)\]/);return m?[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]).sort():[]};
const a=list(srv),b=list(cli);
if(!a.length||JSON.stringify(a)!==JSON.stringify(b))fail('cloud key lists differ between lite/cloud.mjs and claude/cloud-sync.js');else ok('cloud key lists match ('+a.length+' keys)');
for(const k of ['bw_reg','bw_check_products','bw_check_times','bw_fu_notif','bw_profile_v1_full','bw_life'])if(!a.includes(k))fail(`'${k}' is not backed up to the server any more`);

if(bad){console.error(`\n${bad} problem(s): this change could lose users' saved data.`);process.exit(1)}
console.log('\nuser data is safe across updates');
