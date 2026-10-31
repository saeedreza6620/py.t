// Admin insights: funnel, shoppers drifting away, answer quality, money & cost at a glance.
// Pure reads of files the server already keeps (events, usage, feedback, users, purchase requests).
// No AI, no extra storage.
const DAY=864e5;
export function insightsHtml({ev,use,fb,users,reqs,reqStatus,costs,cfg,vault,fa,esc,k,tehranDay,lastSeen}){
  const now=Date.now(),since30=now-30*DAY,tm=n=>fa(Math.round(n).toLocaleString('en-US'))+' تومان';
  const pct=(a,b)=>b?fa(Math.round(a/b*100))+'٪':'—';
  // ---------- 1) funnel (devices first seen in the last 30 days) ----------
  const first=new Map(),days=new Map(),did=new Map();
  for(const e of ev){if(!e.d)continue;const t=Date.parse(e.at);if(!first.has(e.d)||t<first.get(e.d))first.set(e.d,t);
    const s=did.get(e.d)||new Set();s.add(e.t);did.set(e.d,s);const dd=days.get(e.d)||[];dd.push(t);days.set(e.d,dd)}
  const cohort=[...first].filter(([,t])=>t>=since30).map(([d])=>d);
  const regDev=new Set(Object.values(users).flatMap(u=>u.devices||[]));
  const returned=d=>{const f=first.get(d);return (days.get(d)||[]).some(t=>t-f>=7*DAY)};
  const old=d=>now-first.get(d)>=7*DAY;
  const P=[[ 'آمد (سایت یا اپ)',d=>true],['ثبت‌نام کرد',d=>regDev.has(d)],['اولین بررسی محصول',d=>did.get(d).has('check')],['اولین عکس پوست',d=>did.get(d).has('journal_photo')],['برگشت بعد از ۷ روز',d=>old(d)&&returned(d)]];
  const eligible=cohort.filter(old).length;
  const steps=P.map(([l,f],i)=>{const n=cohort.filter(f).length;const base=i?cohort.filter(d=>P[i-1][1](d)&&(i<4||old(d))):null;return [l,n,base?pct(base.filter(f).length,base.length):'—',pct(n,i===4?eligible:cohort.length)]});
  const funnel=`<h2>قیف کاربر — ۳۰ روز اخیر</h2><div class="card"><table><tr><th>مرحله</th><th>دستگاه</th><th>از کسانی که مرحله‌ی قبل را رفتند</th><th>از کل</th></tr>${steps.map(([l,n,prev,all])=>`<tr><td>${l}</td><td>${fa(n)}</td><td>${prev}</td><td>${all}</td></tr>`).join('')}</table>
  <p class="note">بزرگ‌ترین افت را ببین: همان‌جا جای کار است. «برگشت» فقط بین دستگاه‌هایی حساب می‌شود که دست‌کم ۷ روز از اولین بارشان گذشته (${fa(eligible)} دستگاه). هر گوشی/مرورگر یک دستگاه است؛ آیفونی که اپ را نصب کرده، از این به بعد با شماره‌ی ثبت‌نام به همان کاربر وصل می‌شود.</p></div>`;

  // ---------- 2) shoppers drifting away ----------
  const seen=u=>[u.last,...(u.devices||[]).map(d=>lastSeen.get(d))].filter(Boolean).sort().at(-1)||u.first;
  const photos=u=>ev.filter(e=>e.t==='journal_photo'&&(u.devices||[]).includes(e.d)).map(e=>Date.parse(e.at)).sort((a,b)=>a-b);
  const risk=[];for(const u of Object.values(users)){const off=Math.floor((now-Date.parse(seen(u)))/DAY);const ph=photos(u);
    let why='',msg='';
    if(ph.length){const since=Math.floor((now-ph.at(-1))/DAY),d0=Math.floor((now-ph[0])/DAY);const next=[14,28,56,84].find(c=>c>Math.floor((ph.at(-1)-ph[0])/DAY)+6);
      if(next&&d0>next+2){why=`عکس ${next%7?'روز '+fa(next):'هفته‌ی '+fa(next/7)} عقب افتاده (${fa(since)} روز از آخرین عکس)`;msg=`سلام ${u.name||''} عزیز 🌸 وقت عکس ${next%7?'روز '+next:'هفته‌ی '+next/7} پوستته؛ با همون نور و فاصله‌ی عکس شروع یه عکس بگیر تا روندت رو کنار هم ببینی. اگه سؤالی درباره‌ی روتینت داری همین‌جا بپرس.`}}
    if(!why&&off>=7&&off<=45){why=`${fa(off)} روز است اپ را باز نکرده`;msg=`سلام ${u.name||''} عزیز 🌸 چند وقتیه سر نزدی؛ روتینت چطور پیش می‌ره؟ اگه محصول تازه‌ای می‌خوای بخری، قبلش تو بیوتی‌ولت بررسیش کن تا مطمئن باشی به پوستت می‌خوره.`}
    if(why)risk.push({u,off,why,msg})}
  risk.sort((a,b)=>a.off-b.off);
  const drift=`<h2>کاربرانی که دارند دور می‌شوند</h2><div class="card scroll">${risk.length?`<table><tr><th>نام</th><th>موبایل</th><th>چرا</th><th>پیام پیشنهادی</th></tr>${risk.slice(0,40).map(r=>`<tr><td>${esc(r.u.name||'—')}</td><td dir="ltr"><a href="tel:${esc(r.u.phone)}">${esc(r.u.phone)}</a></td><td>${r.why}</td><td><button class="btn ghost" style="font-size:12px;padding:5px 10px" data-copy="${esc(r.msg)}">کپی پیام</button></td></tr>`).join('')}</table>`:'<p class="note">فعلاً کسی در خطر ریزش نیست 🌿</p>'}
  <p class="note">بین ۷ تا ۴۵ روز بی‌فعالیت، یا کسی که نوبت عکسش گذشته. پیام را کپی کن و از راه پشتیبانی (بله/تلگرام/پیامک) بفرست؛ لحن پیشنهادی، دعوت است نه فروش.</p></div>
  <script>document.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(!b)return;navigator.clipboard.writeText(b.dataset.copy).then(()=>{b.textContent='کپی شد ✓'})})</script>`;

  // ---------- 4) answer quality ----------
  const noInci={};for(const e of ev)if(e.t==='check_noinci'&&e.x&&Date.parse(e.at)>=since30)noInci[e.x]=(noInci[e.x]||0)+1;
  const topNo=Object.entries(noInci).sort((a,b)=>b[1]-a[1]).slice(0,15);
  const neg=fb.filter(f=>(f.rating&&f.rating<=2)||(f.tags||[]).some(t=>/اشتباه|غلط|نامربوط|بد|wrong/i.test(t))).slice(-12).reverse();
  const quality=`<h2>کیفیت جواب‌ها</h2><div class="row"><div class="card"><b>محصولاتی که بررسی شدند ولی ترکیبات کاملشان ثبت نیست (۳۰ روز)</b>${topNo.length?`<table><tr><th>شناسه</th><th>چند بار</th></tr>${topNo.map(([id,n])=>`<tr><td dir="ltr">${esc(id)}</td><td>${fa(n)}</td></tr>`).join('')}</table>`:'<p class="note">هنوز داده‌ای نیامده (از این نسخه ثبت می‌شود).</p>'}<p class="note">اولویت تکمیل فایل ترکیبات: از بالای همین جدول شروع کن.</p></div>
  <div class="card"><b>بازخوردهای منفی اخیر</b>${neg.length?`<table><tr><th>زمان</th><th>امتیاز</th><th>متن</th></tr>${neg.map(f=>`<tr><td>${esc(String(f.at).slice(0,10))}</td><td>${f.rating?fa(f.rating):'—'}</td><td>${esc(String(f.text||f.note||(f.tags||[]).join('، ')).slice(0,160))}</td></tr>`).join('')}</table>`:'<p class="note">بازخورد منفی‌ای ثبت نشده.</p>'}</div></div>`;

  // ---------- 5) money & cost at a glance ----------
  const paid=reqs.filter(r=>r.method==='card'&&['negin','sub'].includes(r.kind)&&['paid','done'].includes((reqStatus[r.ref]||{}).status));
  const c=costs(),per=a=>{const v=(c.perAction||{})[a];return v&&v.toman!==null?v.toman:null};
  const rows=[];for(let i=13;i>=0;i--){const d=tehranDay(new Date(now-i*DAY).toISOString());
    const rev=paid.filter(r=>tehranDay((reqStatus[r.ref]||{}).at||r.at)===d).reduce((a,r)=>a+(Number(r.price)||0),0);
    const du=use.filter(u=>tehranDay(u.at)===d&&(u.status===200||u.research));let cost=0,known=true;
    for(const u of du){const v=per(u.research?'research':(u.act||(u.search?'live':'chat')));if(v===null)known=false;else cost+=v}
    rows.push({d,rev,calls:du.length,cost,known})}
  const t=rows.at(-1),avg7=rows.slice(-8,-1).reduce((a,r)=>a+r.cost,0)/7,cap=Number(cfg.aiDailyCalls)||0;
  const alerts=[];if(cap&&t.calls>=cap*0.8)alerts.push(`امروز ${fa(t.calls)} درخواست هوش مصنوعی — نزدیک سقف روزانه (${fa(cap)})`);
  if(avg7>0&&t.cost>Math.max(avg7*2,20000))alerts.push(`هزینه‌ی امروز بیش از دو برابر میانگین ۷ روز است (${tm(t.cost)} در برابر ${tm(avg7)})`);
  if(vault&&vault.capMb&&vault.mb>=vault.capMb*0.8)alerts.push(`فضای امن عکس‌ها ${fa(vault.mb)} از ${fa(vault.capMb)} مگابایت`);
  const sum=(a,f)=>a.reduce((x,r)=>x+f(r),0),r30=paid.filter(r=>Date.parse(r.at)>=since30);
  const money=`<h2>درآمد و هزینه در یک نگاه</h2>${alerts.map(a=>`<div class="card" style="background:#fff1f1;border:1px solid #f3c2c2;margin-bottom:8px">⚠️ ${a}</div>`).join('')}
  <div class="grid">${k(Math.round(sum(r30,r=>Number(r.price)||0)/1000),'هزار تومان فروش ۳۰ روز',`${fa(r30.length)} پرداخت تأییدشده`)}${k(Math.round(sum(rows,r=>r.cost)/1000),'هزار تومان هزینه‌ی هوش مصنوعی ۱۴ روز',rows.every(r=>r.known)?'تخمین از مصرف واقعی':'بخشی بدون قیمت؛ تنظیم «تومان به ازای ۱۰۰۰ توکن» را ببین')}${k(vault?vault.mb:0,'مگابایت فضای عکس‌ها',vault?`از ${fa(vault.capMb)}`:'')}</div>
  <div class="card scroll"><table><tr><th>روز</th><th>فروش</th><th>درخواست هوش مصنوعی</th><th>هزینه‌ی تخمینی</th><th>سود ناخالص</th></tr>${rows.slice().reverse().map(r=>`<tr><td>${esc(r.d)}</td><td>${r.rev?tm(r.rev):'—'}</td><td>${fa(r.calls)}</td><td>${r.calls?tm(r.cost)+(r.known?'':' +؟'):'—'}</td><td>${r.rev||r.cost?tm(r.rev-r.cost):'—'}</td></tr>`).join('')}</table>
  <p class="note">فروش = سفارش‌های کارت‌به‌کارت تأییدشده. هزینه = تعداد درخواست × میانگین هزینه‌ی همان نوع کار در ۳۰ روز. هزینه‌ی ثابت لیارا (پلن و دیسک) جداست.</p></div>`;
  return funnel+drift+quality+money;
}
