// BeautyWallet lite server — one small Node process, no dependencies.
// Serves the app (public/legacy) and holds the AI key server-side:
//   POST /api/ai        → Liara (OpenAI-compatible Chat Completions); search:true uses the ":online" model
//   POST /api/feedback  → appends to DATA_DIR/feedback.jsonl
//   POST /api/event     → anonymous usage counts (random device id + event type)
//   GET  /admin         → owner panel (login with ADMIN_TOKEN): installs, usage, live-search health, feedback
// Env: LIARA_API_KEY (secret), AI_BASE_URL, AI_MODEL, AI_MODEL_LIGHT, AI_MODEL_COMPLEX, AI_MODEL_SEARCH,
//      AI_MODEL_FALLBACK, AI_MODEL_SEARCH_FALLBACK, AI_MAX_TOKENS (optional)
//      ADMIN_TOKEN (secret), PORT (default 3000), DATA_DIR (default ./data), HOURLY_LIMIT, DAILY_LIMIT
import {makeVault} from './vault.mjs';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const PUBLIC=path.join(here,'public');
import os from 'node:os';import {makeBank,RESEARCH_SCHEMA_HINT} from './bank.mjs';import crypto from 'node:crypto';import {makeAdmin} from './admin.mjs';
// Liara app filesystems are read-only unless a disk is mounted: pick the first writable folder, never crash.
function writable(dir){try{fs.mkdirSync(dir,{recursive:true});const t=path.join(dir,'.w');fs.writeFileSync(t,'1');fs.unlinkSync(t);return true}catch{return false}}
const DATA=[process.env.DATA_DIR,'/data',path.join(here,'data'),path.join(os.tmpdir(),'beautywallet-data')].filter(Boolean).find(writable)||os.tmpdir();
const E=process.env;
// values pasted from a .env file may keep quotes or stray spaces: clean them once
for(const k of Object.keys(E)){const v=String(E[k]);const t=v.trim().replace(/^(["'])(.*)\1$/,'$2').trim();if(t!==v)E[k]=t}
// /data is where the Liara disk is mounted (liara.json); DATA_DIR overrides it
const persistent=path.resolve(DATA)===path.resolve(E.DATA_DIR||'/data');
// project endpoint is not a secret, so it is the default; AI_BASE_URL (or a near-miss name) overrides it
const baseVar=Object.keys(E).find(k=>/^(AI_BASE_URL|AI_BASE|BASE_URL|LIARA_BASE_URL|LIARA_AI_BASE_URL)$/i.test(k.replace(/[\s\u200c\u200f\u200e]/g,''))&&/^https?:\/\//.test(String(E[k]).trim()));
// Liara's address is https://ai.liara.ir/api/<workspaceId>/v1 (per Liara support); fix the old /api/v1/<id> form automatically
const BASE=String((baseVar&&E[baseVar])||'https://ai.liara.ir/api/6acf72992688b05ae7bfe4e9/v1').trim().replace(/^(https:\/\/ai\.liara\.ir\/api)\/v1\/([0-9a-f]{24})\/?$/i,'$1/$2/v1').trim().replace(/\/(chat\/completions)\/?$/,'').replace(/\/$/,'');
// if a key was pasted twice / glued to an old one, use the newest complete key in the value
function pickKey(v){v=String(v||'').replace(/^Bearer\s*/i,'');const all=v.match(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]{43}/g);if(!all||all.length<2)return v;
  const iat=k=>{try{return JSON.parse(Buffer.from(k.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'),'base64').toString()).iat||0}catch{return 0}};
  return all.map(k=>({k,t:iat(k)})).sort((a,b)=>b.t-a.t)[0].k}
const RAW_KEY=E.LIARA_API_KEY||E.AI_API_KEY||'';
const KEY=pickKey(RAW_KEY);
const MODELS={light:E.AI_MODEL_LIGHT||E.AI_MODEL||'openai/gpt-4.1-mini',default:E.AI_MODEL||'google/gemini-2.5-pro',complex:E.AI_MODEL_COMPLEX||E.AI_MODEL||'openai/gpt-4.1-mini',search:E.AI_MODEL_SEARCH||'openai/gpt-4.1:online'};
const FALLBACK=E.AI_MODEL_FALLBACK||'google/gemini-2.5-flash',FALLBACK_SEARCH=E.AI_MODEL_SEARCH_FALLBACK||'openai/gpt-4.1-mini:online';
// reasoning models (Gemini Pro, GPT-5…) spend tokens on thinking first, so leave room for the answer
const MAX_TOKENS=Number(E.AI_MAX_TOKENS||8000);
const HOURLY=Number(E.HOURLY_LIMIT||40),DAILY=Number(E.DAILY_LIMIT||600);
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.PNG':'image/png','.JPG':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
const SEC={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY'};
const send=(res,status,body,type='application/json',extra={})=>{res.writeHead(status,{'Content-Type':type,...SEC,...extra});res.end(typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body))};
const ip=req=>String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();
async function readBody(req,max){return new Promise((ok,bad)=>{let n=0;const parts=[];req.on('data',c=>{n+=c.length;if(n>max){bad(Object.assign(new Error('too_large'),{status:413}));req.destroy();return}parts.push(c)});req.on('end',()=>{try{ok(JSON.parse(Buffer.concat(parts).toString('utf8')||'{}'))}catch{bad(Object.assign(new Error('bad_json'),{status:400}))}});req.on('error',bad)})}
function sameOrigin(req){const o=req.headers.origin;if(!o)return true;try{return new URL(o).host===req.headers.host}catch{return false}}

// rate limits (memory; enough for a small test)
const hits=new Map();let day=new Date().toDateString(),dayCount=0;
function allow(addr){const now=Date.now();if(new Date().toDateString()!==day){day=new Date().toDateString();dayCount=0}if(dayCount>=DAILY)return 'daily';const list=(hits.get(addr)||[]).filter(t=>now-t<3600e3);if(list.length>=HOURLY){hits.set(addr,list);return 'hourly'}list.push(now);hits.set(addr,list);dayCount++;return ''}

function sourcesOf(msg){const out=[],seen=new Set();for(const a of msg?.annotations||[]){const v=a.url_citation||a;try{const u=new URL(v.url);if(u.protocol!=='https:'||seen.has(u.href))continue;seen.add(u.href);out.push({url:u.href,title:String(v.title||u.hostname).slice(0,180)})}catch{}}return out.slice(0,12)}
// Liara support's recommended connection: the official OpenAI SDK with baseURL + apiKey
let client=null;
async function sdk(key=KEY){const {default:OpenAI}=await import('openai');if(key!==KEY)return new OpenAI({baseURL:BASE,apiKey:key,maxRetries:0});if(!client)client=new OpenAI({baseURL:BASE,apiKey:KEY,maxRetries:0});return client}
// ---------- daily AI budget: every paid call is counted; past the cap the app answers from the catalog only ----------
const SPEND=path.join(DATA,'spend.json');let spend={day:'',calls:0,online:0};try{spend=JSON.parse(fs.readFileSync(SPEND,'utf8'))}catch{}
const tday=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tehran'});
function budgetOk(online){if(spend.day!==tday())spend={day:tday(),calls:0,online:0};const c=cfg||{};return spend.calls<(Number(c.aiDailyCalls)||0)&&(!online||spend.online<(Number(c.aiDailyOnline)||0))}
function countCall(online){if(spend.day!==tday())spend={day:tday(),calls:0,online:0};spend.calls++;if(online)spend.online++;fs.writeFile(SPEND,JSON.stringify(spend),()=>{})}
let NO_WEB_OPT=false; // set once if the provider rejects the web-result limit
async function chatCall(model,messages,signal,key){
  const online=/:online$/.test(model);
  if(!key){if(!budgetOk(online))return {r:{ok:false,status:429},d:{error:{message:'daily_budget',code:'budget'}}};countCall(online)}
  const params={model,messages};const webN=Number(E.WEB_RESULTS||3);if(online&&webN>0&&!NO_WEB_OPT)params.plugins=[{id:'web',max_results:webN}];
  // gpt-5 family rejects custom temperature / max_tokens; others get a roomy budget for reasoning
  if(!/gpt-5/.test(model)){params.max_tokens=MAX_TOKENS;params.temperature=0.3}
  try{let c;try{c=await (await sdk(key)).chat.completions.create(params,{signal,timeout:110000})}catch(e){if(params.plugins&&Number(e?.status)===400){NO_WEB_OPT=true;console.error('web result limit not supported; sending without it');delete params.plugins;c=await (await sdk(key)).chat.completions.create(params,{signal,timeout:110000})}else throw e}return {r:{ok:true,status:200},d:c}}
  catch(e){if(e?.name==='AbortError'||e?.constructor?.name==='APIUserAbortError')throw Object.assign(new Error('aborted'),{name:'AbortError'});
    const status=Number(e?.status)||0;if(!status)throw e;return {r:{ok:false,status},d:{error:{message:e?.error?.message||e?.message||'',code:e?.code||e?.error?.code||status}}}}
}
async function ai(body){
  if(!KEY||!BASE)return {status:503,body:{error:'دستیار هنوز روی سرور تنظیم نشده (کلید یا آدرس)',code:'not_configured'}};
  const tier=['light','default','complex'].includes(body.tier)?body.tier:'default';
  let messages=Array.isArray(body.input)?body.input:[{role:'user',content:String(body.input||'')}];
  messages=messages.filter(m=>m&&(m.role==='user'||m.role==='assistant')&&typeof m.content==='string').slice(-8).map(m=>({role:m.role,content:m.content.slice(0,24000)}));
  if(!messages.length||messages[messages.length-1].role!=='user')return {status:400,body:{error:'پیام نامعتبر است'}};
  // models guess the date wrong (e.g. Gregorian day number with a Persian month): give them today's date
  const today=new Date().toLocaleDateString('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',weekday:'long',year:'numeric',month:'long',day:'numeric'});
  messages=[{role:'system',content:'تاریخ امروز: '+today+' (به وقت تهران). اگر تاریخ می‌نویسی، همین را بنویس.'},...messages];
  let model=body.search?MODELS.search:MODELS[tier];if(body.search&&!/:online$/.test(model))model+=':online';
  const fallback=body.search?FALLBACK_SEARCH:FALLBACK;
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),body.search?110000:90000);
  try{
    let r,d;const first=model;
    const chain=[...new Set([model,fallback,body.search?'openai/gpt-4o-mini:online':'openai/gpt-5.4-mini',body.search?'openai/gpt-5.4-mini:online':'openai/gpt-4o-mini'])];const tried=[];
    for(const m of chain){
      model=m;
      ({r,d}=await chatCall(m,messages,ctl.signal));
      // unknown/unavailable model → try the safe fallback once instead of failing the user
      tried.push(m+':'+r.status);if(r.ok||![400,401,403,404,422,503].includes(r.status))break;
      console.error('ai model failed, falling back',r.status,m);
    }
    if(!r.ok&&d?.error?.code==='budget')return {status:503,body:{error:'این یکی رو تیم بیوتی‌ولت خودش برات بررسی می‌کنه؛ اسم و شماره‌ت رو بذار 💜',code:'support'}};
    if(!r.ok){lastUpstream={tried,status:r.status,message:String(d?.error?.message||d?.message||'').replace(/(sk-|eyJ)[\w.-]+/g,'[redacted]').slice(0,200)};const code=String(d?.error?.code||d?.code||r.status).replace(/[^\w.-]/g,'').slice(0,60);console.error('ai upstream',r.status,code,model);
      return {status:r.status===429?429:502,body:{error:[401,402,403,404].includes(r.status)?'این یکی رو تیم بیوتی‌ولت خودش برات بررسی می‌کنه؛ اسم و شماره‌ت رو بذار 💜':r.status===429?'الان شلوغه؛ یه کم بعد دوباره بزن':'الان جواب نگرفتم؛ دوباره بزن',code:[401,402,403,404].includes(r.status)?'support':'upstream_'+code}}}
    const msg=d?.choices?.[0]?.message;const text=typeof msg?.content==='string'?msg.content:Array.isArray(msg?.content)?msg.content.map(x=>x.text||'').join('\n'):'';
    if(!text.trim())return {status:502,body:{error:'پاسخ خالی بود؛ دوباره بپرس',code:'empty'}};
    return {status:200,body:{text,sources:sourcesOf(msg),model,fallback:model!==first,searched:!!body.search,usage:d.usage?{in:d.usage.prompt_tokens,out:d.usage.completion_tokens}:null}};
  }catch(e){return {status:504,body:{error:e.name==='AbortError'?'جواب طول کشید؛ دوباره بزن':'اتصال به سرویس هوش مصنوعی برقرار نشد',code:'network'}}}finally{clearTimeout(timer)}
}

// ---------- product research: identify any product by name and fetch its real INCI list ----------
// The shopper only types a name (Persian, transliterated, partial). We find the exact product and its
// ingredient list on the web ourselves (brand site, INCIDecoder, Skinsort, big retailers) — never ask them for a photo.
const RESEARCH_MODELS=[...new Set([E.AI_MODEL_RESEARCH||'openai/gpt-4.1:online','openai/gpt-5-mini:online'])];
const rsDay={day:'',n:0};function researchBudgetOk(){const d=new Date().toISOString().slice(0,10);if(rsDay.day!==d){rsDay.day=d;rsDay.n=0}const cap=Number((cfg||{}).researchDailyMax??30);return cap<=0?false:rsDay.n<cap}
const BANK=makeBank(DATA);const pubF=({aliases,query,hits,lastHit,model,addedAt,...f})=>f;
const pcache=new Map(); // live price answers, 6 hours
const RCACHE=path.join(DATA,'research-cache.json');let rcache={};try{rcache=JSON.parse(fs.readFileSync(RCACHE,'utf8'))}catch{}
const normName=q=>String(q||'').toLowerCase().replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').replace(/[‌\s\-_.,،()]+/g,' ').trim().slice(0,120);
const RESEARCH_PROMPT=`You are a cosmetic-product researcher for an Iranian skincare app. A shopper typed the product name below the way people do in Iran: Persian, transliterated, partial or misspelled, often with the store's Persian title.
Use web search to identify the EXACT product and read its FULL ingredient list (INCI).
Search order: 1) the official brand website, 2) INCIDecoder / Skinsort / CosDNA / SkinCarisma, 3) large retailers (Sephora, Boots, Ulta, Lookfantastic, Digikala product specs).
Search in English with the brand and product line (translate the Persian name first), and also the Persian name if needed.
If several versions exist (oily/dry skin, old/new formula, SPF 30/50), choose the one that best matches the name and list the others in "variants".
Never invent ingredients. Only fill "inci" with a list you actually saw on a page; otherwise use [].
Answer with ONLY minified JSON, no prose, with exactly these keys:
{"found":bool,"role":"","rinse_off":true,"texture":"","finish":null,"actives":[],"made_for":[],"flags":[],"name_en":"","name_fa":"","brand":"","category":"cleanser|toner|serum|moisturizer|sunscreen|mask|exfoliant|eye|lip|body|other","confidence":"high|medium|low","inci":[""],"key_actives":[{"name":"","percent":null}],"spf":null,"texture":"","fragrance":null,"alcohol_denat":null,"essential_oils":[],"pore_clogging":[],"claims_fa":[""],"skin_types_fa":[""],"variants":[""],"source_note_fa":""}`+RESEARCH_SCHEMA_HINT;
function parseJson(t){const s=String(t||'');const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a<0||b<=a)return null;try{return JSON.parse(s.slice(a,b+1))}catch{return null}}
// a product page link from the shopper: read its title ourselves (known shops only) and research from that exact page
const PAGE_HOSTS=/(^|\.)(digikala\.com|khanoumi\.com|torob\.com|basalam\.com|snappshop\.ir|okala\.com|digistyle\.com|zarinsalamat\.com|amazon\.[a-z.]+|sephora\.com|lookfantastic\.com|incidecoder\.com|skinsort\.com)$/i;
function cleanUrl(u){try{const x=new URL(String(u||'').trim());if(!/^https?:$/.test(x.protocol)||/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(x.hostname))return '';x.hash='';return x.href.slice(0,400)}catch{return ''}}
const IMGDIR=path.join(DATA,'bank-img');try{fs.mkdirSync(IMGDIR,{recursive:true})}catch{}
const PRIVATE=/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.|\[)/;
function smallImageUrl(u){try{const x=new URL(u);if(/dkstatics|digikala/i.test(x.hostname)){x.search='?x-oss-process=image/resize,m_lfit,h_240,w_240/format,webp/quality,q_70'}else if(/khanoumi\.com$/i.test(x.hostname)){x.searchParams.set('w','240')}return x.href}catch{return ''}}
async function fetchBankImage(id,u){try{const x=new URL(u);if(x.protocol!=='https:'||PRIVATE.test(x.hostname))return;
  const r=await fetch(smallImageUrl(u),{signal:AbortSignal.timeout(8000),redirect:'follow',headers:{'User-Agent':'Mozilla/5.0 BeautyWallet','Accept':'image/webp,image/*'}});const ct=String(r.headers.get('content-type')||'');
  if(!r.ok||!/^image\/(jpeg|png|webp)/.test(ct))return;const buf=Buffer.from(await r.arrayBuffer());if(buf.length<1500||buf.length>120000)return; // tiny = placeholder, big = would slow the page
  const ext=ct.includes('png')?'png':ct.includes('webp')?'webp':'jpg';const file=id.replace(/[^a-z0-9-]/g,'')+'.'+ext;fs.writeFileSync(path.join(IMGDIR,file),buf);BANK.setImage(id,'/bank-img/'+file)}catch{}}
// no photo from the research? find the same product on Digikala (public search) and keep a small copy.
// The match must share the brand and most words of the name, so a wrong product never gets the photo.
const imgTried=new Map();
const wordsOf=x=>String(x||'').toLowerCase().replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').replace(/[^a-z0-9؀-ۿ]+/g,' ').split(' ').filter(w=>w.length>=2&&!/^(ml|میل|میلی|لیتر|گرم|حجم|مدل|spf\d*)$/.test(w));
function sameProduct(row,title){const t=new Set(wordsOf(title));const en=wordsOf(row.en),fa=wordsOf(row.name),br=wordsOf(row.brand);
  if(br.length&&!br.some(w=>t.has(w))&&!fa.slice(0,3).some(w=>t.has(w)))return false;
  const share=l=>l.length?l.filter(w=>t.has(w)).length/l.length:0;return Math.max(share(en),share(fa))>=0.6}
async function digikalaImage(row){try{const q=(row.brand?row.brand+' ':'')+(row.en||row.name);const r=await fetch('https://api.digikala.com/v1/search/?q='+encodeURIComponent(q.slice(0,90)),{signal:AbortSignal.timeout(8000),headers:{'User-Agent':'Mozilla/5.0 BeautyWallet','Accept':'application/json'}});
  if(!r.ok)return '';const j=await r.json();for(const p of (j&&j.data&&j.data.products||[]).slice(0,6)){const u=p&&p.images&&p.images.main&&((p.images.main.url||[])[0]||(p.images.main.webp_url||[])[0]);if(u&&sameProduct(row,(p.title_fa||'')+' '+(p.title_en||'')))return u}}catch{}return ''}
async function ensureImage(row,first){if(!row||row.image)return;imgTried.set(row.id,Date.now());
  if(first)await fetchBankImage(row.id,first);const now=BANK.list().find(x=>x.id===row.id);if(now&&now.image)return;
  const u=await digikalaImage(row);if(u)await fetchBankImage(row.id,u)}
// backfill: a few products without a photo every 10 minutes (each retried at most once a week)
setInterval(()=>{const wk=7*864e5,now=Date.now();BANK.list().filter(p=>!p.image&&now-(imgTried.get(p.id)||0)>wk).slice(0,3).reduce((a,p)=>a.then(()=>ensureImage(p,'')),Promise.resolve()).catch(()=>{})},10*60e3).unref?.();
async function pageImage(u){try{if(!PAGE_HOSTS.test(new URL(u).hostname))return '';const r=await fetch(u,{signal:AbortSignal.timeout(8000),headers:{'User-Agent':'Mozilla/5.0 BeautyWallet'},redirect:'follow'});const h=(await r.text()).slice(0,300000);const m=h.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i);return m?m[1]:''}catch{return ''}}
async function pageTitle(u){try{if(!PAGE_HOSTS.test(new URL(u).hostname))return '';const r=await fetch(u,{signal:AbortSignal.timeout(8000),headers:{'User-Agent':'Mozilla/5.0 BeautyWallet','Accept-Language':'fa,en'},redirect:'follow'});const h=(await r.text()).slice(0,300000);
  const m=h.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)||h.match(/<title[^>]*>([^<]+)/i);return m?m[1].replace(/\s*[|\-–]\s*(دیجی‌کالا|دیجی کالا|خانومی|Digikala|Khanoumi).*$/i,'').replace(/&[a-z#0-9]+;/gi,' ').trim().slice(0,200):''}catch{return ''}}
// The ingredient list counts only if a cited page really shows it: fetch up to 3 sources and require
// that at least 80% of the listed ingredients appear on one of them. Otherwise nothing is stored.
const incNorm=x=>String(x||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[\u200b-\u200f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
async function pageText(u){try{const x=new URL(u);if(x.protocol!=='https:'||PRIVATE.test(x.hostname))return '';const r=await fetch(x.href,{signal:AbortSignal.timeout(9000),redirect:'follow',headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept-Language':'en,fa'}});if(!r.ok)return '';
  return incNorm((await r.text()).slice(0,1500000).replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/gi,' '))}catch{return ''}}
async function checkSources(inci,sources){const items=(inci||[]).map(incNorm).filter(x=>x.length>=3);if(items.length<5)return {ok:false,coverage:0};
  const urls=[...new Set((sources||[]).map(s=>s&&s.url).filter(Boolean))].slice(0,3);let best={ok:false,coverage:0,url:''};
  const texts=await Promise.all(urls.map(pageText));texts.forEach((t,i)=>{if(!t)return;const pad=' '+t+' ';const c=items.filter(x=>pad.includes(' '+x+' ')).length/items.length;if(c>best.coverage)best={ok:c>=0.8,coverage:Math.round(c*100)/100,url:urls[i]}});return best}
async function research(name,url){
  if(url){const title=await pageTitle(url);name=(title||name||'')+' ';}
  const key=normName(url||name);if(!key)return {status:400,body:{error:'اسم محصول خالیه'}};
  const hit=rcache[key];if(hit&&Date.now()-hit.t<30*864e5)return hit.miss?{status:502,body:{error:'این محصول رو امروز گشتم و پیدا نشد؛ اسمش رو کامل‌تر بنویس',code:'research_failed',cached:true}}:{status:200,body:{...hit.data,cached:true}};
  if(!KEY||!BASE)return {status:503,body:{error:'سرویس هوش مصنوعی تنظیم نشده',code:'not_configured'}};
  if(!researchBudgetOk())return {status:503,body:{error:'این یکی رو تیم بیوتی‌ولت خودش برات بررسی می‌کنه؛ اسم و شماره‌ت رو بذار 💜',code:'support',daily_cap:true}};
  rsDay.n++;
  let best=null;const tried=[];const used=[];
  for(const model of RESEARCH_MODELS){
    let x;try{x=await chatCall(model,[{role:'system',content:RESEARCH_PROMPT},{role:'user',content:(url?'Product page the shopper sent (identify the product on THIS page, then read its full INCI there or on the brand site / INCIDecoder): '+url+'\nPage title: '+String(name).trim().slice(0,200):'Product name typed by the shopper: '+String(name).slice(0,200))}])}catch(e){tried.push(model+':error');continue}
    if(x.d?.error?.code==='budget')return {status:503,body:{error:'این یکی رو تیم بیوتی‌ولت خودش برات بررسی می‌کنه؛ اسم و شماره‌ت رو بذار 💜',code:'support'}};
    if(x.d?.usage)used.push({model,in:x.d.usage.prompt_tokens||0,out:x.d.usage.completion_tokens||0});
    tried.push(model+':'+x.r.status);if(!x.r.ok){if([400,403,404,422,503].includes(x.r.status))continue;break}
    const msg=x.d?.choices?.[0]?.message,j=parseJson(msg?.content);const sources=sourcesOf(msg);
    if(!j)continue;
    if(!j.found&&used.length>=2&&!best)break; // two strong searches said 'not found': ask for the product link instead of paying for a third
    j.inci=Array.isArray(j.inci)?j.inci.map(v=>String(v).trim()).filter(Boolean).slice(0,80):[];
    const cand={...j,sources,model,verified:!!j.found&&j.inci.length>=5&&sources.length>0&&j.confidence!=='low'};
    if(!best||(cand.verified&&!best.verified)||(cand.inci.length>(best.inci||[]).length&&!best.verified))best=cand;
    if(best.verified||(best.found&&best.inci.length>=5))break; // a usable formula: don't pay for another web search
  }
  if(!best||(!best.found&&!(best.inci||[]).length)){rcache[key]={t:Date.now(),miss:true};try{fs.writeFileSync(RCACHE,JSON.stringify(rcache))}catch{}}
  if(!best){logUsage({at:new Date().toISOString(),research:true,status:502,calls:used});return {status:502,body:{error:'الان نتونستم پیداش کنم؛ یه لحظه دیگه دوباره بزن',code:'research_failed',tried}}}
  if(best.found&&(best.inci||[]).length>=5){const sc=await checkSources(best.inci,best.sources);best.sourceCheck=sc;best.sourceVerified=sc.ok;if(!sc.ok)best.verified=false}
  const data={query:String(name).slice(0,120),...best,checkedAt:new Date().toISOString()};
  if(best.sourceVerified){rcache[key]={t:Date.now(),data};try{fs.writeFileSync(RCACHE,JSON.stringify(rcache))}catch{}}
  else if(best.found){rcache[key]={t:Date.now(),miss:true};try{fs.writeFileSync(RCACHE,JSON.stringify(rcache))}catch{}}
  logUsage({at:new Date().toISOString(),research:true,status:200,model:best.model,verified:best.verified,sources:best.sources.length,calls:used});
  return {status:200,body:data};
}

async function readForm(req){return new Promise((ok,bad)=>{let n=0;const parts=[];req.on('data',c=>{n+=c.length;if(n>4000){bad(Object.assign(new Error('too_large'),{status:413}));req.destroy();return}parts.push(c)});req.on('end',()=>ok(Object.fromEntries(new URLSearchParams(Buffer.concat(parts).toString('utf8')))));req.on('error',bad)})}
const EVENTS=new Set(['journal_photo','vault_restore','site_open','app_open','app_open_installed','install','install_offer','install_click','check','aff_click','refill_due','refill_worked','refill_not_worked','refill_buy','negin_spend','negin_buy_click','sub_click','gift_open','gift_view','trial_gift','buy_request','register','register_skip','bale_order','bale_paid','result_unsure']);
const evHits=new Map();let deepCache=null;
function keyInfo(){const k=String(KEY);let type=null,issued=null;try{const p=JSON.parse(Buffer.from(k.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'),'base64').toString());type=p.type||(p.key?'has_key_id':Object.keys(p).slice(0,4).join('|'));issued=p.iat?new Date(p.iat*1000).toISOString().slice(0,16):null}catch{}return {length:k.length,rawLength:String(RAW_KEY).length,keysInValue:(String(RAW_KEY).match(/eyJ[\w-]+\.eyJ/g)||[]).length,jwt:k.split('.').length===3,type,issued,spaces:/\s/.test(k)}}
let lastUpstream=null;
function osOf(ua){ua=String(ua||'');return /iPhone|iPad|iPod/i.test(ua)?'ios':/Android/i.test(ua)?'android':'desktop'}
function logUsage(row){fs.appendFile(path.join(DATA,'usage.jsonl'),JSON.stringify(row)+'\n',()=>{})}

// ---------- affiliate (Digikala + Khanoumi only) ----------
// AFF_DIGIKALA / AFF_KHANOUMI: link template from the affiliate panel with {url} (raw) or {url_enc} (encoded),
// e.g. https://affiliate.example/r?to={url_enc}&id=123 . Without a template the plain store link is used.
const AFF={dk:{host:/(^|\.)digikala\.com$/i,tpl:E.AFF_DIGIKALA||''},kh:{host:/(^|\.)khanoumi\.com$/i,tpl:E.AFF_KHANOUMI||''}};
function affiliateUrl(shop,target){const a=AFF[shop];if(!a)return null;let u;try{u=new URL(target)}catch{return null}
  if(u.protocol!=='https:'||!a.host.test(u.hostname))return null;
  return {url:a.tpl?a.tpl.replace('{url_enc}',encodeURIComponent(u.href)).replace('{url}',u.href):u.href,aff:!!a.tpl}}

// ---------- bestsellers of Digikala & Khanoumi, researched ahead of time ----------
const BEST=path.join(DATA,'bestsellers.json');let best={at:null,items:[],running:false};try{best={...JSON.parse(fs.readFileSync(BEST,'utf8')),running:false}}catch{}
const BEST_PROMPT=`Use web search on digikala.com and khanoumi.com right now. List the currently best-selling FACE SKINCARE products (sunscreen, cleanser, moisturizer, serum, toner, micellar water, acne care) from their bestseller / most-popular listings in skincare categories.
Only include products you actually saw on those pages. Return ONLY minified JSON: {"items":[{"name_fa":"","name_en":"","brand":"","category":"","shop":"digikala|khanoumi","url":""}]} with up to 30 items, most popular first, no duplicates.`;
async function refreshBestsellers(limit=Number(E.BESTSELLER_LIMIT||25)){
  if(best.running||!KEY)return;best.running=true;
  try{
    const x=await chatCall(E.AI_MODEL_RESEARCH||'openai/gpt-4.1:online',[{role:'system',content:BEST_PROMPT},{role:'user',content:'Persian skincare shoppers in Iran. Today: '+new Date().toISOString().slice(0,10)}]);
    const j=x.r.ok?parseJson(x.d?.choices?.[0]?.message?.content):null;const list=Array.isArray(j?.items)?j.items:[];
    const out=[],seen=new Set();
    for(const it of list){if(out.length>=limit)break;const nm=String(it.name_en||it.name_fa||'').trim();const k=normName(nm);if(!nm||seen.has(k))continue;seen.add(k);
      const d=null;
      out.push({name_fa:String(it.name_fa||d?.name_fa||'').slice(0,120),name_en:String(it.name_en||d?.name_en||'').slice(0,120),brand:String(it.brand||d?.brand||'').slice(0,60),category:String(d?.category||it.category||'').slice(0,30),shop:it.shop==='khanoumi'?'khanoumi':'digikala',url:(()=>{try{const u=new URL(it.url);return /(digikala|khanoumi)\.com$/i.test(u.hostname)?u.href:''}catch{return ''}})(),verified:!!d?.verified,query:nm})}
    if(out.length){best={at:new Date().toISOString(),items:out,running:false};fs.writeFileSync(BEST,JSON.stringify(best))}
    logUsage({at:new Date().toISOString(),bestsellers:true,status:x.r.status,found:list.length,kept:out.length});
  }catch(e){console.error('bestsellers',e.message)}finally{best.running=false}
}
// refresh weekly in the background (BESTSELLER_DAYS=0 turns it off)
const BEST_DAYS=Number(E.BESTSELLER_DAYS??0);
if(BEST_DAYS>0)setInterval(()=>{if(!best.at||Date.now()-Date.parse(best.at)>BEST_DAYS*864e5)refreshBestsellers()},6*3600e3).unref?.();
// no automatic refresh on start: the owner refreshes from the admin panel (one AI call)

// ---------- Negin pricing (editable in the admin panel) ----------
const CFG=path.join(DATA,'config.json');
const DEFAULT_CFG={cardNumber:'',cardHolder:'',cardBank:'',payAdvance:1,priceVersion:4,freeChecks:3,freePerIpDay:30,freeRoutine:5,freeRoutinePerIpDay:25,tomanPer1k:900,dollarRate:0,margin:3,aiDailyCalls:1000,aiDailyOnline:400,registerGift:0,trialGift:0,welcome:0,costs:{research:1,live:1,gift:0,pack:2},packs:[{n:5,price:125000},{n:15,price:330000}],subscription:{price:590000,monthly:30,perks:'هشدار تمدید و افت قیمت، تحقیق محصول نامحدود منصفانه'},trial:true};
let cfg=DEFAULT_CFG;try{cfg={...DEFAULT_CFG,...JSON.parse(fs.readFileSync(CFG,'utf8'))}}catch{}
function migrateCfg(){let raw=null;try{raw=JSON.parse(fs.readFileSync(CFG,'utf8'))}catch{}if(!raw||(raw.priceVersion||1)>=4)return; // configs saved before v89
  if((raw.priceVersion||1)===3){try{fs.copyFileSync(CFG,path.join(DATA,'config.backup-v3-'+Date.now()+'.json'))}catch{}cfg={...cfg,priceVersion:4,freeChecks:Math.max(5,Number(raw.freeChecks)||0),freePerIpDay:Math.max(30,Number(raw.freePerIpDay)||0)};try{fs.writeFileSync(CFG,JSON.stringify(cfg))}catch{}return}
  if((raw.priceVersion||1)===2){try{fs.copyFileSync(CFG,path.join(DATA,'config.backup-v2-'+Date.now()+'.json'))}catch{}cfg={...cfg,priceVersion:4,freeChecks:Math.max(5,Number(raw.freeChecks)||0),freePerIpDay:Math.max(30,Number(raw.freePerIpDay)||0)};try{fs.writeFileSync(CFG,JSON.stringify(cfg))}catch{}return}
  try{if(fs.existsSync(CFG))fs.copyFileSync(CFG,path.join(DATA,'config.backup-v1-'+Date.now()+'.json'))}catch{}
  cfg={...cfg,priceVersion:4,freeChecks:3,freePerIpDay:30,welcome:0,trialGift:0,registerGift:0,packs:DEFAULT_CFG.packs,subscription:DEFAULT_CFG.subscription};try{fs.writeFileSync(CFG,JSON.stringify(cfg))}catch{}}
function saveCfg(next){ // merges: a form only changes the fields it sends
  const has=k=>Object.prototype.hasOwnProperty.call(next,k)&&String(next[k]).trim()!=='';const num=(k,cur,min=0,max=1e9)=>has(k)?Math.max(min,Math.min(max,Number(String(next[k]).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))||0)):cur;
  const o=cfg||DEFAULT_CFG,oc=o.costs||DEFAULT_CFG.costs,op=o.packs||DEFAULT_CFG.packs,os=o.subscription||DEFAULT_CFG.subscription;
  const c={priceVersion:o.priceVersion??4,payAdvance:num('payAdvance',o.payAdvance??1,0,50),cardNumber:has('cardNumber')?String(next.cardNumber).replace(/[۰-۹]/g,x=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(x)).replace(/\D/g,'').slice(0,16):(o.cardNumber||''),cardHolder:has('cardHolder')?String(next.cardHolder).slice(0,60):(o.cardHolder||''),cardBank:has('cardBank')?String(next.cardBank).slice(0,30):(o.cardBank||''),freeChecks:num('freeChecks',o.freeChecks??3,0,50),freeRoutine:num('freeRoutine',o.freeRoutine??5,0,100),freePerIpDay:num('freePerIpDay',o.freePerIpDay??30,0,500),tomanPer1k:num('tomanPer1k',o.tomanPer1k??900,0,1e6),dollarRate:num('dollarRate',o.dollarRate??0,0,1e8),margin:num('margin',o.margin??3,1,20),aiDailyCalls:num('aiDailyCalls',o.aiDailyCalls??1000,0,5000),aiDailyOnline:num('aiDailyOnline',o.aiDailyOnline??400,0,5000),registerGift:num('registerGift',o.registerGift??5),trialGift:num('trialGift',o.trialGift??5),welcome:num('welcome',o.welcome??10),
    costs:{research:num('research',oc.research),live:num('live',oc.live),gift:num('gift',oc.gift),pack:num('pack',oc.pack)},
    packs:[{n:num('p1n',op[0].n,1),price:num('p1p',op[0].price)},{n:num('p2n',op[1].n,1),price:num('p2p',op[1].price)}],
    subscription:{price:num('subp',os.price),monthly:num('subn',os.monthly),perks:has('perks')?String(next.perks).slice(0,200):os.perks},
    trial:has('welcome')?(next.trial==='on'||next.trial===true):o.trial};
  cfg=c;try{fs.writeFileSync(CFG,JSON.stringify(c))}catch(e){console.error('config save',e.code)}return c}

migrateCfg();
// one-time change the owner asked for (2026-10-27): 3 gift checks, 5 free routine lookups; config backed up first
(function freeCut(){const mark=path.join(DATA,'migrated-free-2026-10-27');if(fs.existsSync(mark))return;try{if(fs.existsSync(CFG))fs.copyFileSync(CFG,path.join(DATA,'config.backup-freecut-'+Date.now()+'.json'))}catch{}
  cfg={...cfg,freeChecks:Math.min(3,Number(cfg.freeChecks??3)),freeRoutine:Math.min(5,Number(cfg.freeRoutine??5))};try{fs.writeFileSync(CFG,JSON.stringify(cfg));fs.writeFileSync(mark,new Date().toISOString())}catch(e){console.error('free cut',e.code)}})();
// ---------- safe gift: the giver sends a link, the receiver answers 3 skin questions privately ----------
const GIFTS=path.join(DATA,'gifts.json');let gifts={};try{gifts=JSON.parse(fs.readFileSync(GIFTS,'utf8'))}catch{}
const saveGifts=()=>{try{fs.writeFileSync(GIFTS,JSON.stringify(gifts))}catch{}};
const newId=()=>Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);
const SKIN=['چرب','مختلط','نرمال','خشک','مطمئن نیستم'],TODAY=['متعادل','جوش فعال','تحریک‌شده','قرمز و حساس','خشک‌تر از معمول','چرب‌تر از معمول'],GOAL=['کاهش جوش التهابی','کاهش لک پس از جوش','آبرسانی و حمایت از لایهٔ محافظ پوست','کاهش قرمزی','کنترل چربی','کاهش علائم پیری'];

// users who register (name + mobile). SMS verification turns on when KAVENEGAR_API_KEY and KAVENEGAR_TEMPLATE are set in Liara.
const USERS=path.join(DATA,'users.json');
function getUsers(){try{return JSON.parse(fs.readFileSync(USERS,'utf8'))}catch{return {}}}
function normPhone(v){const x=String(v||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d+]/g,'');const m=x.match(/^(?:\+98|0098|98|0)?(9\d{9})$/);return m?'0'+m[1]:''}
function saveUser(phone,info,verified){const u=getUsers();const now=new Date().toISOString();const o=u[phone]||{phone,first:now,devices:[]};
  o.name=info.name||o.name||'';o.last=now;o.os=info.os||o.os;o.installed=!!(o.installed||info.sa);o.verified=!!(o.verified||verified);if(info.d&&!o.devices.includes(info.d))o.devices=[...o.devices,info.d].slice(-5);u[phone]=o;
  try{fs.writeFileSync(USERS+'.tmp',JSON.stringify(u));fs.renameSync(USERS+'.tmp',USERS)}catch(e){console.error('users save',e.message)}
  fs.appendFile(path.join(DATA,'events.jsonl'),JSON.stringify({at:now,t:'register',d:info.d||'anon',page:'app',os:info.os,sa:!!info.sa})+'\n',()=>{})}
// a registered shopper opening the app: keep "last seen" and her devices right (the installed app on iPhone has its own storage, so a new device id)
function touchUser(phone,d,sa){if(!phone)return;const u=getUsers(),o=u[phone];if(!o)return;const now=new Date().toISOString();
  if(o.lastSeen&&Date.now()-Date.parse(o.lastSeen)<3600e3&&(o.devices||[]).includes(d))return;
  o.lastSeen=now;o.last=now;if(sa)o.installed=true;if(d&&!(o.devices||[]).includes(d))o.devices=[...(o.devices||[]),d].slice(-5);u[phone]=o;
  try{fs.writeFileSync(USERS+'.tmp',JSON.stringify(u));fs.renameSync(USERS+'.tmp',USERS)}catch(e){console.error('users save',e.message)}}
const clean=v=>String(v||'').trim().replace(/^["']|["']$/g,'');
const SMS={key:clean(E.KAVENEGAR_API_KEY),tpl:clean(E.KAVENEGAR_TEMPLATE),base:clean(E.KAVENEGAR_BASE)||'https://api.kavenegar.com'};SMS.on=!!(SMS.key&&SMS.tpl);
const OTP=new Map();setInterval(()=>{const t=Date.now();for(const [k,v] of OTP)if(t-v.sent>15*60e3)OTP.delete(k)},5*60e3).unref();
async function sendOtp(phone,code){try{const u=`${SMS.base}/v1/${encodeURIComponent(SMS.key)}/verify/lookup.json?receptor=${phone}&token=${code}&template=${encodeURIComponent(SMS.tpl)}`;
  const r=await fetch(u,{signal:AbortSignal.timeout(12000)});const j=await r.json().catch(()=>({}));if(!(r.ok&&j?.return?.status===200))console.error('sms',r.status,j?.return?.message||'');return r.ok&&j?.return?.status===200}catch(e){console.error('sms',e.message);return false}}
// admin-login diagnostics for /healthz: how many ADMIN_TOKEN variables, length, and a 6-char fingerprint (never the value)
function adminDiag(){const ks=Object.keys(E).filter(k=>k.replace(/[\s\u200c\u200f\u200e]/g,'').toUpperCase()==='ADMIN_TOKEN'&&String(E[k]).trim());
  const v=String(ks.length?E[ks[0]]:'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[\s\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g,'').replace(/^(["'])(.*)\1$/,'$2').replace(/^ADMIN_TOKEN[:=]/i,'').replace(/^(.+?)[=:]?\1$/,'$1');
  return {adminVars:ks.length,adminLen:v.length,adminFp:v?crypto.createHash('sha256').update(v.toLowerCase()).digest('hex').slice(0,6):''}}
// ---------- purchase requests: status + one-time Negin codes ----------
const REQS=path.join(DATA,'request-status.json'),REDEEM=path.join(DATA,'redeem.json');const redeemFails=new Map();
function readJ(f){try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch{return {}}}
function writeJ(f,v){try{fs.writeFileSync(f+'.tmp',JSON.stringify(v));fs.renameSync(f+'.tmp',f)}catch(e){console.error('save',f,e.message)}}
const getReqStatus=()=>readJ(REQS),getRedeem=()=>readJ(REDEEM),saveRedeem=v=>writeJ(REDEEM,v);
function setReqStatus(ref,patch){if(!ref)return;const all=getReqStatus();all[ref]={...(all[ref]||{}),...patch,at:new Date().toISOString()};writeJ(REQS,all)}
function newRedeem(ref,n,sub){const all=getRedeem();let code;do{code=Array.from({length:6},()=>'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[crypto.randomInt(31)]).join('')}while(all[code]);all[code]={n,ref,sub:!!sub,at:new Date().toISOString(),usedAt:null};saveRedeem(all);return code}
// ---------- real API cost → Negin price ----------
// Prices come from Liara's own /models list (a free call, no tokens) and token counts from every logged call.
let PRICES={at:0,unit:'',models:{},sample:null,error:''};
function num(v){const n=Number(v);return Number.isFinite(n)&&n>=0?n:null}
function pickPrice(o){ // finds input/output prices whatever the field names are
  let pin=null,pout=null,req=null;(function walk(x,depth){if(!x||typeof x!=='object'||depth>3)return;for(const [k,v] of Object.entries(x)){const n=num(v);
    if(n!==null&&/prompt|input/i.test(k)&&!/cache|audio|image/i.test(k)&&pin===null)pin=n;else if(n!==null&&/completion|output/i.test(k)&&!/reason|audio|image/i.test(k)&&pout===null)pout=n;else if(n!==null&&/^(request|web_search|search)$/i.test(k)&&req===null)req=n;else if(typeof v==='object')walk(v,depth+1)}})(o,0);
  return {pin,pout,req}}
async function loadPrices(){if(!KEY||!BASE)return;try{const r=await fetch(BASE+'/models',{headers:{Authorization:'Bearer '+KEY},signal:AbortSignal.timeout(15000)});const d=await r.json();const list=Array.isArray(d?.data)?d.data:Array.isArray(d)?d:[];
  const models={};for(const m of list){const id=m.id||m.name;if(!id)continue;const p=pickPrice(m.pricing||m.price||m);if(p.pin===null&&p.pout===null)continue;models[id]=p}
  // per-token values (e.g. 0.000002) are USD per token; turn everything into "per 1M tokens"
  const vals=Object.values(models).flatMap(p=>[p.pin,p.pout]).filter(v=>v>0);const perToken=vals.length&&vals.sort((a,b)=>a-b)[Math.floor(vals.length/2)]<0.01;
  if(perToken)for(const p of Object.values(models)){if(p.pin!==null)p.pin*=1e6;if(p.pout!==null)p.pout*=1e6}
  const med=vals.length?vals[Math.floor(vals.length/2)]*(perToken?1e6:1):0;
  PRICES={at:Date.now(),unit:med>1000?'toman':'usd',models,sample:list[0]?Object.keys(list[0]).slice(0,12):null,count:list.length,error:Object.keys(models).length?'':'no price fields in /models'}}catch(e){PRICES={...PRICES,at:Date.now(),error:String(e.message||e).slice(0,120)}}}
setTimeout(loadPrices,5000).unref?.();setInterval(loadPrices,24*3600e3).unref?.();
function priceFor(model){const m=PRICES.models[model]||PRICES.models[String(model).replace(/:online$/,'')];return m||null}
function callCost(model,tin,tout){const p=priceFor(model);if(!p)return null;return ((p.pin||0)*tin+(p.pout||0)*tout)/1e6+(/:online$/.test(model)&&p.req?p.req:0)}
function costs(){const since=Date.now()-30*864e5;const rows=readJsonlSafe(path.join(DATA,'usage.jsonl')).filter(u=>!u.test&&Date.parse(u.at)>=since);
  const acc={};const add=(k,c,tin,tout)=>{const a=acc[k]||(acc[k]={n:0,cost:0,priced:0,tin:0,tout:0});a.n++;a.tin+=tin;a.tout+=tout;if(c!==null){a.cost+=c;a.priced++}};
  for(const u of rows){if(u.research){let c=0,ok=true,ti=0,to=0;for(const x of u.calls||[]){const v=callCost(x.model,x.in,x.out);ti+=x.in;to+=x.out;if(v===null)ok=false;else c+=v}if((u.calls||[]).length)add('research',ok?c:null,ti,to);continue}
    if(u.usage&&u.status===200){add(u.act||(u.search?'live':'chat'),callCost(u.model,u.usage.in||0,u.usage.out||0),u.usage.in||0,u.usage.out||0)}}
  const avg=k=>{const a=acc[k];return a&&a.priced?a.cost/a.priced:null};
  const per={research:avg('research')!==null||avg('decide')!==null?(avg('research')||0)+(avg('decide')||0):null,live:avg('live'),chat:avg('chat')};
  const c=cfg||{};const tk=k=>{const a=acc[k];return a&&a.n?(a.tin+a.tout)/a.n:null};const tpk=Number(c.tomanPer1k)||0;
  const tokPer={research:tk('research')!==null||tk('decide')!==null?(tk('research')||0)+(tk('decide')||0):null,live:tk('live')};
  const toToman0=v=>v===null?null:PRICES.unit==='toman'?v:(Number(c.dollarRate)>0?v*Number(c.dollarRate):null);
  const tomanOf=k=>tpk&&tokPer[k]!==null?tokPer[k]*tpk/1000:toToman0(per[k]);const toToman=v=>v;
  const worstT=Math.max(...['research','live'].map(tomanOf).filter(v=>v!==null),0)||null;const margin=Number(c.margin)||3;
  const neginToman=worstT!==null?Math.max(1000,Math.ceil(worstT*margin/500)*500):null;
  const round=v=>Math.ceil(v/1000)*1000;
  const suggested=neginToman?{negin:neginToman,packs:[{n:20,price:round(20*neginToman)},{n:60,price:round(60*neginToman*0.85)}],subscription:{monthly:50,price:round(50*neginToman*0.8)}}:null;
  return {pricesAt:PRICES.at?new Date(PRICES.at).toISOString():null,unit:PRICES.unit,priceError:PRICES.error,modelsPriced:Object.keys(PRICES.models).length,listKeys:PRICES.sample,
    used:Object.fromEntries([...new Set(rows.map(u=>u.model).concat(rows.flatMap(u=>(u.calls||[]).map(x=>x.model))).filter(Boolean))].map(m=>[m,priceFor(m)])),
    perAction:Object.fromEntries(Object.entries(acc).map(([k,a])=>[k,{calls:a.n,avgIn:Math.round(a.tin/a.n),avgOut:Math.round(a.tout/a.n),avgCost:a.priced?a.cost/a.priced:null,toman:tpk?Math.round((a.tin+a.tout)/a.n*tpk/1000):null}])),
    perNeginAction:{research:per.research,live:per.live},perNeginToman:{research:tomanOf('research'),live:tomanOf('live')},tokensPerNegin:tokPer,tomanPer1k:tpk,margin,dollarRate:Number(c.dollarRate)||0,suggested}}
function readJsonlSafe(f){try{return fs.readFileSync(f,'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean)}catch{return []}}
const admin=makeAdmin({BANK,BANK_ADJ:BANK,getReqStatus,setReqStatus,newRedeem,getRedeem,costs,loadPrices,getSpend:()=>(spend.day===tday()?spend:{day:tday(),calls:0,online:0}),getUsers,SMS_ON:SMS.on,getCfg:()=>cfg,saveCfg,getGifts:()=>gifts,chatCall,refreshBestsellers,getBest:()=>best,AFF,E,DATA,persistent,MODELS,FALLBACK,FALLBACK_SEARCH,KEY,BASE,ai,logUsage,send,readForm,sameOrigin});
const VAULT=makeVault({DATA,send,ip,sameOrigin,E,normPhone,sendOtp,SMS,readBody});globalThis.BW_VAULT_STATS=VAULT.stats;globalThis.BW_VAULT_ADMIN=VAULT.adminHandle;
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://x');
  try{
    if(url.pathname==='/healthz/deep'&&E.DEEP_CHECK!=='1')return send(res,404,{error:'off'});
    if(url.pathname==='/healthz/deep'){
      // real end-to-end check (plain answer + live search), cached 30 min so it can't be used to run up the bill
      if(!deepCache||Date.now()-deepCache.t>(deepCache.ok?30*60e3:60e3)){
        const t0=Date.now();const a=await ai({tier:'default',input:'فقط بنویس: سلام'});const t1=Date.now();
        const b=await ai({search:true,input:'قیمت امروز میسلار واتر بایودرما سبیوم ۲۵۰ میل در دیجی‌کالا یا ترب چنده؟ خیلی کوتاه با منبع.'});
        const probe=async u=>{try{const r=await fetch(u,{headers:{Authorization:'Bearer '+KEY}});const t=await r.text();return r.status+' '+t.replace(/(sk-|eyJ)[\w.-]+/g,'[redacted]').slice(0,120)}catch(e){return 'ERR '+e.message}};
        const probes={redirect:await (async()=>{try{const r=await fetch(BASE+'/chat/completions',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json',Authorization:'Bearer '+KEY},body:JSON.stringify({model:'openai/gpt-5.4-mini',messages:[{role:'user',content:'hi'}]})});return r.status+' '+(r.headers.get('location')||'')+' '+(await r.text()).slice(0,80)}catch(e){return 'ERR '+e.message}})(),sdk:await (async()=>{try{const x=await chatCall('openai/gpt-5.4-mini',[{role:'user',content:'say hi'}]);return x.r.status+' '+String(x.d?.choices?.[0]?.message?.content||x.d?.error?.message||'').slice(0,60)}catch(e){return 'ERR '+e.message}})(),models:await probe(BASE+'/models'),noKey:await (async()=>{try{const r=await fetch(BASE+'/models');return r.status+' '+(await r.text()).slice(0,80)}catch(e){return 'ERR '+e.message}})()};
        deepCache={t:Date.now(),ok:a.status===200&&b.status===200,r:{at:new Date().toISOString(),probes,key:keyInfo(),upstream:a.status===200?null:lastUpstream,base:BASE.replace(/^https?:\/\//,''),answer:{ok:a.status===200,model:a.body.model,fallback:!!a.body.fallback,seconds:Math.round((t1-t0)/100)/10,error:a.body.code||null},search:{ok:b.status===200,model:b.body.model,fallback:!!b.body.fallback,seconds:Math.round((Date.now()-t1)/100)/10,sources:(b.body.sources||[]).map(x=>new URL(x.url).hostname),sample:String(b.body.text||'').slice(0,300),error:b.body.code||null}}};
        logUsage({at:new Date().toISOString(),test:true,status:b.status,model:b.body.model||'',search:true,sources:(b.body.sources||[]).length});
      }
      return send(res,200,deepCache.r,'application/json',{'Cache-Control':'no-store'});
    }
    if(url.pathname==='/healthz'){const bad=Object.keys(E).filter(k=>/\s|=/.test(k)).length;return send(res,200,{ok:true,ai:!!(KEY&&BASE),key:!!KEY,base:!!BASE,admin:!!Object.keys(E).find(k=>k.replace(/[\s\u200c\u200f\u200e]/g,'').toUpperCase()==='ADMIN_TOKEN'&&String(E[k]).trim()),disk:persistent,badVarNames:bad,...adminDiag(),version:'103'},'application/json',{'Cache-Control':'no-store'})}
    if(url.pathname==='/api/ai'&&req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'درخواست نامعتبر است'});
      const limited=allow(ip(req));if(limited)return send(res,429,{error:limited==='daily'?'سقف امروز آزمایش پر شده؛ فردا دوباره سر بزن 💜':'یه کم زیاد پرسیدی عزیزم؛ یه ساعت دیگه دوباره بپرس',code:'rate_limited'});
      const body=await readBody(req,80000);const t0=Date.now();const ck=typeof body.cacheKey==='string'&&body.search?normName(body.cacheKey).slice(0,120):'';
      const ph=ck&&pcache.get(ck);if(ph&&Date.now()-ph.t<6*3600e3)return send(res,200,{...ph.body,cached:true});
      const dd=String(body.d||'').replace(/[^a-z0-9]/g,'').slice(0,40);let via=null;
      if((body.search&&body.act==='live')||body.act==='chat'){via=BANK.charge(dd,ip(req),cfg);if(!via)return send(res,402,{code:'need_negin',error:body.act==='chat'?'برای سؤال از دستیار یه الماس لازمه 💎':'برای قیمت زنده یه الماس لازمه 💎',wallet:BANK.balance(dd,cfg)})}
      const r=await ai(body);if(via&&r.status!==200)BANK.refund(dd,via);if(via)r.body.wallet=BANK.balance(dd,cfg);if(ck&&r.status===200){pcache.set(ck,{t:Date.now(),body:r.body});if(pcache.size>500)pcache.delete(pcache.keys().next().value)}
      logUsage({at:new Date().toISOString(),status:r.status,model:r.body.model||'',search:!!body.search,ms:Date.now()-t0,sources:(r.body.sources||[]).length,fallback:!!r.body.fallback||undefined,code:r.body.code||undefined,usage:r.body.usage||null,act:['decide','live','chat','explain','routine'].includes(body.act)?body.act:(body.search?'live':'chat')});
      return send(res,r.status,r.body);
    }
    if(url.pathname==='/register'&&req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'forbidden'});if(allow(ip(req)))return send(res,429,{error:'یه کم بعد دوباره بزن'});
      const b=await readBody(req,2000);const phone=normPhone(b.phone);if(!phone)return send(res,400,{error:'شماره موبایل درست نیست'});
      const info={name:String(b.name||'').replace(/[<>]/g,'').trim().slice(0,40),d:String(b.d||'').replace(/[^a-z0-9]/g,'').slice(0,40),sa:!!b.sa,os:osOf(req.headers['user-agent'])};
      if(SMS.on){const prev=OTP.get(phone);if(prev&&Date.now()-prev.sent<60e3)return send(res,429,{error:'یه دقیقه دیگه دوباره بزن'});
        const code=String(crypto.randomInt(10000,100000));const sent=await sendOtp(phone,code);if(!sent)return send(res,502,{error:'پیامک نرفت؛ چند دقیقه بعد دوباره امتحان کن'});
        OTP.set(phone,{code,sent:Date.now(),tries:0,info});return send(res,200,{otp:true})}
      saveUser(phone,info,false);return send(res,200,{ok:true,verified:false});
    }
    if(url.pathname==='/register/verify'&&req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'forbidden'});const b=await readBody(req,1000);const phone=normPhone(b.phone);const o=phone&&OTP.get(phone);
      if(!o||Date.now()-o.sent>10*60e3)return send(res,400,{error:'کد منقضی شده؛ دوباره بفرست'});
      const code=String(b.code||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\D/g,'');
      if(code!==o.code){o.tries++;if(o.tries>=5)OTP.delete(phone);return send(res,400,{error:'کد درست نیست'})}
      OTP.delete(phone);saveUser(phone,o.info,true);return send(res,200,{ok:true,verified:true});
    }
    if(url.pathname==='/redeem'&&req.method==='POST'){ // one-time Negin code that support sends after payment
      if(!sameOrigin(req))return send(res,403,{error:'forbidden'});const a=ip(req);const f=redeemFails.get(a)||{n:0,t:Date.now()};if(Date.now()-f.t>3600e3){f.n=0;f.t=Date.now()}if(f.n>=8)return send(res,429,{error:'چند بار اشتباه زدی؛ یه ساعت دیگه امتحان کن'});
      const b=await readBody(req,500);const code=String(b.code||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).toUpperCase().replace(/[^A-Z0-9]/g,'');const all=getRedeem();const r=all[code];
      if(!r){f.n++;redeemFails.set(a,f);return send(res,400,{error:'این کد درست نیست'})}if(r.usedAt)return send(res,400,{error:'این کد قبلاً استفاده شده'});
      r.usedAt=new Date().toISOString();r.d=String(b.d||'').replace(/[^a-z0-9]/g,'').slice(0,40);saveRedeem(all);BANK.credit(r.d,r.n);setReqStatus(r.ref,{status:'done'});
      fs.appendFile(path.join(DATA,'events.jsonl'),JSON.stringify({at:r.usedAt,t:'redeem',d:r.d||'anon',page:'app'})+'\n',()=>{});return send(res,200,{ok:true,n:r.n,sub:!!r.sub,wallet:BANK.balance(r.d,cfg)});
    }
    if(url.pathname==='/pay-proof'&&req.method==='POST'){ // the shopper says "I paid": tracking number + last 4 card digits → admin confirms
      if(!sameOrigin(req))return send(res,403,{error:'forbidden'});if(allow(ip(req)))return send(res,429,{error:'یه کم بعد دوباره بزن'});
      const b=await readBody(req,1000);const digits=v=>String(v||'').replace(/[۰-۹]/g,x=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(x)).replace(/\D/g,'');
      const ref=String(b.ref||''),d=String(b.d||'').replace(/[^a-z0-9]/g,'');const row=readJsonlSafe(path.join(DATA,'purchase-requests.jsonl')).find(r=>r.ref===ref&&r.d===d);
      if(!row)return send(res,404,{error:'سفارش پیدا نشد'});const track=digits(b.track).slice(0,24),last4=digits(b.last4).slice(-4);
      if(track.length<4&&last4.length<4)return send(res,400,{error:'شماره پیگیری یا ۴ رقم آخر کارتت رو بنویس'});
      const prev=getReqStatus()[ref]||{};if(['done','rejected'].includes(prev.status))return send(res,400,{error:'این سفارش قبلاً بررسی شده'});
      const adv=prev.advance!=null?prev.advance:Math.max(0,Math.min(Number(cfg.payAdvance??1),row.n||0));if(adv&&prev.advance==null)BANK.credit(d,adv);
      setReqStatus(ref,{status:'proof',track,last4,paidAt:String(b.time||'').slice(0,40),advance:adv});return send(res,200,{ok:true,advance:adv,wallet:BANK.balance(d,cfg)});
    }
    if(url.pathname==='/order-status'){const d=String(url.searchParams.get('d')||'').replace(/[^a-z0-9]/g,'');const st=getReqStatus();
      const mine=readJsonlSafe(path.join(DATA,'purchase-requests.jsonl')).filter(r=>d&&r.d===d&&r.method==='card').slice(-5).map(r=>({ref:r.ref,n:r.n,price:r.price,kind:r.kind,status:(st[r.ref]&&st[r.ref].status)||'new'}));
      return send(res,200,{orders:mine,wallet:BANK.balance(d,cfg)},'application/json',{'Cache-Control':'no-store'})}
    if(url.pathname==='/buy-request'&&req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'forbidden'});const lim=allow(ip(req));if(lim)return send(res,429,{error:'یه کم بعد دوباره بزن'});
      const b=await readBody(req,2000);const phone=String(b.phone||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[^\d+]/g,'');
      const card=b.method==='card'&&['negin','sub'].includes(b.kind)&&/^[a-z0-9]{12,40}$/.test(String(b.d||''));
      if(!/^(\+98|0)?9\d{9}$/.test(phone)&&!(card&&!phone))return send(res,400,{error:'شماره موبایل درست نیست'});
      const kind=['negin','sub','product','support'].includes(b.kind)?b.kind:'negin';const ref='BW-'+String(crypto.randomInt(10000,100000));
      // card-to-card orders take amount and Negin count from the server's own price list, never from the page
      const pk=card&&kind==='negin'?(cfg.packs||[])[Number(b.pack)||0]:null;
      const row={at:new Date().toISOString(),ref,kind,method:card?'card':'contact',n:card?(kind==='sub'?Number(cfg.subscription.monthly)||0:Number(pk&&pk.n)||0):Math.max(0,Math.min(1000,Number(b.n)||0)),price:card?(kind==='sub'?Number(cfg.subscription.price)||0:Number(pk&&pk.price)||0):Math.max(0,Number(b.price)||0),name:String(b.name||'').slice(0,40),phone,item:String(b.item||'').slice(0,kind==='support'?600:120),d:String(b.d||'').replace(/[^a-z0-9]/g,'').slice(0,40)};
      fs.appendFileSync(path.join(DATA,'purchase-requests.jsonl'),JSON.stringify(row)+'\n');
      fs.appendFile(path.join(DATA,'events.jsonl'),JSON.stringify({at:row.at,t:'buy_request',d:row.d||'anon',page:'app',os:osOf(req.headers['user-agent'])})+'\n',()=>{});
      return send(res,200,{ok:true,ref,n:row.n,price:row.price});
    }
    if(url.pathname.startsWith('/bank-img/')){const f=path.join(IMGDIR,path.basename(url.pathname));return fs.stat(f,(e,st)=>{if(e||!st.isFile())return send(res,404,'','text/plain');const ext=path.extname(f).slice(1);res.writeHead(200,{'Content-Type':ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg','Cache-Control':'public, max-age=2592000, immutable'});fs.createReadStream(f).pipe(res)})}
    if(url.pathname==='/bank.json')return send(res,200,BANK.publicBank(),'application/json',{'Cache-Control':'no-cache'});
    if(url.pathname==='/wallet')return send(res,200,BANK.balance(String(url.searchParams.get('d')||'').replace(/[^a-z0-9]/g,'').slice(0,40),cfg),'application/json',{'Cache-Control':'no-store'});
    if(url.pathname==='/costs.json')return send(res,200,costs(),'application/json',{'Cache-Control':'no-store'});
    if(url.pathname==='/config.json')return send(res,200,{...cfg,aff:{dk:!!AFF.dk.tpl,kh:!!AFF.kh.tpl}},'application/json',{'Cache-Control':'no-cache'});
    if(url.pathname==='/gift'&&req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'forbidden'});const lim=allow(ip(req));if(lim)return send(res,429,{error:'یه کم بعد دوباره بزن'});
      const b=await readBody(req,2000);const id=newId();
      gifts[id]={id,at:new Date().toISOString(),to:String(b.to||'').slice(0,40),from:String(b.from||'').slice(0,40),budget:String(b.budget||'').slice(0,30),owner:String(b.d||'').replace(/[^a-z0-9]/g,'').slice(0,40),answers:null};
      const keys=Object.keys(gifts);if(keys.length>5000)for(const k of keys.slice(0,keys.length-5000))delete gifts[k];
      saveGifts();fs.appendFile(path.join(DATA,'events.jsonl'),JSON.stringify({at:new Date().toISOString(),t:'gift_create',d:gifts[id].owner||'anon',page:'app',os:osOf(req.headers['user-agent'])})+'\n',()=>{});
      return send(res,200,{id});
    }
    {const m=url.pathname.match(/^\/gift\/([a-z0-9]{6,20})$/);if(m){const g=gifts[m[1]];if(!g)return send(res,404,{error:'این لینک هدیه پیدا نشد'});
      if(req.method==='POST'){if(!sameOrigin(req))return send(res,403,{error:'forbidden'});if(g.answers)return send(res,200,{ok:true,already:true});const b=await readBody(req,2000);
        if(!SKIN.includes(b.skinBase)||!TODAY.includes(b.skinToday)||!GOAL.includes(b.goal1))return send(res,400,{error:'یکی از گزینه‌ها رو انتخاب کن'});
        g.answers={skinBase:b.skinBase,skinToday:b.skinToday,goal1:b.goal1,sensitive:!!b.sensitive,at:new Date().toISOString()};saveGifts();
        fs.appendFile(path.join(DATA,'events.jsonl'),JSON.stringify({at:new Date().toISOString(),t:'gift_answer',d:'anon',page:'app',os:osOf(req.headers['user-agent'])})+'\n',()=>{});
        return send(res,200,{ok:true})}
      // the giver sees the answers; the receiver only sees who it's from (no product, no budget)
      return send(res,200,url.searchParams.get('view')==='to'?{from:g.from,to:g.to,answered:!!g.answers}:{to:g.to,budget:g.budget,answers:g.answers,at:g.at},'application/json',{'Cache-Control':'no-store'})}}
    if(url.pathname==='/go'){
      const shop=url.searchParams.get('s')==='kh'?'kh':'dk';const t=affiliateUrl(shop,url.searchParams.get('u')||'');
      if(!t)return send(res,400,'لینک نامعتبر','text/plain; charset=utf-8');
      fs.appendFile(path.join(DATA,'events.jsonl'),JSON.stringify({at:new Date().toISOString(),t:'aff_click',d:String(url.searchParams.get('d')||'anon').replace(/[^a-z0-9]/g,'').slice(0,40)||'anon',shop,aff:t.aff,page:'app',os:osOf(req.headers['user-agent'])})+'\n',()=>{});
      res.writeHead(302,{Location:t.url,'Cache-Control':'no-store','Referrer-Policy':'no-referrer-when-downgrade'});return res.end();
    }
    if(url.pathname==='/api/bestsellers'||url.pathname==='/bestsellers.json'){return send(res,200,{at:best.at,items:best.items.map(({name_fa,name_en,brand,category,shop,verified,query})=>({name_fa,name_en,brand,category,shop,verified,query}))},'application/json',{'Cache-Control':'public, max-age=600'})}
    if(url.pathname==='/api/research'&&req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'درخواست نامعتبر است'});
      const limited=allow(ip(req));if(limited)return send(res,429,{error:'یه کم زیاد پرسیدی عزیزم؛ یه ساعت دیگه دوباره بپرس',code:'rate_limited'});
      const b=await readBody(req,4000);const d=String(b.d||'').replace(/[^a-z0-9]/g,'').slice(0,40);
      const known=!b.url&&BANK.find(b.name);if(known){BANK.hit(known,b.name);if(/^[a-z0-9][a-z0-9-]{1,79}$/.test(String(b.replaces||'')))BANK.setReplaces(known,String(b.replaces));const f=pubF(known);
        return send(res,200,{fromBank:true,found:true,verified:true,name_en:f.en,name_fa:f.name,brand:f.brand,formula:f,sources:f.sources.map(u=>({url:u,title:''})),variants:f.variants||[],wallet:BANK.balance(d,cfg)})}
      // a product the shopper already uses (added to «روتین من»): free, never a diamond
      const own=b.routine===true;
      if(own&&!BANK.routineFree(d,ip(req),cfg)){fs.appendFile(path.join(DATA,'not-found.jsonl'),JSON.stringify({at:new Date().toISOString(),query:String(b.name||'').slice(0,120),routine:true,queued:true})+'\n',()=>{});return send(res,200,{found:false,queued:true,wallet:BANK.balance(d,cfg)})}
      const via=own?'routine':BANK.charge(d,ip(req),cfg);if(!via)return send(res,402,{code:'need_negin',error:'برای بررسی یه محصول تازه الماس لازمه 💎',wallet:BANK.balance(d,cfg)});
      const link=cleanUrl(b.url);const r=await research(b.name,link);
      // only an ingredient list that a cited page really shows counts as found (and is worth a diamond)
      if(r.status===200&&r.body.found&&!r.body.sourceVerified){r.body={...r.body,found:false,unverified:true}}
      const replaces=/^[a-z0-9][a-z0-9-]{1,79}$/.test(String(b.replaces||''))?String(b.replaces):'';
      if(r.status!==200||!r.body.found||r.body.cached){if(own)BANK.routineBack(d);else BANK.refund(d,via)} // no new cost → no charge
      if(r.status!==200||!r.body.found)fs.appendFile(path.join(DATA,'not-found.jsonl'),JSON.stringify({at:new Date().toISOString(),query:String(b.name||'').slice(0,120),url:link||undefined,routine:own||undefined})+'\n',()=>{});
      let formula=null,inBank=false;if(r.status===200&&r.body.found){formula=BANK.toFormula(r.body,b.name,r.body.sources,r.body.model);if(formula&&replaces)formula.replaces=replaces;const row=BANK.add(formula,b.name);inBank=!!row;if(row)formula=pubF(row)
        // photo in the background: never delays the answer
        if(row&&!row.image){const img=r.body.image_url||'';(img?Promise.resolve(img):link?pageImage(link):Promise.resolve('')).then(u=>ensureImage(row,u)).catch(()=>{})}}
      return send(res,r.status,{...r.body,formula,inBank,wallet:BANK.balance(d,cfg)});
    }
    if(url.pathname==='/api/feedback'&&req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'درخواست نامعتبر است'});
      const b=await readBody(req,8000);const row={at:new Date().toISOString(),kind:String(b.kind||'app').slice(0,20),rating:Math.max(0,Math.min(5,Number(b.rating)||0))||undefined,tags:Array.isArray(b.tags)?b.tags.slice(0,8).map(t=>String(t).slice(0,40)):undefined,text:String(b.text||'').slice(0,1000)||undefined,skin:String(b.skin||'').slice(0,20)||undefined,routineSize:Number(b.routineSize)||undefined,raw:b.kind==='answer'?{rating:String(b.rating||'').slice(0,20),messageId:String(b.assistantMessageId||'').slice(0,60)}:undefined};
      try{fs.appendFileSync(path.join(DATA,'feedback.jsonl'),JSON.stringify(row)+'\n')}catch(e){console.error('feedback write failed',e.code);return send(res,500,{error:'ذخیره نشد؛ دوباره بزن'})}return send(res,200,{ok:true,message:'رسید، مرسی 💜'});
    }
    if(url.pathname==='/api/event'&&req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'forbidden'});
      const addr=ip(req),now=Date.now(),list=(evHits.get(addr)||[]).filter(t=>now-t<3600e3);if(list.length>=300)return send(res,429,{ok:false});list.push(now);evHits.set(addr,list);
      const b=await readBody(req,1000);const t=String(b.type||''),d=String(b.d||'');
      if(!EVENTS.has(t)||!/^[a-z0-9]{12,40}$/.test(d))return send(res,400,{ok:false});
      if(b.p&&/^app_open/.test(t))touchUser(normPhone(b.p),d,!!b.sa);
      fs.appendFile(path.join(DATA,'events.jsonl'),JSON.stringify({at:new Date().toISOString(),t,d,sa:!!b.sa,page:b.page==='site'?'site':'app',os:osOf(req.headers['user-agent'])})+'\n',()=>{});
      return send(res,204,'');
    }
    if(url.pathname.startsWith('/api/vault'))return await VAULT.handle(req,res,url);
    if(url.pathname==='/admin'||url.pathname.startsWith('/admin/'))return await admin(req,res,url);
    if(url.pathname.startsWith('/api/'))return send(res,404,{error:'این بخش در نسخه آزمایشی فعال نیست'});
    // static files
    let p=decodeURIComponent(url.pathname);if((p==='/'||p==='/index.html')&&!fs.existsSync(path.join(PUBLIC,'index.html'))){res.writeHead(302,{Location:'/legacy/'});return res.end()}
    if(p==='/legacy'){res.writeHead(301,{Location:'/legacy/'});return res.end()}
    if(p==='/app'||p==='/app/'){res.writeHead(302,{Location:'/legacy/'+url.search,'Cache-Control':'no-store'});return res.end()} // the app's own short address; the site lives at /
    if(p.endsWith('/'))p+='index.html';
    const file=path.normalize(path.join(PUBLIC,p));if(!file.startsWith(PUBLIC))return send(res,403,'','text/plain');
    fs.stat(file,(err,st)=>{if(err||!st.isFile())return send(res,404,'پیدا نشد','text/plain; charset=utf-8');const ext=path.extname(file);const html=ext==='.html'||/sw\.js$/.test(file);res.writeHead(200,{'Content-Type':TYPES[ext]||'application/octet-stream',...SEC,'Cache-Control':html?'no-cache':'public, max-age=604800'});fs.createReadStream(file).pipe(res)});
  }catch(e){send(res,e.status||500,{error:e.status===413?'پیام خیلی طولانیه':'خطای سرور',code:e.message})}
});
server.listen(Number(E.PORT||3000),'0.0.0.0',()=>console.log('BeautyWallet lite on 0.0.0.0:'+(E.PORT||3000)+' ai='+(KEY&&BASE?'configured':'missing')+' data='+DATA+(persistent?' (disk)':' (temporary)')));
process.on('uncaughtException',e=>console.error('uncaught',e));process.on('unhandledRejection',e=>console.error('unhandled',e));
