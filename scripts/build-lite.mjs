// Builds lite/public for the Liara-hosted test version (lite/server.mjs).
// Same app as public/legacy (installable PWA with its service worker), with claude/claude-bridge.js
// in LITE mode: /api/ai goes to the lite server (which holds the key), the rest runs on the catalog engine.
import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';import {bwReviewBundle} from './lib-bw-review.mjs';
const src=new URL('../',import.meta.url).pathname,legacy=path.join(src,'public/legacy'),out=path.join(src,'lite/public'),dest=path.join(out,'legacy');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
const SKIP=new Set(['pilot','README_FA.md','apple-touch-icon-beautywallet-circle-v3.png','apple-touch-icon-beautywallet-v2.png','beautywallet-logo.png']);
fs.cpSync(legacy,dest,{recursive:true,filter:f=>!SKIP.has(path.relative(legacy,f).split(path.sep)[0])});
for(const f of ['favicon.ico','favicon.svg','apple-touch-icon.png','apple-touch-icon-precomposed.png','robots.txt'])if(fs.existsSync(path.join(src,'public',f)))fs.copyFileSync(path.join(src,'public',f),path.join(out,f));
fs.writeFileSync(path.join(dest,'bw-review.js'),bwReviewBundle(src));
const load=f=>import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync(path.join(src,f),'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const {BEAUTYWALLET_SYSTEM_PROMPT:system}=await load('assistant/knowledge.ts');const {PERSONAL_RESPONSE_STYLE:style}=await load('assistant/personal-response.ts');
fs.writeFileSync(path.join(dest,'bw-prompts.js'),'/* GENERATED */window.BWPrompts='+JSON.stringify({system:system.trim(),style:style.trim()})+';\n');
fs.copyFileSync(path.join(src,'claude/claude-bridge.js'),path.join(dest,'claude-bridge.js'));
fs.copyFileSync(path.join(src,'claude/lite-track.js'),path.join(dest,'lite-track.js'));
fs.copyFileSync(path.join(src,'claude/landing.html'),path.join(out,'index.html'));
for(const f of fs.existsSync(path.join(src,'claude/site'))?fs.readdirSync(path.join(src,'claude/site')):[])fs.copyFileSync(path.join(src,'claude/site',f),path.join(out,f));
if(fs.existsSync(path.join(src,'claude/qr-beautywallet.png')))fs.copyFileSync(path.join(src,'claude/qr-beautywallet.png'),path.join(out,'qr.png'));
const version=(fs.readFileSync(path.join(dest,'sw.js'),'utf8').match(/bw-static-v(\d+)/)||[])[1]||'0';
let html=fs.readFileSync(path.join(dest,'index.html'),'utf8');
if(!html.includes('window.BW_LITE'))html=html.replace(/<head>\s*(<base [^>]*>)?/,m=>m+`\n<script>window.BW_LITE=true</script>\n<script src="./claude-bridge.js?v=${version}"></script>\n<script src="./bw-prompts.js?v=${version}"></script>\n<script src="./lite-track.js?v=${version}" defer></script>\n`);
// brand: light-blue glowing gem (نگین) instead of the old water drop — lite only
const brand=path.join(src,'claude/brand'),gem=fs.readFileSync(path.join(brand,'gem.svg'),'utf8').trim();
const gemSvg=(pre,attrs)=>gem.replace(/id="g/g,`id="${pre}`).replace(/url\(#g/g,`url(#${pre}`).replace('<svg ',`<svg ${attrs} `);
for(const f of fs.readdirSync(brand))if(f.endsWith('.png'))fs.copyFileSync(path.join(brand,f),path.join(dest,f));
fs.copyFileSync(path.join(brand,'favicon.ico'),path.join(out,'favicon.ico'));fs.copyFileSync(path.join(brand,'gem.svg'),path.join(out,'favicon.svg'));fs.copyFileSync(path.join(brand,'apple-touch-icon-gem-180.png'),path.join(out,'apple-touch-icon.png'));
html=html.replace(/<svg class="logo"[\s\S]*?<\/svg>/,gemSvg('lg','class="logo" role="img" aria-label="الماس بیوتی‌ولت"'));
html=html.replace(/(<div class="bw-opening-mark">)<svg[\s\S]*?<\/svg>/,(m,a)=>a+gemSvg('og','aria-hidden="true"'));
html=html.replace(/apple-touch-icon-180-v\d+\.png/g,'apple-touch-icon-gem-180.png');
const mf=path.join(dest,'manifest.webmanifest');fs.writeFileSync(mf,fs.readFileSync(mf,'utf8').replace(/bw-circle-192-v\d+\.png/g,'bw-gem-192.png').replace(/bw-circle-maskable-512-v\d+\.png/g,'bw-gem-maskable-512.png').replace(/bw-circle-512-v\d+\.png/g,'bw-gem-512.png'));
html=html.replace('</head>','<style>html body .brand .logo{box-shadow:0 0 0 2px #9ad6ff,0 7px 22px rgba(80,170,240,.35)!important;border-radius:22px}.bw-opening-mark svg{filter:drop-shadow(0 8px 18px rgba(80,170,240,.45))}</style>\n</head>');
fs.writeFileSync(path.join(dest,'index.html'),html);
// shrink big photos so the Liara upload stays small (same names, same formats)
import('node:child_process').then(()=>{});
{const {spawnSync}=await import('node:child_process');const r=spawnSync('python3',['-c',`
import os,sys
from PIL import Image
root=sys.argv[1];saved=0
for d,_,fs in os.walk(root):
  for f in fs:
    p=os.path.join(d,f)
    if not f.lower().endswith(('.png','.jpg','.jpeg','.webp')) or os.path.getsize(p)<150000: continue
    try:
      im=Image.open(p);before=os.path.getsize(p);im.thumbnail((720,720));t=p+'.tmp'
      fmt='JPEG' if f.lower().endswith(('.jpg','.jpeg')) else ('WEBP' if f.lower().endswith('.webp') else 'PNG')
      if fmt=='JPEG': im.convert('RGB').save(t,'JPEG',quality=82,optimize=True)
      elif fmt=='WEBP': im.save(t,'WEBP',quality=82)
      else: (im.convert('RGBA').quantize(colors=256,method=Image.Quantize.FASTOCTREE)).save(t,'PNG',optimize=True)
      if os.path.getsize(t)<before: os.replace(t,p);saved+=before-os.path.getsize(p)
      else: os.remove(t)
    except Exception as e: pass
print('images shrunk by %.1f MB'%(saved/1e6))
`,dest],{encoding:'utf8'});console.log((r.stdout||r.stderr||'').trim())}
// small webp thumbnails for catalog photos: lists show 44–96px images, so the app never downloads full photos just to draw a row
{const {spawnSync}=await import('node:child_process');const r=spawnSync('python3',['-c',`
import os,sys
from PIL import Image
src=os.path.join(sys.argv[1],'assets');dst=os.path.join(sys.argv[1],'t');n=0;size=0
for d,_,fs in os.walk(src):
  for f in fs:
    if not f.lower().endswith(('.png','.jpg','.jpeg','.webp')): continue
    p=os.path.join(d,f);rel=os.path.relpath(p,src);out=os.path.join(dst,os.path.splitext(rel)[0]+'.webp')
    try:
      im=Image.open(p);im.thumbnail((192,192));os.makedirs(os.path.dirname(out),exist_ok=True)
      (im.convert('RGBA') if im.mode in ('P','LA','RGBA') else im.convert('RGB')).save(out,'WEBP',quality=72,method=6);n+=1;size+=os.path.getsize(out)
    except Exception as e: pass
print('thumbs: %d files, %.0f KB'%(n,size/1e3))
`,dest],{encoding:'utf8'});console.log((r.stdout||r.stderr||'').trim())}
let n=0,bytes=0;(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else{n++;bytes+=fs.statSync(p).size}}})(out);
console.log('lite/public:',n,'files,',(bytes/1e6).toFixed(1),'MB, version',version);
