// "Where did each person stop?" — one row per signed-up person (all her devices together), built only from
// files the server already keeps (users, events.jsonl, card orders). No AI, nothing new is collected.
// Phones are masked and only the first name is shown, in the panel and in the CSV.
const DAY=864e5;
const tday=t=>new Date(t+3.5*3600e3).toISOString().slice(0,10);
const LABEL={app_open:'باز کردن اپ',app_open_installed:'باز کردن اپ نصب‌شده',check:'بررسی محصول',gem_open:'باز کردن گفتگو',gem_msg:'پیام در گفتگو',
  routine_tick:'تیک روتین',followup_answer:'جواب پیگیری',paywall_view:'رسیدن به صفحه‌ی پرداخت',negin_open:'باز کردن ولت الماس',negin_buy_click:'زدن خرید الماس',
  sub_click:'زدن اشتراک',buy_request:'شروع پرداخت',register:'ثبت‌نام',register_skip:'رد کردن ثبت‌نام',notif_on:'روشن کردن یادآور',notif_denied:'رد اجازه‌ی اعلان',
  install:'نصب اپ',gift_open:'باز کردن هدیه',gift_panel:'باز کردن گیفت‌یار',journal_photo:'عکس پوست',wel_check:'انتخاب «بررسی محصول» در خوش‌آمد',wel_chat:'انتخاب «حرف بزنیم» در خوش‌آمد',wel_skip:'رد کردن خوش‌آمد',
  life_set:'جواب دوره‌ی زندگی',cycle_set:'جواب چرخه',check_noinci:'بررسی بدون ترکیبات',share_out:'اشتراک‌گذاری',share_in:'ورود از لینک اشتراک',refill_due:'یادآور تمام شدن',pay_done:'پرداخت تأییدشده'};
export const STAGES=[['none','ثبت‌نام کرد، حکمی نگرفت'],['once','یک روز آمد، حکم گرفت، برنگشت'],['back','در روز دیگری هم برگشت'],['wall','به صفحه‌ی پرداخت رسید'],['click','روی خرید زد'],['paid','پرداخت کرد']];
const mask=p=>{p=String(p||'');return p.length>=10?p.slice(0,4)+'•••'+p.slice(-3):''};

export function journeys({ev,users,reqs,reqStatus,now=Date.now()}){
  const owner=new Map();for(const [ph,u] of Object.entries(users))for(const d of u.devices||[])owner.set(d,ph);
  const by=new Map();for(const [ph,u] of Object.entries(users))by.set(ph,{ph,u,ev:[]});
  for(const e of ev){if(!e.d||e.page==='site')continue;const ph=owner.get(e.d);if(!ph)continue;const t=Date.parse(e.at);if(isFinite(t))by.get(ph).ev.push({t,type:e.t})}
  const paidDev=new Set(reqs.filter(r=>r.method==='card'&&(reqStatus[r.ref]||{}).status==='done').map(r=>r.d));
  const rows=[...by.values()].map(({ph,u,ev})=>{ev.sort((a,b)=>a.t-b.t);const c=k=>ev.filter(e=>(Array.isArray(k)?k.includes(e.type):e.type===k)).length;
    const first=Math.min(Date.parse(u.first)||Infinity,ev[0]?.t||Infinity),last=Math.max(Date.parse(u.last)||0,ev.at(-1)?.t||0);
    const days=new Set(ev.map(e=>tday(e.t))),checks=c('check');const paid=(u.devices||[]).some(d=>paidDev.has(d))||c('pay_done')>0;
    const stage=paid?'paid':c(['negin_buy_click','sub_click','buy_request'])?'click':c('paywall_view')?'wall':days.size>1?'back':checks||c('gem_msg')?'once':'none';
    const lastEv=[...ev].reverse().find(e=>LABEL[e.type]&&!/^app_open/.test(e.type));
    return {ph,devices:u.devices||[],evs:ev,name:String(u.name||'').trim().split(/\s+/)[0]||'—',phone:mask(ph),src:u.src||'نامشخص',first:isFinite(first)?new Date(first).toISOString():'',last:last?new Date(last).toISOString():'',
      idle:last?Math.floor((now-last)/DAY):null,days:days.size,opens:c(['app_open','app_open_installed']),checks,chat:c('gem_msg'),routine:c('routine_tick'),followup:c('followup_answer'),
      wall:c('paywall_view'),buy:c(['negin_buy_click','sub_click','buy_request']),paid,installed:!!u.installed||c('install')>0,notif:c('notif_on')>0,
      welcome:c('wel_check')?'بررسی':c('wel_chat')?'گفتگو':c('wel_skip')?'رد کرد':'—',stage,lastAction:lastEv?LABEL[lastEv.type]:'فقط باز کرد'}});
  rows.sort((a,b)=>STAGES.findIndex(s=>s[0]===b.stage)-STAGES.findIndex(s=>s[0]===a.stage)||(b.last>a.last?1:-1));
  const n=rows.length,count=k=>rows.filter(r=>r.stage===k).length;
  const leftLast={};for(const r of rows.filter(r=>r.idle!==null&&r.idle>=7&&!r.paid))leftLast[r.lastAction]=(leftLast[r.lastAction]||0)+1;
  return {rows,n,funnel:{signed:n,verdict:rows.filter(r=>r.checks>0).length,chat:rows.filter(r=>r.chat>0).length,back:rows.filter(r=>r.days>1).length,routine:rows.filter(r=>r.routine+r.followup>0).length,
    notif:rows.filter(r=>r.notif).length,installed:rows.filter(r=>r.installed).length,wall:rows.filter(r=>r.wall>0).length,buy:rows.filter(r=>r.buy>0).length,paid:rows.filter(r=>r.paid).length,
    active7:rows.filter(r=>r.idle!==null&&r.idle<7).length},stages:STAGES.map(([k,l])=>[l,count(k)]),leftLast:Object.entries(leftLast).sort((a,b)=>b[1]-a[1])}}

export function journeysCsv(o){const j=journeys(o);const cols=['name','phone','src','first','last','idle','days','opens','checks','chat','routine','followup','wall','buy','paid','installed','notif','welcome','stage','lastAction'];
  const head=['نام','موبایل','منبع','اولین بار','آخرین بار','روز از آخرین بار','روزهای فعال','باز کردن','بررسی','پیام گفتگو','تیک روتین','جواب پیگیری','صفحه‌ی پرداخت','زدن خرید','پرداخت','نصب','یادآور','انتخاب خوش‌آمد','مرحله','آخرین کار'];
  const st=Object.fromEntries(STAGES);const cell=v=>{v=String(v??'');if(/^[=+\-@]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};
  return '﻿'+head.join(',')+'\n'+j.rows.map(r=>cols.map(c=>cell(c==='stage'?st[r.stage]:typeof r[c]==='boolean'?(r[c]?'بله':'نه'):r[c])).join(',')).join('\n')}

export function journeysHtml(o){const {fa,esc}=o;const j=journeys(o),F=j.funnel;const d=iso=>iso?new Date(iso).toLocaleDateString('fa-IR',{timeZone:'Asia/Tehran',month:'short',day:'numeric'}):'—';
  if(!j.n)return '<h2>سفر هر کاربر</h2><div class="card"><p class="note">هنوز کسی ثبت‌نام نکرده.</p></div>';
  const step=(l,v)=>`<div style="flex:1;min-width:92px;background:#f5f3ff;border-radius:12px;padding:8px;text-align:center"><b style="font-size:20px">${fa(v)}</b><br><small>${esc(l)}</small></div>`;
  const yes=v=>v?'✓':'';
  return `<h2 id="journeys">سفر هر کاربر: کجا ماندند؟ <a class="btn ghost" style="font-size:12px;padding:6px 12px;margin-inline-start:8px" href="/admin/journeys.csv">دانلود CSV</a></h2><div class="card">
<p class="note">فقط کسانی که ثبت‌نام کرده‌اند (همه‌ی دستگاه‌های هر نفر با هم). عدد مطلق، نفر به نفر. موبایل‌ها نصفه نمایش داده می‌شوند.</p>
<div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0">${step('ثبت‌نام',F.signed)}${step('حکم گرفت',F.verdict)}${step('روز دیگری برگشت',F.back)}${step('روتین یا پیگیری',F.routine)}${step('یادآور روشن',F.notif)}${step('صفحه‌ی پرداخت',F.wall)}${step('زد روی خرید',F.buy)}${step('پرداخت کرد',F.paid)}${step('فعال در ۷ روز اخیر',F.active7)}</div>
<p><b>کجا ماندند:</b> ${j.stages.map(([l,v])=>`${esc(l)}: <b>${fa(v)}</b>`).join(' · ')}</p>
${j.leftLast.length?`<p><b>آخرین کاری که کردند و دیگر نیامدند (۷ روز یا بیشتر غیبت):</b> ${j.leftLast.map(([l,v])=>`${esc(l)}: <b>${fa(v)}</b>`).join(' · ')}</p>`:''}
<div class="scroll"><table><tr><th>نام</th><th>موبایل</th><th>منبع</th><th>اولین</th><th>آخرین</th><th>روز فعال</th><th>بررسی</th><th>گفتگو</th><th>روتین/پیگیری</th><th>پرداخت</th><th>نصب/یادآور</th><th>مرحله</th><th>آخرین کار</th></tr>
${j.rows.map(r=>`<tr><td>${esc(r.name)}</td><td dir="ltr">${esc(r.phone)}</td><td>${esc(r.src)}</td><td>${d(r.first)}</td><td>${d(r.last)}${r.idle!=null?` <small>(${fa(r.idle)} روز پیش)</small>`:''}</td><td>${fa(r.days)}</td><td>${fa(r.checks)}</td><td>${fa(r.chat)}</td><td>${fa(r.routine)}/${fa(r.followup)}</td><td>${r.paid?'✅':r.buy?'زد':r.wall?'دید':''}</td><td>${yes(r.installed)}/${yes(r.notif)}</td><td>${esc((STAGES.find(s=>s[0]===r.stage)||[])[1]||'')}</td><td>${esc(r.lastAction)}</td></tr>`).join('')}</table></div></div>`}
