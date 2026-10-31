// Installs the sweet/fresh UI layers into the main site (public/legacy) and bumps the
// release cache version. Idempotent. Sources of truth: claude/*.css|js, assistant/*.ts.
import fs from 'node:fs';import path from 'node:path';import {bwReviewBundle} from './lib-bw-review.mjs';
const src=new URL('../',import.meta.url).pathname,legacy=path.join(src,'public/legacy');
const VERSION=process.argv[2]||'68';
for(const f of ['fresh.css','fresh.js','sweet.css','sweet.js','lilac.css','skin-journal.js','followup.js'])fs.copyFileSync(path.join(src,'claude',f),path.join(legacy,f));
// light thumbnails of catalog photos hosted elsewhere (made by .github/workflows/thumbs.yml)
{const tdir=path.join(src,'claude/thumbs-ext'),ids=fs.existsSync(tdir)?fs.readdirSync(tdir).filter(f=>f.endsWith('.webp')).map(f=>f.slice(0,-5)):[];
 const out=path.join(legacy,'t/ext');fs.mkdirSync(out,{recursive:true});ids.forEach(id=>fs.copyFileSync(path.join(tdir,id+'.webp'),path.join(out,id+'.webp')));
 const sj=path.join(legacy,'sweet.js');fs.writeFileSync(sj,fs.readFileSync(sj,'utf8').replace('/*EXT_THUMBS*/[]','/*EXT_THUMBS*/'+JSON.stringify(ids)));}
fs.writeFileSync(path.join(legacy,'bw-review.js'),bwReviewBundle(src));
let html=fs.readFileSync(path.join(legacy,'index.html'),'utf8');
html=html.replace(/\?v=\d+/g,'?v='+VERSION);
if(!html.includes('./bw-review.js'))html=html.replace('<script src="./catalog-routine.js','<script src="./bw-review.js?v='+VERSION+'" defer></script>\n<script src="./catalog-routine.js');
if(!html.includes('./sweet.js'))html=html.replace(/<\/body>/,'<link rel="stylesheet" href="./fresh.css?v='+VERSION+'">\n<link rel="stylesheet" href="./sweet.css?v='+VERSION+'">\n<script src="./fresh.js?v='+VERSION+'" defer></script>\n<script src="./sweet.js?v='+VERSION+'" defer></script>\n</body>');
if(!html.includes('./lilac.css'))html=html.replace(/(<link rel="stylesheet" href="\.\/sweet\.css\?v=\d+">)/,'$1\n<link rel="stylesheet" href="./lilac.css?v='+VERSION+'">');
if(!html.includes('./followup.js'))html=html.replace(/(<script src="\.\/sweet\.js\?v=\d+"[^>]*><\/script>)/,'$1\n<script src="./followup.js?v='+VERSION+'" defer></script>');
if(!html.includes('./skin-journal.js'))html=html.replace(/(<script src="\.\/routine-reminder\.js\?v=\d+"[^>]*><\/script>)/,'<script src="./skin-journal.js?v='+VERSION+'" defer></script>\n$1');
fs.writeFileSync(path.join(legacy,'index.html'),html);
for(const f of ['sw.js','manifest.webmanifest','install-app.js']){const p=path.join(legacy,f);fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(/bw-static-v\d+/g,'bw-static-v'+VERSION).replace(/\/legacy\/\?v=\d+/g,'/legacy/?v='+VERSION));}
fs.copyFileSync(path.join(legacy,'index.html'),path.join(src,'public/index.html'));
console.log('sweet UI applied to public/legacy, release v'+VERSION);
