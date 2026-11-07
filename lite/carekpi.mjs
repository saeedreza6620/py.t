// «مراقبت روزانه» dashboard — is the daily-care hook working, and is anything breaking?
// One page in the admin (/admin/care). Everything is counted from files the server already keeps
// (users, events, card orders, AI usage, push log, feedback). People, not percentages first: with tens of
// users one person moves a percentage a lot, so every rate is shown as «n از N».
// The team's own phones can be left out (they are the most active users and would hide the truth).
import {journeys} from './journeys.mjs';

const DAY=864e5,HOUR=36e5;
const CARE=['routine_tick','followup_answer','journal_photo'];          // a "care day": she did one of these that day
const tday=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t));
const tHour=t=>Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tehran',hour:'2-digit',hourCycle:'h23'}).format(new Date(t)));
const sh=t=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',month:'short',day:'numeric'}).format(new Date(t));

export function careData({ev,users,reqs,reqStatus,use,fb,push,team=[],now=Date.now()}){
  const T=new Set(team);
  const all=journeys({ev,users,reqs,reqStatus,now}).rows.filter(r=>!T.has(r.ph));
  const N=all.length;
  const careDays=(r,a,b)=>new Set((r.evs||[]).filter(e=>CARE.includes(e.type)&&e.t>=a&&e.t<b).map(e=>tday(e.t)));
  const any=(r,types,a,b)=>(r.evs||[]).some(e=>(!types||types.includes(e.type))&&e.t>=a&&e.t<b);
  const first=r=>Date.parse(r.first)||now;
  // streak: consecutive Tehran days with care up to today (or yesterday, so the streak isn't "broken" before her evening routine)
  const streak=r=>{const d=careDays(r,now-60*DAY,now+1);let n=0,t=now;if(!d.has(tday(t)))t-=DAY;while(d.has(tday(t))){n++;t-=DAY}return n};

  // ⭐ north star: people who cared for their skin on 3+ different days in the last 7
  const wcu=(end)=>all.filter(r=>careDays(r,end-7*DAY,end).size>=3).length;
  const star={now:wcu(now+1),prev:wcu(now+1-7*DAY),weeks:[...Array(8)].map((_,i)=>({end:now+1-(7-i)*7*DAY,n:wcu(now+1-(7-i)*7*DAY)}))};

  // layers
  const newIn=(a,b)=>all.filter(r=>first(r)>=a&&first(r)<b);
  const signups={now:newIn(now-7*DAY,now+1).length,prev:newIn(now-14*DAY,now-7*DAY).length,src:{}};
  for(const r of newIn(now-30*DAY,now+1))signups.src[r.src||'نامشخص']=(signups.src[r.src||'نامشخص']||0)+1;
  // activation: of people who signed up 1–30 days ago, who checked a product within 24h / did a first care action within 3 days
  const coh=all.filter(r=>now-first(r)>=DAY&&now-first(r)<30*DAY);
  const act={base:coh.length,check24:coh.filter(r=>any(r,['check'],first(r)-HOUR,first(r)+DAY)).length,care3:coh.filter(r=>any(r,CARE,first(r)-HOUR,first(r)+3*DAY)).length,
    never:all.filter(r=>r.checks===0&&now-first(r)>=DAY).length};
  // habit
  const todayCare=all.filter(r=>careDays(r,now-DAY*1.5,now+1).has(tday(now))).length;
  const avg7=[...Array(7)].map((_,i)=>{const t=now-(i+1)*DAY;return all.filter(r=>careDays(r,t-DAY,t+DAY).has(tday(t))).length}).reduce((a,b)=>a+b,0)/7;
  const streaks=all.map(streak);const pushSet=new Set();for(const r of all)if(r.notif)pushSet.add(r.ph);
  const habit={today:todayCare,avg7,s3:streaks.filter(s=>s>=3).length,s7:streaks.filter(s=>s>=7).length,best:Math.max(0,...streaks),
    reminder:all.filter(r=>r.notif).length,photo:all.filter(r=>(r.evs||[]).some(e=>e.type==='journal_photo')).length,routine:all.filter(r=>r.routine+r.followup>0).length};
  // retention by signup week: came back (any activity) in week 1 / week 2 / week 4 after signing up
  const weeks=[...Array(6)].map((_,i)=>{const a=now-(i+1)*7*DAY,b=now-i*7*DAY,c=newIn(a,b);
    const back=(k)=>{const ok=c.filter(r=>now-first(r)>=(k+1)*7*DAY);return {base:ok.length,n:ok.filter(r=>any(r,null,first(r)+k*7*DAY+DAY*(k?0:1),first(r)+(k+1)*7*DAY)).length}};
    return {from:a,size:c.length,w1:back(0),w2:back(1),w4:back(3)}}).reverse();
  // money
  const st=reqStatus||{},card=(reqs||[]).filter(r=>r.method==='card');
  const money={wall:all.filter(r=>r.wall>0).length,buy:all.filter(r=>r.buy>0).length,paid:all.filter(r=>r.paid).length,
    pending:card.filter(r=>(st[r.ref]||{}).status==='proof'),oldPending:card.filter(r=>(st[r.ref]||{}).status==='proof'&&now-Date.parse((st[r.ref]||{}).at||r.at)>12*HOUR).length};
  // health
  const u24=(use||[]).filter(u=>now-Date.parse(u.at)<DAY),aiBad=u24.filter(u=>u.status&&u.status!==200).length;
  const ev6=(ev||[]).filter(e=>now-Date.parse(e.at)<6*HOUR).length,evDay=(ev||[]).filter(e=>now-Date.parse(e.at)<DAY).length;
  const fbBad=(fb||[]).filter(f=>now-Date.parse(f.at)<DAY&&((f.rating&&f.rating<=2)||(f.tags||[]).some(t=>/اشتباه|غلط|نامربوط|بد|wrong/i.test(t)))).length;
  const pushRate=push&&push.sent7?push.ok7/push.sent7:null;
  // alarms: each says what it means and the first thing to do
  const A=[];const h=tHour(now);
  if(h>=10&&h<23&&ev6===0&&evDay>0)A.push({lvl:'red',t:'۶ ساعت است هیچ رویدادی از اپ نیامده',d:'یا کسی اپ را باز نکرده یا ثبت رویداد/سایت خراب است. سایت را خودت باز کن و یک کار بکن؛ اگر در پنل نیامد، لاگ لیارا را ببین.'});
  if(avg7>=2&&todayCare<avg7*0.5&&h>=21)A.push({lvl:'red',t:'مراقبت امروز کمتر از نصف میانگین هفته است',d:'اعلان‌ها رسیدند؟ (ردیف اعلان را ببین) آپدیت امروز چیزی را در روتین/تیک خراب نکرده؟ روتین را خودت تیک بزن.'});
  if(pushRate!=null&&push.sent7>=5&&pushRate<0.7)A.push({lvl:'red',t:'بیش از ۳۰٪ اعلان‌های این هفته نرسیدند',d:'کلیدهای اعلان (VAPID) یا سرویس اعلان مشکل دارد؛ خطای آخر را در پنل اصلی ببین.'});
  if(u24.length>=5&&aiBad/u24.length>0.2)A.push({lvl:'red',t:'بیش از ۲۰٪ درخواست‌های هوش مصنوعی امروز خطا داده‌اند',d:'کلید یا اعتبار هوش مصنوعی یا اینترنت بین‌الملل؛ دستیار و بررسی محصول تازه آسیب می‌بینند.'});
  if(money.oldPending)A.push({lvl:'red',t:money.oldPending+' واریز بیش از ۱۲ ساعت منتظر تأیید است',d:'مشتری پول داده و منتظر الماس است؛ همین الان از «تأیید سریع واریزها» تأیید یا رد کن.'});
  if(fbBad)A.push({lvl:'amber',t:fbBad+' بازخورد منفی در ۲۴ ساعت',d:'همه را همان روز بخوان؛ خط قرمز: توصیه‌ی ناایمن = صفر.'});
  if(act.base>=5&&act.check24/act.base<0.4)A.push({lvl:'amber',t:'کمتر از ۴۰٪ تازه‌واردها در ۲۴ ساعت اول محصولی سنجیده‌اند',d:'مشکل فعال‌سازی است، نه جذب: صفحه‌ی اول و اولین سنجش را ساده‌تر کن؛ با چند نفرشان حرف بزن.'});
  if(star.prev>=2&&star.now<star.prev*0.6)A.push({lvl:'amber',t:'ستاره‌ی شمال نسبت به هفته‌ی قبل بیش از ۴۰٪ افت کرده',d:'چه چیزی این هفته عوض شد؟ (آپدیت، پیام، قطعی نت) کسانی که هفته‌ی قبل مراقبت داشتند و این هفته نه را پیدا کن و بپرس.'});
  if(N&&habit.reminder/N<0.3)A.push({lvl:'amber',t:'کمتر از ۳۰٪ کاربرها یادآور را روشن کرده‌اند',d:'بدون یادآور، قلاب مراقبت روزانه کار نمی‌کند؛ لینک /y یا کارت «اجازه بده» را برای بقیه بفرست.'});
  return {N,team:team.length,star,signups,act,habit,weeks,money,health:{ev6,evDay,ai24:u24.length,aiBad,push,pushRate,fbBad},alarms:A}}

export function carePage(o){const {fa,esc}=o;const d=careData(o);const f=v=>fa(Math.round(v));
  const of=(n,b)=>b?`<b>${f(n)}</b><small> از ${f(b)}</small>`:'<small>—</small>';
  const delta=(a,b)=>a===b?'<small>مثل هفته‌ی قبل</small>':a>b?`<small style="color:#1f9d6f">▲ ${f(a-b)} نسبت به هفته‌ی قبل</small>`:`<small style="color:#c0392b">▼ ${f(b-a)} نسبت به هفته‌ی قبل</small>`;
  const mx=Math.max(1,...d.star.weeks.map(w=>w.n));
  const bars=d.star.weeks.map((w,i)=>`<div class="bar"><i style="height:${Math.max(4,Math.round(w.n/mx*70))}px;${i===7?'background:#6a5bd6':''}"></i><b>${f(w.n)}</b><small>${esc(sh(w.end-DAY))}</small></div>`).join('');
  const tile=(t,v,s,c)=>`<div class="tile${c?' '+c:''}"><small>${t}</small><div class="v">${v}</div>${s?`<small>${s}</small>`:''}</div>`;
  const al=d.alarms.length?d.alarms.map(a=>`<div class="al ${a.lvl}"><b>${a.lvl==='red'?'🔴':'🟠'} ${esc(a.t)}</b><span>${esc(a.d)}</span></div>`).join(''):'<div class="al ok"><b>🟢 همه‌چیز عادی است</b><span>هیچ هشدار فعالی نیست.</span></div>';
  const ret=d.weeks.map(w=>`<tr><td>هفته‌ی ${esc(sh(w.from))}</td><td>${f(w.size)}</td><td>${of(w.w1.n,w.w1.base)}</td><td>${of(w.w2.n,w.w2.base)}</td><td>${of(w.w4.n,w.w4.base)}</td></tr>`).join('');
  const src=Object.entries(d.signups.src).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<span class="chip">${esc(k)}: ${f(v)}</span>`).join('')||'<small>—</small>';
  return `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>داشبورد مراقبت روزانه · بیوتی‌ولت</title>
<style>body{margin:0;font-family:Vazirmatn,Tahoma,sans-serif;background:#f7f5ff;color:#241a4f}header{position:sticky;top:0;z-index:2;background:#241a4f;color:#fff;padding:14px 16px;display:flex;gap:10px;align-items:center}header a{color:#cfc6ff;margin-inline-start:auto}
main{padding:14px;max-width:900px;margin:0 auto}h2{font-size:16px;margin:20px 0 8px}.p{background:#fff;border-radius:18px;padding:14px;margin-bottom:12px;box-shadow:0 10px 30px -20px rgba(60,40,140,.5)}
.star{background:linear-gradient(135deg,#6a5bd6,#c86dd7);color:#fff}.star .big{font-size:44px;font-weight:800;line-height:1.2}.star small{opacity:.9}
.bars{display:flex;gap:6px;align-items:flex-end;margin-top:12px}.bar{flex:1;text-align:center;font-size:11px}.bar i{display:block;background:rgba(255,255,255,.55);border-radius:6px 6px 0 0;margin:0 auto 4px;width:70%}.bar b{display:block;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.tile{background:#fff;border-radius:16px;padding:12px;box-shadow:0 8px 24px -20px rgba(60,40,140,.6)}.tile .v{font-size:22px;font-weight:800;margin:4px 0}.tile small{color:#5d5788;font-size:12px;line-height:1.7}
.al{border-radius:14px;padding:10px 12px;margin-bottom:8px;display:flex;flex-direction:column;gap:4px;font-size:14px;line-height:1.8}.al.red{background:#fdecec;border:1px solid #f3c2c2}.al.amber{background:#fff4e2;border:1px solid #f5d6a3}.al.ok{background:#e6f6ef;border:1px solid #bfe6d3}
table{width:100%;border-collapse:collapse;font-size:13px}th{background:#241a4f;color:#fff;padding:6px;text-align:right}td{border-bottom:1px solid #eee;padding:6px}.chip{display:inline-block;background:#eef1f6;border-radius:10px;padding:2px 9px;margin:2px}
.m{color:#5d5788;font-size:13px;line-height:1.9}input{font:inherit;border:1px solid #ddd6fb;border-radius:10px;padding:8px;width:100%;box-sizing:border-box}button{font:inherit;font-weight:800;border:0;border-radius:10px;padding:8px 14px;background:#6a5bd6;color:#fff}</style>
<header><b>🌸 داشبورد مراقبت روزانه</b><a href="/admin">پنل کامل</a></header><main>
<h2>🚨 هشدارها (قبل از اینکه فیل شود)</h2>${al}
<div class="p star"><small>⭐ ستاره‌ی شمال: کسانی که در ۷ روز اخیر دست‌کم ۳ روز مراقبت کرده‌اند (تیک روتین، جواب پیگیری یا عکس)</small><div class="big">${f(d.star.now)} <small style="font-size:16px">نفر از ${f(d.N)}</small></div>${delta(d.star.now,d.star.prev).replace(/color:#[0-9a-f]+/g,'color:#fff')}<div class="bars">${bars}</div></div>
<h2>۱. جذب</h2><div class="grid">${tile('ثبت‌نام ۷ روز اخیر',f(d.signups.now),delta(d.signups.now,d.signups.prev))}${tile('منبع ثبت‌نام‌ها (۳۰ روز)','',src)}</div>
<h2>۲. فعال‌سازی (اولین ارزش)</h2><div class="grid">${tile('در ۲۴ ساعت اول محصولی سنجید',of(d.act.check24,d.act.base),'تازه‌واردهای ۱ تا ۳۰ روز اخیر')}${tile('در ۳ روز اول مراقبت کرد',of(d.act.care3,d.act.base),'تیک روتین، پیگیری یا عکس')}${tile('هنوز هیچ محصولی نسنجیده',f(d.act.never),'از کسانی که بیش از یک روز از عضویتشان گذشته','warn')}</div>
<h2>۳. عادت مراقبت روزانه</h2><div class="grid">${tile('مراقبت امروز',f(d.habit.today),'میانگین ۷ روز: '+fa(d.habit.avg7.toFixed(1)))}${tile('در حال حاضر ۳ روز پشت‌سرهم',f(d.habit.s3),'۷ روز پشت‌سرهم: '+f(d.habit.s7)+' · بهترین: '+f(d.habit.best)+' روز')}${tile('یادآور روشن',of(d.habit.reminder,d.N),'بدون یادآور، قلاب کار نمی‌کند')}${tile('روتین یا پیگیری دارد',of(d.habit.routine,d.N))}${tile('دفترچه‌ی عکس دارد',of(d.habit.photo,d.N))}</div>
<h2>۴. برگشت، بر اساس هفته‌ی عضویت</h2><div class="p"><table><tr><th>عضو شده در</th><th>تعداد</th><th>هفته‌ی ۱ برگشت</th><th>هفته‌ی ۲</th><th>هفته‌ی ۴</th></tr>${ret}</table><p class="m">«برگشت» یعنی در آن هفته (بعد از روز عضویت) دوباره در اپ کاری کرده. خانه‌ی خالی یعنی هنوز آن هفته نرسیده.</p></div>
<h2>۵. پول</h2><div class="grid">${tile('به صفحه‌ی پرداخت رسید',of(d.money.wall,d.N))}${tile('روی خرید زد',of(d.money.buy,d.N))}${tile('پرداخت کرد',of(d.money.paid,d.N))}${tile('واریز منتظر تأیید',f(d.money.pending.length),d.money.oldPending?'⚠️ '+f(d.money.oldPending)+' تا بیش از ۱۲ ساعت':'', d.money.oldPending?'warn':'')}</div>
<h2>۶. سلامت سیستم</h2><div class="grid">${tile('رویداد در ۶ ساعت اخیر',f(d.health.ev6),'۲۴ ساعت: '+f(d.health.evDay))}${tile('هوش مصنوعی ۲۴ ساعت',f(d.health.ai24)+' درخواست','خطا: '+f(d.health.aiBad))}${tile('اعلان‌های ۷ روز',d.health.push&&d.health.push.sent7?of(d.health.push.ok7,d.health.push.sent7):'<small>—</small>','رسیده از فرستاده')}${tile('بازخورد منفی ۲۴ ساعت',f(d.health.fbBad))}</div>
<h2>⚙️ حذف حساب‌های تیم از آمار</h2><form class="p" method="post" action="/admin/care/team"><p class="m">شماره‌های خودتان (تیم) را بنویس تا آمار واقعی کاربرها دیده شود؛ با ویرگول جدا کن. الان ${f(d.team)} شماره حذف شده.</p><input name="team" dir="ltr" value="${esc((o.team||[]).join(', '))}" placeholder="0904…, 0991…"><p><button>ذخیره</button></p></form>
<p class="m">عددها مستقیم از داده‌های سرور شمرده می‌شوند و چیزی تخمینی نیست. با این تعداد کاربر، هر درصد را با «n از N» بخوان و روی روند چند هفته تصمیم بگیر، نه یک روز.</p></main></html>`}
