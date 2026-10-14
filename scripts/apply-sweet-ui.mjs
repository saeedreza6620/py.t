// Installs the sweet/fresh UI layers into the main site (public/legacy) and bumps the
// release cache version. Idempotent. Sources of truth: claude/*.css|js, assistant/*.ts.
import fs from 'node:fs';import path from 'node:path';import {bwReviewBundle} from './lib-bw-review.mjs';
const src=new URL('../',import.meta.url).pathname,legacy=path.join(src,'public/legacy');
const VERSION=process.argv[2]||'68';
for(const f of ['fresh.css','fresh.js','sweet.css','sweet.js','lilac.css'])fs.copyFileSync(path.join(src,'claude',f),path.join(legacy,f));
fs.writeFileSync(path.join(legacy,'bw-review.js'),bwReviewBundle(src));
let html=fs.readFileSync(path.join(legacy,'index.html'),'utf8');
html=html.replace(/\?v=\d+/g,'?v='+VERSION);
if(!html.includes('./bw-review.js'))html=html.replace('<script src="./catalog-routine.js','<script src="./bw-review.js?v='+VERSION+'" defer></script>\n<script src="./catalog-routine.js');
if(!html.includes('./sweet.js'))html=html.replace(/<\/body>/,'<link rel="stylesheet" href="./fresh.css?v='+VERSION+'">\n<link rel="stylesheet" href="./sweet.css?v='+VERSION+'">\n<script src="./fresh.js?v='+VERSION+'" defer></script>\n<script src="./sweet.js?v='+VERSION+'" defer></script>\n</body>');
if(!html.includes('./lilac.css'))html=html.replace(/(<link rel="stylesheet" href="\.\/sweet\.css\?v=\d+">)/,'$1\n<link rel="stylesheet" href="./lilac.css?v='+VERSION+'">');
fs.writeFileSync(path.join(legacy,'index.html'),html);
for(const f of ['sw.js','manifest.webmanifest','install-app.js']){const p=path.join(legacy,f);fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(/bw-static-v\d+/g,'bw-static-v'+VERSION).replace(/\/legacy\/\?v=\d+/g,'/legacy/?v='+VERSION));}
fs.copyFileSync(path.join(legacy,'index.html'),path.join(src,'public/index.html'));
console.log('sweet UI applied to public/legacy, release v'+VERSION);
