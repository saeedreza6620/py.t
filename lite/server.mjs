// BeautyWallet lite server — one small Node process, no dependencies.
// Serves the app (public/legacy) and holds the AI key server-side:
//   POST /api/ai        → Liara (OpenAI-compatible Chat Completions); search:true uses the ":online" model
//   POST /api/feedback  → appends to DATA_DIR/feedback.jsonl
//   POST /api/event     → anonymous usage counts (random device id + event type)
//   GET  /admin         → owner panel (login with ADMIN_TOKEN): installs, usage, live-search health, feedback
// Env: LIARA_API_KEY (secret), AI_BASE_URL, AI_MODEL, AI_MODEL_LIGHT, AI_MODEL_COMPLEX, AI_MODEL_SEARCH,
//      AI_MODEL_FALLBACK, AI_MODEL_SEARCH_FALLBACK, AI_MAX_TOKENS (optional)
//      ADMIN_TOKEN (secret), PORT (default 3000), DATA_DIR (default ./data), HOURLY_LIMIT, DAILY_LIMIT
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const PUBLIC=path.join(here,'public');
import os from 'node:os';import {makeAdmin} from './admin.mjs';
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
async function chatCall(model,messages,signal,key){
  const params={model,messages};
  // gpt-5 family rejects custom temperature / max_tokens; others get a roomy budget for reasoning
  if(!/gpt-5/.test(model)){params.max_tokens=MAX_TOKENS;params.temperature=0.3}
  try{const c=await (await sdk(key)).chat.completions.create(params,{signal,timeout:110000});return {r:{ok:true,status:200},d:c}}
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
    if(!r.ok){lastUpstream={tried,status:r.status,message:String(d?.error?.message||d?.message||'').replace(/(sk-|eyJ)[\w.-]+/g,'[redacted]').slice(0,200)};const code=String(d?.error?.code||d?.code||r.status).replace(/[^\w.-]/g,'').slice(0,60);console.error('ai upstream',r.status,code,model);
      return {status:r.status===429?429:502,body:{error:r.status===401||r.status===403?'کلید یا دسترسی سرویس هوش مصنوعی مشکل دارد':r.status===402?'اعتبار سرویس هوش مصنوعی تمام شده':r.status===429?'سرویس شلوغه؛ یه کم بعد دوباره بزن':r.status===404?'نام مدل یا آدرس سرویس درست نیست':'دستیار الان جواب نداد؛ دوباره تلاش کن',code:'upstream_'+code}}}
    const msg=d?.choices?.[0]?.message;const text=typeof msg?.content==='string'?msg.content:Array.isArray(msg?.content)?msg.content.map(x=>x.text||'').join('\n'):'';
    if(!text.trim())return {status:502,body:{error:'پاسخ خالی بود؛ دوباره بپرس',code:'empty'}};
    return {status:200,body:{text,sources:sourcesOf(msg),model,fallback:model!==first,searched:!!body.search,usage:d.usage?{in:d.usage.prompt_tokens,out:d.usage.completion_tokens}:null}};
  }catch(e){return {status:504,body:{error:e.name==='AbortError'?'جواب طول کشید؛ دوباره بزن':'اتصال به سرویس هوش مصنوعی برقرار نشد',code:'network'}}}finally{clearTimeout(timer)}
}

// ---------- product research: identify any product by name and fetch its real INCI list ----------
// The shopper only types a name (Persian, transliterated, partial). We find the exact product and its
// ingredient list on the web ourselves (brand site, INCIDecoder, Skinsort, big retailers) — never ask them for a photo.
const RESEARCH_MODELS=[...new Set([E.AI_MODEL_RESEARCH||'openai/gpt-4.1:online','openai/gpt-5-mini:online','openai/gpt-4.1-mini:online'])];
const RCACHE=path.join(DATA,'research-cache.json');let rcache={};try{rcache=JSON.parse(fs.readFileSync(RCACHE,'utf8'))}catch{}
const normName=q=>String(q||'').toLowerCase().replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').replace(/[‌\s\-_.,،()]+/g,' ').trim().slice(0,120);
const RESEARCH_PROMPT=`You are a cosmetic-product researcher for an Iranian skincare app. A shopper typed the product name below the way people do in Iran: Persian, transliterated, partial or misspelled, often with the store's Persian title.
Use web search to identify the EXACT product and read its FULL ingredient list (INCI).
Search order: 1) the official brand website, 2) INCIDecoder / Skinsort / CosDNA / SkinCarisma, 3) large retailers (Sephora, Boots, Ulta, Lookfantastic, Digikala product specs).
Search in English with the brand and product line (translate the Persian name first), and also the Persian name if needed.
If several versions exist (oily/dry skin, old/new formula, SPF 30/50), choose the one that best matches the name and list the others in "variants".
Never invent ingredients. Only fill "inci" with a list you actually saw on a page; otherwise use [].
Answer with ONLY minified JSON, no prose, with exactly these keys:
{"found":bool,"name_en":"","name_fa":"","brand":"","category":"cleanser|toner|serum|moisturizer|sunscreen|mask|exfoliant|eye|lip|body|other","confidence":"high|medium|low","inci":[""],"key_actives":[{"name":"","percent":null}],"spf":null,"texture":"","fragrance":null,"alcohol_denat":null,"essential_oils":[],"pore_clogging":[],"claims_fa":[""],"skin_types_fa":[""],"variants":[""],"source_note_fa":""}`;
function parseJson(t){const s=String(t||'');const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a<0||b<=a)return null;try{return JSON.parse(s.slice(a,b+1))}catch{return null}}
async function research(name){
  const key=normName(name);if(!key)return {status:400,body:{error:'اسم محصول خالیه'}};
  const hit=rcache[key];if(hit&&Date.now()-hit.t<30*864e5)return {status:200,body:{...hit.data,cached:true}};
  if(!KEY||!BASE)return {status:503,body:{error:'سرویس هوش مصنوعی تنظیم نشده',code:'not_configured'}};
  let best=null;const tried=[];
  for(const model of RESEARCH_MODELS){
    let x;try{x=await chatCall(model,[{role:'system',content:RESEARCH_PROMPT},{role:'user',content:'Product name typed by the shopper: '+String(name).slice(0,200)}])}catch(e){tried.push(model+':error');continue}
    tried.push(model+':'+x.r.status);if(!x.r.ok){if([400,403,404,422,503].includes(x.r.status))continue;break}
    const msg=x.d?.choices?.[0]?.message,j=parseJson(msg?.content);const sources=sourcesOf(msg);
    if(!j)continue;
    j.inci=Array.isArray(j.inci)?j.inci.map(v=>String(v).trim()).filter(Boolean).slice(0,80):[];
    const cand={...j,sources,model,verified:!!j.found&&j.inci.length>=5&&sources.length>0&&j.confidence!=='low'};
    if(!best||(cand.verified&&!best.verified)||(cand.inci.length>(best.inci||[]).length&&!best.verified))best=cand;
    if(best.verified)break;
  }
  if(!best)return {status:502,body:{error:'الان نتونستم پیداش کنم؛ یه لحظه دیگه دوباره بزن',code:'research_failed',tried}};
  const data={query:String(name).slice(0,120),...best,checkedAt:new Date().toISOString()};
  if(best.verified){rcache[key]={t:Date.now(),data};try{fs.writeFileSync(RCACHE,JSON.stringify(rcache))}catch{}}
  logUsage({at:new Date().toISOString(),research:true,status:200,model:best.model,verified:best.verified,sources:best.sources.length});
  return {status:200,body:data};
}

async function readForm(req){return new Promise((ok,bad)=>{let n=0;const parts=[];req.on('data',c=>{n+=c.length;if(n>4000){bad(Object.assign(new Error('too_large'),{status:413}));req.destroy();return}parts.push(c)});req.on('end',()=>ok(Object.fromEntries(new URLSearchParams(Buffer.concat(parts).toString('utf8')))));req.on('error',bad)})}
const EVENTS=new Set(['site_open','app_open','app_open_installed','install','install_offer','install_click','check','aff_click','refill_due','refill_worked','refill_not_worked','refill_buy','negin_spend','negin_buy_click','sub_click','gift_open','gift_view']);
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
      const r=await research(it.name_en?it.name_en+' '+(it.brand||''):it.name_fa).catch(()=>null);const d=r&&r.status===200?r.body:null;
      out.push({name_fa:String(it.name_fa||d?.name_fa||'').slice(0,120),name_en:String(it.name_en||d?.name_en||'').slice(0,120),brand:String(it.brand||d?.brand||'').slice(0,60),category:String(d?.category||it.category||'').slice(0,30),shop:it.shop==='khanoumi'?'khanoumi':'digikala',url:(()=>{try{const u=new URL(it.url);return /(digikala|khanoumi)\.com$/i.test(u.hostname)?u.href:''}catch{return ''}})(),verified:!!d?.verified,query:nm})}
    if(out.length){best={at:new Date().toISOString(),items:out,running:false};fs.writeFileSync(BEST,JSON.stringify(best))}
    logUsage({at:new Date().toISOString(),bestsellers:true,status:x.r.status,found:list.length,kept:out.length});
  }catch(e){console.error('bestsellers',e.message)}finally{best.running=false}
}
// refresh weekly in the background (BESTSELLER_DAYS=0 turns it off)
const BEST_DAYS=Number(E.BESTSELLER_DAYS??7);
if(BEST_DAYS>0)setInterval(()=>{if(!best.at||Date.now()-Date.parse(best.at)>BEST_DAYS*864e5)refreshBestsellers()},6*3600e3).unref?.();
if(BEST_DAYS>0&&!best.at)setTimeout(()=>refreshBestsellers(),60e3).unref?.();

// ---------- Negin pricing (editable in the admin panel) ----------
const CFG=path.join(DATA,'config.json');
const DEFAULT_CFG={welcome:10,costs:{research:1,live:1,gift:0,pack:2},packs:[{n:20,price:49000},{n:60,price:119000}],subscription:{price:99000,monthly:50,perks:'هشدار تمدید و افت قیمت، تحقیق محصول نامحدود منصفانه'},trial:true};
let cfg=DEFAULT_CFG;try{cfg={...DEFAULT_CFG,...JSON.parse(fs.readFileSync(CFG,'utf8'))}}catch{}
function saveCfg(next){const n=Number;const c={welcome:Math.max(0,n(next.welcome)||0),costs:{research:Math.max(0,n(next.research)||0),live:Math.max(0,n(next.live)||0),gift:Math.max(0,n(next.gift)||0),pack:Math.max(0,n(next.pack)||0)},
  packs:[{n:Math.max(1,n(next.p1n)||20),price:Math.max(0,n(next.p1p)||0)},{n:Math.max(1,n(next.p2n)||60),price:Math.max(0,n(next.p2p)||0)}],subscription:{price:Math.max(0,n(next.subp)||0),monthly:Math.max(0,n(next.subn)||0),perks:String(next.perks||'').slice(0,200)},trial:next.trial==='on'||next.trial===true};
  cfg=c;try{fs.writeFileSync(CFG,JSON.stringify(c))}catch(e){console.error('config save',e.code)}return c}

// ---------- safe gift: the giver sends a link, the receiver answers 3 skin questions privately ----------
const GIFTS=path.join(DATA,'gifts.json');let gifts={};try{gifts=JSON.parse(fs.readFileSync(GIFTS,'utf8'))}catch{}
const saveGifts=()=>{try{fs.writeFileSync(GIFTS,JSON.stringify(gifts))}catch{}};
const newId=()=>Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);
const SKIN=['چرب','مختلط','نرمال','خشک','مطمئن نیستم'],TODAY=['متعادل','جوش فعال','تحریک‌شده','قرمز و حساس','خشک‌تر از معمول','چرب‌تر از معمول'],GOAL=['کاهش جوش التهابی','کاهش لک پس از جوش','آبرسانی و حمایت از لایهٔ محافظ پوست','کاهش قرمزی','کنترل چربی','کاهش علائم پیری'];

const admin=makeAdmin({getCfg:()=>cfg,saveCfg,getGifts:()=>gifts,chatCall,refreshBestsellers,getBest:()=>best,AFF,E,DATA,persistent,MODELS,FALLBACK,FALLBACK_SEARCH,KEY,BASE,ai,logUsage,send,readForm,sameOrigin});
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://x');
  try{
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
    if(url.pathname==='/healthz'){const bad=Object.keys(E).filter(k=>/\s|=/.test(k)).length;return send(res,200,{ok:true,ai:!!(KEY&&BASE),key:!!KEY,base:!!BASE,admin:!!Object.keys(E).find(k=>k.replace(/[\s\u200c\u200f\u200e]/g,'').toUpperCase()==='ADMIN_TOKEN'&&String(E[k]).trim()),disk:persistent,badVarNames:bad,version:'70'},'application/json',{'Cache-Control':'no-store'})}
    if(url.pathname==='/api/ai'&&req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'درخواست نامعتبر است'});
      const limited=allow(ip(req));if(limited)return send(res,429,{error:limited==='daily'?'سقف امروز آزمایش پر شده؛ فردا دوباره سر بزن 💜':'یه کم زیاد پرسیدی عزیزم؛ یه ساعت دیگه دوباره بپرس',code:'rate_limited'});
      const body=await readBody(req,80000);const t0=Date.now();const r=await ai(body);
      logUsage({at:new Date().toISOString(),status:r.status,model:r.body.model||'',search:!!body.search,ms:Date.now()-t0,sources:(r.body.sources||[]).length,fallback:!!r.body.fallback||undefined,code:r.body.code||undefined,usage:r.body.usage||null});
      return send(res,r.status,r.body);
    }
    if(url.pathname==='/config.json')return send(res,200,cfg,'application/json',{'Cache-Control':'no-cache'});
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
      const b=await readBody(req,4000);const r=await research(b.name);return send(res,r.status,r.body);
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
      fs.appendFile(path.join(DATA,'events.jsonl'),JSON.stringify({at:new Date().toISOString(),t,d,sa:!!b.sa,page:b.page==='site'?'site':'app',os:osOf(req.headers['user-agent'])})+'\n',()=>{});
      return send(res,204,'');
    }
    if(url.pathname==='/admin'||url.pathname.startsWith('/admin/'))return await admin(req,res,url);
    if(url.pathname.startsWith('/api/'))return send(res,404,{error:'این بخش در نسخه آزمایشی فعال نیست'});
    // static files
    let p=decodeURIComponent(url.pathname);if((p==='/'||p==='/index.html')&&!fs.existsSync(path.join(PUBLIC,'index.html'))){res.writeHead(302,{Location:'/legacy/'});return res.end()}
    if(p==='/legacy'){res.writeHead(301,{Location:'/legacy/'});return res.end()}
    if(p.endsWith('/'))p+='index.html';
    const file=path.normalize(path.join(PUBLIC,p));if(!file.startsWith(PUBLIC))return send(res,403,'','text/plain');
    fs.stat(file,(err,st)=>{if(err||!st.isFile())return send(res,404,'پیدا نشد','text/plain; charset=utf-8');const ext=path.extname(file);const html=ext==='.html'||/sw\.js$/.test(file);res.writeHead(200,{'Content-Type':TYPES[ext]||'application/octet-stream',...SEC,'Cache-Control':html?'no-cache':'public, max-age=604800'});fs.createReadStream(file).pipe(res)});
  }catch(e){send(res,e.status||500,{error:e.status===413?'پیام خیلی طولانیه':'خطای سرور',code:e.message})}
});
server.listen(Number(E.PORT||3000),'0.0.0.0',()=>console.log('BeautyWallet lite on 0.0.0.0:'+(E.PORT||3000)+' ai='+(KEY&&BASE?'configured':'missing')+' data='+DATA+(persistent?' (disk)':' (temporary)')));
process.on('uncaughtException',e=>console.error('uncaught',e));process.on('unhandledRejection',e=>console.error('unhandled',e));
