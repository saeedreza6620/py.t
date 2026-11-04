// Message studio — messages that come from BeautyWallet itself (a card inside the app, and a notification on
// her phone when she allowed notifications). No SMS, no phone calls.
// The team writes a message to one person or to a group (by where they stopped), or switches on one of four
// automatic moments. {نام}, {محصول_روتین}, {محصول_آخر} are filled from that person's own data; "{x|y}" uses y
// when x is unknown. Anti-annoyance rules are enforced here, not left to good intentions:
//   at most one automatic message a week per person · automatic ones only 9:00–21:00 Tehran · a notification
//   asked for at night waits for 9:00 · two unopened messages pause the automatic ones · «دیگه نفرست» is final.
// Every automatic moment keeps ~10% of eligible people without the message (control), so the panel can say
// whether the message brought people back or they would have come anyway.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {journeys,STAGES} from './journeys.mjs';

const DAY=864e5,HOUR=36e5;
const CTA={'':'بدون دکمه',check:'بسنج 🔍',routine:'روتینم 🧴',wallet:'ولت الماس 💎',chat:'حرف بزنیم 💬',gift:'گیفت‌یار 🎁'};
const ACT={check:['check'],routine:['routine_tick','followup_answer','check'],wallet:['negin_buy_click','sub_click','buy_request','pay_done'],chat:['gem_msg'],gift:['gift_panel','gift_open'],'':['check','routine_tick','gem_msg']};
export const FLOWS={
  noverdict:{title:'ثبت‌نام کرد ولی هنوز حکمی نگرفته (۲۴ ساعت بعد)',cta:'check',text:'{نام|عزیزم} جان، اسم یا لینک محصولی که می‌خوای بخری رو بفرست؛ با پوست و روتینت می‌سنجمش 💜'},
  noroutine:{title:'حکم گرفت ولی هنوز چیزی در روتینش نیست (۲۴ ساعت بعد)',cta:'routine',text:'{نام|عزیزم} جان، {محصول_آخر|اون محصولی که بررسی کردی} رو آخرش خریدی؟ اگه آره بذارش توی روتینت تا حالش رو ازت بپرسم 🌸'},
  paywall:{title:'بررسی‌های رایگانش تمام شد و نخرید (روز بعد)',cta:'wallet',text:'{نام|عزیزم} جان، بررسی‌های رایگانت تموم شد. اگه هنوز محصولی برای سنجیدن داری، کوچک‌ترین بسته‌ی الماس کافیه 💎'},
  idle7:{title:'یک هفته نیامده و محصولی در روتینش دارد',cta:'routine',text:'{نام|عزیزم} جان، {محصول_روتین} رو هنوز می‌زنی؟ یه تیک کوچولو بزن تا ببینیم پوستت باهاش چطوره 💜'}};
const tehranHour=t=>Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tehran',hour:'2-digit',hourCycle:'h23'}).format(new Date(t)));
const next9=t=>{let x=t;for(let i=0;i<30&&!(tehranHour(x)>=9&&tehranHour(x)<22);i++)x+=HOUR;return x};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);

export function makeStudio({DATA,send,readBody,readForm,sameOrigin,BANK,PUSH,smsOn,getUsers,readJsonl,getReqStatus,cloudOf,productName}){
  const CFG=path.join(DATA,'studio.json'),MSG=path.join(DATA,'studio-msgs.json');
  const rd=(f,d)=>{try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch{return d}};
  const wr=(f,v)=>{try{fs.writeFileSync(f+'.tmp',JSON.stringify(v));fs.renameSync(f+'.tmp',f)}catch(e){console.error('studio',e.message)}};
  let cfg=rd(CFG,{});cfg.flows=cfg.flows||{};cfg.optout=cfg.optout||{};for(const k of Object.keys(FLOWS))cfg.flows[k]={on:false,text:FLOWS[k].text,cta:FLOWS[k].cta,...cfg.flows[k]};
  let msgs=rd(MSG,[]);const saveCfg=()=>wr(CFG,cfg),saveMsgs=()=>{if(msgs.length>6000)msgs=msgs.slice(-6000);wr(MSG,msgs)};
  const data=()=>journeys({ev:readJsonl(path.join(DATA,'events.jsonl')),users:getUsers(),reqs:readJsonl(path.join(DATA,'purchase-requests.jsonl')),reqStatus:getReqStatus()});
  const parse=v=>{try{return JSON.parse(v)}catch{return undefined}};
  function vars(r){const c=cloudOf(r.ph)||{},ids=parse(c.bw_check_products||'[]')||[],last=parse(c.bw_last_check||'null');
    return {'نام':r.name&&r.name!=='—'?r.name:'','محصول_روتین':ids.map(productName).find(Boolean)||'','محصول_آخر':typeof last==='string'?productName(last)||'':'',_routine:ids.length}}
  // "{نام}" → value; "{x|fallback}" → fallback when unknown; null when a field without a fallback is unknown
  function fill(text,v){let miss=false;const out=String(text).replace(/\{([^{}|]+)(?:\|([^{}]*))?\}/g,(m,k,f)=>{const val=v[k.trim()];if(val)return val;if(f!==undefined)return f;miss=true;return ''});return miss?null:out.replace(/\s+/g,' ').trim()}
  function personOf(d){const t=BANK.trust(d);if(!t.phone)return null;if(smsOn()&&!t.verified)return null;return t.phone}
  const devicesOf=ph=>(getUsers()[ph]||{}).devices||[];
  function create(r,text,cta,source,hold){const m={id:crypto.randomBytes(6).toString('hex'),ph:r.ph,source,cta:cta||'',text,at:Date.now(),hold:!!hold};
    if(!hold)m.pushDue=next9(m.at);msgs.push(m);return m}
  async function pushDue(){const now=Date.now();let changed=false;
    for(const m of msgs){if(m.hold||!m.pushDue||m.pushDue>now||m.pushed!=null||m.seenAt)continue;m.pushed=0;changed=true;
      const devs=devicesOf(m.ph);if(devs.length&&PUSH){m.pushAt=Date.now();try{const r=await PUSH.toDevices(devs,'studio');m.pushed=r.ok}catch{}}}
    if(changed)saveMsgs()}
  // automatic moments
  function eligible(k,r,now){const ev=r.evs||[],last=t=>{const e=[...ev].reverse().find(x=>(Array.isArray(t)?t.includes(x.type):x.type===t));return e?e.t:0};
    const first=Date.parse(r.first)||now;const v=vars(r);
    if(k==='noverdict')return now-first>24*HOUR&&r.checks===0&&r.chat===0;
    if(k==='noroutine')return r.checks>0&&!v._routine&&now-last('check')>24*HOUR&&now-last('check')<14*DAY;
    if(k==='paywall')return !r.paid&&last('paywall_view')&&now-last('paywall_view')>18*HOUR&&now-last('paywall_view')<4*DAY;
    if(k==='idle7')return r.idle!=null&&r.idle>=7&&r.idle<45&&v._routine>0;return false}
  function runFlows(now=Date.now()){const h=tehranHour(now);if(h<9||h>=21)return 0;let n=0;const rows=data().rows;
    for(const r of rows){if(cfg.optout[r.ph])continue;const mine=msgs.filter(m=>m.ph===r.ph);
      if(mine.some(m=>m.source.startsWith('flow:')&&now-m.at<7*DAY))continue;                       // one automatic message a week
      if(mine.filter(m=>!m.hold&&!m.seenAt&&now-m.at>3*DAY).length>=2)continue;                     // two unopened: pause
      for(const [k,f] of Object.entries(cfg.flows)){if(!f.on)continue;if(mine.some(m=>m.source==='flow:'+k&&now-m.at<30*DAY))continue;if(!eligible(k,r,now))continue;
        const text=fill(f.text,vars(r));if(!text)continue;const hold=crypto.randomInt(10)===0;create(r,text,f.cta,'flow:'+k,hold);n++;break}}
    if(n)saveMsgs();return n}
  setInterval(()=>{try{runFlows()}catch(e){console.error('studio flows',e.message)}pushDue().catch(()=>{})},60e3).unref();

  // results: seen / tapped / did it within 48h / came back within 7 days — and the same for the control group
  function results(){const rows=data().rows,byPh=new Map(rows.map(r=>[r.ph,r]));const g={};
    for(const m of msgs){const key=m.source.startsWith('flow:')?m.source:'manual:'+(m.batch||m.id);const o=g[key]||(g[key]={key,label:m.source.startsWith('flow:')?FLOWS[m.source.slice(5)]?.title||m.source:(m.label||'پیام دستی'),text:m.text,at:m.at,sent:0,pushed:0,seen:0,click:0,act:0,back:0,hold:0,hAct:0,hBack:0});
      const r=byPh.get(m.ph),ev=r?r.evs:[],after=ev.filter(e=>e.t>m.at);const act=after.some(e=>(ACT[m.cta]||ACT['']).includes(e.type)&&e.t-m.at<48*HOUR),back=after.some(e=>e.t-m.at<7*DAY);
      if(m.at>o.at)o.at=m.at;if(m.hold){o.hold++;o.hAct+=act?1:0;o.hBack+=back?1:0;continue}
      o.sent++;o.pushed+=m.pushed>0?1:0;o.seen+=m.seenAt?1:0;o.click+=m.clickAt?1:0;o.act+=act?1:0;o.back+=back?1:0}
    return Object.values(g).sort((a,b)=>b.at-a.at)}
  function box(){const R=results().slice(0,3),on=Object.values(cfg.flows).filter(f=>f.on).length;
    return `<a href="/admin/studio" style="display:block;margin:0 0 14px;padding:14px 16px;border-radius:16px;text-decoration:none;font-weight:800;background:linear-gradient(135deg,#6a5bd6,#c86dd7);color:#fff">📣 استودیوی پیام · ${fa(on)} مسیر خودکار روشن${R.length?' · آخرین: '+fa(R[0].seen)+' دید از '+fa(R[0].sent):''}</a>`}

  // ---- the app's side ----
  async function handle(req,res,url){const H={'Cache-Control':'no-store'};
    if(url.pathname==='/api/inbox'&&req.method==='GET'){const ph=personOf(String(url.searchParams.get('d')||'').replace(/[^a-z0-9]/g,''));if(!ph)return send(res,200,{msgs:[]},'application/json',H);
      const list=msgs.filter(m=>m.ph===ph&&!m.hold&&!m.closedAt&&!m.clickAt&&!(m.seenAt&&Date.now()-m.seenAt>12*HOUR)&&Date.now()-m.at<14*DAY).slice(-3).reverse().map(m=>({id:m.id,text:m.text,cta:m.cta,label:CTA[m.cta]||''}));
      return send(res,200,{msgs:list,optout:!!cfg.optout[ph]},'application/json',H)}
    if(url.pathname==='/api/inbox/ev'&&req.method==='POST'){if(!sameOrigin(req))return send(res,403,{error:'forbidden'});const b=await readBody(req,600);
      const ph=personOf(String(b.d||'').replace(/[^a-z0-9]/g,''));if(!ph)return send(res,401,{error:'need_login'});
      if(b.a==='optout'){cfg.optout[ph]=new Date().toISOString();saveCfg()}
      const m=msgs.find(x=>x.id===b.id&&x.ph===ph);if(m){const t=Date.now();if(b.a==='seen'&&!m.seenAt)m.seenAt=t;if(b.a==='click'){m.clickAt=m.clickAt||t;m.seenAt=m.seenAt||t}if(b.a==='close'||b.a==='optout'){m.closedAt=m.closedAt||t;m.seenAt=m.seenAt||t}saveMsgs()}
      return send(res,200,{ok:true},'application/json',H)}
    if(url.pathname==='/api/inbox/peek'&&req.method==='POST'){ // the service worker, woken by an empty push: what should the notification say?
      const b=await readBody(req,2000);const d=PUSH?PUSH.devOf(b.endpoint):'';const ph=d&&personOf(d);if(!ph)return send(res,200,{},'application/json',H);
      const m=msgs.filter(x=>x.ph===ph&&!x.hold&&x.pushAt&&Date.now()-x.pushAt<30*60e3&&!(x.peeked||[]).includes(d)).at(-1);if(!m)return send(res,200,{},'application/json',H);
      m.peeked=[...(m.peeked||[]),d];saveMsgs();return send(res,200,{id:m.id,title:'بیوتی‌ولت 💎',body:m.text},'application/json',H)}
    return send(res,404,{error:'not found'})}

  // ---- the panel ----
  function targets(f){const rows=data().rows;if(f.to==='one')return rows.filter(r=>r.ph===f.ph);if(f.to==='all')return rows;return rows.filter(r=>r.stage===f.to)}
  function page(msg){const rows=data().rows,R=results(),push=PUSH?PUSH.devices():new Set();
    const opt=`<option value="all">همه‌ی ثبت‌نامی‌ها (${fa(rows.length)} نفر)</option>`+STAGES.map(([k,l])=>`<option value="${k}">${esc(l)} (${fa(rows.filter(r=>r.stage===k).length)} نفر)</option>`).join('')+`<option value="one">یک نفر مشخص…</option>`;
    const people=rows.map(r=>`<option value="${esc(r.ph)}">${esc(r.name)} · ${esc(r.phone)} · ${esc((STAGES.find(s=>s[0]===r.stage)||[])[1]||'')}${r.devices.some(d=>push.has(d))?' · 🔔':''}</option>`).join('');
    const ctaSel=v=>Object.entries(CTA).map(([k,l])=>`<option value="${k}"${k===v?' selected':''}>${esc(l)}</option>`).join('');
    const pct=(a,b)=>b?fa(Math.round(a/b*100))+'٪':'—';
    const flows=Object.entries(cfg.flows).map(([k,f])=>`<form method="post" action="/admin/studio/flow" class="p"><input type="hidden" name="k" value="${k}"><label class="sw"><input type="checkbox" name="on" value="1"${f.on?' checked':''}> <b>${esc(FLOWS[k].title)}</b></label>
<textarea name="text" rows="3">${esc(f.text)}</textarea><div class="row"><select name="cta">${ctaSel(f.cta)}</select><button>ذخیره</button></div></form>`).join('');
    const table=R.length?`<table><tr><th>پیام</th><th>فرستاده</th><th>اعلان رسید</th><th>دید</th><th>دکمه را زد</th><th>کار را کرد (۴۸ ساعت)</th><th>برگشت (۷ روز)</th><th>گروه کنترل: برگشت</th></tr>${R.map(o=>`<tr><td><b>${esc(o.label)}</b><br><small>${esc(o.text.slice(0,90))}</small></td><td>${fa(o.sent)}</td><td>${fa(o.pushed)}</td><td>${fa(o.seen)} <small>${pct(o.seen,o.sent)}</small></td><td>${fa(o.click)}</td><td>${fa(o.act)} <small>${pct(o.act,o.sent)}</small></td><td>${fa(o.back)} <small>${pct(o.back,o.sent)}</small></td><td>${o.hold?fa(o.hBack)+' از '+fa(o.hold)+' <small>'+pct(o.hBack,o.hold)+'</small>':'—'}</td></tr>`).join('')}</table>`:'<p class="m">هنوز پیامی نرفته.</p>';
    return `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>استودیوی پیام · بیوتی‌ولت</title>
<style>body{margin:0;font-family:Vazirmatn,Tahoma,sans-serif;background:#f7f5ff;color:#241a4f}header{position:sticky;top:0;z-index:2;background:#241a4f;color:#fff;padding:14px 16px;display:flex;gap:10px;align-items:center}header a{color:#cfc6ff;margin-inline-start:auto}
main{padding:14px;max-width:820px;margin:0 auto}h2{font-size:17px;margin:20px 0 8px}.p{background:#fff;border-radius:18px;padding:14px;margin-bottom:12px;box-shadow:0 10px 30px -20px rgba(60,40,140,.5)}
textarea,select,input[type=text]{width:100%;box-sizing:border-box;font:inherit;border:1px solid #ddd6fb;border-radius:12px;padding:10px;margin-top:8px;background:#fff}.row{display:flex;gap:8px;margin-top:8px;align-items:center}.row>*{flex:1}
button{font:inherit;font-weight:800;border:0;border-radius:12px;padding:10px 14px;background:#6a5bd6;color:#fff;cursor:pointer}button.g{background:#ece6ff;color:#241a4f}.m{color:#5d5788;font-size:13px;line-height:1.9}
table{width:100%;border-collapse:collapse;font-size:13px;background:#fff;border-radius:14px;overflow:hidden}th{background:#241a4f;color:#fff;padding:6px;text-align:right}td{border-bottom:1px solid #eee;padding:6px;vertical-align:top}.scroll{overflow-x:auto}
.ok{background:#e3f6ee;color:#17744f;padding:10px 14px;border-radius:12px;margin-bottom:12px}.sw{display:block}#prev{white-space:pre-wrap;background:#faf8ff;border-radius:12px;padding:10px;margin-top:8px;font-size:14px}</style>
<header><b>📣 استودیوی پیام</b><a href="/admin">پنل کامل</a></header><main>${msg?`<div class="ok">${esc(msg)}</div>`:''}
<p class="m">پیام‌ها از خود بیوتی‌ولت می‌روند: کارت بالای اپ دفعه‌ی بعد که بازش کند، و اگر اجازه‌ی اعلان داده (🔔) اعلان روی گوشی. پیامک نمی‌رود. فیلدها: <b>{نام}</b>، <b>{محصول_روتین}</b>، <b>{محصول_آخر}</b>؛ با <b>{محصول_آخر|اون محصول}</b> وقتی نامعلوم است «اون محصول» می‌آید. کسی که فیلدش نامعلوم است و جایگزین ندارد، پیام را نمی‌گیرد.</p>
<h2>✍️ پیام تازه</h2><form class="p" method="post" action="/admin/studio/send" id="cf"><div class="row"><select name="to" id="to">${opt}</select><select name="ph" id="ph" hidden>${people}</select></div>
<textarea name="text" id="tx" rows="3" maxlength="400" placeholder="{نام} جان، …" required></textarea><div class="row"><select name="cta">${ctaSel('check')}</select><input type="text" name="label" maxlength="40" placeholder="اسم این پیام برای گزارش (اختیاری)"></div>
<div id="prev" class="m">پیش‌نمایش اینجا می‌آید</div><div class="row"><button type="button" class="g" id="pv">پیش‌نمایش برای ۳ نفر</button><button>بفرست</button></div></form>
<h2>⚙️ لحظه‌های خودکار</h2><p class="m">هر مسیر برای هر نفر حداکثر یک بار در ۳۰ روز؛ همه‌ی مسیرها با هم حداکثر یک پیام در هفته برای هر نفر؛ فقط ۹ صبح تا ۹ شب؛ اگر دو پیام قبلی را باز نکرده، صبر می‌کند؛ ۱۰٪ آدم‌ها به‌عنوان گروه کنترل پیام نمی‌گیرند.</p>${flows}
<h2>📊 نتیجه‌ها</h2><div class="scroll">${table}</div><p class="m">«کار را کرد» یعنی همان کاری که دکمه می‌خواست (مثلاً بررسی) تا ۴۸ ساعت انجام شد. «گروه کنترل» کسانی‌اند که همان شرایط را داشتند ولی پیام نگرفتند؛ اگر درصد برگشت گروه پیام‌گرفته بیشتر از کنترل باشد، پیام اثر داشته. با تعداد کم، این مقایسه فقط جهت را نشان می‌دهد.</p>
<p class="m">${fa(Object.keys(cfg.optout).length)} نفر «دیگه نفرست» را زده‌اند و هیچ پیامی نمی‌گیرند.</p></main>
<script>var to=document.getElementById('to'),ph=document.getElementById('ph');to.onchange=function(){ph.hidden=to.value!=='one'};
document.getElementById('pv').onclick=async function(){var f=new FormData(document.getElementById('cf'));var r=await fetch('/admin/studio/preview',{method:'POST',body:new URLSearchParams(f)});var j=await r.json();
document.getElementById('prev').textContent=j.error||('به '+j.n+' نفر می‌رسد ('+j.push+' نفر اعلان هم می‌گیرند'+(j.skip?'، '+j.skip+' نفر به‌خاطر فیلد نامعلوم یا «دیگه نفرست» نمی‌گیرند':'')+'):\\n\\n'+j.sample.join('\\n\\n'))};</script></html>`}
  async function admin(req,res,url){const p=url.pathname;const html=(b)=>send(res,200,b,'text/html; charset=utf-8',{'Cache-Control':'no-store'});
    if(p==='/admin/studio'&&req.method==='GET')return html(page(url.searchParams.get('m')||''));
    if(req.method!=='POST'||!sameOrigin(req))return send(res,403,{error:'forbidden'});const f=await readForm(req);
    if(p==='/admin/studio/flow'){const k=String(f.k||'');if(!cfg.flows[k])return send(res,400,{error:'bad'});const t=String(f.text||'').trim().slice(0,400);
      cfg.flows[k]={on:f.on==='1',text:t||FLOWS[k].text,cta:CTA[f.cta]!==undefined?f.cta:FLOWS[k].cta};saveCfg();res.writeHead(303,{Location:'/admin/studio?m='+encodeURIComponent('ذخیره شد')});return res.end()}
    const text=String(f.text||'').trim().slice(0,400),cta=CTA[f.cta]!==undefined?f.cta:'';if(!text)return send(res,400,{error:'متن خالی است'});
    const push=PUSH?PUSH.devices():new Set();const list=targets(f).filter(r=>!cfg.optout[r.ph]).map(r=>({r,t:fill(text,vars(r))})).filter(x=>x.t);const skip=targets(f).length-list.length;
    if(p==='/admin/studio/preview')return send(res,200,{n:list.length,skip,push:list.filter(x=>x.r.devices.some(d=>push.has(d))).length,sample:list.slice(0,3).map(x=>x.r.name+': '+x.t)});
    if(p==='/admin/studio/send'){if(!list.length){res.writeHead(303,{Location:'/admin/studio?m='+encodeURIComponent('به کسی نرسید (فیلد نامعلوم یا گروه خالی)')});return res.end()}
      const batch=crypto.randomBytes(4).toString('hex'),label=String(f.label||'').trim().slice(0,40);for(const x of list){const m=create(x.r,x.t,cta,'manual');m.batch=batch;m.label=label||'پیام دستی · '+new Date().toLocaleDateString('fa-IR',{timeZone:'Asia/Tehran',month:'short',day:'numeric'})}
      saveMsgs();pushDue().catch(()=>{});res.writeHead(303,{Location:'/admin/studio?m='+encodeURIComponent('برای '+list.length+' نفر فرستاده شد')});return res.end()}
    return send(res,404,{error:'not found'})}
  return {handle,admin,box,runFlows,pushDue,results}}
