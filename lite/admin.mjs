// Owner panel for the lite server: installs, usage, live-search health, feedback.
// Login with ADMIN_TOKEN once → HttpOnly cookie (the token never sits in the address bar).
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=n=>String(n??'').replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const tehranDay=iso=>{try{return new Date(iso).toLocaleDateString('en-CA',{timeZone:'Asia/Tehran'})}catch{return String(iso).slice(0,10)}};
const faDay=day=>{try{return new Date(day+'T12:00:00Z').toLocaleDateString('fa-IR',{month:'short',day:'numeric',weekday:'short'})}catch{return day}};
export function readJsonl(file){try{return fs.readFileSync(file,'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean)}catch{return []}}

export function makeAdmin({E,DATA,persistent,MODELS,FALLBACK,FALLBACK_SEARCH,KEY,BASE,ai,logUsage,send,readForm,sameOrigin}){
  // tolerate stray spaces/case in the variable name or value as typed in the Liara console
const adminKey=Object.keys(E).find(k=>k.replace(/[\s\u200c\u200f\u200e]/g,'').toUpperCase()==='ADMIN_TOKEN');
const secret=String(adminKey?E[adminKey]:'').trim();
  const sig=secret?crypto.createHmac('sha256',secret).update('bw-admin-v1').digest('hex'):'';
  const same=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y)};
  function cookie(req,name){const m=String(req.headers.cookie||'').split(/;\s*/).find(c=>c.startsWith(name+'='));return m?decodeURIComponent(m.slice(name.length+1)):''}
  function authed(req,url){if(!secret)return false;if(same(cookie(req,'bw_admin'),sig))return true;const t=url.searchParams.get('token');return !!t&&same(t,secret)}
  const origin=req=>(String(req.headers['x-forwarded-proto']||'').split(',')[0]||(req.socket.encrypted?'https':'http'))+'://'+req.headers.host;

  function stats(){
    const ev=readJsonl(path.join(DATA,'events.jsonl')),use=readJsonl(path.join(DATA,'usage.jsonl')).filter(u=>!u.test),fb=readJsonl(path.join(DATA,'feedback.jsonl'));
    const today=tehranDay(new Date().toISOString());
    const uniq=f=>new Set(ev.filter(f).map(e=>e.d)).size;
    const devices=new Set(ev.map(e=>e.d));
    const osOf={};for(const e of ev)if(e.d&&e.os)osOf[e.d]=e.os;
    const os={ios:0,android:0,desktop:0};for(const d of devices)os[osOf[d]||'desktop']=(os[osOf[d]||'desktop']||0)+1;
    const installedSet=new Set(ev.filter(e=>e.t==='install'||e.t==='app_open_installed').map(e=>e.d));
    const search=use.filter(u=>u.search),plain=use.filter(u=>!u.search);
    const ok=l=>l.filter(u=>u.status===200);
    const avgMs=l=>{const x=ok(l).filter(u=>u.ms);return x.length?Math.round(x.reduce((a,u)=>a+u.ms,0)/x.length/100)/10:0};
    const lastErr=l=>{const x=l.filter(u=>u.status!==200).at(-1);return x?{at:x.at,code:x.code||String(x.status)}:null};
    const days=[];for(let i=13;i>=0;i--){const d=tehranDay(new Date(Date.now()-i*864e5).toISOString());const de=ev.filter(e=>tehranDay(e.at)===d),du=use.filter(u=>tehranDay(u.at)===d);
      days.push({d,devices:new Set(de.map(e=>e.d)).size,installs:new Set(de.filter(e=>e.t==='install'||e.t==='app_open_installed').map(e=>e.d)).size,checks:de.filter(e=>e.t==='check').length,search:du.filter(u=>u.search).length,ai:du.filter(u=>!u.search).length,fb:fb.filter(f=>tehranDay(f.at)===d).length})}
    const rated=fb.filter(f=>f.rating);
    return {devices:devices.size,today:new Set(ev.filter(e=>tehranDay(e.at)===today).map(e=>e.d)).size,
      siteVisitors:uniq(e=>e.t==='site_open'),appUsers:uniq(e=>e.page==='app'),installed:installedSet.size,
      installAndroid:uniq(e=>e.t==='install'),homeScreenOpens:uniq(e=>e.t==='app_open_installed'),installClicks:uniq(e=>e.t==='install_click'),
      checks:ev.filter(e=>e.t==='check').length,checkers:uniq(e=>e.t==='check'),os,
      search:{n:search.length,ok:ok(search).length,ms:avgMs(search),sources:ok(search).reduce((a,u)=>a+(u.sources||0),0),last:lastErr(search),fallback:search.filter(u=>u.fallback).length},
      plain:{n:plain.length,ok:ok(plain).length,ms:avgMs(plain),last:lastErr(plain),fallback:plain.filter(u=>u.fallback).length},
      fb:{n:fb.length,avg:rated.length?rated.reduce((a,f)=>a+f.rating,0)/rated.length:0,rows:fb},days,lastAt:[...ev,...use].map(x=>x.at).sort().at(-1)||''};
  }

  const CSS=`@font-face{font-family:Vazirmatn;src:url(/legacy/vazirmatn-400.woff2) format("woff2");font-weight:400}@font-face{font-family:Vazirmatn;src:url(/legacy/vazirmatn-700.woff2) format("woff2");font-weight:700 900}
:root{--ink:#1d2550;--muted:#6b7096;--sky:#eaf5ff;--blue:#3d8bd9;--violet:#7c5cf0;--violet2:#efe9ff;--line:rgba(124,92,240,.16);--ok:#1f8a6c;--warn:#b7791f;--bad:#c0396b}
*{box-sizing:border-box}body{margin:0;font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl;color:var(--ink);background:radial-gradient(900px 500px at 100% -10%,#dcd0ff 0,transparent 60%),radial-gradient(800px 500px at -10% 0,#cfe8ff 0,transparent 55%),#f6f8ff;min-height:100vh}
.wrap{max-width:1080px;margin:0 auto;padding:20px 16px 60px}header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px}
h1{font-size:22px;margin:0}h1 small{display:block;font-size:13px;color:var(--muted);font-weight:400}h2{font-size:16px;margin:26px 0 10px}
.logo{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,var(--blue),var(--violet));display:grid;place-items:center;color:#fff;font-weight:900;box-shadow:0 10px 24px -12px var(--violet)}
.brand{display:flex;gap:12px;align-items:center}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
.card{background:rgba(255,255,255,.9);border:1px solid var(--line);border-radius:20px;padding:14px 16px;box-shadow:0 14px 30px -24px rgba(29,37,80,.45)}
.kpi b{display:block;font-size:30px;font-weight:900;background:linear-gradient(120deg,var(--blue),var(--violet));-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1.3}.kpi span{font-size:13px;color:var(--muted)}.kpi small{display:block;font-size:12px;color:var(--muted);margin-top:4px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:720px){.row{grid-template-columns:1fr}}
.st{display:flex;align-items:center;gap:8px;margin:6px 0;font-size:14px}.dot{width:10px;height:10px;border-radius:50%;flex:none}.ok{background:var(--ok)}.warn{background:var(--warn)}.bad{background:var(--bad)}
code{direction:ltr;unicode-bidi:embed;background:var(--sky);padding:2px 6px;border-radius:6px;font-size:12px}
.btn{appearance:none;border:0;cursor:pointer;font:700 14px Vazirmatn,Tahoma,sans-serif;border-radius:14px;padding:10px 16px;background:linear-gradient(120deg,var(--blue),var(--violet));color:#fff;text-decoration:none;display:inline-block}
.ghost{background:#fff;color:var(--ink);border:1px solid var(--line)}
.links .l{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:10px 0;border-bottom:1px dashed var(--line)}.links .l:last-child{border:0}.links a{direction:ltr;color:var(--violet);font-weight:700;word-break:break-all}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:8px 6px;border-bottom:1px solid var(--line);text-align:right;vertical-align:top}th{color:var(--muted);font-weight:700}
.scroll{overflow-x:auto}.bar{height:8px;border-radius:6px;background:linear-gradient(90deg,var(--blue),var(--violet));min-width:2px}
#testOut{white-space:pre-wrap;font-size:13px;margin-top:10px;line-height:1.9}.hearts{color:var(--violet);letter-spacing:1px}
.login{max-width:380px;margin:12vh auto;text-align:center}.login input{width:100%;font:16px Vazirmatn,Tahoma;padding:12px;border-radius:14px;border:1px solid var(--line);margin:14px 0;direction:ltr;text-align:center}
.note{font-size:12px;color:var(--muted);line-height:1.9}`;
  const page=(title,body)=>`<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title><style>${CSS}</style><body><div class="wrap">${body}</div></body></html>`;

  function loginPage(err){return page('ورود مدیریت',`<div class="login card"><div class="logo" style="margin:0 auto">BW</div><h1 style="margin-top:12px">پنل مدیریت بیوتی‌ولت</h1><form method="post" action="/admin/login"><input name="token" type="password" autocomplete="current-password" placeholder="ADMIN_TOKEN" required autofocus>${err?'<p style="color:var(--bad)">رمز درست نیست</p>':''}<button class="btn" style="width:100%">ورود</button></form><p class="note">همان مقدار <code>ADMIN_TOKEN</code> که در متغیرهای لیارا گذاشتی.</p></div>`)}

  function dashboard(req){
    const s=stats(),o=origin(req),max=Math.max(1,...s.days.map(d=>d.devices));
    const pct=(a,b)=>b?fa(Math.round(a/b*100))+'٪':'—';
    const aiReady=!!(KEY&&BASE);
    const searchState=!aiReady?['bad','کلید یا آدرس هوش مصنوعی تنظیم نشده']:s.search.n===0?['warn','هنوز هیچ سرچ زنده‌ای انجام نشده؛ دکمه «تست زنده» را بزن']:s.search.ok/s.search.n>=.8?['ok','سرچ زنده سالم است']:['bad','بیشتر سرچ‌ها خطا داده‌اند'];
    const k=(n,label,sub='')=>`<div class="card kpi"><b>${fa(n)}</b><span>${label}</span>${sub?`<small>${sub}</small>`:''}</div>`;
    return page('پنل مدیریت بیوتی‌ولت',`
<header><div class="brand"><div class="logo">BW</div><h1>پنل مدیریت بیوتی‌ولت<small>نسخه آزمایشی · آخرین فعالیت: ${s.lastAt?esc(new Date(s.lastAt).toLocaleString('fa-IR',{timeZone:'Asia/Tehran'})):'—'}</small></h1></div><div><a class="btn ghost" href="/admin">تازه‌سازی</a> <a class="btn ghost" href="/admin/logout">خروج</a></div></header>
<div class="card links"><div class="l"><span>🧪 لینک تست برای کاربران</span><a href="${esc(o)}/legacy/" target="_blank">${esc(o)}/legacy/</a></div><div class="l"><span>🌐 وب‌سایت</span><a href="${esc(o)}/" target="_blank">${esc(o)}/</a></div><div class="l"><span>🛠 پنل مدیریت (همین صفحه)</span><a href="${esc(o)}/admin">${esc(o)}/admin</a></div></div>
${persistent?'':`<div class="card" style="margin-top:12px;border-color:rgba(183,121,31,.5);background:#fff8ec"><div class="st"><span class="dot warn"></span><b>داده‌ها دائمی نیستند.</b></div><p class="note">با هر انتشار تازه، آمار و بازخوردها پاک می‌شوند. در لیارا یک دیسک با نام <code>data</code> بساز تا به <code>/data</code> وصل شود. (الان: <code>${esc(DATA)}</code>)</p></div>`}
<h2>نصب و استفاده</h2><div class="grid">
${k(s.installed,'نصب روی گوشی','از آیکن صفحه اصلی باز شده یا نصب اندروید')}
${k(s.devices,'دستگاه یکتا',`امروز: ${fa(s.today)}`)}
${k(s.appUsers,'کاربر اپ',`بازدید سایت: ${fa(s.siteVisitors)}`)}
${k(s.checks,'بررسی محصول',`توسط ${fa(s.checkers)} نفر`)}
${k(s.search.n,'سرچ زنده قیمت',`موفق: ${pct(s.search.ok,s.search.n)}`)}
${k(s.fb.n,'بازخورد',s.fb.avg?`میانگین ${fa(s.fb.avg.toFixed(1))} از ۵`:'')}
</div>
<p class="note">جزئیات نصب: نصب مستقیم اندروید ${fa(s.installAndroid)} · باز شدن از آیکن صفحه اصلی ${fa(s.homeScreenOpens)} · زدن دکمه نصب ${fa(s.installClicks)} · آیفون ${fa(s.os.ios||0)} / اندروید ${fa(s.os.android||0)} / کامپیوتر ${fa(s.os.desktop||0)} دستگاه.<br>آیفون رویداد «نصب» نمی‌فرستد؛ نصب آیفون وقتی شمرده می‌شود که کاربر اپ را یک بار از آیکن صفحه اصلی باز کند. هیچ اطلاعات شخصی، پوستی یا محصولی ثبت نمی‌شود؛ فقط یک شناسه تصادفی دستگاه.</p>
<h2>سلامت بک‌اند</h2><div class="row">
<div class="card"><div class="st"><span class="dot ${aiReady?'ok':'bad'}"></span>اتصال هوش مصنوعی: ${aiReady?'تنظیم شده':'تنظیم نشده'}</div>
<div class="st"><span class="dot ${searchState[0]}"></span>${searchState[1]}</div>
<p class="note">مدل تحلیل: <code>${esc(MODELS.default)}</code> (پشتیبان <code>${esc(FALLBACK)}</code>)<br>مدل سرچ زنده: <code>${esc(MODELS.search)}</code> (پشتیبان <code>${esc(FALLBACK_SEARCH)}</code>)<br>
سرچ زنده: ${fa(s.search.n)} بار، میانگین ${fa(s.search.ms)} ثانیه، ${fa(s.search.sources)} لینک منبع${s.search.fallback?`، ${fa(s.search.fallback)} بار با مدل پشتیبان`:''}${s.search.last?`<br>آخرین خطا: <code>${esc(s.search.last.code)}</code> — ${esc(new Date(s.search.last.at).toLocaleString('fa-IR',{timeZone:'Asia/Tehran'}))}`:''}<br>
تحلیل: ${fa(s.plain.n)} بار، موفق ${pct(s.plain.ok,s.plain.n)}، میانگین ${fa(s.plain.ms)} ثانیه${s.plain.fallback?`، ${fa(s.plain.fallback)} بار با مدل پشتیبان`:''}${s.plain.last?`<br>آخرین خطا: <code>${esc(s.plain.last.code)}</code>`:''}</p></div>
<div class="card"><b>تست زنده سرچ قیمت</b><p class="note">یک جست‌وجوی واقعی (قیمت میسلار بایودرما) می‌زند تا مطمئن شوی کلید، مدل و سرچ کار می‌کنند. کمی اعتبار مصرف می‌کند و در آمار کاربران حساب نمی‌شود.</p><button class="btn" id="testBtn">🔎 تست زنده</button><div id="testOut"></div></div></div>
<h2>۱۴ روز اخیر</h2><div class="card scroll"><table><tr><th>روز</th><th>دستگاه</th><th></th><th>نصب</th><th>بررسی</th><th>سرچ زنده</th><th>تحلیل</th><th>بازخورد</th></tr>
${s.days.slice().reverse().map(d=>`<tr><td>${esc(faDay(d.d))}</td><td>${fa(d.devices)}</td><td style="width:30%"><div class="bar" style="width:${Math.round(d.devices/max*100)}%"></div></td><td>${fa(d.installs)}</td><td>${fa(d.checks)}</td><td>${fa(d.search)}</td><td>${fa(d.ai)}</td><td>${fa(d.fb)}</td></tr>`).join('')}</table></div>
<h2>بازخوردها <a class="btn ghost" style="font-size:12px;padding:6px 12px;margin-inline-start:8px" href="/admin/feedback.csv">دانلود CSV</a></h2>
<div class="card scroll"><table><tr><th>زمان</th><th>امتیاز</th><th>برچسب‌ها</th><th>متن</th><th>پوست</th></tr>
${s.fb.rows.length?s.fb.rows.slice().reverse().map(r=>`<tr><td>${esc(new Date(r.at).toLocaleString('fa-IR',{timeZone:'Asia/Tehran',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}))}</td><td class="hearts">${r.rating?'💜'.repeat(r.rating):esc(r.raw?.rating||r.kind||'')}</td><td>${esc((r.tags||[]).join('، '))}</td><td>${esc(r.text)}</td><td>${esc(r.skin)}</td></tr>`).join(''):'<tr><td colspan="5" class="note">هنوز بازخوردی نیامده</td></tr>'}</table></div>
<script>document.getElementById('testBtn').onclick=async function(){var b=this,o=document.getElementById('testOut');b.disabled=true;b.textContent='در حال جست‌وجو…';o.textContent='';try{var r=await fetch('/admin/test-search',{method:'POST'});var d=await r.json();o.innerHTML='';var h=document.createElement('div');h.textContent=(d.ok?'✅ سالم':'❌ خطا')+' · '+(d.model||'')+' · '+(d.seconds??'?')+' ثانیه · '+((d.sources||[]).length)+' منبع';h.style.fontWeight='700';o.append(h);var t=document.createElement('div');t.textContent=d.text||d.error||'';o.append(t);(d.sources||[]).forEach(function(s){var a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener';a.textContent='↗ '+s.title;a.style.display='block';o.append(a)})}catch(e){o.textContent='❌ '+e.message}b.disabled=false;b.textContent='🔎 تست زنده'}</script>`);
  }

  function csv(){const rows=readJsonl(path.join(DATA,'feedback.jsonl'));const cols=['at','kind','rating','tags','text','skin','routineSize'];
    return '﻿'+cols.join(',')+'\n'+rows.map(r=>cols.map(c=>{let v=String(Array.isArray(r[c])?r[c].join('|'):r[c]??'');if(/^[=+\-@]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'}).join(',')).join('\n')}

  return async function handle(req,res,url){
    const p=url.pathname;
    if(p==='/admin/login'&&req.method==='POST'){
      const f=await readForm(req);if(!secret||!same(String(f.token||''),secret))return send(res,401,loginPage(true),'text/html; charset=utf-8');
      const secure=String(req.headers['x-forwarded-proto']||'').startsWith('https')?'; Secure':'';
      res.writeHead(303,{Location:'/admin','Set-Cookie':`bw_admin=${sig}; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=2592000${secure}`});return res.end();
    }
    if(p==='/admin/logout'){res.writeHead(303,{Location:'/admin','Set-Cookie':'bw_admin=; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=0'});return res.end()}
    if(!secret)return send(res,503,page('پنل مدیریت','<div class="login card"><h1>پنل مدیریت خاموش است</h1><p class="note">در لیارا متغیر <code>ADMIN_TOKEN</code> را بگذار.</p></div>'),'text/html; charset=utf-8');
    if(!authed(req,url))return send(res,p==='/admin'||p==='/admin/'?200:401,loginPage(false),'text/html; charset=utf-8',{'Cache-Control':'no-store'});
    if(p==='/admin/test-search'&&req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'forbidden'});
      const t0=Date.now();const r=await ai({search:true,input:'قیمت امروز «میسلار واتر بایودرما سبیوم ۲۵۰ میل» در دیجی‌کالا، ترب یا خانومی چنده؟ تخفیف یا خرید قسطی داره؟ کوتاه جواب بده و منبع بیار.'});
      logUsage({at:new Date().toISOString(),test:true,status:r.status,model:r.body.model||'',search:true,ms:Date.now()-t0,sources:(r.body.sources||[]).length,code:r.body.code||''});
      return send(res,200,{ok:r.status===200,model:r.body.model,seconds:Math.round((Date.now()-t0)/100)/10,text:String(r.body.text||'').slice(0,1200),sources:r.body.sources||[],error:r.body.error},'application/json',{'Cache-Control':'no-store'});
    }
    if(p==='/admin/feedback.csv'||(p==='/admin/feedback'&&url.searchParams.get('format')==='csv'))return send(res,200,csv(),'text/csv; charset=utf-8',{'Content-Disposition':'attachment; filename="beautywallet-feedback.csv"','Cache-Control':'no-store'});
    if(p==='/admin'||p==='/admin/'||p==='/admin/feedback')return send(res,200,dashboard(req),'text/html; charset=utf-8',{'Cache-Control':'no-store'});
    return send(res,404,'پیدا نشد','text/plain; charset=utf-8');
  };
}
