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


/* ---------- her life stage and cycle: asked ONCE, kept on this phone, shared with every section ---------- */
// pregnancy / breastfeeding / planning changes what is safe (retinoids…); the monthly cycle changes how a
// photo or a new breakout should be read. Asked once, re-asked only when it naturally may have changed.
var K_LIFE='bw_life',FLAG='بارداری یا شیردهی';
var LIFE_OPTS=[['none','هیچ‌کدوم'],['pregnant','باردارم'],['breastfeeding','شیر می‌دم'],['trying','برنامه‌ی بارداری دارم'],['private','ترجیح می‌دم نگم']];
var LIFE_AGAIN={none:365,pregnant:270,breastfeeding:180,trying:90,private:365,pb:180};
function life(){var l=rj(K_LIFE,{});return l&&typeof l==='object'?l:{}}
function careful(l){l=l||life();return /^(pregnant|breastfeeding|trying|pb)$/.test(l.state||'')}
function setLife(state){var l=life();l.state=state;l.at=tday();l.next=dnum(tday())+(LIFE_AGAIN[state]||365);wj(K_LIFE,l);syncProfileFlag();return l}
function syncProfileFlag(){try{var p=rj('bw_profile_v1_full',{}),f=Array.isArray(p.safetyFlags)?p.safetyFlags.slice():[],has=f.indexOf(FLAG)>=0,want=careful();
  if(want&&!has)f.push(FLAG);if(!want&&has&&life().state)f=f.filter(function(x){return x!==FLAG});p.safetyFlags=f;wj('bw_profile_v1_full',p);
  var box=document.querySelector('#profile-form input[name="safetyFlags"][value="'+FLAG+'"]');if(box)box.checked=want}catch(e){}}
function adoptProfileFlag(){var l=life();if(l.state)return;try{var f=(rj('bw_profile_v1_full',{}).safetyFlags)||[];if(f.indexOf(FLAG)>=0){l.state='pb';l.at=tday();l.next=dnum(tday())+LIFE_AGAIN.pb;wj(K_LIFE,l)}}catch(e){}}
function lifeDue(){var l=life();return !l.state||dnum(tday())>=(l.next||0)}
function cyc(){var c=life().cycle;return c&&c.on&&/^\d{4}-\d\d-\d\d$/.test(c.last||'')?c:null}
function cyclePos(d){var c=cyc();if(!c)return -1;var len=Math.min(45,Math.max(20,Number(c.len)||28));return ((dnum(d||tday())-dnum(c.last))%len+len)%len}
function nearPeriod(d){var c=cyc();if(!c)return false;var n=cyclePos(d),len=Number(c.len)||28;return n<=4||n>=len-2}
function premenstrual(d){var c=cyc();if(!c)return false;var n=cyclePos(d),len=Number(c.len)||28;return n>=len-7}
function cycleDue(){var l=life();return ids().length>0&&!(l.cycle&&l.cycle.asked)&&!/^(pregnant|breastfeeding)$/.test(l.state||'')&&!!l.state}
function hasRetinoid(){return ids().some(function(id){return info(id).kind==='retinoid'})}

/* ---------- today card ---------- */
var CSS='.fu{border-radius:20px;padding:14px 15px;margin:10px 0 14px;background:linear-gradient(150deg,#ffffff,#f4f0ff 60%,#fff2f8);box-shadow:0 8px 24px rgba(110,90,190,.12);font-size:14px;line-height:1.9}.fu small.k{display:block;color:#7a6aa8;font-size:12px}.fu b{display:block;font-size:15px;color:#2d2a4a;margin:2px 0 8px}.fu .o{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.fu button{border:0;border-radius:13px;padding:9px 13px;font:inherit;font-size:13.5px;background:#f0eefb;color:#2d2a4a;cursor:pointer}.fu button.m{background:linear-gradient(135deg,#7aa7ff,#c08cff 60%,#ff9cc7);color:#fff}.fu p{margin:8px 0 0;color:#4a4566}.fu .x{float:left;background:transparent;padding:0 4px;color:#9a93b8}.fu input[type=time],.fu input[type=date],.fu select{border:1px solid #ddd6f3;border-radius:10px;padding:6px 8px;font:inherit;background:#fff;color:#2d2a4a;min-height:36px}.fu label{display:inline-flex;gap:6px;align-items:center;font-size:13px}.fu .row2{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:6px 0}.fu .note{font-size:12px;color:#8a83a8;margin-top:6px;display:block}.fu-set{font-size:12.5px;color:#7a6aa8;background:none!important;padding:4px 2px!important;text-decoration:underline}.fu hr{border:0;border-top:1px dashed #e2dcf3;margin:10px 0}';
var box=null,settingsOpen=false,cycleForm=false;
function place(){var home=document.getElementById('sw-home');if(!home)return null;if(!box){box=document.createElement('div');box.id='fuToday';var h2=$('.sw-hero h2',home);if(h2)h2.parentNode.insertBefore(box,h2);else home.prepend(box)}return box}
function special(){ // questions/alerts that are not about one product, in priority order
  var l=life();
  if(careful(l)&&hasRetinoid()&&(rj(K_ANS,{})._life||{}).ret!==l.state)return {kind:'lifeRet',html:'<div class="fu" data-sp="lifeRet"><small class="k">مهم، برای خودت و کوچولوت 🌸</small><b>توی روتینت رتینوئید هست.</b><p>در بارداری، شیردهی یا وقتی برای بارداری برنامه داری، رتینوئیدها (مثل رتینول) رو کنار بذار و قبل از ادامه با پزشک یا ماماات هماهنگ کن. گزینه‌های ملایم‌تر رو کنارت پیدا می‌کنیم.</p><div class="o" style="margin-top:8px"><button type="button" class="m" data-sp-ok="1">باشه، متوجه شدم</button></div></div>'};
  if(ids().length&&lifeDue())return {kind:'life',html:'<div class="fu" data-sp="life"><small class="k">یه سؤال یک‌باره و خصوصی</small><b>'+(l.state==='pregnant'?'قشنگم، هنوز باردار هستی یا کوچولوت به دنیا اومده؟':'عزیزم، الان باردار یا شیرده هستی، یا برای بارداری برنامه داری؟')+'</b><div class="o">'+LIFE_OPTS.map(function(o,i){return '<button type="button" data-life="'+o[0]+'"'+(i===0?' class="m"':'')+'>'+o[1]+'</button>'}).join('')+'</div><span class="note">فقط روی همین گوشی می‌مونه و فقط برای اینه که محصولی که الان برات مناسب نیست پیشنهاد نشه. یک بار می‌پرسم؛ هر وقت عوض شد از «⚙️ تنظیمات من» تغییرش بده.</span></div>'};
  return null}
function cycleCard(){var c=life().cycle||{};
  if(cycleForm)return '<div class="fu" data-sp="cycle"><small class="k">چرخه‌ی ماهانه</small><b>آخرین بار کِی شروع شد؟ (تقریبی هم کافیه)</b><div class="row2"><input type="date" id="fuCycLast" max="'+tday()+'" value="'+esc(c.last||'')+'"><label>معمولاً هر<select id="fuCycLen">'+[21,24,26,28,30,32,35].map(function(n){return '<option value="'+n+'"'+((Number(c.len)||28)===n?' selected':'')+'>'+fa(n)+'</option>'}).join('')+'</select>روز</label></div><div class="o"><button type="button" class="m" data-cyc-save="1">ذخیره</button><button type="button" data-cyc-no="1">نه، ممنون</button></div><span class="note">فقط روی همین گوشی می‌مونه.</span></div>';
  return '<div class="fu" data-sp="cycle"><small class="k">یه سؤال یک‌باره</small><b>دوست داری چرخه‌ی ماهانه‌ت رو هم در نظر بگیرم؟ 🌙</b><p>قبل و حین پریود، پوست ممکنه موقتاً جوش، پف یا حساسیت داشته باشه. اگه بدونم، عکس‌ها رو به روزای منصفانه‌تر می‌برم و جوش هورمونی رو با واکنش به محصول اشتباه نمی‌گیرم.</p><div class="o" style="margin-top:8px"><button type="button" class="m" data-cyc-yes="1">آره</button><button type="button" data-cyc-no="1">نه، ممنون</button></div><span class="note">فقط روی همین گوشی می‌مونه؛ هر وقت خواستی از «⚙️ تنظیمات من» عوضش کن.</span></div>'}
function taskCard(x,more){var q=x.q,opts=q.opts.slice(),note='';
  if(q.photo&&nearPeriod()){note='<span class="note">اگه این روزا پریودی یا نزدیکشی، پوست ممکنه موقتاً پف یا جوش داشته باشه؛ می‌تونی عکس رو چند روز دیگه بگیری تا مقایسه منصفانه باشه.</span>';opts.push(['p4','چند روز دیگه یادم بنداز'])}
  return '<div class="fu" data-id="'+esc(x.id)+'" data-c="'+x.c+'"><small class="k">کار امروز · '+esc(q.title)+'</small><b>'+esc(q.q)+'</b><div class="o">'+opts.map(function(o,i){return '<button type="button" data-fu="'+o[0]+'"'+(i===0?' class="m"':'')+'>'+esc(o[1])+'</button>'}).join('')+(q.photo?'<button type="button" data-fu-photo="1">📷 دفترچه‌ی عکس</button>':'')+'</div>'+note+(more?'<p style="font-size:12px;color:#8a83a8">'+fa(more)+' کار دیگه هم داری؛ بعد از این نشونت می‌دم.</p>':'')+'</div>'}
function render(msg){var el=place();if(!el)return;var h='';
  if(msg)h='<div class="fu"><small class="k">کار امروز</small><b>ثبت شد 💜</b><p>'+esc(msg)+'</p></div>';
  else{var sp=special(),t=tasks(),st=stagger();
    if(sp)h=sp.html;else if(t.length)h=taskCard(t[0],t.length-1);
    else if(cycleDue())h=cycleCard();
    else if(st)h='<div class="fu" data-stag="'+esc(st.key)+'"><button type="button" class="x" data-fu-x="1" aria-label="بستن">✕</button><small class="k">یه نکته‌ی مهم</small><b>«'+esc(st.a.name)+'» و «'+esc(st.b.name)+'» رو با هم شروع کردی.</b><p>برای اینکه بفهمی نتیجه (خوب یا بد) از کدومه، یکی رو دو هفته دیرتر شروع کن. اگه پوستت حساسه، این‌طوری کمتر هم تحریک می‌شه.</p></div>';
    h+=notifBlock()}
  h+=settingsOpen?settingsHtml():(ids().length?'<button type="button" class="fu-set" data-set-open="1">⚙️ یادآورها و تنظیمات من</button>':'');
  el.innerHTML=h;writePlan()}
function answer(id,c,v){var ans=rj(K_ANS,{}),q=ask(info(id),Number(c));
  (ans[id]||(ans[id]={}))[c]=v==='p4'?{v:'later',at:dstr(dnum(tday())+3)}:{v:v,at:tday()};wj(K_ANS,ans);track('followup_answer');
  var r=v==='p4'?'باشه قشنگم، چند روز دیگه دوباره یادت می‌ندازم 🌙':(REPLY[q.k]||{})[v]||'ثبت شد 💜';
  if(q.k==='purge'&&(v==='same'||v==='new')&&premenstrual())r+=' این روزها نزدیک پریودت هم هست؛ بخشی از جوش‌ها ممکنه هورمونی باشه. یک هفته بعد دوباره نگاه کن.';
  render(r);setTimeout(function(){render()},v==='later'||v==='p4'?2500:9000)}

/* ---------- reminders outside the app (one setting, shared with the پیگیری tab) ---------- */
var standalone=false;try{standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){}
var ios=/iphone|ipad|ipod/i.test(navigator.userAgent),canPush='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
var TIME=/^([01]\d|2[0-3]):[0-5]\d$/;
function notif(){var n=rj(K_NOTIF,{}),r=rj('bw_reminder_v1',{});n.am=TIME.test(n.am||'')?n.am:TIME.test(r.morning||'')?r.morning:(TIME.test(n.time||'')?n.time:'09:00');n.pm=TIME.test(n.pm||'')?n.pm:TIME.test(r.evening||'')?r.evening:'21:00';
  if(n.amOn===undefined)n.amOn=n.daily!==undefined?!!n.daily:true;if(n.pmOn===undefined)n.pmOn=false;return n}
function saveNotif(n){wj(K_NOTIF,n);var r={enabled:!!(n.amOn||n.pmOn),morning:n.am,evening:n.pm};wj('bw_reminder_v1',r);mirror=JSON.stringify(r)}
var mirror='';
function granted(){return typeof Notification!=='undefined'&&Notification.permission==='granted'}
function notifBlock(){var n=notif(),has=ids().length>0;if(!has||(n.on&&granted()))return '';
  if(n.hide&&Date.now()-n.hide<14*DAY)return '';
  if(ios&&!standalone)return '<div class="fu"><b>یادآور روی گوشی 🔔</b>برای اینکه روزای مهم روتینت رو روی گوشیت یادت بندازم، اول بیوتی‌ولت رو از دکمه‌ی اشتراک‌گذاری Safari «به صفحه‌ی اصلی» اضافه کن و از آیکن خودش باز کن.<div class="o" style="margin-top:6px"><button type="button" data-fu-later="1">بعداً</button></div></div>';
  if(!canPush||(typeof Notification!=='undefined'&&Notification.permission==='denied'))return '';
  return '<div class="fu"><b>یادآور روی گوشی 🔔</b>روزای مهم روتینت (روز ۳ هر محصول، عکس هفته‌ی ۴ و ۸) رو هر ساعتی که دوست داری روی گوشیت یادت بندازم؟'+timeRows(n)+'<div class="o" style="margin-top:8px"><button type="button" class="m" data-fu-on="1">روشنش کن</button><button type="button" data-fu-later="1">بعداً</button></div></div>'}
function timeRows(n){return '<div class="row2"><label><input type="checkbox" id="fuAmOn"'+(n.amOn?' checked':'')+'> صبح‌ها</label><input type="time" id="fuAm" value="'+n.am+'" step="60"></div><div class="row2"><label><input type="checkbox" id="fuPmOn"'+(n.pmOn?' checked':'')+'> شب‌ها هم یادم بنداز</label><input type="time" id="fuPm" value="'+n.pm+'" step="60"></div><span class="note">ساعت رو هر چی بخوای بذار (به وقت ایران). روزهایی که کار مهمی داری، پیامش همون ساعت میاد؛ بقیه‌ی روزها فقط اگه تیک زده باشی.</span>'}
function readTimes(n){var a=($('#fuAm')||{}).value,p=($('#fuPm')||{}).value;if(TIME.test(a||''))n.am=a;if(TIME.test(p||''))n.pm=p;var ao=$('#fuAmOn'),po=$('#fuPmOn');if(ao)n.amOn=ao.checked;if(po)n.pmOn=po.checked;return n}
function settingsHtml(){var n=notif(),l=life(),c=l.cycle||{},st;
  st=n.on&&granted()?'روشن ✓':ios&&!standalone?'برای روشن شدن، اپ رو به صفحه‌ی اصلی اضافه کن':!canPush?'این مرورگر اعلان رو پشتیبانی نمی‌کنه':(typeof Notification!=='undefined'&&Notification.permission==='denied')?'اجازه‌ی اعلان در تنظیمات گوشی بسته است':'خاموش';
  return '<div class="fu" id="fuSettings"><button type="button" class="x" data-set-close="1" aria-label="بستن">✕</button><small class="k">⚙️ تنظیمات من</small><b>یادآور روی گوشی: '+st+'</b>'+timeRows(n)+'<hr><b>شرایط من</b><div class="row2"><select id="fuLife"><option value="">انتخاب کن</option>'+LIFE_OPTS.map(function(o){return '<option value="'+o[0]+'"'+(l.state===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+(l.state==='pb'?'<option value="pb" selected>بارداری یا شیردهی (از پروفایل)</option>':'')+'</select></div>'+
    '<div class="row2"><label><input type="checkbox" id="fuCycOn"'+(c.on?' checked':'')+'> چرخه‌ی ماهانه‌م رو در نظر بگیر</label></div><div class="row2"><label>آخرین شروع <input type="date" id="fuCycLast2" max="'+tday()+'" value="'+esc(c.last||'')+'"></label><label>هر<select id="fuCycLen2">'+[21,24,26,28,30,32,35].map(function(x){return '<option value="'+x+'"'+((Number(c.len)||28)===x?' selected':'')+'>'+fa(x)+'</option>'}).join('')+'</select>روز</label></div><span class="note">این‌ها فقط روی همین گوشی ذخیره می‌شن و هیچ‌جا فرستاده نمی‌شن.</span>'+
    '<div class="o" style="margin-top:8px"><button type="button" class="m" data-set-save="1">ذخیره</button></div></div>'}
function b64u(s){var p=(s+'===').slice(0,s.length+(4-s.length%4)%4).replace(/-/g,'+').replace(/_/g,'/'),b=atob(p),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
function subscribe(){return Notification.requestPermission().then(function(p){if(p!=='granted')throw Error('denied');return navigator.serviceWorker.ready})
  .then(function(reg){return fetch('/api/push/key',{cache:'no-store'}).then(function(r){return r.json()}).then(function(k){return reg.pushManager.getSubscription().then(function(s){return s||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(k.key)})})}).then(function(sub){
    try{if(reg.periodicSync)reg.periodicSync.register('bw-daily',{minInterval:12*3600e3}).catch(function(){})}catch(e){}return sub})})}
function enable(n,quiet){n=n||readTimes(notif());
  return subscribe().then(function(sub){n.on=true;n.endpoint=sub.endpoint;n.sig='';saveNotif(n);track('notif_on');return syncSub(sub,true).then(function(ok){if(!ok)throw Error('server');return sub})})
  .then(function(){if(quiet)return true;return fetch('/api/push/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:notif().endpoint})}).then(function(r){return r.ok},function(){return false})})
  .then(function(ok){settingsOpen=false;render(quiet?'تنظیمات یادآورت ذخیره شد 🔔 '+whenText():ok?'یادآور روشن شد 🔔 یه اعلان آزمایشی هم فرستادم. '+whenText():'یادآور روشن شد، ولی اعلان آزمایشی نرسید؛ تیم بیوتی‌ولت بررسی می‌کنه. یادآورهای داخل اپ همچنان کار می‌کنن.')})
  .catch(function(e){settingsOpen=false;render(e&&e.message==='denied'?'اجازه‌ی اعلان داده نشد. اگه خواستی بعداً از تنظیمات گوشی برای بیوتی‌ولت روشنش کن.':'فعلاً ذخیره نشد؛ اینترنت رو چک کن و دوباره امتحان کن.')})}
function whenText(){var n=notif();return n.amOn&&n.pmOn?'صبح‌ها ساعت '+fa(n.am)+' و شب‌ها ساعت '+fa(n.pm)+'.':n.pmOn&&!n.amOn?'شب‌ها ساعت '+fa(n.pm)+'.':'صبح‌ها ساعت '+fa(n.am)+'.'}
function taskSlot(n){return n.amOn||!n.pmOn?'am':'pm'}
var lastSig='';
function syncSub(sub,force){var n=notif();if(!n.on)return Promise.resolve(false);var days=planDays().filter(function(x){return x.task}).map(function(x){return x.date});
  var body={am:n.am,pm:n.pm,amDaily:!!n.amOn,pmDaily:!!n.pmOn,taskSlot:taskSlot(n),days:days},sig=JSON.stringify(body);if(!force&&(sig===lastSig||sig===n.sig))return Promise.resolve(true);lastSig=sig;
  var dev='';try{dev=localStorage.getItem('bw_device')||''}catch(e){}
  return (sub?Promise.resolve(sub):navigator.serviceWorker.ready.then(function(r){return r.pushManager.getSubscription()})).then(function(s){if(!s){n.on=false;saveNotif(n);return false}
    body.sub=s.toJSON();body.d=dev;return fetch('/api/push/sub',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){if(r.ok){n.sig=sig;saveNotif(n)}return r.ok})}).catch(function(){lastSig='';return false})}

/* next 30 days of messages, written on the phone for the service worker */
function planDays(){var out=[],t0=dnum(tday()),s=starts();for(var k=0;k<30;k++){var d=dstr(t0+k),t=tasks(d).filter(function(x){return dnum(d)===dnum(s[x.id])+x.c});
  out.push({date:d,task:t.length>0,title:t.length?'بیوتی‌ولت 💎 '+t[0].q.title:'',body:t.length?t[0].q.q:''})}return out}
function slotNames(slot){var tm=rj('bw_check_times',{});var safe=careful();return ids().filter(function(id){return (tm[id]||(info(id).kind==='spf'?'am':'pm'))===slot&&!(safe&&info(id).kind==='retinoid')}).map(function(id){return info(id).name}).slice(0,2)}
function morning(){var names=slotNames('am');return {title:'صبحت بخیر قشنگم 🌸',body:names.length?'پوستت منتظر '+names.join(' و ')+'ـه 💜 یه دقیقه برای خودت؛ بعدش یه تیک کوچولو توی بیوتی‌ولت.':'یه صبح آروم برات آرزو می‌کنم 🌤 ضدآفتابت رو قبل از بیرون رفتن فراموش نکن.'}}
function evening(){var names=slotNames('pm');return {title:'شبت آروم عزیزم 🌙',body:names.length?'قبل از خواب، '+names.join(' و ')+(names.length>1?' منتظرتن':' منتظرته')+' 💜 پوستت شب‌ها خودش رو ترمیم می‌کنه.':'قبل از خواب صورتت رو بشور و یه مرطوب‌کننده بزن؛ پوستت ازت ممنون می‌شه 💜'}}
function idb(){return new Promise(function(ok,bad){var r=indexedDB.open('bw-followup',1);r.onupgradeneeded=function(){r.result.createObjectStore('kv')};r.onsuccess=function(){ok(r.result)};r.onerror=function(){bad(r.error)}})}
var planSig='';
function writePlan(){var n=notif(),days=planDays().filter(function(x){return x.task}).map(function(x){return {date:x.date,title:x.title,body:x.body}});
  var plan={days:days,am:n.amOn?morning():null,pm:n.pmOn?evening():null,amTime:n.am,pmTime:n.pm,taskSlot:taskSlot(n),time:n.am},sig=JSON.stringify(plan);if(sig===planSig)return;planSig=sig;
  idb().then(function(db){var t=db.transaction('kv','readwrite');t.objectStore('kv').put(plan,'plan')}).catch(function(){});
  if(n.on)syncSub(null,false)}

/* ---------- wiring ---------- */
function init(){if(!document.getElementById('sw-home'))return setTimeout(init,500);
  var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);adoptProfileFlag();mirror=JSON.stringify(rj('bw_reminder_v1',{}));render();
  document.addEventListener('click',function(e){var b=e.target.closest('#fuToday button');if(!b)return;var card=b.closest('[data-id]'),d=b.dataset;
    if(d.fu&&card)return answer(card.dataset.id,card.dataset.c,d.fu);
    if(d.fuPhoto){if(typeof window.switchTab==='function')window.switchTab('track');setTimeout(function(){var j=document.getElementById('skinJournal');j&&j.scrollIntoView({behavior:'smooth',block:'start'})},300);return}
    if(d.fuX){var s=b.closest('[data-stag]');if(s)wj(K_STAG,s.dataset.stag);return render()}
    if(d.life){var l=setLife(d.life);track('life_set');return render(l.state==='none'||l.state==='private'?'ممنونم که گفتی 🌸 دیگه نمی‌پرسم، مگر خودت از تنظیماتت عوضش کنی.':'ممنونم که گفتی قشنگم 🌸 از این به بعد هر پیشنهادی با این شرایط سنجیده می‌شه و محصولاتی که الان برات مناسب نیست کنار گذاشته می‌شن.')}
    if(d.spOk){var a=rj(K_ANS,{});a._life={ret:life().state};wj(K_ANS,a);return render()}
    if(d.cycYes){cycleForm=true;return render()}
    if(d.cycNo){var l2=life();l2.cycle={asked:true,on:false};wj(K_LIFE,l2);cycleForm=false;return render('باشه عزیزم، دیگه نمی‌پرسم 🌸')}
    if(d.cycSave){var last=($('#fuCycLast')||{}).value,len=Number(($('#fuCycLen')||{}).value)||28;if(!/^\d{4}-\d\d-\d\d$/.test(last||''))return;var l3=life();l3.cycle={asked:true,on:true,last:last,len:len};wj(K_LIFE,l3);cycleForm=false;track('cycle_set');return render('ثبت شد 🌙 از این به بعد عکس‌ها و جوش‌های هورمونی رو با در نظر گرفتن چرخه‌ت می‌سنجم.')}
    if(d.fuOn)return enable();
    if(d.fuLater){var n=notif();n.hide=Date.now();saveNotif(n);return render()}
    if(d.setOpen){settingsOpen=true;return render()}
    if(d.setClose){settingsOpen=false;return render()}
    if(d.setSave){var n2=readTimes(notif()),lv=($('#fuLife')||{}).value;if(lv&&lv!==life().state)setLife(lv);
      var l4=life(),con=($('#fuCycOn')||{}).checked,cl=($('#fuCycLast2')||{}).value;l4.cycle={asked:true,on:!!con&&/^\d{4}-\d\d-\d\d$/.test(cl||''),last:cl||'',len:Number(($('#fuCycLen2')||{}).value)||28};wj(K_LIFE,l4);
      saveNotif(n2);if(n2.amOn||n2.pmOn){if(canPush&&!(ios&&!standalone))return enable(n2,n2.on&&granted());}else if(n2.on){n2.on=false;saveNotif(n2);navigator.serviceWorker.ready.then(function(r){return r.pushManager.getSubscription()}).then(function(s){if(s)fetch('/api/push/sub',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:s.endpoint})})}).catch(function(){})}
      settingsOpen=false;return render('تنظیماتت ذخیره شد 💜')}});
  // keep in step with the routine, the پیگیری-tab reminder settings and the clock
  var last=JSON.stringify(ids());setInterval(function(){var cur=JSON.stringify(ids()),rm=JSON.stringify(rj('bw_reminder_v1',{}));
    if(rm!==mirror){mirror=rm;var r=rj('bw_reminder_v1',{}),n=notif();if(TIME.test(r.morning||''))n.am=r.morning;if(TIME.test(r.evening||''))n.pm=r.evening;if(typeof r.enabled==="boolean"){n.amOn=r.enabled;n.pmOn=r.enabled}wj(K_NOTIF,n);if(r.enabled&&!n.on&&canPush&&granted())enable(n,true);else render()}
    if(cur!==last){last=cur;render()}},3000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)render()});
  if(/[?&]from=notif/.test(location.search))track('notif_open');
  try{navigator.serviceWorker&&navigator.serviceWorker.addEventListener('message',function(e){if(e.data&&e.data.bw==='notif-open'){track('notif_open');render()}})}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.BWFollowup={tasks:tasks,plan:planDays,render:render,life:life,careful:careful};
})();
