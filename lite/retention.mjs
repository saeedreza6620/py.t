// Retention diagnostics for the admin panel: where shoppers stop coming back, which first-day action
// predicts that they DO come back (the hook), what brings them back, and the value loop ring by ring.
// Reads events.jsonl + users only (device-level; one phone/browser = one device). No AI, no storage.
const DAY=864e5;
export function retentionHtml({ev,users,fa,esc,k}){
  const now=Date.now(),pct=(a,b)=>b?Math.round(a/b*100):null,P=v=>v===null?'—':fa(v)+'٪';
  const app=ev.filter(e=>e.d&&e.page!=='site'&&e.t!=='site_open');
  const by=new Map();for(const e of app){const t=Date.parse(e.at);if(!isFinite(t))continue;let x=by.get(e.d);if(!x){x={d:e.d,first:t,ev:[]};by.set(e.d,x)}if(t<x.first)x.first=t;x.ev.push({t,type:e.t})}
  const regDev=new Set(Object.values(users).flatMap(u=>u.devices||[]));
  const devs=[...by.values()].filter(x=>now-x.first<=90*DAY);
  for(const x of devs){x.ev.sort((a,b)=>a.t-b.t);x.day=e=>Math.floor((e.t-x.first)/DAY);x.days=new Set(x.ev.map(x.day));x.age=Math.floor((now-x.first)/DAY);
    x.on=(a,b)=>[...x.days].some(d=>d>=a&&d<=b);x.did=(type,maxDay=999)=>x.ev.some(e=>(Array.isArray(type)?type.includes(e.type):e.type===type)&&x.day(e)<=maxDay)}
  if(devs.length<5)return `<h2>سلامت بازگشت کاربر</h2><div class="card"><p class="note">هنوز داده‌ی کافی نیست (${fa(devs.length)} دستگاه در ۹۰ روز). از حدود ۳۰ دستگاه به بعد این بخش معنادار می‌شود.</p></div>`;
  const ret=(a,b)=>{const el=devs.filter(x=>x.age>=b);return {v:pct(el.filter(x=>x.on(a,b)).length,el.length),n:el.length}};
  const d1=ret(1,1),d7=ret(7,13),d30=ret(28,41);
  // stickiness: active days per active device in the last 30 days
  const last30=devs.filter(x=>x.ev.some(e=>now-e.t<30*DAY)),dau=new Map();for(const x of last30)for(const e of x.ev)if(now-e.t<30*DAY){const d=Math.floor(e.t/DAY);(dau.get(d)||dau.set(d,new Set()).get(d)).add(x.d)}
  const avgDau=dau.size?[...dau.values()].reduce((a,s)=>a+s.size,0)/30:0,stick=last30.length?Math.round(avgDau/last30.length*100):0;
  // time to first value (first check), minutes
  const ttv=devs.map(x=>{const c=x.ev.find(e=>e.type==='check');return c?(c.t-x.first)/6e4:null}).filter(v=>v!==null).sort((a,b)=>a-b);
  const med=ttv.length?ttv[Math.floor(ttv.length/2)]:null;
  const BENCH={d1:30,d7:15,d30:8,stick:10};
  const tiles=`<div class="grid">${k(d1.v===null?'—':d1.v+'٪','برگشت روز بعد (D1)',`${fa(d1.n)} دستگاه · هدف: ${fa(BENCH.d1)}٪`)}${k(d7.v===null?'—':d7.v+'٪','برگشت هفته‌ی دوم (D7)',`${fa(d7.n)} دستگاه · هدف: ${fa(BENCH.d7)}٪`)}${k(d30.v===null?'—':d30.v+'٪','برگشت ماه دوم (D30)',`${fa(d30.n)} دستگاه · هدف: ${fa(BENCH.d30)}٪`)}${k(stick+'٪','چسبندگی (کاربر روزانه ÷ ماهانه)',`هدف: ${fa(BENCH.stick)}٪ به بالا`)}${k(med===null?'—':med<1?'<۱':Math.round(med),'دقیقه تا اولین بررسی','از اولین باز کردن اپ (میانه)')}</div>`;

  // ---------- value loop, ring by ring ----------
  const old=devs.filter(x=>x.age>=14);
  const RINGS=[
    ['۱. کشف','اپ را باز کرد',x=>true,'ورود از اینستاگرام/هدیه/لینک. اگر بعد از این حلقه زیاد می‌ریزند: صفحه‌ی اول باید در ۱۰ ثانیه یک «سؤال خرید» بگیرد، نه توضیح.'],
    ['۲. اولین حکم','اولین محصول را بررسی کرد',x=>x.did('check'),'لحظه‌ی «آها». اگر ضعیف است: یک محصول پرفروش آماده برای تست یک‌کلیکی، و پیشنهاد «همین الان محصولی که توی سبدت داری را بزن».'],
    ['۳. سرمایه‌گذاری','روتینش را تیک زد یا عکس شروع گرفت',x=>x.did(['routine_tick','journal_photo']),'تبدیل «خرید» به «مراقبت روزانه». بدون این حلقه، اپ فقط ماهی یک بار لازم می‌شود. همین‌جا (نه قبل از اولین حکم) ثبت‌نام را پیشنهاد بده تا روتین و عکس‌هایش بماند.'],
    ['۴. برگشت اول','روز دیگری دوباره آمد',x=>x.days.size>=2,'یادآور ساعت روتین + نتیجه‌ی کوچک روزانه (رشته‌ی روزها) + سؤال «پوستت امروز چطوره؟».'],
    ['۵. عادت','حداقل ۴ روز مختلف فعال بود',x=>x.days.size>=4,'عادت وقتی شکل می‌گیرد که هر بار چیز تازه‌ای ببیند: پیشرفت هفته، نوبت عکس، فصل تازه.'],
    ['۶. دیدن نتیجه','عکس دوم را با فاصله گرفت',x=>{const p=x.ev.filter(e=>e.type==='journal_photo');return p.length>=2&&p.at(-1).t-p[0].t>=10*DAY},'قوی‌ترین قلاب ارزش: «قبل و بعد» خودش. نوبت عکس هفته‌ی ۲ و ۴ را جدی یادآوری کن.'],
    ['۷. خرید بعدی','برای خرید یا تمدید دوباره آمد',x=>{const c=x.ev.filter(e=>e.type==='check'||/^refill/.test(e.type));return c.length&&c.some(e=>x.day(e)>=7)},'زمان تمام شدن محصول قابل پیش‌بینی است؛ یک هفته قبلش «داره تموم می‌شه؛ همین را دوباره بخری یا بهترش را؟».'],
    ['۸. معرفی','هدیه یا لینک برای کسی فرستاد',x=>x.did(['gift_create','share_out']),'وقتی نتیجه دید، از او بخواه برای دوستش «بررسی هدیه» بفرستد؛ مشتری بعدی از دل همین حلقه می‌آید.']];
  // rings 1–5 are a chain (each needs the ones before); 6–8 are measured among those who formed the habit
  const CHAIN=5,inChain=x=>RINGS.slice(0,CHAIN).every(r=>r[2](x));
  const counts=RINGS.map((r,i)=>i<CHAIN?old.filter(x=>RINGS.slice(0,i+1).every(q=>q[2](x))).length:old.filter(x=>inChain(x)&&r[2](x)).length);
  let worst=-1,worstDrop=0;for(let i=1;i<RINGS.length;i++){const a=counts[Math.min(i-1,CHAIN-1)],b=counts[i];if(a>=3){const drop=1-b/a;if(drop>worstDrop){worstDrop=drop;worst=i}}}
  const ring=(i)=>{const n=counts[i],base=counts[0],w=Math.max(8,Math.round((base?n/base:0)*100));const prev=i?counts[Math.min(i-1,CHAIN-1)]:null;
    return `<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><b>${RINGS[i][0]} <span style="font-weight:400">— ${RINGS[i][1]}</span></b><span>${fa(n)} · ${P(pct(n,base))}${prev?` <small>(از قبلی ${P(pct(n,prev))})</small>`:''}</span></div><div style="height:10px;border-radius:8px;background:#eef0fb;overflow:hidden"><div style="height:100%;width:${w}%;background:${i===worst?'linear-gradient(90deg,#ff8aa8,#ff5f7e)':'linear-gradient(90deg,#7aa7ff,#c08cff)'}"></div></div></div>`};
  const loop=`<div class="card"><b>حلقه‌ی ارزش بیوتی‌ولت — از صفر تا صد</b><p class="note">دستگاه‌هایی که دست‌کم ۱۴ روز از اولین بارشان گذشته (${fa(old.length)}). حلقه‌های ۱ تا ۵ پشت هم‌اند؛ ۶ تا ۸ بین کسانی سنجیده می‌شود که به «عادت» رسیده‌اند. ثبت‌نام: ${fa(old.filter(x=>regDev.has(x.d)).length)} دستگاه. نوار قرمز = بزرگ‌ترین ریزش.</p>${RINGS.map((r,i)=>ring(i)).join('')}
   ${worst>0?`<div style="margin-top:10px;padding:10px 12px;border-radius:12px;background:#fff1f4"><b>نقطه‌ضعف اصلی الان: بین «${RINGS[Math.min(worst-1,CHAIN-1)][0]}» و «${RINGS[worst][0]}» — ${fa(Math.round(worstDrop*100))}٪ ریزش</b><br><small>راه تبدیلش به قوت: ${RINGS[worst][3]}</small></div>`:''}</div>`;

  // ---------- hook finder: which day-0 action predicts coming back in week 2 ----------
  const el=devs.filter(x=>x.age>=14),base7=pct(el.filter(x=>x.on(7,13)).length,el.length);
  const ACT=[['بررسی محصول','check'],['ثبت‌نام',null],['نصب اپ روی گوشی',['install','app_open_installed']],['عکس شروع','journal_photo'],['تیک روتین','routine_tick'],['کلیک خرید','aff_click'],['ورود از اشتراک‌گذاری','share_in'],['باز کردن هدیه',['gift_open','gift_view']],['خرج الماس','negin_spend']];
  const hooks=ACT.map(([l,t])=>{const yes=el.filter(x=>t===null?regDev.has(x.d):x.did(t,0)),no=el.filter(x=>!yes.includes(x));
    const ry=pct(yes.filter(x=>x.on(7,13)).length,yes.length),rn=pct(no.filter(x=>x.on(7,13)).length,no.length);return {l,n:yes.length,ry,rn,lift:ry!==null&&rn?ry/rn:null}}).filter(h=>h.n>0).sort((a,b)=>(b.lift||0)-(a.lift||0));
  const hookT=`<div class="card"><b>قلاب‌یاب: کدام کارِ روز اول، برگشت هفته‌ی دوم را بیشتر می‌کند؟</b><p class="note">میانگین برگشت هفته‌ی دوم: ${P(base7)} (${fa(el.length)} دستگاه). ضریب بالای ۱٫۵ یعنی آن کار احتمالاً «قلاب» است؛ کاربرهای تازه را به سمت همان کار هل بده.</p>
   ${hooks.length?`<table><tr><th>کار در روز اول</th><th>چند دستگاه</th><th>برگشت اگر انجام داد</th><th>اگر نداد</th><th>ضریب</th></tr>${hooks.map(h=>`<tr${h.lift>=1.5&&h.n>=5?' style="background:#eefaf2"':''}><td>${h.l}</td><td>${fa(h.n)}</td><td>${P(h.ry)}</td><td>${P(h.rn)}</td><td>${h.lift===null?'—':fa(h.lift.toFixed(1))+'×'}</td></tr>`).join('')}</table>`:'<p class="note">هنوز داده نیست.</p>'}
   <p class="note">این همبستگی است، نه علت قطعی؛ با کمتر از ۵ دستگاه در یک ردیف، به عدد تکیه نکن.</p></div>`;

  // ---------- what brings them back ----------
  const why={};const L={check:'بررسی یک خرید تازه',journal_photo:'نوبت عکس پوست',routine_tick:'تیک زدن روتین',refill_due:'تمام شدن محصول',refill_worked:'تمام شدن محصول',refill_buy:'تمام شدن محصول',gift_open:'هدیه',gift_view:'هدیه',share_in:'اشتراک لینک از فروشگاه/اینستاگرام',negin_buy_click:'خرید الماس',aff_click:'رفتن به خرید'};
  for(const x of devs)for(const d of x.days){if(d===0)continue;const dayEv=x.ev.filter(e=>x.day(e)===d);const m=dayEv.find(e=>L[e.type]);const key=m?L[m.type]:'فقط سر زد (بدون کار مشخص)';why[key]=(why[key]||0)+1}
  const total=Object.values(why).reduce((a,b)=>a+b,0);
  const whyT=`<div class="card"><b>کاربرها برای چه برمی‌گردند؟</b>${total?`<table><tr><th>اولین کارِ روزِ برگشت</th><th>چند بار</th><th>سهم</th></tr>${Object.entries(why).sort((a,b)=>b[1]-a[1]).map(([w,n])=>`<tr><td>${w}</td><td>${fa(n)}</td><td>${P(pct(n,total))}</td></tr>`).join('')}</table><p class="note">اگر «فقط سر زد» بالاست: اپ دعوتش کرده ولی کاری برایش آماده نبوده. صفحه‌ی اول باید بگوید «امروز برای تو چه داریم».</p>`:'<p class="note">هنوز برگشتی ثبت نشده.</p>'}</div>`;

  // ---------- weekly cohorts ----------
  const wk=t=>Math.floor((t-now)/(7*DAY));const groups={};for(const x of devs){const w=-wk(x.first);if(w>8)continue;(groups[w]||(groups[w]=[])).push(x)}
  const coh=`<div class="card scroll"><b>گروه‌های هفتگی: چند درصد هر گروه در هفته‌های بعد برگشتند</b><table><tr><th>شروع</th><th>تعداد</th>${[1,2,3,4].map(n=>`<th>هفته‌ی ${fa(n)}</th>`).join('')}</tr>${Object.keys(groups).map(Number).sort((a,b)=>a-b).map(w=>{const g=groups[w];return `<tr><td>${w?fa(w)+' هفته پیش':'این هفته'}</td><td>${fa(g.length)}</td>${[1,2,3,4].map(n=>{const e=g.filter(x=>x.age>=n*7+6);const v=pct(e.filter(x=>x.on(n*7,n*7+6)).length,e.length);return `<td style="background:${v===null?'#fff':`rgba(122,167,255,${Math.min(.85,(v||0)/40+.05)})`}">${P(v)}</td>`}).join('')}</tr>`}).join('')}</table></div>`;

  return `<h2>سلامت بازگشت کاربر</h2>${tiles}${loop}<div class="row">${hookT}${whyT}</div>${coh}`;
}
