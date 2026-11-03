// Stage-1 KPI card (the first thing in /admin): one question — is there a moment she will pay for?
// Absolute numbers, not percentages (with tens of users a single person moves a percentage by 5%).
// Every number is counted from files the server already keeps; each row says who owns it and how to move it.
const DAY=864e5;
// the 8-week sprint: Saturday 16 Aban 1405 → Friday 10 Dey 1405
export const KPI_START=Date.parse('2026-11-06T20:30:00Z'); // Sat 7 Nov 2026 00:00 Tehran
export const KPI_WEEKS=8;
export const KPI_TARGETS={pay:10,signup:200,activated:120,paywall:40,buyclick:20,returning:30,costPct:30};

const tehranWeekStart=t=>{ // Saturday 00:00 Tehran of the week containing t
  const off=3.5*3600e3,local=new Date(t+off),dow=(local.getUTCDay()+1)%7; // Sat=0
  return Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-dow*DAY-off};
const tday=t=>new Date(t+3.5*3600e3).toISOString().slice(0,10);

export function kpiData({ev,users,reqs,reqStatus,costs,cfg,fb,now=Date.now()}){
  const wk=tehranWeekStart(now),prev=wk-7*DAY,start=KPI_START;
  const inW=(t,a,b)=>t>=a&&t<b;
  const devPhone=new Map();for(const u of Object.values(users))for(const d of u.devices||[])devPhone.set(d,u.phone);
  const who=d=>devPhone.get(d)||d; // one person across her devices once she signed in
  // --- paying (card orders confirmed, admin approve or automatic SMS) ---
  const paid=reqs.filter(r=>r.method==='card'&&(reqStatus[r.ref]||{}).status==='done').map(r=>({p:who(r.d),t:Date.parse((reqStatus[r.ref]||{}).at||r.at)}));
  const firstPay=new Map();for(const x of paid)if(!firstPay.has(x.p)||x.t<firstPay.get(x.p))firstPay.set(x.p,x.t);
  const payIn=(a,b)=>[...firstPay.values()].filter(t=>inW(t,a,b)).length;
  // --- sign-ups (by source) ---
  const U=Object.values(users).map(u=>({t:Date.parse(u.first),src:u.src||''}));
  const signIn=(a,b)=>U.filter(u=>inW(u.t,a,b));
  // --- events: first time a device did something ---
  const first=(types)=>{const m=new Map();for(const e of ev){if(!types.includes(e.t)||!e.d)continue;const t=Date.parse(e.at),p=who(e.d);if(!m.has(p)||t<m.get(p))m.set(p,t)}return m};
  const cnt=(m,a,b)=>[...m.values()].filter(t=>inW(t,a,b)).length;
  const act=first(['check']),wall=first(['paywall_view']),click=first(['negin_buy_click','sub_click']);
  // --- returning: active this week on a day other than her very first day ---
  const firstSeen=new Map(),daysIn=(a,b)=>{const m=new Map();for(const e of ev){if(!e.d)continue;const t=Date.parse(e.at);if(!inW(t,a,b))continue;const p=who(e.d);(m.get(p)||m.set(p,new Set()).get(p)).add(tday(t))}return m};
  for(const e of ev){if(!e.d)continue;const t=Date.parse(e.at),p=who(e.d);if(!firstSeen.has(p)||t<firstSeen.get(p))firstSeen.set(p,t)}
  const ret=(a,b)=>{let n=0;for(const [p,ds] of daysIn(a,b)){const f=tday(firstSeen.get(p));if([...ds].some(d=>d!==f))n++}return n};
  const fu=first(['followup_answer']);
  // --- cost of one check vs the price of one diamond ---
  let c=null;try{c=costs()}catch{}const each=c&&c.perNeginToman?c.perNeginToman.research:null;
  const pk=(cfg.packs||[])[0]||{},dPrice=pk.n?pk.price/pk.n:null;const costPct=each!=null&&dPrice?Math.round(each/dPrice*100):null;
  const bad=(fb||[]).filter(f=>inW(Date.parse(f.at),wk,now+1)&&((f.rating&&f.rating<=2)||(f.tags||[]).some(t=>/اشتباه|غلط|نامربوط|بد|wrong/i.test(t)))).length;
  const srcOf=(a,b)=>{const m={};for(const u of signIn(a,b)){const k=u.src||'نامشخص';m[k]=(m[k]||0)+1}return Object.entries(m).sort((x,y)=>y[1]-x[1])};
  const week=Math.max(1,Math.min(KPI_WEEKS,Math.floor((now-start)/(7*DAY))+1)),started=now>=start;
  return {week,started,wk,prev,
    rows:[
      {k:'pay',star:true,name:'پرداخت‌کننده (نفر)',owner:'هر دو',now:payIn(wk,now+1),last:payIn(prev,wk),total:payIn(start,now+1),all:firstPay.size,target:KPI_TARGETS.pay,how:'هر کس به دیوار پرداخت رسید و نخرید، تا ۲۴ ساعت یک پیام شخصی بگیرد؛ کوچک‌ترین بسته‌ی الماس را پیشنهاد بده'},
      {k:'signup',name:'ثبت‌نام تازه',owner:'برند و جذب',now:signIn(wk,now+1).length,last:signIn(prev,wk).length,total:signIn(start,now+1).length,all:U.length,target:KPI_TARGETS.signup,how:'هر کانال لینک خودش را دارد (ig برای اینستاگرام، اسم انگلیسی هر فروشگاه برای آن فروشگاه)؛ هفته‌ای ۳ پست با یک قلاب: «لینکشو بده، با پوستت می‌سنجم»'},
      {k:'activated',name:'حکم شخصی گرفت (فعال‌شده)',owner:'محصول',now:cnt(act,wk,now+1),last:cnt(act,prev,wk),total:cnt(act,start,now+1),all:act.size,target:KPI_TARGETS.activated,how:'هر ثبت‌نامی که تا ۲۴ ساعت حکم نگرفت، یک پیام: «اسم یا لینک محصولی که می‌خوای بخری رو بفرست»'},
      {k:'paywall',name:'به دیوار پرداخت رسید',owner:'محصول',now:cnt(wall,wk,now+1),last:cnt(wall,prev,wk),total:cnt(wall,start,now+1),all:wall.size,target:KPI_TARGETS.paywall,how:'یعنی بررسی‌های رایگانش تمام شد و ارزش را دید؛ اگر کم است، مشکل جذب و فعال‌سازی است نه قیمت'},
      {k:'buyclick',name:'روی خرید زد',owner:'محصول',now:cnt(click,wk,now+1),last:cnt(click,prev,wk),total:cnt(click,start,now+1),all:click.size,target:KPI_TARGETS.buyclick,how:'اگر زیاد می‌زنند و نمی‌پردازند: مسیر پرداخت؛ اگر نمی‌زنند: قیمت یا پیام ارزش. یک بسته‌ی کوچک‌تر را امتحان کن'},
      {k:'returning',name:'کاربر برگشتی این هفته',owner:'محصول',now:ret(wk,now+1),last:ret(prev,wk),total:null,all:null,target:KPI_TARGETS.returning,weekly:true,fu:cnt(fu,wk,now+1),how:'قلاب «نتیجه»: هر محصولی که به روتین اضافه شد، روز ۳ و هفته‌ی ۲ پیگیری می‌شود؛ یادآور را روشن کنند'},
      {k:'cost',name:'هزینه‌ی هوش مصنوعی هر بررسی',owner:'محصول',costPct,each,dPrice,target:KPI_TARGETS.costPct,how:'باید کمتر از ۳۰٪ قیمت یک الماس بماند؛ اگر بیشتر شد، قیمت الماس یا مدل را بازبینی کن'}],
    bad,src:srcOf(started?start:0,now+1)}}

export function kpiHtml(o){const {fa,esc}=o;const d=kpiData(o);
  const n=v=>v==null?'—':fa(v);
  const bar=(v,t)=>{const p=Math.max(0,Math.min(100,Math.round((v||0)/t*100)));return `<div style="background:#eef1f6;border-radius:8px;height:8px;overflow:hidden;min-width:70px"><i style="display:block;height:8px;width:${p}%;background:${p>=100?'#1f9d6f':p>=50?'#6a8cff':'#e0a33a'}"></i></div><small>${fa(p)}٪ هدف</small><br>`};
  const pace=t=>d.started?Math.round(t*d.week/8):0;
  const rows=d.rows.map(r=>{
    if(r.k==='cost')return `<tr><td>${esc(r.name)}</td><td>${esc(r.owner)}</td><td colspan="3">${r.each!=null?fa(Math.round(r.each).toLocaleString('en'))+' تومان':'—'} از ${r.dPrice?fa(Math.round(r.dPrice).toLocaleString('en'))+' تومان قیمت یک الماس':'—'}</td><td>${r.costPct==null?'—':`<b style="color:${r.costPct<=r.target?'#1f9d6f':'#c0392b'}">${fa(r.costPct)}٪</b>`} <small>(هدف: زیر ${fa(r.target)}٪)</small></td><td class="note">${esc(r.how)}</td></tr>`;
    if(r.weekly)return `<tr><td>${esc(r.name)}</td><td>${esc(r.owner)}</td><td><b>${n(r.now)}</b></td><td>${n(r.last)}</td><td><small>جواب به کارت پیگیری: ${fa(r.fu||0)}</small></td><td>${bar(r.now,r.target)}<small>هدف هفته‌ی ۸: ${fa(r.target)} در هفته</small></td><td class="note">${esc(r.how)}</td></tr>`;
    const behind=d.started&&r.total<pace(r.target);
    return `<tr${r.star?' style="background:#f6f1ff"':''}><td>${r.star?'⭐ ':''}<b>${esc(r.name)}</b></td><td>${esc(r.owner)}</td><td><b>${n(r.now)}</b></td><td>${n(r.last)}</td><td><b>${n(r.total)}</b> <small>از شروع · کل: ${n(r.all)}</small></td><td>${bar(r.total,r.target)}<small>هدف ۸ هفته: ${fa(r.target)}${d.started?` · الان باید ~${fa(pace(r.target))} باشد ${behind?'🔴':'🟢'}`:''}</small></td><td class="note">${esc(r.how)}</td></tr>`}).join('');
  const src=d.src.length?d.src.map(([k,v])=>`<span style="display:inline-block;background:#eef1f6;border-radius:10px;padding:2px 9px;margin:2px">${esc(k)}: ${fa(v)}</span>`).join(''):'<span class="note">هنوز ثبت‌نامی با منبع نیامده</span>';
  return `<h2>⭐ KPI مرحله‌ی ۱ — آیا لحظه‌ای هست که کاربر به‌خاطرش پول بدهد؟</h2>
<div class="card"><p class="note">${d.started?`هفته‌ی ${fa(d.week)} از ۸ (از شنبه ۱۶ آبان ۱۴۰۵).`:'شروع رسمی: شنبه ۱۶ آبان ۱۴۰۵؛ ستون «از شروع» از آن روز شمرده می‌شود.'} عدد مطلق، نه درصد. «این هفته» از شنبه ساعت ۰۰ تهران.</p>
<div class="scroll"><table><tr><th>شاخص</th><th>مسئول</th><th>این هفته</th><th>هفته‌ی قبل</th><th>جمع</th><th>پیشرفت تا هدف</th><th>چطور جلو ببریم</th></tr>${rows}</table></div>
<p><b>ثبت‌نام بر اساس منبع:</b> ${src}</p>
<p class="note">لینک هر کانال: <code dir="ltr">https://beautywallet.liara.run/?src=ig</code> · برای هر فروشگاه اسم انگلیسی خودش، مثلاً <code dir="ltr">?src=darya</code> · هدیه‌ها خودکار «gift» شمرده می‌شوند.</p>
<p class="note">🚦 خط قرمز: توصیه‌ی ناایمن = صفر. بازخورد منفی کاربران این هفته: <b>${fa(d.bad)}</b> — هر کدام را همان روز بخوان.</p></div>`}
