// Installs the sweet/fresh UI layers into the main site (public/legacy) and bumps the
// release cache version. Idempotent. Sources of truth: claude/*.css|js, assistant/*.ts.
import fs from 'node:fs';import path from 'node:path';import {bwReviewBundle} from './lib-bw-review.mjs';
const src=new URL('../',import.meta.url).pathname,legacy=path.join(src,'public/legacy');
const VERSION=process.argv[2]||'68';
for(const f of ['fresh.css','fresh.js','sweet.css','sweet.js','lilac.css','skin-journal.js','followup.js','gem-chat.js','cloud-sync.js','inbox.js','layer1.js','calm.js','today.js','native.js'])fs.copyFileSync(path.join(src,'claude',f),path.join(legacy,f));
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
if(!html.includes('./gem-chat.js'))html=html.replace(/(<script src="\.\/sweet\.js\?v=\d+"[^>]*><\/script>)/,'$1\n<script src="./gem-chat.js?v='+VERSION+'" defer></script>');
if(!html.includes('./cloud-sync.js'))html=html.replace(/(<script src="\.\/sweet\.js\?v=\d+"[^>]*><\/script>)/,'<script src="./cloud-sync.js?v='+VERSION+'" defer></script>\n$1');
if(!html.includes('./calm.js'))html=html.replace(/(<script src="\.\/sweet\.js\?v=\d+"[^>]*><\/script>)/,'$1\n<script src="./calm.js?v='+VERSION+'" defer></script>');
if(!html.includes('./native.js'))html=html.replace(/(<script src="\.\/sweet\.js\?v=\d+"[^>]*><\/script>)/,'$1\n<script src="./native.js?v='+VERSION+'" defer></script>');
if(!html.includes('./today.js'))html=html.replace(/(<script src="\.\/sweet\.js\?v=\d+"[^>]*><\/script>)/,'$1\n<script src="./today.js?v='+VERSION+'" defer></script>');
if(!html.includes('./layer1.js'))html=html.replace(/(<script src="\.\/sweet\.js\?v=\d+"[^>]*><\/script>)/,'$1\n<script src="./layer1.js?v='+VERSION+'" defer></script>');
if(!html.includes('./inbox.js'))html=html.replace(/(<script src="\.\/sweet\.js\?v=\d+"[^>]*><\/script>)/,'$1\n<script src="./inbox.js?v='+VERSION+'" defer></script>');
if(!html.includes('./followup.js'))html=html.replace(/(<script src="\.\/sweet\.js\?v=\d+"[^>]*><\/script>)/,'$1\n<script src="./followup.js?v='+VERSION+'" defer></script>');
if(!html.includes('./skin-journal.js'))html=html.replace(/(<script src="\.\/routine-reminder\.js\?v=\d+"[^>]*><\/script>)/,'<script src="./skin-journal.js?v='+VERSION+'" defer></script>\n$1');
// v143: no flash of the old base screen while the app opens — a soft cover until sweet.js marks <html class="bw-ready">
// (it lifts by itself after 6 s whatever happens, so the app can never stay hidden)
if(!html.includes('id="bwBootCss"'))html=html.replace(/<head>/,'<head>\n<style id="bwBootCss">html:not(.bw-ready) body>*:not(#bwBoot){visibility:hidden!important}html:not(.bw-ready),html:not(.bw-ready) body{background:#f6f8ff!important}#bwBoot{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:radial-gradient(600px 380px at 100% 0,rgba(196,178,255,.45),transparent 60%),radial-gradient(600px 380px at 0 0,rgba(176,215,255,.5),transparent 55%),#f6f8ff;transition:opacity .25s}html.bw-ready #bwBoot{opacity:0;pointer-events:none}#bwBoot svg{width:74px;height:74px;animation:bwBootP 1.4s ease-in-out infinite}@keyframes bwBootP{50%{transform:scale(1.08);opacity:.85}}@media (prefers-reduced-motion:reduce){#bwBoot svg{animation:none}}</style>\n<script>setTimeout(function(){document.documentElement.classList.add("bw-ready")},6000)</script>');
if(!html.includes('id="bwBoot"'))html=html.replace(/<body([^>]*)>/,'<body$1>\n<div id="bwBoot" aria-hidden="true"><svg viewBox="0 0 64 64"><defs><linearGradient id="bwBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#c79bff"/></linearGradient></defs><path d="M14 22 24 10h16l10 12-18 32z" fill="url(#bwBg)"/><path d="M14 22h36M24 10l8 12 8-12M32 22v32" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/></svg></div>');
fs.writeFileSync(path.join(legacy,'index.html'),html);
for(const f of ['sw.js','manifest.webmanifest','install-app.js']){const p=path.join(legacy,f);fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(/bw-static-v\d+/g,'bw-static-v'+VERSION).replace(/\/legacy\/\?v=\d+/g,'/legacy/?v='+VERSION));}
fs.copyFileSync(path.join(legacy,'index.html'),path.join(src,'public/index.html'));
console.log('sweet UI applied to public/legacy, release v'+VERSION);
