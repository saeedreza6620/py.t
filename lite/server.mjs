// BeautyWallet lite server — one small Node process, no dependencies.
// Serves the app (public/legacy) and holds the AI key server-side:
//   POST /api/ai        → Liara (OpenAI-compatible Chat Completions); search:true uses the ":online" model
//   POST /api/feedback  → appends to DATA_DIR/feedback.jsonl
//   GET  /admin/feedback?token=ADMIN_TOKEN[&format=csv] → owner view of feedback
// Env: LIARA_API_KEY (secret), AI_BASE_URL, AI_MODEL, AI_MODEL_LIGHT, AI_MODEL_COMPLEX, AI_MODEL_SEARCH,
//      AI_MODEL_FALLBACK, AI_MODEL_SEARCH_FALLBACK, AI_MAX_TOKENS (optional)
//      ADMIN_TOKEN (secret), PORT (default 3000), DATA_DIR (default ./data), HOURLY_LIMIT, DAILY_LIMIT
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const PUBLIC=path.join(here,'public');
const DATA=process.env.DATA_DIR||path.join(here,'data');fs.mkdirSync(DATA,{recursive:true});
const E=process.env;
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
    let r,d;
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
    return {status:200,body:{text,sources:sourcesOf(msg),model,searched:!!body.search,usage:d.usage?{in:d.usage.prompt_tokens,out:d.usage.completion_tokens}:null}};
  }catch(e){return {status:504,body:{error:e.name==='AbortError'?'جواب طول کشید؛ دوباره بزن':'اتصال به سرویس هوش مصنوعی برقرار نشد',code:'network'}}}finally{clearTimeout(timer)}
}

function logUsage(row){fs.appendFile(path.join(DATA,'usage.jsonl'),JSON.stringify(row)+'\n',()=>{})}
function feedbackRows(){try{return fs.readFileSync(path.join(DATA,'feedback.jsonl'),'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean)}catch{return []}}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function adminPage(rows){const avg=rows.filter(r=>r.rating).reduce((a,r,_,l)=>a+r.rating/l.length,0);
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>بازخورد بیوتی‌ولت</title><style>body{font-family:Tahoma,sans-serif;direction:rtl;background:#eef8ff;color:#15384b;margin:0;padding:16px}table{border-collapse:collapse;width:100%;background:#fff;border-radius:12px;overflow:hidden}td,th{padding:8px;border-bottom:1px solid #d6eaf3;font-size:13px;vertical-align:top;text-align:right}th{background:#ffe4f0}.k{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px}.k b{background:#fff;padding:10px 14px;border-radius:12px}</style><h1>بازخورد کاربران</h1><div class="k"><b>تعداد: ${rows.length}</b><b>میانگین امتیاز: ${avg?avg.toFixed(1):'-'}</b><a href="?token=${esc(E.ADMIN_TOKEN)}&format=csv">دانلود CSV</a></div><table><tr><th>زمان</th><th>نوع</th><th>امتیاز</th><th>برچسب‌ها</th><th>متن</th><th>پوست</th></tr>${rows.slice().reverse().map(r=>`<tr><td>${esc((r.at||'').slice(0,16).replace('T',' '))}</td><td>${esc(r.kind)}</td><td>${esc(r.rating||r.raw?.rating||'')}</td><td>${esc((r.tags||[]).join('، '))}</td><td>${esc(r.text)}</td><td>${esc(r.skin)}</td></tr>`).join('')}</table>`}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://x');
  try{
    if(url.pathname==='/healthz')return send(res,200,{ok:true,ai:!!(KEY&&BASE)});
    if(url.pathname==='/api/ai'&&req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'درخواست نامعتبر است'});
      const limited=allow(ip(req));if(limited)return send(res,429,{error:limited==='daily'?'سقف امروز آزمایش پر شده؛ فردا دوباره سر بزن 💗':'یه کم زیاد پرسیدی عزیزم؛ یه ساعت دیگه دوباره بپرس',code:'rate_limited'});
      const body=await readBody(req,80000);const r=await ai(body);
      logUsage({at:new Date().toISOString(),status:r.status,model:r.body.model||'',search:!!body.search,usage:r.body.usage||null});
      return send(res,r.status,r.body);
    }
    if(url.pathname==='/api/feedback'&&req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'درخواست نامعتبر است'});
      const b=await readBody(req,8000);const row={at:new Date().toISOString(),kind:String(b.kind||'app').slice(0,20),rating:Math.max(0,Math.min(5,Number(b.rating)||0))||undefined,tags:Array.isArray(b.tags)?b.tags.slice(0,8).map(t=>String(t).slice(0,40)):undefined,text:String(b.text||'').slice(0,1000)||undefined,skin:String(b.skin||'').slice(0,20)||undefined,routineSize:Number(b.routineSize)||undefined,raw:b.kind==='answer'?{rating:String(b.rating||'').slice(0,20),messageId:String(b.assistantMessageId||'').slice(0,60)}:undefined};
      fs.appendFileSync(path.join(DATA,'feedback.jsonl'),JSON.stringify(row)+'\n');return send(res,200,{ok:true,message:'رسید، مرسی 💗'});
    }
    if(url.pathname==='/admin/feedback'){
      if(!E.ADMIN_TOKEN||url.searchParams.get('token')!==E.ADMIN_TOKEN)return send(res,401,'نیاز به توکن مدیریت','text/plain; charset=utf-8');
      const rows=feedbackRows();
      if(url.searchParams.get('format')==='csv'){const cols=['at','kind','rating','tags','text','skin','routineSize'];const csv='﻿'+cols.join(',')+'\n'+rows.map(r=>cols.map(c=>{let v=String(Array.isArray(r[c])?r[c].join('|'):r[c]??'');if(/^[=+\-@]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'}).join(',')).join('\n');return send(res,200,csv,'text/csv; charset=utf-8',{'Content-Disposition':'attachment; filename="beautywallet-feedback.csv"'})}
      return send(res,200,adminPage(rows),'text/html; charset=utf-8');
    }
    if(url.pathname.startsWith('/api/'))return send(res,404,{error:'این بخش در نسخه آزمایشی فعال نیست'});
    // static files
    let p=decodeURIComponent(url.pathname);if(p==='/'||p==='/index.html'){res.writeHead(302,{Location:'/legacy/'});return res.end()}
    if(p.endsWith('/'))p+='index.html';
    const file=path.normalize(path.join(PUBLIC,p));if(!file.startsWith(PUBLIC))return send(res,403,'','text/plain');
    fs.stat(file,(err,st)=>{if(err||!st.isFile())return send(res,404,'پیدا نشد','text/plain; charset=utf-8');const ext=path.extname(file);const html=ext==='.html'||/sw\.js$/.test(file);res.writeHead(200,{'Content-Type':TYPES[ext]||'application/octet-stream',...SEC,'Cache-Control':html?'no-cache':'public, max-age=604800'});fs.createReadStream(file).pipe(res)});
  }catch(e){send(res,e.status||500,{error:e.status===413?'پیام خیلی طولانیه':'خطای سرور',code:e.message})}
});
server.listen(Number(E.PORT||3000),()=>console.log('BeautyWallet lite on :'+(E.PORT||3000)+' ai='+(KEY&&BASE?'configured':'missing')));
