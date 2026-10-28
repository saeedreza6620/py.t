/* BeautyWallet — skin photo journal + routine log reminders.
   Privacy: photos never leave this device. They are resized on the device and kept in IndexedDB
   (not localStorage, whose ~5MB quota silently dropped full-size photos before). Every save is read
   back and verified before the shopper is told it was saved. A photo is never overwritten: each one
   is a dated entry in a timeline, and the first one is the reference (baseline).
   Comparison schedule: the skin's surface layer renews over roughly 4–6 weeks, so day-to-day photos
   mislead; entries are compared at weeks 2, 4, 8 and 12, then every 4 weeks. Comparison, not diagnosis. */
(function(){'use strict';
var DBN='bw-skin-journal',STORE='photos',LEGACY='bw_face_photo',SEEN='bw_journal_nudge_';
var SCHEDULE=[14,28,56,84];for(var d=112;d<=364;d+=28)SCHEDULE.push(d);
var TAGS=['بهتر شده','بدون تغییر','خشکی','قرمزی','جوش جدید','سوزش یا خارش','لک'];
var MAX_SIDE=1280,DAY=864e5;
var $=function(s,r){return (r||document).querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var fa=function(n){return String(n).replace(/\d/g,function(x){return '۰۱۲۳۴۵۶۷۸۹'[x]})};
function faDate(iso){try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'long',day:'numeric'}).format(new Date(iso))}catch(e){return iso.slice(0,10)}}
function tehranDay(t){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t))}
function dayIndex(iso){var p=tehranDay(iso).split('-');return Math.round(Date.UTC(+p[0],p[1]-1,+p[2])/DAY)}

/* ---------- storage (IndexedDB) ---------- */
var dbp=null;
function db(){if(dbp)return dbp;dbp=new Promise(function(ok,bad){if(!window.indexedDB)return bad(Error('idb'));var r=indexedDB.open(DBN,1);
  r.onupgradeneeded=function(){var s=r.result.createObjectStore(STORE,{keyPath:'id'});s.createIndex('date','date')};
  r.onsuccess=function(){var x=r.result;x.onversionchange=function(){x.close();dbp=null};ok(x)};r.onerror=function(){dbp=null;bad(r.error||Error('idb'))};r.onblocked=function(){bad(Error('blocked'))}});return dbp}
function run(mode,fn){return db().then(function(x){return new Promise(function(ok,bad){var t=x.transaction(STORE,mode),s=t.objectStore(STORE),out;var r=fn(s);if(r)r.onsuccess=function(){out=r.result};t.oncomplete=function(){ok(out)};t.onerror=t.onabort=function(){bad(t.error||Error('tx'))}})})}
function all(){return run('readonly',function(s){return s.getAll()}).then(function(a){return (a||[]).sort(function(x,y){return x.date<y.date?-1:1})})}
function get(id){return run('readonly',function(s){return s.get(id)})}
function del(id){return run('readwrite',function(s){return s.delete(id)})}
function put(e){return run('readwrite',function(s){return s.put(e)}).then(function(){return get(e.id)}).then(function(back){
  if(!back||!back.data||back.data.byteLength!==e.data.byteLength)throw Error('verify');return back})}
var persisted=null;
function askPersist(){try{if(navigator.storage&&navigator.storage.persist)return navigator.storage.persisted().then(function(p){return p||navigator.storage.persist()}).then(function(p){persisted=!!p;return p}).catch(function(){return false})}catch(e){}return Promise.resolve(false)}

/* ---------- photo: resize + compress on the device ---------- */
function loadImage(file){
  if(window.createImageBitmap)return createImageBitmap(file,{imageOrientation:'from-image'}).catch(function(){return createImageBitmap(file)}).catch(function(){return viaImg(file)});
  return viaImg(file)}
function viaImg(file){return new Promise(function(ok,bad){var u=URL.createObjectURL(file),i=new Image();i.onload=function(){ok(i);setTimeout(function(){URL.revokeObjectURL(u)},1000)};i.onerror=function(){URL.revokeObjectURL(u);bad(Error('img'))};i.src=u})}
function toJpeg(src){return new Promise(function(ok,bad){var w=src.width,h=src.height,k=Math.min(1,MAX_SIDE/Math.max(w,h)),c=document.createElement('canvas');
  c.width=Math.round(w*k);c.height=Math.round(h*k);var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(src,0,0,c.width,c.height);
  var tryQ=function(q){c.toBlob(function(b){if(!b)return bad(Error('encode'));if(b.size>900000&&q>0.6)return tryQ(q-0.12);b.arrayBuffer().then(function(buf){ok({data:buf,type:'image/jpeg',w:c.width,h:c.height})},bad)},'image/jpeg',q)};tryQ(0.85)})}
var urls={};function urlOf(e){if(!urls[e.id])urls[e.id]=URL.createObjectURL(new Blob([e.data],{type:e.type||'image/jpeg'}));return urls[e.id]}
function dropUrl(id){if(urls[id]){URL.revokeObjectURL(urls[id]);delete urls[id]}}

/* ---------- routine context (what was in use when the photo was taken) ---------- */
function routineNames(){try{var ids=JSON.parse(localStorage.getItem('bw_check_products')||'[]');if(!Array.isArray(ids)||typeof PRODUCTS==='undefined')return [];
  return ids.map(function(id){var p=PRODUCTS.find(function(x){return x.id===id});return p&&p.name}).filter(Boolean).slice(0,12)}catch(e){return []}}

/* ---------- schedule ---------- */
function plan(list){
  if(!list.length)return {state:'empty'};
  var base=list[0],today=dayIndex(Date.now()),d0=dayIndex(base.date),now=today-d0;
  var last=dayIndex(list[list.length-1].date)-d0,next=null;
  for(var i=0;i<SCHEDULE.length;i++){if(SCHEDULE[i]>last+6){next=SCHEDULE[i];break}}
  if(next===null)return {state:'done',now:now};
  var label=next%7===0?'هفته‌ی '+fa(next/7):'روز '+fa(next);
  return {state:now>=next-1?'due':'wait',now:now,next:next,label:label,left:next-now,dueAt:(d0+next)*DAY}}

/* ---------- routine log (the daily ticks in the پیگیری tab) ---------- */
function ticked(key){try{var t=JSON.parse(localStorage.getItem('bw_track_'+key)||'{}');return Object.keys(t).filter(function(k){return t[k]===true})}catch(e){return []}}
function streak(){var n=0,t=Date.now();if(!ticked(tehranDay(t)).length)t-=DAY;while(n<400&&ticked(tehranDay(t)).length){n++;t-=DAY}return n}
function todayMissing(){var k=ticked(tehranDay(Date.now())),am=k.some(function(x){return x.indexOf('am-')===0}),pm=k.some(function(x){return x.indexOf('pm-')===0});
  var h=+new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tehran',hour:'2-digit',hourCycle:'h23'}).format(new Date());
  var ev=21;try{var r=JSON.parse(localStorage.getItem('bw_reminder_v1')||'{}');if(r.evening)ev=+r.evening.slice(0,2)}catch(e){}
  if(h>=ev&&!pm)return 'شب';if(h>=11&&h<ev&&!am)return 'صبح';return ''}

/* ---------- UI ---------- */
var CSS='.sj h3{margin:0 0 4px}.sj .sj-sub{font-size:13px;color:#5d6b80;line-height:1.9;margin:0 0 10px}.sj-next{border-radius:16px;padding:11px 13px;margin:8px 0 12px;font-size:14px;line-height:1.9;background:#eef6ff;color:#23476b}.sj-next.due{background:#fff1f6;color:#7a2950}.sj-next b{display:block}.sj-row{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0}.sj button,.sj label.sj-btn{border:0;border-radius:14px;padding:10px 14px;font:inherit;font-size:14px;cursor:pointer;background:#f2f4fb;color:#2b3550}.sj .sj-main{background:linear-gradient(135deg,#7aa7ff,#c08cff 60%,#ff9cc7);color:#fff;font-weight:700}.sj-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;margin-top:10px}.sj-item{position:relative;border-radius:14px;overflow:hidden;background:#f4f2fa;border:0;padding:0;cursor:pointer;text-align:right}.sj-item img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block}.sj-item span{display:block;font-size:11px;padding:4px 6px;color:#3b3f55;line-height:1.6}.sj-item i{position:absolute;top:5px;right:5px;font-style:normal;font-size:10px;background:rgba(255,255,255,.9);border-radius:8px;padding:1px 6px}.sj-cmp{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.sj-cmp figure{margin:0}.sj-cmp img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:14px;display:block}.sj-cmp figcaption{font-size:12px;text-align:center;color:#4d5670;margin-top:4px;line-height:1.7}.sj-form{border:1px solid #e3e6f3;border-radius:16px;padding:12px;margin-top:10px;background:#fff}.sj-form img{max-width:140px;border-radius:12px;display:block;margin-bottom:8px}.sj-form label{display:flex;gap:6px;align-items:center;font-size:13px;line-height:2}.sj-tags{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.sj-tags label{background:#f3f1fb;border-radius:12px;padding:2px 10px}.sj-form textarea{width:100%;box-sizing:border-box;min-height:56px;border-radius:12px;border:1px solid #dde1ef;padding:8px;font:inherit;font-size:13px}.sj-msg{font-size:13px;line-height:1.9;margin-top:8px;color:#29506f}.sj-msg.bad{color:#9b2d3c}.sj details{margin-top:10px;font-size:13px;line-height:2;color:#46506a}.sj details summary{cursor:pointer;font-weight:700}.sj-view{position:fixed;inset:0;background:rgba(20,22,35,.86);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:10px}.sj-view img{max-width:100%;max-height:70vh;border-radius:14px}.sj-view p{color:#fff;font-size:13px;line-height:1.9;margin:0;text-align:center;max-width:520px}.sj-streak{font-size:13px;color:#4c3a74;margin:4px 0 0}.sj-nudge{position:fixed;left:12px;right:12px;bottom:84px;z-index:9998;background:#fff;border-radius:18px;box-shadow:0 10px 30px rgba(60,60,120,.22);padding:12px 14px;display:flex;gap:10px;align-items:center;font-size:14px;line-height:1.8;max-width:520px;margin:auto}.sj-nudge b{flex:1}.sj-nudge button{border:0;border-radius:12px;padding:8px 12px;font:inherit;font-size:13px;background:#f2f4fb}.sj-nudge .go{background:linear-gradient(135deg,#7aa7ff,#c08cff);color:#fff}';
var root,pending=null,msgT;
function msg(t,bad){var m=$('.sj-msg',root);if(!m)return;m.textContent=t;m.className='sj-msg'+(bad?' bad':'');clearTimeout(msgT);if(!bad)msgT=setTimeout(function(){m.textContent=''},7000)}
function render(){if(!root)return Promise.resolve();return all().then(function(list){
  var p=plan(list),s=streak(),h='';
  h+='<h3>دفترچه‌ی عکس پوست من</h3><p class="sj-sub">عکس‌ها فقط روی همین گوشی ذخیره می‌شوند و جایی ارسال نمی‌شوند. هر عکس جدا با تاریخ ثبت می‌شود و جای عکس قبلی را نمی‌گیرد. عکس برای مقایسه است، نه تشخیص.</p>';
  if(p.state==='empty')h+='<div class="sj-next"><b>اولین عکس، نقطه‌ی شروع توست.</b>قبل از شروع یک محصول یا روتین تازه ثبتش کن تا بعداً منصفانه مقایسه کنی.</div>';
  else if(p.state==='due')h+='<div class="sj-next due"><b>امروز وقت عکس '+p.label+' است.</b>همان نور و همان فاصله‌ی عکس شروع را رعایت کن تا مقایسه درست باشد.</div>';
  else if(p.state==='wait')h+='<div class="sj-next"><b>عکس بعدی: '+p.label+' ('+(p.left<=1?'فردا':fa(p.left)+' روز دیگر')+')</b>مقایسه‌ی روزبه‌روز گمراه‌کننده است؛ لایه‌ی سطحی پوست حدود ۴ تا ۶ هفته طول می‌کشد تا نو شود.</div>';
  else h+='<div class="sj-next"><b>برنامه‌ی یک‌ساله کامل شد.</b>هر وقت روتین را عوض کردی، یک عکس تازه ثبت کن.</div>';
  if(s>1)h+='<p class="sj-streak">✦ '+fa(s)+' روز پشت سر هم روتینت را ثبت کرده‌ای.</p>';
  h+='<div class="sj-row"><label class="sj-btn sj-main" for="sjFile">'+(list.length?'＋ ثبت عکس تازه':'＋ ثبت عکس شروع')+'</label><input id="sjFile" type="file" accept="image/*" capture="user" hidden>'+(list.length?'<button type="button" data-sj="backup">پشتیبان عکس‌ها</button>':'')+'<label class="sj-btn" for="sjRestore">بازگردانی پشتیبان</label><input id="sjRestore" type="file" accept=".bwjournal,.json,application/json" hidden></div>';
  h+='<div class="sj-slot"></div><div class="sj-msg" role="status" aria-live="polite"></div>';
  if(list.length>1){var a=list[0],b=list[list.length-1];h+='<div class="sj-cmp"><figure><img src="'+urlOf(a)+'" alt="عکس شروع"><figcaption>شروع · '+esc(faDate(a.date))+'</figcaption></figure><figure><img src="'+urlOf(b)+'" alt="آخرین عکس"><figcaption>'+esc(dayLabel(b,a))+' · '+esc(faDate(b.date))+'</figcaption></figure></div>'}
  if(list.length)h+='<div class="sj-grid">'+list.slice().reverse().map(function(e){return '<button type="button" class="sj-item" data-sj-open="'+e.id+'"><img loading="lazy" src="'+urlOf(e)+'" alt=""><i>'+esc(dayLabel(e,list[0]))+'</i><span>'+esc(faDate(e.date))+(e.tags&&e.tags.length?'<br>'+esc(e.tags.slice(0,2).join('، ')):'')+'</span></button>'}).join('')+'</div>';
  h+='<details><summary>چطور عکس قابل‌مقایسه بگیرم؟</summary>هر بار در یک جا و یک نور بایست؛ بهترین نور، نور روز روبه‌روی پنجره است. صورت شسته و بدون آرایش و کرم باشد (حدود ۱۵ دقیقه بعد از شستشو). حالت زیبایی و فیلتر دوربین را خاموش کن. گوشی را به فاصله‌ی یک دست و هم‌سطح چشم نگه دار و مستقیم به دوربین نگاه کن. اگر بخش خاصی مثل گونه یا چانه مهم است، یک عکس نیم‌رخ هم بگیر.<br>اگر سوزش، قرمزی شدید یا تورم دیدی، مصرف محصول تازه را متوقف کن و با پزشک مشورت کن.</details>';
  if(list.length)h+='<p class="sj-sub" style="margin-top:8px">'+(persisted?'مرورگر این عکس‌ها را ماندگار نگه می‌دارد.':'اگر فضای گوشی پر شود یا اطلاعات مرورگر پاک شود، این عکس‌ها هم پاک می‌شوند؛ هر چند وقت یک بار «پشتیبان عکس‌ها» بگیر.')+'</p>';
  revokeUnused(list);root.innerHTML=h;window.dispatchEvent(new CustomEvent('bw-journal',{detail:p}))}).catch(function(){root.innerHTML='<h3>دفترچه‌ی عکس پوست من</h3><p class="sj-sub">این مرورگر اجازه‌ی ذخیره‌ی عکس روی گوشی را نمی‌دهد (مثلاً در حالت خصوصی). در مرورگر معمولی یا نسخه‌ی نصب‌شده باز کن.</p>'})}
function revokeUnused(list){var keep={};list.forEach(function(e){keep[e.id]=1});Object.keys(urls).forEach(function(id){if(!keep[id])dropUrl(id)})}
function dayLabel(e,base){var n=dayIndex(e.date)-dayIndex(base.date);if(e.id===base.id)return 'شروع';if(n<1)return 'همان روز';return n%7===0?'هفته‌ی '+fa(n/7):'روز '+fa(n)}

function pick(file){if(!file)return;if(!/^image\//.test(file.type||'image/'))return msg('لطفاً یک فایل عکس انتخاب کن.',true);if(file.size>25*1024*1024)return msg('این عکس خیلی بزرگ است؛ عکس کوچک‌تری انتخاب کن.',true);
  msg('در حال آماده‌سازی عکس روی گوشی…');
  loadImage(file).then(toJpeg).then(function(img){pending=img;var u=URL.createObjectURL(new Blob([img.data],{type:img.type}));
    $('.sj-slot',root).innerHTML='<form class="sj-form" id="sjForm"><img src="'+u+'" alt="پیش‌نمایش"><b style="font-size:14px">قبل از ذخیره:</b>'+
    '<label><input type="checkbox" name="c1"> بدون آرایش، کرم و فیلتر</label><label><input type="checkbox" name="c2"> همان نور و جای عکس‌های قبلی</label>'+
    '<div style="font-size:13px;margin-top:6px">حال پوست (اختیاری):</div><div class="sj-tags">'+TAGS.map(function(t){return '<label><input type="checkbox" name="tag" value="'+esc(t)+'"> '+esc(t)+'</label>'}).join('')+'</div>'+
    '<textarea name="note" maxlength="300" placeholder="یادداشت کوتاه؛ مثلاً از کدام شب رتینول را شروع کردی"></textarea>'+
    '<label><input type="checkbox" name="consent" required> می‌خواهم این عکس روی همین گوشی ذخیره شود</label>'+
    '<div class="sj-row"><button type="submit" class="sj-main">ذخیره</button><button type="button" data-sj="cancel">انصراف</button></div></form>';
    $('#sjForm img',root).onload=function(){setTimeout(function(){URL.revokeObjectURL(u)},500)};msg('')}).catch(function(){msg('این عکس باز نشد؛ یک عکس JPG یا PNG دیگر امتحان کن.',true)})}
function save(form){if(!pending)return;var fd=new FormData(form);if(!fd.has('consent'))return msg('برای ذخیره، تیک رضایت را بزن.',true);
  var btn=form.querySelector('button[type=submit]');btn.disabled=true;msg('در حال ذخیره و بررسی…');
  var e={id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),date:new Date().toISOString(),data:pending.data,type:pending.type,w:pending.w,h:pending.h,
    bare:fd.has('c1'),sameLight:fd.has('c2'),tags:fd.getAll('tag').map(String).slice(0,7),note:String(fd.get('note')||'').trim().slice(0,300),routine:routineNames(),v:1};
  askPersist().then(function(){return put(e)}).then(function(){pending=null;try{window.bwTrack&&window.bwTrack('journal_photo')}catch(x){}
    return render().then(function(){msg('عکس ذخیره و بازخوانی شد ✓ — روی همین گوشی، با تاریخ '+faDate(e.date)+'.')})})
  .catch(function(err){btn.disabled=false;var full=err&&(err.name==='QuotaExceededError'||/quota/i.test(err.message||''));
    msg(full?'فضای ذخیره‌ی گوشی پر است؛ عکس ذخیره نشد. چند عکس قدیمی را حذف کن یا اول پشتیبان بگیر.':'عکس ذخیره نشد. دوباره امتحان کن؛ اگر باز نشد، مرورگر را از حالت خصوصی خارج کن.',true)})}
function view(id){get(id).then(function(e){if(!e)return;all().then(function(list){var v=document.createElement('div');v.className='sj-view';v.setAttribute('role','dialog');
  v.innerHTML='<img src="'+urlOf(e)+'" alt=""><p>'+esc(dayLabel(e,list[0]))+' · '+esc(faDate(e.date))+(e.tags&&e.tags.length?'<br>'+esc(e.tags.join('، ')):'')+(e.note?'<br>'+esc(e.note):'')+(e.routine&&e.routine.length?'<br><small>روتین آن زمان: '+esc(e.routine.join('، '))+'</small>':'')+(e.bare===false||e.sameLight===false?'<br><small>این عکس با شرایط استاندارد گرفته نشده؛ در مقایسه احتیاط کن.</small>':'')+'</p><div class="sj-row"><button type="button" data-v="close">بستن</button><button type="button" data-v="del">حذف این عکس</button></div>';
  v.addEventListener('click',function(ev){var b=ev.target.closest('button');if(ev.target===v||(b&&b.dataset.v==='close'))return v.remove();
    if(b&&b.dataset.v==='del'){if(!confirm('این عکس از گوشی حذف شود؟ این کار برگشت‌پذیر نیست مگر پشتیبان داشته باشی.'))return;del(e.id).then(function(){dropUrl(e.id);v.remove();render().then(function(){msg('عکس حذف شد.')})})}});
  document.body.appendChild(v)})})}

/* ---------- backup / restore (a file on the shopper's own phone) ---------- */
function b64(buf){var s='',a=new Uint8Array(buf);for(var i=0;i<a.length;i+=32768)s+=String.fromCharCode.apply(null,a.subarray(i,i+32768));return btoa(s)}
function unb64(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer}
function backup(){all().then(function(list){if(!list.length)return;var out={app:'BeautyWallet',kind:'skin-journal',version:1,exported:new Date().toISOString(),photos:list.map(function(e){var c={};for(var k in e)if(k!=='data')c[k]=e[k];c.data=b64(e.data);return c})};
  var blob=new Blob([JSON.stringify(out)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='BeautyWallet-skin-photos-'+tehranDay(Date.now())+'.bwjournal';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},30000);
  try{localStorage.setItem('bw_journal_backup',new Date().toISOString())}catch(x){}
  msg('فایل پشتیبان ('+fa(Math.max(1,Math.round(blob.size/1e6)))+' مگابایت) روی گوشی‌ات ذخیره شد. آن را جای امن نگه دار؛ عکس‌ها داخلش هستند.')}).catch(function(){msg('پشتیبان ساخته نشد؛ دوباره امتحان کن.',true)})}
function restore(file){if(!file)return;msg('در حال بازگردانی…');file.text().then(function(t){var j=JSON.parse(t);if(!j||j.kind!=='skin-journal'||!Array.isArray(j.photos))throw Error('format');
  return all().then(function(have){var ids={};have.forEach(function(e){ids[e.id]=1});var add=j.photos.filter(function(p){return p&&typeof p.id==='string'&&!ids[p.id]&&typeof p.data==='string'&&/^\d{4}-\d\d-\d\dT/.test(p.date||'')}).slice(0,400);
    return add.reduce(function(chain,p){return chain.then(function(){return put({id:p.id.slice(0,40),date:p.date,data:unb64(p.data),type:'image/jpeg',w:+p.w||0,h:+p.h||0,bare:!!p.bare,sameLight:!!p.sameLight,tags:(Array.isArray(p.tags)?p.tags:[]).map(String).slice(0,7),note:String(p.note||'').slice(0,300),routine:(Array.isArray(p.routine)?p.routine:[]).map(String).slice(0,12),v:1})})},askPersist()).then(function(){return add.length})})})
  .then(function(n){return render().then(function(){msg(n?fa(n)+' عکس بازگردانی شد ✓':'عکس تازه‌ای در این فایل نبود؛ همه قبلاً روی گوشی بودند.')})}).catch(function(){msg('این فایل پشتیبانِ دفترچه‌ی عکس بیوتی‌ولت نیست یا خراب است.',true)})}

/* ---------- one-time move of the old single photo (localStorage) into the journal ---------- */
function migrate(){var raw='';try{raw=localStorage.getItem(LEGACY)||''}catch(e){return Promise.resolve()}
  var m=/^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$/.exec(raw);if(!m){if(raw)try{localStorage.removeItem(LEGACY)}catch(e){}return Promise.resolve()}
  var blob=new Blob([unb64(m[2])],{type:m[1]});
  return loadImage(blob).then(toJpeg).then(function(img){return put({id:'legacy-face',date:new Date().toISOString(),data:img.data,type:img.type,w:img.w,h:img.h,bare:true,sameLight:true,tags:[],note:'عکس مرجعی که قبلاً ثبت کرده بودی (تاریخ دقیقش ذخیره نشده بود).',routine:[],v:1,migrated:true})})
    .then(function(){try{localStorage.removeItem(LEGACY)}catch(e){}}).catch(function(){/* keep the old copy if anything fails */})}

/* ---------- gentle reminders when the app opens (once a day each) ---------- */
function nudge(text,go){var k=SEEN+tehranDay(Date.now())+'-'+go;try{if(localStorage.getItem(k))return;localStorage.setItem(k,'1')}catch(e){return}
  var n=document.createElement('div');n.className='sj-nudge';n.setAttribute('role','status');n.innerHTML='<b>'+esc(text)+'</b><button type="button" class="go">برو</button><button type="button" aria-label="بستن">✕</button>';
  n.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;n.remove();if(b.classList.contains('go')&&typeof window.switchTab==='function'){window.switchTab('track');setTimeout(function(){var t=go==='photo'?root:document.querySelector('#track .track-grid');t&&t.scrollIntoView({behavior:'smooth',block:'start'})},250)}});
  document.body.appendChild(n);setTimeout(function(){n.remove()},14000)}
function nudges(){all().then(function(list){var p=plan(list);if(p.state==='due')return nudge('امروز وقت عکس '+p.label+' پوستت است؛ یک دقیقه طول می‌کشد.','photo');
  var miss=todayMissing();if(miss)nudge('روتین '+miss+' امروز هنوز ثبت نشده؛ فقط تیکش را بزن.','routine')}).catch(function(){})}

/* ---------- public API (used by the calendar export in routine-reminder.js) ---------- */
window.BWSkinJournal={plan:function(){return all().then(plan)},upcoming:function(){return all().then(function(list){if(!list.length)return [];var d0=dayIndex(list[0].date),last=dayIndex(list[list.length-1].date)-d0;
  return SCHEDULE.filter(function(c){return c>last+6}).slice(0,4).map(function(c){return {day:c,label:c%7===0?'هفته‌ی '+fa(c/7):'روز '+fa(c),date:new Date((d0+c)*DAY).toISOString().slice(0,10)}})})},render:render};

function init(){root=document.getElementById('skinJournal');if(!root)return;root.classList.add('sj');
  var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  root.addEventListener('change',function(e){if(e.target.id==='sjFile'){pick(e.target.files&&e.target.files[0]);e.target.value=''}if(e.target.id==='sjRestore'){restore(e.target.files&&e.target.files[0]);e.target.value=''}});
  root.addEventListener('submit',function(e){if(e.target.id==='sjForm'){e.preventDefault();save(e.target)}});
  root.addEventListener('click',function(e){var b=e.target.closest('[data-sj],[data-sj-open]');if(!b)return;if(b.dataset.sjOpen)return view(b.dataset.sjOpen);
    if(b.dataset.sj==='cancel'){pending=null;$('.sj-slot',root).innerHTML='';msg('')}if(b.dataset.sj==='backup')backup()});
  try{if(navigator.storage&&navigator.storage.persisted)navigator.storage.persisted().then(function(p){persisted=p})}catch(e){}
  migrate().then(render).then(function(){setTimeout(nudges,2500)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
