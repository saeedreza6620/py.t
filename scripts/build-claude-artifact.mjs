// Packs the full BeautyWallet legacy app as a claude.ai artifact (dist-claude/).
// Backend endpoints are replaced by claude/claude-bridge.js; decisions come from the
// catalog engine; explanations and chat use the viewer's Claude (sample capability).
import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';import {bwReviewBundle} from './lib-bw-review.mjs';
const src=new URL('../',import.meta.url).pathname,legacy=path.join(src,'public/legacy'),out=path.join(src,'dist-claude');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync(path.join(legacy,'index.html'),'utf8');
// 1. collect local files referenced by the page and its scripts/styles
const files=new Set(),rx=/["'(]\.?\/?((?:assets|supplements|icons)?\/?[A-Za-z0-9_.\/-]+\.(?:png|jpe?g|webp|svg|woff2?|ttf|js|css|PNG|JPG|json))/g;
const add=r=>{r=r.replace(/^\.?\//,'');if(r.endsWith('/')&&fs.existsSync(path.join(legacy,r,'index.html'))){add(r+'index.html');return;}if(!r||r.endsWith('/')||r.startsWith('pilot/')||r==='sw.js'||!fs.existsSync(path.join(legacy,r))||files.has(r))return;files.add(r);if(/\.(js|css|html)$/.test(r))for(const m of fs.readFileSync(path.join(legacy,r),'utf8').matchAll(rx))add(m[1]);};
for(const m of html.matchAll(/(?:src|href)=["']\.?\/?([^"'#?]+)/g))if(!/^(https?:|\/|mailto:|legacy\/)/.test(m[1]))add(m[1]);
for(const m of html.matchAll(rx))add(m[1]);
for(const f of fs.readdirSync(path.join(legacy,'assets/user-products')))add('assets/user-products/'+f);
for(const f of files){fs.mkdirSync(path.dirname(path.join(out,f)),{recursive:true});fs.copyFileSync(path.join(legacy,f),path.join(out,f));}
// 2. catalog review bundle (engine + server glue + full formulas) and prompts — single source
fs.writeFileSync(path.join(out,'bw-review.js'),bwReviewBundle(src));
const {BEAUTYWALLET_SYSTEM_PROMPT:system}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync(path.join(src,'assistant/knowledge.ts'),'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const {PERSONAL_RESPONSE_STYLE:style}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync(path.join(src,'assistant/personal-response.ts'),'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
fs.writeFileSync(path.join(out,'bw-prompts.js'),'/* GENERATED */window.BWPrompts='+JSON.stringify({system:system.trim(),style:style.trim()})+';\n');
fs.copyFileSync(path.join(src,'claude/claude-bridge.js'),path.join(out,'claude-bridge.js'));
// 3. the page as an artifact fragment: head content + body content, no doctype/html/head/body
const head=html.slice(html.indexOf('<head>')+6,html.indexOf('</head>')),body=html.slice(html.indexOf('<body')).replace(/^<body[^>]*>/,'').replace(/<\/body>\s*<\/html>\s*$/,'');
let headClean=head.replace(/<meta charset[^>]*>\s*/,'').replace(/<meta name="viewport"[^>]*>\s*/,'').replace(/<title>[^<]*<\/title>\s*/,'').replace(/<link rel="manifest"[^>]*>\s*/g,'').replace(/<base [^>]*>\s*/g,'')
  .replace(/<script>if\('serviceWorker'[^<]*<\/script>\s*/,'');
const fixDirs=x=>x.replace(/href="(\.\/topics\/[a-z-]+\/)"/g,'href="$1index.html"');
const page='<title>BeautyWallet</title>\n<script src="./claude-bridge.js"></script>\n<script src="./bw-prompts.js"></script>\n'+headClean+'\n'+fixDirs(body).replace(/navigator\.serviceWorker\.register\([^)]*\)/g,'Promise.resolve()');
fs.writeFileSync(path.join(out,'index.html'),page);
const all=[...new Set([...files,'bw-review.js','bw-prompts.js','claude-bridge.js'])];
const bytes=all.reduce((n,f)=>n+fs.statSync(path.join(out,f)).size,0)+page.length;
fs.writeFileSync(path.join(out,'files.json'),JSON.stringify(Object.fromEntries(all.map(f=>[f,f])),null,1));
console.log('dist-claude:',all.length,'files +index,',(bytes/1e6).toFixed(2),'MB');
