/* BeautyWallet v148 — «مراقبت روزانه»: reports that turn her own daily data into a decision.
   Revenue model v2 (docs/strategy/12-revenue-model-v2.md): the daily habit (ticks, reminders, day-7 photo compare) stays free
   forever; understanding the change is paid, and only after she has felt it:
   - گزارش ۴ هفته‌ای (cfg.reportPrice, 2): her last 28 days — how many days the routine was done, morning/night, sunscreen,
     what each product did by her own follow-up answers, what the calm program found.
   - تنظیم روتین (cfg.tunePrice, 2): rule-based next steps from the same data (keep / stop / give time / add / alternate nights).
   - روتین فصل (cfg.seasonPrice, 1): Tehran season × her skin type × her products' textures.
   Honesty: built only from her data on this phone; counts, never a percentage under 10 samples; «هنوز زوده» when the data is
   too thin — and then nothing is charged. «ولت پلاس» covers all three (the server's spendN returns 'sub').
   Storage: one NEW key, bw_care_v1 (what she opened and when). Nothing else is written. */
(function(){'use strict';
var DAY=864e5,K='bw_care_v1',STEPS=['am-cleanse','am-care','am-spf','pm-cleanse','pm-active','pm-moist'];
function rj(k,d){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}}
function wj(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fa(n){return String(n).replace(/\d/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d]})}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function teh(t){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran'}).format(new Date(t))}
function dnum(s){var p=String(s).slice(0,10).split('-');return Math.round(Date.UTC(+p[0],p[1]-1,+p[2])/DAY)}
function track(n){try{window.bwTrack&&window.bwTrack(n)}catch(e){}}
function F(id){try{return window.BWCatalog&&BWCatalog.formula(id)||null}catch(e){return null}}
function pname(id){var f=F(id);if(f&&f.name)return f.name;try{var L=window.PRODUCTS||[];for(var i=0;i<L.length;i++)if(L[i].id===id)return L[i].name}catch(e){}return 'محصولت'}
function routine(){var r=rj('bw_check_products',[]);return Array.isArray(r)?r.map(String):[]}
function profile(){return rj('bw_profile_v1_full',{})||{}}
var STRONG=/^(RETINOID|AHA|BHA|VITC_LAA)$/;

/* ---------- her data, last 28 days ---------- */
function data(){var today=dnum(teh(Date.now())),days=[],first=null;
  for(var i=0;i<120;i++){var k=teh(Date.now()-i*DAY),t=rj('bw_track_'+k,null);if(t&&STEPS.some(function(s){return t[s]===true})){first=i;if(i<28)days.push({k:k,t:t})}}
  var cnt=function(s){return days.filter(function(d){return d.t[s]===true}).length};
  var am=days.filter(function(d){return d.t['am-cleanse']||d.t['am-care']||d.t['am-spf']}).length,pm=days.filter(function(d){return d.t['pm-cleanse']||d.t['pm-active']||d.t['pm-moist']}).length;
  var start=rj('bw_fu_start',{})||{},ans=rj('bw_fu_answers',{})||{};
  var prods=routine().map(function(id){var f=F(id)||{},a=ans[id]||{},s0=start[id]?dnum(start[id]):null,cls=(f.actives||[]).map(function(x){return x.cls});
    var vals=Object.keys(a).sort(function(x,y){return +x - +y}).map(function(c){return {c:+c,v:a[c]&&a[c].v}}).filter(function(x){return x.v&&x.v!=='later'&&x.v!=='done'});
    var bad=vals.some(function(x){return /^(bad|new)$/.test(x.v)}),mild=vals.some(function(x){return /^(mild|peel|tight)$/.test(x.v)}),good=vals.some(function(x){return x.v==='good'}),meh=vals.some(function(x){return x.v==='meh'});
    return {id:id,name:pname(id),role:f.role||'',texture:f.texture||'',strong:cls.some(function(c){return STRONG.test(c)}),retinoid:cls.indexOf('RETINOID')>=0,active:cls.length>0,
      fl:f.flags||[],weeks:s0!=null?Math.floor((today-s0)/7):null,bad:bad,mild:mild,good:good,meh:meh,answered:vals.length}});
  var hist=rj('bw_calm_hist',[]);hist=Array.isArray(hist)?hist:[];
  return {n:days.length,age:first==null?0:first+1,am:am,pm:pm,spf:cnt('am-spf'),moist:cnt('pm-moist'),active:cnt('pm-active'),prods:prods,calm:hist.filter(function(h){return h&&h.end&&today-dnum(h.end)<=60})}}
function enough(D){return D.n>=10&&D.age>=21}

/* ---------- 1) the 4-week report ---------- */
function verdict(p){if(p.bad)return ['⚠️','اذیتت کرده'];if(p.good)return ['✓','گفتی جواب داده'];if(p.mild)return ['〜','کمی کشیدگی، قرمزی یا خشکی داده'];if(p.meh)return ['…','فرقی حس نکردی'];if(!p.answered)return ['؟','هنوز جوابی ثبت نکردی'];return ['✓','مشکلی گزارش نکردی']}
function reportHtml(D){var h='<h3>📊 گزارش ۴ هفته‌ای پوستت</h3><p class="cr-note">فقط از داده‌ی خودت روی همین گوشی ساخته شده.</p>';
  h+='<div class="cr-box"><b>روتینت در ۲۸ روز گذشته</b><div>روزهایی که روتینت رو زدی: <b>'+fa(D.n)+'</b> روز از ۲۸</div><div>صبح: '+fa(D.am)+' روز · شب: '+fa(D.pm)+' روز</div><div>ضدآفتاب صبح: <b>'+fa(D.spf)+'</b> روز · مرطوب‌کننده‌ی شب: '+fa(D.moist)+' روز</div></div>';
  if(D.prods.length)h+='<div class="cr-box"><b>هر محصول با پوستت چه کرد (از جواب‌های خودت)</b>'+D.prods.map(function(p){var v=verdict(p);return '<div class="cr-row"><span>'+v[0]+'</span><span>'+esc(p.name)+'<small>'+v[1]+(p.weeks!=null?' · '+fa(p.weeks)+' هفته':'')+'</small></span></div>'}).join('')+'</div>';
  if(D.calm.length)h+='<div class="cr-box"><b>برنامه‌ی آرام‌سازی</b><div>'+D.calm.map(function(c){return (c.found&&c.found.length?'علت احتمالی: '+esc(c.found.map(pname).join('، ')):'مقصر قطعی پیدا نشد')}).join('<br>')+'</div></div>';
  var tip=D.spf<Math.ceil(D.n/2)?'ضدآفتاب بیشتر از نصف روزها جا افتاده؛ برای لک و چین، ضدآفتاب از هر سرمی مهم‌تره.':D.n<14?'روزهای روتین کم بوده؛ نتیجه‌ی هر محصول با استفاده‌ی منظم معلوم می‌شه.':'روتینت منظم بوده؛ حالا جواب هر محصول قابل اعتماده.';
  h+='<div class="cr-ok">💡 '+tip+'</div><div class="cr-row2"><button type="button" class="cr-go" data-cr="tune">قدم بعد: تنظیم روتین برای ۴ هفته‌ی بعد</button><button type="button" data-cr="season">🍂 روتین '+season()[1]+'</button><button type="button" data-cr="photos">📷 عکس‌هام کنار هم</button></div>';return h}

/* ---------- 2) tune the routine ---------- */
function tune(D){var out=[],slot=rj('bw_check_times',{})||{};
  D.prods.forEach(function(p){
    if(p.bad)out.push(['stop',esc(p.name)+': کنارش بذار. گفتی اذیتت کرده؛ اگه خواستی بدونی مقصر بوده یا نه، «پوستم به هم ریخته» با تست ساعد پیداش می‌کنه.']);
    else if(p.mild&&p.strong)out.push(['slow',esc(p.name)+': هنوز کمی قرمزی یا خشکی داری؛ یک شب در میون بزن و همون شب مرطوب‌کننده رو بیشتر کن.']);
    else if(p.meh&&p.active&&p.weeks!=null&&p.weeks<(p.retinoid?12:8))out.push(['wait',esc(p.name)+': هنوز زوده؛ '+(p.retinoid?'رتینوئید معمولاً ۱۲ هفته':'این ماده معمولاً ۸ هفته')+' طول می‌کشه تا اثرش معلوم بشه. منظم ادامه بده.']);
    else if(p.meh&&p.weeks!=null&&p.weeks>=(p.retinoid?12:8))out.push(['swap',esc(p.name)+': '+fa(p.weeks)+' هفته گذشته و فرقی حس نکردی؛ وقتشه عوضش کنی. قبل از خرید جایگزین، اسمش رو اینجا بسنج.']);
    else if(p.mild)out.push(['slow',esc(p.name)+': گفتی کمی کشیدگی، قرمزی یا خشکی داده. اگه هنوز هست، بعدش مرطوب‌کننده بزن؛ اگه بعد از دو هفته‌ی دیگه هم بود، یه جایگزین ملایم‌تر رو قبل از خرید اینجا بسنج.']);
    else if(p.good)out.push(['keep',esc(p.name)+': نگهش دار، جواب داده.']);
    else if(!p.answered&&p.weeks!=null&&p.weeks>=2)out.push(['ask',esc(p.name)+': هنوز نگفتی باهاش چطوری؛ توی پیگیری روزانه جواب بده تا ماه بعد دقیق‌تر بگم نگهش داری یا نه.'])});
  var roles=D.prods.map(function(p){return p.role});
  if(roles.indexOf('sunscreen')<0)out.push(['add','ضدآفتاب توی روتینت نیست؛ مهم‌ترین قدم بعدیه. یکی با پوستت بسنج و اضافه کن.']);
  else if(D.spf<Math.round(D.n*0.8))out.push(['habit','ضدآفتاب '+fa(D.spf)+' روز از '+fa(D.n)+' روزِ روتینت زده شده؛ کنار مسواک صبح بذارش تا جا نیفته. برای لک و چین، ضدآفتاب منظم از هر سرمی مهم‌تره.']);
  if(roles.indexOf('moisturizer')<0)out.push(['add','مرطوب‌کننده نداری؛ مخصوصاً اگه فعال قوی می‌زنی، لازمه.']);
  var strongPm=D.prods.filter(function(p){return p.strong&&slot[p.id]!=='am'});if(strongPm.length>=2)out.push(['alt',esc(strongPm.map(function(p){return p.name}).join(' و '))+' رو یک شب در میون جدا بزن، نه با هم؛ با هم پوست رو زیاد اذیت می‌کنن.']);
  if(D.n<10)out.push(['simple','روزهای روتین کم بوده؛ این ماه فقط سه قدم اصلی (شستشو، مرطوب‌کننده، ضدآفتاب) رو منظم کن. روتین کوتاه و منظم از روتین بلند و نامنظم بهتر جواب می‌ده.']);
  if(!out.length)out.push(['keep','روتینت همین‌طور خوبه؛ تغییری لازم نیست. ۴ هفته‌ی دیگه دوباره نگاه می‌کنیم.']);
  var ic={stop:'⛔',slow:'🐢',wait:'⏳',swap:'🔄',keep:'✓',add:'➕',habit:'⏰',alt:'↔️',simple:'🌱',ask:'💬'};
  return '<h3>🧭 تنظیم روتین برای ۴ هفته‌ی بعد</h3><p class="cr-note">از جواب‌های خودت به پیگیری‌ها و تیک‌های روزانه‌ت.</p><div class="cr-box">'+out.map(function(x){return '<div class="cr-row"><span>'+ic[x[0]]+'</span><span>'+x[1]+'</span></div>'}).join('')+'</div><p class="cr-note">هر محصول تازه رو یکی‌یکی و با فاصله اضافه کن تا اگه پوستت واکنش داد، بدونی کدوم بوده.</p>'}

/* ---------- 3) the season ---------- */
function pyear(){try{return String(new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric'}).format(new Date())).replace(/\D/g,'')}catch(e){return ''}}
function season(){var m=+new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:'Asia/Tehran',month:'numeric'}).format(new Date());
  return m<=3?['spring','بهار']:m<=6?['summer','تابستون']:m<=9?['autumn','پاییز']:['winter','زمستون']}
function seasonHtml(D){var s=season(),skin=String(profile().skinBase||''),dry=/خشک/.test(skin),oily=/چرب/.test(skin),light=D.prods.some(function(p){return p.role==='moisturizer'&&/gel|water/.test(p.texture)}),rich=D.prods.some(function(p){return p.role==='moisturizer'&&/cream|balm/.test(p.texture)});
  var L=[];if(s[0]==='winter'||s[0]==='autumn'){L.push('آب داغ و دوش طولانی سد پوست رو ضعیف می‌کنه؛ صورتت رو با آب ولرم بشور.');
    L.push(light&&!rich?'مرطوب‌کننده‌ات سبکه؛ برای شب‌ها یه کرم غنی‌تر (با سرامید یا روغن‌های غیرمعطر) اضافه کن یا روی جاهای خشک یه لایه‌ی نازک وازلین بزن.':'مرطوب‌کننده رو روی پوست کمی نم‌دار بزن تا آب رو نگه داره.');
    if(D.prods.some(function(p){return p.strong}))L.push('فعال‌های قوی (اسید، رتینوئید) رو در سرما کم‌تکرارتر کن؛ پوست زودتر خشک و تحریک می‌شه.');
    L.push('ضدآفتاب رو کنار نذار؛ اشعه‌ی UVA زمستون هم هست، مخصوصاً روی برف و در ارتفاع.');if(dry)L.push('پوست خشک تو این فصل بیشتر اذیت می‌شه؛ دستگاه بخور توی اتاق کمک می‌کنه.')}
  else{L.push('ضدآفتاب رو بیرون از خونه هر ۲ تا ۳ ساعت تجدید کن، مخصوصاً بعد از عرق.');
    L.push(rich&&!light?'کرمت غنیه؛ برای روزهای گرم یه مرطوب‌کننده‌ی سبک‌تر (ژل یا لوسیون) بهتره، کرم غنی رو برای شب نگه دار.':'مرطوب‌کننده‌ی سبک کافیه؛ لازم نیست حذفش کنی.');
    if(oily)L.push('پوست چرب تابستون براق‌تر می‌شه؛ با شستن زیاد خشکش نکن، همون دو بار در روز بسه.');
    if(D.prods.some(function(p){return p.strong}))L.push('با رتینوئید یا اسید، پوست به آفتاب حساس‌تره؛ ضدآفتاب رو جدی‌تر بگیر.')}
  return '<h3>🍂 روتین '+s[1]+'</h3><p class="cr-note">برای پوست '+esc(skin||'تو')+' و محصولاتی که الان می‌زنی.</p><div class="cr-box">'+L.map(function(x){return '<div class="cr-row"><span>•</span><span>'+esc(x)+'</span></div>'}).join('')+'</div>'}

/* ---------- sheet, payment, entry ---------- */
var CSS='.cr-sheet{position:fixed;inset:0;z-index:9990;background:rgba(25,18,60,.5);display:flex;align-items:flex-end;justify-content:center}.cr-in{background:#fff;width:100%;max-width:560px;max-height:92vh;overflow:auto;border-radius:22px 22px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom,0px));direction:rtl;line-height:1.9;font-size:14px;color:#241a4f}'+
 '.cr-in h3{margin:0 0 4px;font-size:17px}.cr-note{font-size:12.5px;color:#6d6496;margin:2px 0 6px}.cr-box{background:#f6f3ff;border-radius:14px;padding:10px 12px;margin:8px 0}.cr-ok{background:#eef8f3;color:#24543f;border-radius:14px;padding:9px 12px;margin:8px 0}'+
 '.cr-row{display:flex;gap:8px;align-items:flex-start;padding:4px 0}.cr-row small{display:block;color:#6d6496;font-size:12px}.cr-row2{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.cr-row2 button,.cr-in .cr-close{font:inherit;border:0;border-radius:14px;padding:9px 12px;cursor:pointer;background:#f1edff;color:#241a4f}'+
 '.cr-go{background:linear-gradient(135deg,#7c5cf0,#c86dd7)!important;color:#fff!important;font-weight:800}.cr-offer{display:block;width:100%;text-align:right;font:inherit;border:1px solid #e3ddfb;border-radius:16px;padding:10px 12px;margin:10px 0 0;background:linear-gradient(135deg,#f6f3ff,#fff0f6);cursor:pointer;color:#241a4f}.cr-offer small{display:block;color:#6d6496;font-size:12px}';
function style(){if(document.getElementById('crCss'))return;var s=document.createElement('style');s.id='crCss';s.textContent=CSS;document.head.appendChild(s)}
var cur=null;
function sheet(html){style();if(cur)cur.remove();var o=document.createElement('div');o.className='cr-sheet';o.setAttribute('role','dialog');o.innerHTML='<div class="cr-in">'+html+'<div class="cr-row2"><button type="button" class="cr-close" data-crx="1">بستن</button></div></div>';
  o.addEventListener('click',function(e){if(e.target===o||e.target.closest('[data-crx]')){o.remove();cur=null;return}var b=e.target.closest('[data-cr]');if(b)go(b.dataset.cr,b)});document.body.appendChild(o);cur=o;return o}
var PRICE={report:2,tune:2,season:1};try{fetch('/api/calm/price',{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){['report','tune','season'].forEach(function(k){if(j&&j[k]!=null)PRICE[k]=j[k]})}).catch(function(){})}catch(e){}
function st(){var s=rj(K,{});return s&&typeof s==='object'?s:{}}
// what she already opened stays open: the report and the tune for 28 days, the season for the whole season
function isOpen(kind){var s=st()[kind];if(!s)return false;if(kind==='season')return s.key===season()[0]+'-'+pyear();return Date.now()-Date.parse(s.at)<28*DAY}
function mark(kind){var s=st();s[kind]={at:new Date().toISOString(),key:kind==='season'?season()[0]+'-'+pyear():undefined};wj(K,s)}
function show(kind){var D=data();if(kind==='report')return sheet(reportHtml(D));if(kind==='tune')return sheet(tune(D));if(kind==='season')return sheet(seasonHtml(D))}
var TITLE={report:'گزارش ۴ هفته‌ای پوستت',tune:'تنظیم روتین برای ۴ هفته‌ی بعد',season:'روتین '+season()[1]};
function go(kind,btn){if(kind==='photos'){if(cur){cur.remove();cur=null}if(typeof window.switchTab==='function')window.switchTab('track');setTimeout(function(){var j=document.getElementById('skinJournal');j&&j.scrollIntoView({behavior:'smooth',block:'start'})},350);return}
  open(kind,btn)}
function open(kind,btn){kind=kind||'report';track('care_open');var D=data();
  if((kind==='report'||kind==='tune')&&!enough(D))return sheet('<h3>📊 '+TITLE[kind]+'</h3><div class="cr-box">هنوز زوده عزیزم 💜 برای یه گزارش قابل اعتماد، دست‌کم ۱۰ روز روتینِ تیک‌خورده در ۳ هفته لازمه. تا الان '+fa(D.n)+' روز ثبت شده.</div><p class="cr-note">تا اون موقع هر روز توی «امروز» تیک بزن؛ هیچ الماسی کم نشد.</p>');
  if(isOpen(kind))return show(kind);
  var w=sheet('<h3>'+({report:'📊',tune:'🧭',season:'🍂'}[kind])+' '+TITLE[kind]+'</h3>'+preview(kind,D)+'<div class="cr-row2"><button type="button" class="cr-go" data-crbuy="1">باز کردن با '+fa(PRICE[kind])+' الماس 💎</button></div><p class="cr-note">با «ولت پلاس» همه‌ی گزارش‌ها بدون الماس باز می‌شن.</p>');
  var b=w.querySelector('[data-crbuy]');b.onclick=function(){if(!window.BWCalm||!BWCalm.spend)return;BWCalm.spend(kind,function(){mark(kind);track('care_buy');show(kind)},b)}}
// what she gets, before paying (no part of the result itself)
function preview(kind,D){if(kind==='report')return '<div class="cr-box">'+fa(D.n)+' روز روتین و '+fa(D.prods.length)+' محصول آماده‌ی بررسی‌ان. توی گزارش می‌بینی:<br>• صبح و شب و ضدآفتاب، روز به روز<br>• هر محصول با پوستت چه کرد (از جواب‌های خودت)<br>• نتیجه‌ی برنامه‌ی آرام‌سازی، اگه داشتی<br>• یه نکته‌ی اصلی برای ماه بعد</div>';
  if(kind==='tune')return '<div class="cr-box">برای هر محصول روتینت می‌گم: نگه دار، کم کن، صبر کن یا عوض کن، و چی کم داری. همه از جواب‌ها و تیک‌های خودت.</div>';
  return '<div class="cr-box">تغییر روتین برای '+season()[1]+'، با نوع پوستت و بافت محصولاتی که الان می‌زنی.</div>'}
// the offer on «امروز»: only once the report is worth reading (≥10 ticked days, ≥3 weeks), not if opened in the last 28 days
function offerHtml(){var D=data();if(!enough(D)||isOpen('report'))return '';track('care_offer');
  return '<button type="button" class="cr-offer" data-care="report">📊 گزارش ۴ هفته‌ای پوستت آماده‌ست<small>'+fa(D.n)+' روز روتین و '+fa(D.prods.length)+' محصول؛ ببین چی جواب داد و ماه بعد چی کار کنی</small></button>'}
document.addEventListener('click',function(e){var b=e.target.closest('[data-care]');if(b){e.preventDefault();open(b.dataset.care,b)}});
window.BWCare={open:open,offerHtml:offerHtml,data:data,tune:tune,enough:enough,style:style};
})();
