/* BeautyWallet v141 — «امروز»: the home screen for a returning user.
 * Inspired by: Loop Habit Tracker (github.com/iSoron/uhabits: habit strength instead of a fragile streak),
 * Apple Health / Oura (one «today» card on top), Ente Photos (photo memories), Hooked (trigger → one tap → real reward → investment).
 * Rules: no guilt, no countdowns, no «your streak is gone». A missed day lowers strength a little; it never resets to zero.
 * Data: ticks are written to the SAME key the routine tab uses (bw_track_YYYY-MM-DD), so both stay in sync and cloud backup keeps them.
 * Only reads other keys; adds no new storage except nothing. New users still see the «امروز اومدی چیکار کنیم؟» welcome untouched. */
(function(){'use strict';
var TRACK={am:[['am-cleanse','🫧','شست‌وشو'],['am-care','💦','آبرسان'],['am-spf','☀','ضدآفتاب']],pm:[['pm-cleanse','🌙','پاک‌سازی'],['pm-active','✨','اکتیو'],['pm-moist','🧴','مرطوب']]};
var ALL=TRACK.am.concat(TRACK.pm),DAY=864e5;
function fa(n){return String(n).replace(/\d/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d]})}
function rj(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
function wj(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function teh(t){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran'}).format(new Date(t))}
function today(){try{if(window.BWDate&&BWDate.gregorianToday)return BWDate.gregorianToday()}catch(e){}return teh(Date.now())}
function key(i){return i?teh(Date.now()-i*DAY):today()}
function hour(){try{return +new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tehran',hour:'numeric',hourCycle:'h23'}).format(new Date())}catch(e){return new Date().getHours()}}
function track(n){try{window.bwTrack&&window.bwTrack(n)}catch(e){}}
function toast(t){var d=document.createElement('div');d.className='sw-toast';d.textContent=t;document.body.append(d);setTimeout(function(){d.remove()},2400)}
function name(){var r=rj('bw_reg',{})||{},n=String(r.name||'').trim().split(/\s+/)[0];return n&&n.length<20?n:''}
function returning(){var p=rj('bw_profile_v1_full',{})||{},ids=rj('bw_check_products',[]);return !!(p.skinBase||(Array.isArray(ids)&&ids.length)||(rj('bw_reg',{})||{}).phone)}
function slot(){var h=hour();return h>=4&&h<15?'am':'pm'}
function greet(){var h=hour(),n=name();var g=h>=4&&h<12?'صبحت بخیر':h<17?'سلام':'شبت بخیر';return g+(n?' '+esc(n):' عزیزم')+(h>=4&&h<17?' ☀':' 🌙')}
function dayScore(k){var t=rj('bw_track_'+k,{})||{},c=0;ALL.forEach(function(x){if(t[x[0]]===true)c++});return c/ALL.length}
/* Loop Habit Tracker's score: an exponential moving average; for a daily habit multiplier = 0.5^(1/13). */
function strength(){var first=-1,i;for(i=59;i>=0;i--){if(dayScore(key(i))>0){first=i;break}}if(first<0)return {s:0,days:0};
  var m=Math.pow(.5,1/13),s=0;for(i=first;i>=0;i--){var c=dayScore(key(i));if(i===0&&c===0)continue;s=s*m+c*(1-m)}return {s:s,days:first+1}}
function words(st){if(!st.days)return 'با اولین تیک امروز شروع می‌شه 🌱';if(st.s<.25)return 'داره شکل می‌گیره؛ هر روز یه کم محکم‌تر می‌شه 🌱';if(st.s<.55)return 'داره عادتت می‌شه، عالیه 🌿';return 'دیگه عادتت شده؛ پوستت اینو حس می‌کنه 💪'}
function ring(p){var r=26,c=2*Math.PI*r,o=c*(1-p);return '<svg viewBox="0 0 64 64" class="td-ring" aria-hidden="true"><circle cx="32" cy="32" r="'+r+'" class="bg"/><circle cx="32" cy="32" r="'+r+'" class="fg" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+o.toFixed(1)+'"/></svg>'}
var WD=['ی','د','س','چ','پ','ج','ش'];
function week(){var h='';for(var i=6;i>=0;i--){var k=key(i),sc=dayScore(k),d=new Date(Date.now()-i*DAY);var wd=WD[new Date(new Date(k+'T12:00:00').getTime()).getDay()]||'';
  h+='<span class="td-dot'+(i===0?' now':'')+'" style="--f:'+sc.toFixed(2)+'" title="'+fa(Math.round(sc*6))+' از ۶"><i></i><small>'+wd+'</small></span>'}return h}
function card(){var sl=slot(),t=rj('bw_track_'+today(),{})||{},items=TRACK[sl],done=items.filter(function(x){return t[x[0]]===true}).length,st=strength();
  var head=sl==='am'?'روتین صبح امروز':'روتین شب امروز',all=done===items.length;
  var h='<div class="td-card"><div class="td-top"><b>'+head+'</b><small>'+(all?'کامل شد ✨':fa(done)+' از '+fa(items.length))+'</small></div><div class="td-ticks">';
  items.forEach(function(x){var on=t[x[0]]===true;h+='<button type="button" class="td-tick'+(on?' on':'')+'" data-td="'+x[0]+'" aria-pressed="'+on+'"><i>'+(on?'✓':x[1])+'</i>'+x[2]+'</button>'});
  h+='</div>'+(all?'<p class="td-yay">'+(sl==='am'?'آفرین 💜 صبحت رو با مراقبت شروع کردی. شب دوباره همین‌جا.':'آفرین 💜 امشب پوستت با خیال راحت می‌خوابه.')+'</p>':'');
  h+='<div class="td-habit">'+ring(st.s)+'<div class="td-hw"><b>پایداری روتینت '+fa(Math.round(st.s*100))+'٪</b><small>'+words(st)+'</small><div class="td-week">'+week()+'</div></div></div>';
  // v148: the 4-week report offer appears only once it is worth reading (care.js decides)
  try{if(window.BWCare){BWCare.style();h+=BWCare.offerHtml()}}catch(e){}
  h+='<button type="button" class="td-more" data-tq="routine">روتین کامل و محصولاتم ←</button></div>';return h}
var QUICK=[['check','🔍','بسنجم'],['calm','😣','پوستم به هم ریخته'],['chat','💬','حرف بزنیم'],['photo','📸','عکس امروز']];
function quick(){return '<div class="td-quick">'+QUICK.map(function(q){return '<button type="button" data-tq="'+q[0]+'"><i>'+q[1]+'</i>'+q[2]+'</button>'}).join('')+'</div>'}
function calmTask(){var s=rj('bw_calm_v1',null);if(!s||s.v!==1||s.closed||s.phase==='done'||s.result)return null;
  var dn=function(x){var p=String(x).slice(0,10).split('-');return Math.round(Date.UTC(+p[0],p[1]-1,+p[2])/DAY)},n=dn(teh(Date.now()))-dn(s.start);/* same count as calm.js dayN */
  if(s.phase==='reveal')return {t:'🌿 نتیجه‌ی تست ساعدت آماده‌ست',s:'ببین کدوم محصول بوده',a:'calm'};
  if(s.phase==='calm'&&s.days&&s.days[today()])return null;
  return {t:'🌿 برنامه‌ی آرام‌سازی · روز '+fa(n),s:'حال امروز پوستت رو ثبت کن؛ یک دقیقه',a:'calm'}}
function waiting(box){var c=calmTask();if(c)return show(c);
  var J=window.BWSkinJournal;if(J&&J.plan)J.plan().then(function(p){if(p&&p.state==='due')show({t:'📸 امروز روز عکس '+esc(p.label||'پوستت')+'ـه',s:'فقط یک دقیقه، با همون قاب همیشگی',a:'photo'});else box.hidden=true}).catch(function(){box.hidden=true});else box.hidden=true;
  function show(x){box.hidden=false;box.innerHTML='<button type="button" class="td-wait" data-tq="'+x.a+'"><span><b>'+x.t+'</b><small>'+x.s+'</small></span><i>←</i></button>'}}
function goTrack(then){if(typeof window.switchTab==='function')window.switchTab('track');setTimeout(then||function(){},300)}
function act(a){track('today_q_'+a);
  if(a==='check'){var i=document.getElementById('swAsk');if(i){i.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(function(){i.focus()},350)}return}
  if(a==='calm'){var s=rj('bw_calm_v1',null);if(s&&s.v===1&&!s.closed&&s.phase!=='done')return goTrack(function(){try{window.BWCalm&&BWCalm.paint&&BWCalm.paint()}catch(e){}var c=document.getElementById('bwCalm');c&&c.scrollIntoView({behavior:'smooth',block:'start'})});if(window.BWCalm&&BWCalm.open)BWCalm.open();else{var b=document.getElementById('cmChip');b&&b.click()}return}
  if(a==='chat'){var g=document.getElementById('swHeroGem');g&&g.click();return}
  if(a==='photo')return goTrack(function(){var j=document.getElementById('skinJournal');j&&j.scrollIntoView({behavior:'smooth',block:'start'});window.BWSkinJournal&&BWSkinJournal.photo&&BWSkinJournal.photo()});
  if(a==='routine'){if(typeof window.switchTab==='function')window.switchTab('sw-routine');return}}
var CSS='#sw-home.bw-ret .sw-hero{position:relative;padding-top:6px}'+
'#sw-home.bw-ret .sw-hero-gem,#sw-home.bw-ret #swHeroSay,#sw-home.bw-ret #cmChip,#sw-home.bw-ret .sw-quick,#sw-home.bw-ret .sw-rtnrow{display:none!important}'+
'#sw-home.bw-ret .sw-hello{display:none!important}.td-hi{font:900 21px var(--sw-font,inherit);color:var(--sw-ink,#1f2a44);text-align:right;margin:4px 4px 0;padding-left:100px;line-height:1.7}'+
'#sw-home.bw-ret #swNeginPill{position:absolute;top:2px;left:4px;min-height:36px;padding:4px 12px;font-size:13px;margin:0}'+
'body.bw-has-today .sj-nudge{display:none!important}'+
'#bwToday{display:grid;gap:12px;margin:0 0 14px;text-align:right}'+
'.td-card{background:#fff;border:1px solid var(--sw-line,#ebe7f5);border-radius:24px;padding:16px;box-shadow:0 16px 36px -24px rgba(60,50,120,.35)}'+
'.td-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}.td-top b{font-size:17px;color:var(--sw-ink,#1f2a44)}.td-top small{font-size:13px;color:#7a6fa0;font-weight:800}'+
'.td-ticks{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}'+
'.td-tick{appearance:none;border:1.5px solid #ece6fb;background:#faf8ff;border-radius:18px;min-height:84px;display:grid;justify-items:center;align-content:center;gap:6px;font:800 13px var(--sw-font,inherit);color:#4b4569;cursor:pointer;transition:transform .15s,background .25s,border-color .25s}'+
'.td-tick i{font-style:normal;font-size:24px;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:#fff;box-shadow:0 4px 12px -6px rgba(90,70,160,.4)}'+
'.td-tick:active{transform:scale(.95)}.td-tick.on{background:linear-gradient(160deg,#e9f7ff,#fbe9ff);border-color:#c9b8f5;color:#3b2f73}.td-tick.on i{background:linear-gradient(160deg,#8fd3ff,#c79bff);color:#fff;font-size:20px;font-weight:900}'+
'.td-yay{margin:12px 2px 0;font-size:14px;line-height:1.9;color:#5a3f9e;font-weight:700}'+
'.td-habit{display:flex;gap:12px;align-items:center;margin-top:14px;padding-top:14px;border-top:1px dashed #ece6fb}'+
'.td-ring{width:58px;height:58px;flex:none;transform:rotate(-90deg)}.td-ring circle{fill:none;stroke-width:7}.td-ring .bg{stroke:#f0ecfa}.td-ring .fg{stroke:#a98bf0;stroke-linecap:round;transition:stroke-dashoffset .6s}'+
'.td-hw{flex:1;min-width:0}.td-hw b{display:block;font-size:14px;color:var(--sw-ink,#1f2a44)}.td-hw small{display:block;font-size:12.5px;color:#7a7395;line-height:1.8}'+
'.td-week{display:flex;gap:6px;margin-top:6px}.td-dot{display:grid;justify-items:center;gap:2px}.td-dot i{width:16px;height:16px;border-radius:50%;background:#f0ecfa;position:relative;overflow:hidden}'+
'.td-dot i::after{content:"";position:absolute;inset:0;background:#a98bf0;opacity:var(--f)}.td-dot.now i{outline:2px solid #c9b8f5;outline-offset:1px}.td-dot small{font-size:10.5px;color:#9a93b5}'+
'.td-more{appearance:none;border:0;background:none;color:#6b4fd0;font:800 13px var(--sw-font,inherit);margin-top:10px;padding:8px 0;cursor:pointer;min-height:40px}'+
'.td-wait{appearance:none;width:100%;display:flex;align-items:center;gap:10px;justify-content:space-between;text-align:right;background:linear-gradient(160deg,#effaf3,#f4f0ff);border:1px solid #d8eedf;border-radius:20px;padding:13px 15px;cursor:pointer;font-family:var(--sw-font,inherit)}'+
'.td-wait b{display:block;font-size:14.5px;color:#245b3d}.td-wait small{display:block;font-size:12.5px;color:#5f7a69;margin-top:2px}.td-wait i{font-style:normal;color:#2f7a52;font-weight:900}'+
'.td-quick{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}'+
'.td-quick button{appearance:none;border:1px solid var(--sw-line,#ebe7f5);background:#fff;border-radius:18px;padding:10px 2px;display:grid;justify-items:center;gap:5px;font:800 11.5px var(--sw-font,inherit);color:#4b4569;cursor:pointer;min-height:78px;line-height:1.5}'+
'.td-quick i{font-style:normal;font-size:22px;width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(160deg,#eef7ff,#fbefff)}'+
'.sw-toast{width:max-content;max-width:calc(100vw - 40px);text-align:center;line-height:1.8}'+'@media (prefers-reduced-motion:reduce){.td-tick,.td-ring .fg{transition:none}}';
var box,waitBox;
function paint(){var home=document.getElementById('sw-home');if(!home)return;
  if(!returning()){home.classList.remove('bw-ret');document.body.classList.remove('bw-has-today');if(box)box.remove();box=null;return}
  home.classList.add('bw-ret');document.body.classList.add('bw-has-today');
  var hello=home.querySelector('.sw-hello');
  if(!box||!box.isConnected){box=document.createElement('div');box.id='bwToday';var hero=home.querySelector('.sw-hero'),anchor=home.querySelector('#swNeginPill')||hello;
    if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(box,anchor.nextSibling);else home.prepend(box)}
  box.innerHTML='<p class="td-hi">'+greet()+'</p>'+card()+'<div id="tdWait" hidden></div>'+quick();waiting(box.querySelector('#tdWait'))}
document.addEventListener('click',function(e){var t=e.target.closest('#bwToday [data-td]');
  if(t){var k=today(),m=rj('bw_track_'+k,{})||{};m[t.dataset.td]=!m[t.dataset.td];wj('bw_track_'+k,m);track(m[t.dataset.td]?'today_tick':'today_untick');
    var items=TRACK[slot()];paint();if(m[t.dataset.td]&&items.every(function(x){return m[x[0]]===true})){track('today_done');toast('همه‌شو انجام دادی 💜 پوستت ممنونته')}return}
  var q=e.target.closest('#bwToday [data-tq]');if(q)act(q.dataset.tq)});
function start(){if(!document.getElementById('bwTodayCss')){var s=document.createElement('style');s.id='bwTodayCss';s.textContent=CSS;document.head.append(s)}
  var tries=0;(function wait(){if(document.getElementById('sw-home')&&document.querySelector('#sw-home .sw-hello'))return paint();if(++tries<80)setTimeout(wait,100)})();
  // repaint when she comes back to home or the app (ticks from the routine tab, a new day)
  document.addEventListener('visibilitychange',function(){if(!document.hidden)paint()});
  window.addEventListener('storage',function(e){if(e.key&&/^bw_(track_|calm_v1|reg|profile_v1_full|check_products)/.test(e.key))paint()});
  var sw=window.switchTab;if(typeof sw==='function'&&!sw.__td){window.switchTab=function(t){var r=sw.apply(this,arguments);if(t==='sw-home')setTimeout(paint,30);return r};window.switchTab.__td=1}
  document.addEventListener('click',function(e){if(e.target.closest('.sw-nav button,[data-go="sw-home"]'))setTimeout(paint,80)});
  setTimeout(paint,1500)}
window.BWToday={paint:paint,strength:strength};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
