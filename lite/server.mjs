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
const DATA=[process.env.DATA_DIR,path.join(here,'data'),path.join(os.tmpdir(),'beautywallet-data')].filter(Boolean).find(writable)||os.tmpdir();
const E=process.env;
const persistent=!!E.DATA_DIR&&path.resolve(DATA)===path.resolve(E.DATA_DIR);
const BASE=String(E.AI_BASE_URL||'').trim().replace(/\/(chat\/completions)\/?$/,'').replace(/\/$/,'');
const KEY=E.LIARA_API_KEY||E.AI_API_KEY||'';
const MODELS={light:E.AI_MODEL_LIGHT||E.AI_MODEL||'openai/gpt-4.1-mini',default:E.AI_MODEL||'openai/gpt-4.1-mini',complex:E.AI_MODEL_COMPLEX||E.AI_MODEL||'openai/gpt-4.1-mini',search:E.AI_MODEL_SEARCH||'openai/gpt-4.1-mini:online'};
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
async function ai(body){
  if(!KEY||!BASE)return {status:503,body:{error:'دستیار هنوز روی سرور تنظیم نشده (کلید یا آدرس)',code:'not_configured'}};
  const tier=['light','default','complex'].includes(body.tier)?body.tier:'default';
  let messages=Array.isArray(body.input)?body.input:[{role:'user',content:String(body.input||'')}];
  messages=messages.filter(m=>m&&(m.role==='user'||m.role==='assistant')&&typeof m.content==='string').slice(-8).map(m=>({role:m.role,content:m.content.slice(0,24000)}));
  if(!messages.length||messages[messages.length-1].role!=='user')return {status:400,body:{error:'پیام نامعتبر است'}};
  let model=body.search?MODELS.search:MODELS[tier];if(body.search&&!/:online$/.test(model))model+=':online';
  const fallback=body.search?FALLBACK_SEARCH:FALLBACK;
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),body.search?110000:90000);
  try{
    let r,d;const first=model;
    for(const m of model===fallback?[model]:[model,fallback]){
      model=m;
      r=await fetch(BASE+'/chat/completions',{method:'POST',signal:ctl.signal,headers:{'Content-Type':'application/json','Authorization':'Bearer '+KEY},body:JSON.stringify({model,messages,max_tokens:MAX_TOKENS,temperature:0.3})});
      d=await r.json().catch(()=>null);
      // unknown/unavailable model → try the safe fallback once instead of failing the user
      if(r.ok||![400,404,422,503].includes(r.status))break;
      console.error('ai model failed, falling back',r.status,m);
    }
    if(!r.ok){const code=String(d?.error?.code||d?.code||r.status).replace(/[^\w.-]/g,'').slice(0,60);console.error('ai upstream',r.status,code,model);
      return {status:r.status===429?429:502,body:{error:r.status===401||r.status===403?'کلید یا دسترسی سرویس هوش مصنوعی مشکل دارد':r.status===402?'اعتبار سرویس هوش مصنوعی تمام شده':r.status===429?'سرویس شلوغه؛ یه کم بعد دوباره بزن':r.status===404?'نام مدل یا آدرس سرویس درست نیست':'دستیار الان جواب نداد؛ دوباره تلاش کن',code:'upstream_'+code}}}
    const msg=d?.choices?.[0]?.message;const text=typeof msg?.content==='string'?msg.content:Array.isArray(msg?.content)?msg.content.map(x=>x.text||'').join('\n'):'';
    if(!text.trim())return {status:502,body:{error:'پاسخ خالی بود؛ دوباره بپرس',code:'empty'}};
    return {status:200,body:{text,sources:sourcesOf(msg),model,fallback:model!==first,searched:!!body.search,usage:d.usage?{in:d.usage.prompt_tokens,out:d.usage.completion_tokens}:null}};
  }catch(e){return {status:504,body:{error:e.name==='AbortError'?'جواب طول کشید؛ دوباره بزن':'اتصال به سرویس هوش مصنوعی برقرار نشد',code:'network'}}}finally{clearTimeout(timer)}
}

async function readForm(req){return new Promise((ok,bad)=>{let n=0;const parts=[];req.on('data',c=>{n+=c.length;if(n>4000){bad(Object.assign(new Error('too_large'),{status:413}));req.destroy();return}parts.push(c)});req.on('end',()=>ok(Object.fromEntries(new URLSearchParams(Buffer.concat(parts).toString('utf8')))));req.on('error',bad)})}
const EVENTS=new Set(['site_open','app_open','app_open_installed','install','install_offer','install_click','check']);
const evHits=new Map();
function osOf(ua){ua=String(ua||'');return /iPhone|iPad|iPod/i.test(ua)?'ios':/Android/i.test(ua)?'android':'desktop'}
function logUsage(row){fs.appendFile(path.join(DATA,'usage.jsonl'),JSON.stringify(row)+'\n',()=>{})}
const admin=makeAdmin({E,DATA,persistent,MODELS,FALLBACK,FALLBACK_SEARCH,KEY,BASE,ai,logUsage,send,readForm,sameOrigin});

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://x');
  try{
    if(url.pathname==='/healthz')return send(res,200,{ok:true,ai:!!(KEY&&BASE)});
    if(url.pathname==='/api/ai'&&req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'درخواست نامعتبر است'});
      const limited=allow(ip(req));if(limited)return send(res,429,{error:limited==='daily'?'سقف امروز آزمایش پر شده؛ فردا دوباره سر بزن 💜':'یه کم زیاد پرسیدی عزیزم؛ یه ساعت دیگه دوباره بپرس',code:'rate_limited'});
      const body=await readBody(req,80000);const t0=Date.now();const r=await ai(body);
      logUsage({at:new Date().toISOString(),status:r.status,model:r.body.model||'',search:!!body.search,ms:Date.now()-t0,sources:(r.body.sources||[]).length,fallback:!!r.body.fallback||undefined,code:r.body.code||undefined,usage:r.body.usage||null});
      return send(res,r.status,r.body);
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
