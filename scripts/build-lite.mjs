// Builds lite/public for the Liara-hosted test version (lite/server.mjs).
// Same app as public/legacy (installable PWA with its service worker), with claude/claude-bridge.js
// in LITE mode: /api/ai goes to the lite server (which holds the key), the rest runs on the catalog engine.
import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';import {bwReviewBundle} from './lib-bw-review.mjs';
const src=new URL('../',import.meta.url).pathname,legacy=path.join(src,'public/legacy'),out=path.join(src,'lite/public'),dest=path.join(out,'legacy');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
const SKIP=new Set(['pilot','README_FA.md']);
fs.cpSync(legacy,dest,{recursive:true,filter:f=>!SKIP.has(path.relative(legacy,f).split(path.sep)[0])});
for(const f of ['favicon.ico','favicon.svg','apple-touch-icon.png','apple-touch-icon-precomposed.png','robots.txt'])if(fs.existsSync(path.join(src,'public',f)))fs.copyFileSync(path.join(src,'public',f),path.join(out,f));
fs.writeFileSync(path.join(dest,'bw-review.js'),bwReviewBundle(src));
const load=f=>import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync(path.join(src,f),'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const {BEAUTYWALLET_SYSTEM_PROMPT:system}=await load('assistant/knowledge.ts');const {PERSONAL_RESPONSE_STYLE:style}=await load('assistant/personal-response.ts');
fs.writeFileSync(path.join(dest,'bw-prompts.js'),'/* GENERATED */window.BWPrompts='+JSON.stringify({system:system.trim(),style:style.trim()})+';\n');
fs.copyFileSync(path.join(src,'claude/claude-bridge.js'),path.join(dest,'claude-bridge.js'));
const version=(fs.readFileSync(path.join(dest,'sw.js'),'utf8').match(/bw-static-v(\d+)/)||[])[1]||'0';
let html=fs.readFileSync(path.join(dest,'index.html'),'utf8');
if(!html.includes('window.BW_LITE'))html=html.replace(/<head>\s*(<base [^>]*>)?/,m=>m+`\n<script>window.BW_LITE=true</script>\n<script src="./claude-bridge.js?v=${version}"></script>\n<script src="./bw-prompts.js?v=${version}"></script>\n`);
fs.writeFileSync(path.join(dest,'index.html'),html);
let n=0,bytes=0;(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else{n++;bytes+=fs.statSync(p).size}}})(out);
console.log('lite/public:',n,'files,',(bytes/1e6).toFixed(1),'MB, version',version);
