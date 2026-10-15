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
const version=(fs.readFileSync(path.join(dest,'sw.js'),'utf8').match(/bw-static-v(\d+)/)||[])[1]||'0';
let html=fs.readFileSync(path.join(dest,'index.html'),'utf8');
if(!html.includes('window.BW_LITE'))html=html.replace(/<head>\s*(<base [^>]*>)?/,m=>m+`\n<script>window.BW_LITE=true</script>\n<script src="./claude-bridge.js?v=${version}"></script>\n<script src="./bw-prompts.js?v=${version}"></script>\n<script src="./lite-track.js?v=${version}" defer></script>\n`);
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
let n=0,bytes=0;(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else{n++;bytes+=fs.statSync(p).size}}})(out);
console.log('lite/public:',n,'files,',(bytes/1e6).toFixed(1),'MB, version',version);
