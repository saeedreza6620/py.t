/* BeautyWallet — result follow-up per routine product + "today" card + reminders outside the app.
   Each product in the routine gets checkpoints that fit what it is (skin science, not one schedule):
   day 3 tolerance for everything; week 2 comfort/verdict for basics and sunscreen habit; actives add
   week-2 purge-vs-irritation, week-4 and week-8 photos/verdict; retinoids and anti-spot week 12.
   The home screen shows ONE task a day. The phone writes the next 30 days of messages into
   IndexedDB so the installed app can show them as a notification (server sends an empty wake-up). */
(function(){'use strict';
var DAY=864e5,K_START='bw_fu_start',K_ANS='bw_fu_answers',K_NOTIF='bw_fu_notif',K_STAG='bw_fu_stagger_seen';
var $=function(s,r){return (r||document).querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var fa=function(n){return String(n).replace(/\d/g,function(x){return '۰۱۲۳۴۵۶۷۸۹'[x]})};
function rj(k,d){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}}
function wj(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function tday(t){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t==null?Date.now():t))}
function dnum(s){var p=s.split('-');return Math.round(Date.UTC(+p[0],p[1]-1,+p[2])/DAY)}
function dstr(n){return new Date(n*DAY).toISOString().slice(0,10)}
var track=function(t){try{window.bwTrack&&window.bwTrack(t)}catch(e){}};

/* ---------- what each product is ---------- */
var PIG=['VITC','VITC_LAA','VITC_DERIV','AZELAIC','ARBUTIN','TXA','CYSTEAMINE'];
function info(id){var f=null;try{f=window.BWCatalog&&BWCatalog.formula(id)}catch(e){}
  var p=null;try{p=typeof PRODUCTS!=='undefined'&&PRODUCTS.find(function(x){return x.id===id})}catch(e){}
  var name=(f&&f.name)||(p&&p.name)||'محصولت',role=(f&&f.role)||'',cls=((f&&f.actives)||[]).map(function(a){return a.cls});
  var short=name.length>34?name.slice(0,32)+'…':name,kind;
  if(role==='sunscreen'||/ضد ?آفتاب/.test(name))kind='spf';else if(/^(cleanser|micellar|mask)$/.test(role)||(f&&f.rinseOff))kind='basic'; // wash-off: tolerance and comfort only
  else if(cls.indexOf('RETINOID')>=0)kind='retinoid';else if(cls.some(function(c){return /^(AHA|BHA|PHA)$/.test(c)}))kind='acid';
  else if(cls.some(function(c){return /^(VITAMIN_B3|AZELAIC|VITC|VITC_LAA|VITC_DERIV|ARBUTIN|TXA|CYSTEAMINE|BAKUCHIOL|PEPTIDE|ZINC)$/.test(c)}))kind='active';
  else kind='basic';
  var pig=cls.some(function(c){return PIG.indexOf(c)>=0});
  return {id:id,name:short,kind:kind,days:kind==='retinoid'||(kind==='active'&&pig)?[3,14,28,56,84]:kind==='acid'||kind==='active'?[3,14,28,56]:[3,14]}}
function ask(i,c){var n=i.name,last=i.days[i.days.length-1]===c;
  if(c===3)return {k:'tol',title:'روز سوم '+n,q:'عزیزم، پوستت این سه روز با '+n+' چطور بوده؟ 🌸',opts:[['ok','خوبه 😊'],['mild','یه کم می‌سوزه'],['bad','قرمز یا ملتهب شده']]};
  if(c===14&&(i.kind==='acid'||i.kind==='retinoid'))return {k:'purge',title:'هفته‌ی ۲ '+n,q:'قشنگم، از وقتی '+n+' رو شروع کردی جوش تازه‌ای دیدی؟',opts:[['none','نه'],['same','آره، همون جاهایی که همیشه جوش می‌زنم'],['new','آره، جاهای تازه یا با سوزش']]};
  if(c===14&&i.kind==='spf')return {k:'habit',title:'هفته‌ی ۲ ضدآفتاب',q:'این دو هفته چند روز ضدآفتابت رو زدی؟ 🌤',opts:[['most','تقریباً هر روز'],['some','بعضی روزا'],['rare','کم']]};
  if(c===14&&i.kind==='basic')return {k:'verdict',title:'هفته‌ی ۲ '+n,q:'دو هفته با '+n+' گذشت؛ پوستت باهاش راحته؟ 💜',opts:[['good','راحتم، نگهش می‌دارم'],['meh','فرقی حس نکردم'],['bad','اذیتم می‌کنه']]};
  if(c===14)return {k:'tol2',title:'هفته‌ی ۲ '+n,q:'هنوز با '+n+' حس خوبی داری عزیزم؟',opts:[['ok','آره'],['mild','گاهی می‌سوزه'],['bad','نه، اذیتم می‌کنه']]};
  if(!last)return {k:'photo',title:'هفته‌ی '+fa(c/7)+' '+n,q:'هفته‌ی '+fa(c/7)+' با '+n+' شد 🌷 یه عکس با همون نور همیشگی بگیر تا تغییرت رو کنار هم ببینیم.',photo:true,opts:[['done','عکس گرفتم'],['later','فردا']]};
  return {k:'final',title:'هفته‌ی '+fa(c/7)+' — حکم '+n,q:'وقت دیدن نتیجه‌ست ✨ عکس امروزت رو کنار عکس شروع ببین؛ '+n+' برات جواب داد؟',photo:true,opts:[['good','جواب داد'],['meh','فرقی نکرد'],['bad','بدتر شد']]}}
var REPLY={tol:{ok:'عالیه 💜 همین‌طور ادامه بده.',mild:'سوزش کم در روزهای اول برای بعضی محصولات پیش میاد؛ یک شب در میان مصرف کن و مرطوب‌کننده‌ی ساده کنارش بزن. اگر بیشتر شد، قطعش کن.',bad:'مصرفش رو همین حالا متوقف کن و فقط شوینده‌ی ملایم و مرطوب‌کننده‌ی ساده بزن. اگر تا دو سه روز بهتر نشد یا تورم و خارش داری، حتماً به پزشک نشون بده.'},
  tol2:{ok:'عالیه 💜',mild:'تعداد شب‌های مصرف رو کم کن (یک شب در میان) تا پوستت عادت کنه.',bad:'فعلاً کنارش بذار و بعد از آروم شدن پوست، با پزشک یا داروساز درباره‌ی ادامه‌اش مشورت کن.'},
  purge:{none:'خیلی خوب 💜',same:'این احتمالاً «جوش گذرا»ست: اکتیو داره چرخه‌ی پوست رو تند می‌کنه. معمولاً تا هفته‌ی ۴ تا ۶ کم می‌شه؛ ادامه بده مگر اینکه دردناک یا زیاد شد.',new:'جوش در جاهای تازه یا همراه سوزش بیشتر شبیه تحریکه، نه جوش گذرا. مصرف رو کم کن یا قطع کن؛ اگر ادامه داشت با پزشک مشورت کن.'},
  habit:{most:'آفرین 🌤 ضدآفتاب فقط با هر روز زدن کار می‌کنه.',some:'ضدآفتاب رو کنار مسواک یا آینه بذار تا یادت نره؛ یادآور صبح هم کمکت می‌کنه.',rare:'شاید بافت یا بوش اذیتت می‌کنه؟ قبل از خرید بعدی بررسیش کن تا یکی پیدا کنیم که دوستش داشته باشی.'},
  verdict:{good:'نگهش دار 💜',meh:'برای محصولات پایه «حس نکردن فرق» یعنی کارش رو بی‌سروصدا انجام می‌ده؛ اگر بخوای، قبل از خرید بعدی یه گزینه‌ی جورتر رو بررسی کن.',bad:'کنارش بذار؛ دفعه‌ی بعد قبل از خرید با پروفایلت بسنجیمش.'},
  photo:{done:'عکس ثبت شد 💜 تا حکم نهایی کنارتم.',later:'باشه، فردا یادت می‌ندازم.'},
  final:{good:'عالی 🎉 نگهش دار. اگر تموم شد، همینو دوباره بخر یا قبلش بررسی کن.',meh:'بعد از این مدت اگر فرقی نیست، احتمالاً این محصول برای هدفت مناسب نیست. قبل از خرید بعدی، جایگزین رو با پروفایلت بسنجیم.',bad:'کنارش بذار. اگر پوستت بدتر شده، یک بار به پزشک نشون بده.'}};

/* ---------- plan ---------- */
function ids(){var a=rj('bw_check_products',[]);return Array.isArray(a)?a.filter(function(x){return typeof x==='string'}).slice(0,15):[]}
function starts(){var s=rj(K_START,{}),cur=ids(),t=tday(),ch=false;cur.forEach(function(id){if(!s[id]){s[id]=t;ch=true}});Object.keys(s).forEach(function(id){if(cur.indexOf(id)<0){delete s[id];ch=true}});if(ch)wj(K_START,s);return s}
function tasks(onDay){var s=starts(),ans=rj(K_ANS,{}),today=dnum(onDay||tday()),out=[];
  ids().forEach(function(id){var i=info(id),d0=dnum(s[id]);i.days.forEach(function(c){var due=d0+c;var a=(ans[id]||{})[c];
    if(a&&!(a.v==='later'&&dnum(a.at)<today))return;if(today<due||today>due+(c===3?6:10))return;
    var q=ask(i,c);out.push({id:id,c:c,info:i,q:q,pri:(c===3?0:q.k==='purge'?1:q.photo?2:3)*100+(today-due)})})});
  return out.sort(function(a,b){return a.pri-b.pri})}
function stagger(){var s=starts(),act=ids().map(info).filter(function(i){return /retinoid|acid|active/.test(i.kind)}),seen=rj(K_STAG,'');
  for(var a=0;a<act.length;a++)for(var b=a+1;b<act.length;b++){var gap=Math.abs(dnum(s[act[a].id])-dnum(s[act[b].id]));var key=act[a].id+'|'+act[b].id;
    if(gap<14&&dnum(tday())-Math.max(dnum(s[act[a].id]),dnum(s[act[b].id]))<14&&seen!==key)return {key:key,a:act[a],b:act[b]}}return null}

/* ---------- today card ---------- */
var CSS='.fu{border-radius:20px;padding:14px 15px;margin:10px 0 14px;background:linear-gradient(150deg,#ffffff,#f4f0ff 60%,#fff2f8);box-shadow:0 8px 24px rgba(110,90,190,.12);font-size:14px;line-height:1.9}.fu small.k{display:block;color:#7a6aa8;font-size:12px}.fu b{display:block;font-size:15px;color:#2d2a4a;margin:2px 0 8px}.fu .o{display:flex;flex-wrap:wrap;gap:7px}.fu button{border:0;border-radius:13px;padding:9px 13px;font:inherit;font-size:13.5px;background:#f0eefb;color:#2d2a4a;cursor:pointer}.fu button.m{background:linear-gradient(135deg,#7aa7ff,#c08cff 60%,#ff9cc7);color:#fff}.fu p{margin:8px 0 0;color:#4a4566}.fu .x{float:left;background:transparent;padding:0 4px;color:#9a93b8}.fu-n{margin-top:10px;padding-top:10px;border-top:1px dashed #e2dcf3;font-size:13px}.fu-n select{border:1px solid #ddd6f3;border-radius:10px;padding:5px;font:inherit;margin:0 4px}';
var box=null;
function place(){var home=document.getElementById('sw-home');if(!home)return null;if(!box){box=document.createElement('div');box.id='fuToday';var h2=$('.sw-hero h2',home);if(h2)h2.parentNode.insertBefore(box,h2);else home.prepend(box)}return box}
function render(msg){var el=place();if(!el)return;var t=tasks(),st=stagger(),h='';
  if(msg)h='<div class="fu"><small class="k">کار امروز</small><b>ثبت شد</b><p>'+esc(msg)+'</p></div>';
  else if(t.length){var x=t[0];h='<div class="fu" data-id="'+esc(x.id)+'" data-c="'+x.c+'"><small class="k">کار امروز · '+esc(x.q.title)+'</small><b>'+esc(x.q.q)+'</b><div class="o">'+x.q.opts.map(function(o,i){return '<button type="button" data-fu="'+o[0]+'"'+(i===0?' class="m"':'')+'>'+esc(o[1])+'</button>'}).join('')+(x.q.photo?'<button type="button" data-fu-photo="1">📷 دفترچه‌ی عکس</button>':'')+'</div>'+(t.length>1?'<p style="font-size:12px;color:#8a83a8">'+fa(t.length-1)+' کار دیگه هم داری؛ بعد از این نشونت می‌دم.</p>':'')+'</div>'}
  else if(st)h='<div class="fu" data-stag="'+esc(st.key)+'"><button type="button" class="x" data-fu-x="1" aria-label="بستن">✕</button><small class="k">یه نکته‌ی مهم</small><b>«'+esc(st.a.name)+'» و «'+esc(st.b.name)+'» رو با هم شروع کردی.</b><p>برای اینکه بفهمی نتیجه (خوب یا بد) از کدومه، یکی رو دو هفته دیرتر شروع کن. اگه پوستت هم حساسه، این‌طوری کمتر تحریک می‌شه.</p></div>';
  h+=notifBlock();el.innerHTML=h;writePlan()}
function answer(id,c,v){var ans=rj(K_ANS,{});(ans[id]||(ans[id]={}))[c]={v:v,at:tday()};wj(K_ANS,ans);track('followup_answer');
  var q=ask(info(id),Number(c)),r=(REPLY[q.k]||{})[v]||'ثبت شد 💜';render(r);setTimeout(function(){render()},v==='later'?2500:9000)}

/* ---------- reminders outside the app ---------- */
var standalone=false;try{standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){}
var ios=/iphone|ipad|ipod/i.test(navigator.userAgent),canPush='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
function notifBlock(){var n=rj(K_NOTIF,{}),has=ids().length>0;if(!has)return '';
  if(n.on&&typeof Notification!=='undefined'&&Notification.permission==='granted')return '';
  if(n.hide&&Date.now()-n.hide<14*DAY)return '';
  if(ios&&!standalone)return '<div class="fu fu-n"><b>یادآور روی گوشی 🔔</b>برای اینکه روزای مهم روتینت (مثل روز ۳ و عکس هفته‌ی ۴) رو بهت یادآوری کنم، اول بیوتی‌ولت رو از دکمه‌ی اشتراک‌گذاری Safari «به صفحه‌ی اصلی» اضافه کن و از آیکن خودش باز کن.<div class="o" style="margin-top:6px"><button type="button" data-fu-later="1">بعداً</button></div></div>';
  if(!canPush)return '';
  if(typeof Notification!=='undefined'&&Notification.permission==='denied')return '';
  return '<div class="fu fu-n"><b>یادآور روی گوشی 🔔</b>روزای مهم روتینت رو (روز ۳ هر محصول، عکس هفته‌ی ۴ و ۸) همون ساعتی که می‌خوای روی گوشیت یادآوری کنم؟ حداکثر روزی یک پیام.<div class="o" style="margin-top:6px;align-items:center">ساعت<select id="fuTime">'+['08:00','09:00','10:00','13:00','18:00','21:00','22:00'].map(function(t){return '<option'+(t==='09:00'?' selected':'')+'>'+t+'</option>'}).join('')+'</select><label style="font-size:12.5px"><input type="checkbox" id="fuDaily"> هر روز هم یه یادآور کوتاه روتین</label></div><div class="o" style="margin-top:8px"><button type="button" class="m" data-fu-on="1">روشنش کن</button><button type="button" data-fu-later="1">بعداً</button></div></div>'}
function b64u(s){var p=(s+'===').slice(0,s.length+(4-s.length%4)%4).replace(/-/g,'+').replace(/_/g,'/'),b=atob(p),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
function enable(){var time=($('#fuTime')||{}).value||'09:00',daily=!!($('#fuDaily')||{}).checked;
  Notification.requestPermission().then(function(p){if(p!=='granted')throw Error('denied');return navigator.serviceWorker.ready})
  .then(function(reg){return fetch('/api/push/key',{cache:'no-store'}).then(function(r){return r.json()}).then(function(k){return reg.pushManager.getSubscription().then(function(s){return s||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(k.key)})})}).then(function(sub){
    try{if(reg.periodicSync)reg.periodicSync.register('bw-daily',{minInterval:12*3600e3}).catch(function(){})}catch(e){}return sub})})
  .then(function(sub){var n={on:true,time:time,daily:daily,endpoint:sub.endpoint};wj(K_NOTIF,n);track('notif_on');return syncSub(sub,true)})
  .then(function(){var ep=rj(K_NOTIF,{}).endpoint;return fetch('/api/push/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:ep})}).then(function(r){return r.ok},function(){return false})})
  .then(function(ok){render(ok?'یادآور روشن شد 🔔 یک اعلان آزمایشی هم فرستادم. از این به بعد هر روزی که کاری داری، ساعت '+fa(time)+' روی گوشیت می‌بینی.':'یادآور روشن شد، ولی اعلان آزمایشی نرسید؛ تیم بیوتی‌ولت بررسی می‌کند. یادآورها داخل اپ همچنان کار می‌کنند.')})
  .catch(function(e){render(e&&e.message==='denied'?'اجازه‌ی اعلان داده نشد. اگه خواستی بعداً از تنظیمات گوشی برای بیوتی‌ولت روشنش کن.':'فعلاً روشن نشد؛ کمی بعد دوباره امتحان کن.')})}
var lastSig='';
function syncSub(sub,force){var n=rj(K_NOTIF,{});if(!n.on)return Promise.resolve();var days=planDays().filter(function(x){return x.task}).map(function(x){return x.date});
  var sig=JSON.stringify([n.time,n.daily,days]);if(!force&&(sig===lastSig||sig===n.sig))return Promise.resolve();lastSig=sig;
  var dev='';try{dev=localStorage.getItem('bw_device')||''}catch(e){}
  return (sub?Promise.resolve(sub):navigator.serviceWorker.ready.then(function(r){return r.pushManager.getSubscription()})).then(function(s){if(!s){n.on=false;wj(K_NOTIF,n);return}
    return fetch('/api/push/sub',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({sub:s.toJSON(),time:n.time,daily:n.daily,days:days,d:dev})}).then(function(r){if(r.ok){n.sig=sig;wj(K_NOTIF,n)}})}).catch(function(){})}

/* next 30 days of messages, written on the phone for the service worker */
function planDays(){var out=[],t0=dnum(tday());for(var k=0;k<30;k++){var d=dstr(t0+k),t=tasks(d).filter(function(x){return dnum(d)===dnum(starts()[x.id])+x.c});
  out.push({date:d,task:t.length>0,title:t.length?'بیوتی‌ولت 💎 '+t[0].q.title:'',body:t.length?t[0].q.q:''})}return out}
function morning(){var tm=rj('bw_check_times',{}),names=ids().filter(function(id){return (tm[id]||(info(id).kind==='spf'?'am':'pm'))==='am'}).map(function(id){return info(id).name}).slice(0,2);
  return {title:'صبحت بخیر قشنگم 🌸',body:names.length?'پوستت منتظر '+names.join(' و ')+'ـه 💜 یه دقیقه برای خودت؛ بعدش یه تیک کوچولو توی بیوتی‌ولت.':'یه صبح آروم برات آرزو می‌کنم 🌤 ضدآفتابت رو قبل از بیرون رفتن فراموش نکن.'}}
function idb(){return new Promise(function(ok,bad){var r=indexedDB.open('bw-followup',1);r.onupgradeneeded=function(){r.result.createObjectStore('kv')};r.onsuccess=function(){ok(r.result)};r.onerror=function(){bad(r.error)}})}
var planSig='';
function writePlan(){var n=rj(K_NOTIF,{}),days=planDays().filter(function(x){return x.task}).map(function(x){return {date:x.date,title:x.title,body:x.body}});
  var plan={days:days,daily:n.daily?morning():null,time:n.time||'09:00'},sig=JSON.stringify(plan);if(sig===planSig)return;planSig=sig;
  idb().then(function(db){var t=db.transaction('kv','readwrite');t.objectStore('kv').put(plan,'plan')}).catch(function(){});
  if(n.on)syncSub(null,false)}

/* ---------- wiring ---------- */
function init(){if(!document.getElementById('sw-home'))return setTimeout(init,500);
  var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);render();
  document.addEventListener('click',function(e){var b=e.target.closest('#fuToday button');if(!b)return;var card=b.closest('[data-id]');
    if(b.dataset.fu&&card)return answer(card.dataset.id,card.dataset.c,b.dataset.fu);
    if(b.dataset.fuPhoto){if(typeof window.switchTab==='function')window.switchTab('track');setTimeout(function(){var j=document.getElementById('skinJournal');j&&j.scrollIntoView({behavior:'smooth',block:'start'})},300);return}
    if(b.dataset.fuX){var s=b.closest('[data-stag]');if(s)wj(K_STAG,s.dataset.stag);return render()}
    if(b.dataset.fuOn)return enable();
    if(b.dataset.fuLater){var n=rj(K_NOTIF,{});n.hide=Date.now();wj(K_NOTIF,n);return render()}});
  // keep in step with the routine and the clock
  window.addEventListener('storage',function(e){if(e.key==='bw_check_products')render()});
  var last=JSON.stringify(ids());setInterval(function(){var cur=JSON.stringify(ids());if(cur!==last){last=cur;render()}},4000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)render()});
  if(/[?&]from=notif/.test(location.search))track('notif_open');
  try{navigator.serviceWorker&&navigator.serviceWorker.addEventListener('message',function(e){if(e.data&&e.data.bw==='notif-open'){track('notif_open');render()}})}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.BWFollowup={tasks:tasks,plan:planDays,render:render};
})();
