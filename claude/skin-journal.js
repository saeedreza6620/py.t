/* BeautyWallet — skin photo journal + routine log reminders.
   Privacy model (end-to-end encrypted backup):
   - Photos are resized on the phone and kept in IndexedDB (verified by reading back before "saved").
   - A copy is encrypted ON THE PHONE (AES-GCM 256) and only that ciphertext is sent to /api/vault.
   - The key comes from a recovery code made on the phone (160 random bits). From it, HKDF derives three
     independent values: the vault id, an access token (the server keeps only its SHA-256) and the
     encryption key (never leaves the phone). The server cannot derive the key, so nobody there —
     including the BeautyWallet team — can open a photo. With the code, photos come back on any phone.
   - Each photo is a dated entry; nothing is overwritten. Comparison at weeks 2/4/8/12 then every 4 weeks
     (the skin's surface layer renews over roughly 4–6 weeks). Comparison, not diagnosis. */
(function(){'use strict';
var DBN='bw-skin-journal',STORE='photos',LEGACY='bw_face_photo',SEEN='bw_journal_nudge_',VK='bw_vault_v1',VDEL='bw_vault_del';
var SCHEDULE=[14,28,56,84];for(var d=112;d<=364;d+=28)SCHEDULE.push(d);
var TAGS=['بهتر شده','بدون تغییر','خشکی','قرمزی','جوش جدید','سوزش یا خارش','لک'];
var MAX_SIDE=1024,TARGET=260000,MAX_PHOTOS=30,DAY=864e5;
var $=function(s,r){return (r||document).querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var fa=function(n){return String(n).replace(/\d/g,function(x){return '۰۱۲۳۴۵۶۷۸۹'[x]})};
function faDate(iso){try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'long',day:'numeric'}).format(new Date(iso))}catch(e){return String(iso).slice(0,10)}}
function tehranDay(t){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t))}
function dayIndex(iso){var p=tehranDay(iso).split('-');return Math.round(Date.UTC(+p[0],p[1]-1,+p[2])/DAY)}
function readJ(k,dflt){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?dflt:v}catch(e){return dflt}}
function writeJ(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}

/* ---------- storage on the phone (IndexedDB) ---------- */
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

/* ---------- photo: resize + compress on the phone ---------- */
function loadImage(file){
  if(window.createImageBitmap)return createImageBitmap(file,{imageOrientation:'from-image'}).catch(function(){return createImageBitmap(file)}).catch(function(){return viaImg(file)});
  return viaImg(file)}
function viaImg(file){return new Promise(function(ok,bad){var u=URL.createObjectURL(file),i=new Image();i.onload=function(){ok(i);setTimeout(function(){URL.revokeObjectURL(u)},1000)};i.onerror=function(){URL.revokeObjectURL(u);bad(Error('img'))};i.src=u})}
function toJpeg(src){return new Promise(function(ok,bad){var side=MAX_SIDE;
  var draw=function(){var w=src.width,h=src.height,k=Math.min(1,side/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);
    var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(src,0,0,c.width,c.height);
    var tryQ=function(q){c.toBlob(function(b){if(!b)return bad(Error('encode'));if(b.size>TARGET&&q>0.55)return tryQ(q-0.1);if(b.size>TARGET&&side>640){side=Math.round(side*0.8);return draw()}
      b.arrayBuffer().then(function(buf){ok({data:buf,type:'image/jpeg',w:c.width,h:c.height})},bad)},'image/jpeg',q)};tryQ(0.85)};draw()})}
var urls={};function urlOf(e){if(!urls[e.id])urls[e.id]=URL.createObjectURL(new Blob([e.data],{type:e.type||'image/jpeg'}));return urls[e.id]}
function dropUrl(id){if(urls[id]){URL.revokeObjectURL(urls[id]);delete urls[id]}}

/* ---------- end-to-end encrypted vault ---------- */
var A32='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';// no I/O/0/1 — easy to copy by hand
var te=new TextEncoder(),td=new TextDecoder();
function canVault(){return !!(window.crypto&&crypto.subtle&&crypto.getRandomValues&&window.fetch)}
function newCode(){var b=crypto.getRandomValues(new Uint8Array(20)),bits=0,val=0,out='';for(var i=0;i<b.length;i++){val=(val<<8)|b[i];bits+=8;while(bits>=5){out+=A32[(val>>>(bits-5))&31];bits-=5}}
  return 'BW-'+out.match(/.{4}/g).join('-')}
function codeChars(code){var s=String(code||'').toUpperCase().replace(/[۰-۹]/g,function(x){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(x)}).replace(/[^A-Z0-9]/g,'');return s.length===34&&s.slice(0,2)==='BW'?s.slice(2):s}
function codeBytes(code){var s=codeChars(code);
  if(s.length!==32)return null;var out=new Uint8Array(20),bits=0,val=0,j=0;for(var i=0;i<32;i++){var v=A32.indexOf(s[i]);if(v<0)return null;val=(val<<5)|v;bits+=5;if(bits>=8){out[j++]=(val>>>(bits-8))&255;bits-=8}}return out}
function hex(b){return Array.prototype.map.call(b,function(x){return ('0'+x.toString(16)).slice(-2)}).join('')}
function b64url(b){var s='';for(var i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
var keyCache={};
function keysFor(code){if(keyCache[code])return keyCache[code];var raw=codeBytes(code);if(!raw)return Promise.reject(Error('code'));
  var salt=te.encode('beautywallet-vault-v1');
  keyCache[code]=crypto.subtle.importKey('raw',raw,'HKDF',false,['deriveBits','deriveKey']).then(function(base){
    var bits=function(info,n){return crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt:salt,info:te.encode(info)},base,n*8).then(function(x){return new Uint8Array(x)})};
    return Promise.all([bits('vault-id',16),bits('vault-auth',32),crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:salt,info:te.encode('vault-enc')},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])])
      .then(function(r){return {id:hex(r[0]),token:b64url(r[1]),key:r[2]}})});return keyCache[code]}
function vault(){var v=readJ(VK,null);return v&&typeof v.code==='string'&&codeBytes(v.code)?v:null}
function ensureVault(){var v=vault();if(v||!canVault())return v;v={code:newCode(),saved:false,on:true,created:new Date().toISOString()};writeJ(VK,v);return v}
function meta(e){return {id:e.id,date:e.date,w:e.w,h:e.h,type:e.type,bare:e.bare,sameLight:e.sameLight,tags:e.tags||[],note:e.note||'',routine:e.routine||[],migrated:!!e.migrated}}
function seal(k,e){var m=te.encode(JSON.stringify(meta(e))),img=new Uint8Array(e.data),plain=new Uint8Array(4+m.length+img.length);
  new DataView(plain.buffer).setUint32(0,m.length);plain.set(m,4);plain.set(img,4+m.length);var iv=crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt({name:'AES-GCM',iv:iv},k.key,plain).then(function(ct){var out=new Uint8Array(13+ct.byteLength);out[0]=1;out.set(iv,1);out.set(new Uint8Array(ct),13);return out})}
function open_(k,buf){var b=new Uint8Array(buf);if(b[0]!==1||b.length<40)return Promise.reject(Error('format'));
  return crypto.subtle.decrypt({name:'AES-GCM',iv:b.slice(1,13)},k.key,b.slice(13)).then(function(p){var u=new Uint8Array(p),n=new DataView(u.buffer).getUint32(0),m=JSON.parse(td.decode(u.slice(4,4+n)));
    return {id:String(m.id).slice(0,40),date:m.date,data:u.slice(4+n).buffer,type:'image/jpeg',w:+m.w||0,h:+m.h||0,bare:!!m.bare,sameLight:!!m.sameLight,tags:(m.tags||[]).map(String).slice(0,7),note:String(m.note||'').slice(0,300),routine:(m.routine||[]).map(String).slice(0,12),migrated:!!m.migrated,synced:true,v:1}})}
function api(k,method,pid,body){return fetch('/api/vault/'+k.id+(pid?'/'+pid:''),{method:method,headers:Object.assign({'X-Vault-Auth':k.token},body?{'Content-Type':'application/octet-stream'}:{}),body:body,cache:'no-store',credentials:'same-origin'})}
var sync={state:'idle',left:0,err:''},syncing=null;
function syncNow(){if(syncing)return syncing;var v=vault();if(!v||v.on===false||!canVault())return Promise.resolve();
  syncing=keysFor(v.code).then(function(k){
    var tomb=readJ(VDEL,[]);return tomb.reduce(function(c,id){return c.then(function(){return api(k,'DELETE',id).then(function(r){if(r.ok)writeJ(VDEL,readJ(VDEL,[]).filter(function(x){return x!==id}))})})},Promise.resolve())
    .then(all).then(function(list){var todo=list.filter(function(e){return !e.synced});sync={state:todo.length?'sending':'ok',left:todo.length,err:''};paintSync();
      return todo.reduce(function(c,e){return c.then(function(){if(sync.err)return;return seal(k,e).then(function(blob){return api(k,'PUT',e.id,blob)}).then(function(r){
        if(r.ok){e.synced=true;return put(e).then(function(){sync.left--;paintSync()})}
        sync.err=r.status===409?'full':r.status===507?'space':'server'})})},Promise.resolve())})})
  .catch(function(){sync.err=navigator.onLine===false?'offline':'server'})
  .then(function(){if(!sync.err)sync={state:'ok',left:0,err:''};else sync.state='wait';paintSync();syncing=null});return syncing}
function paintSync(){var el=root&&$('.sj-lock',root);if(!el)return;var v=vault();
  if(!canVault()){el.textContent='این مرورگر رمزنگاری را پشتیبانی نمی‌کند؛ عکس‌ها فقط روی همین گوشی می‌مانند.';return}
  if(!v){el.textContent='';return}
  if(v.on===false){el.innerHTML='پشتیبان امن خاموش است؛ عکس‌ها فقط روی همین گوشی هستند. <button type="button" data-sj="vault-on">روشن کن</button>';return}
  el.innerHTML=sync.state==='sending'?'🔒 در حال قفل و ارسال امن… ('+fa(sync.left)+' مانده)':
    sync.err==='offline'?'🔒 اینترنت وصل نیست؛ وقتی وصل شوی خودکار ارسال می‌شود.':
    sync.err==='full'?'🔒 فضای امن تو پر است ('+fa(MAX_PHOTOS)+' عکس). یک عکس قدیمی را حذف کن.':
    sync.err?'🔒 ارسال امن فعلاً انجام نشد؛ عکس‌ها روی گوشی هستند و بعداً دوباره امتحان می‌شود.':
    '🔒 همه‌ی عکس‌ها قفل‌شده در فضای امن پشتیبان دارند.'}

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
  return {state:now>=next-1?'due':'wait',now:now,next:next,label:label,left:next-now}}

/* ---------- routine log (the daily ticks in the پیگیری tab) ---------- */
function ticked(key){try{var t=JSON.parse(localStorage.getItem('bw_track_'+key)||'{}');return Object.keys(t).filter(function(k){return t[k]===true})}catch(e){return []}}
function streak(){var n=0,t=Date.now();if(!ticked(tehranDay(t)).length)t-=DAY;while(n<400&&ticked(tehranDay(t)).length){n++;t-=DAY}return n}
function todayMissing(){var k=ticked(tehranDay(Date.now())),am=k.some(function(x){return x.indexOf('am-')===0}),pm=k.some(function(x){return x.indexOf('pm-')===0});
  var h=+new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tehran',hour:'2-digit',hourCycle:'h23'}).format(new Date());
  var ev=21;try{var r=JSON.parse(localStorage.getItem('bw_reminder_v1')||'{}');if(r.evening)ev=+r.evening.slice(0,2)}catch(e){}
  if(h>=ev&&!pm)return 'شب';if(h>=11&&h<ev&&!am)return 'صبح';return ''}

/* ---------- UI ---------- */
var CSS='.sj h3{margin:0 0 4px}.sj .sj-sub{font-size:13px;color:#5d6b80;line-height:1.9;margin:0 0 10px}.sj-next{border-radius:16px;padding:11px 13px;margin:8px 0 12px;font-size:14px;line-height:1.9;background:#eef6ff;color:#23476b}.sj-next.due{background:#fff1f6;color:#7a2950}.sj-next b{display:block}.sj-row{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0}.sj button,.sj label.sj-btn{border:0;border-radius:14px;padding:10px 14px;font:inherit;font-size:14px;cursor:pointer;background:#f2f4fb;color:#2b3550}.sj .sj-main{background:linear-gradient(135deg,#7aa7ff,#c08cff 60%,#ff9cc7);color:#fff;font-weight:700}.sj-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;margin-top:10px}.sj-item{position:relative;border-radius:14px;overflow:hidden;background:#f4f2fa;border:0;padding:0;cursor:pointer;text-align:right}.sj-item img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block}.sj-item span{display:block;font-size:11px;padding:4px 6px;color:#3b3f55;line-height:1.6}.sj-item i{position:absolute;top:5px;right:5px;font-style:normal;font-size:10px;background:rgba(255,255,255,.9);border-radius:8px;padding:1px 6px}.sj-cmp{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.sj-cmp figure{margin:0}.sj-cmp img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:14px;display:block}.sj-cmp figcaption{font-size:12px;text-align:center;color:#4d5670;margin-top:4px;line-height:1.7}.sj-form{border:1px solid #e3e6f3;border-radius:16px;padding:12px;margin-top:10px;background:#fff}.sj-form img{max-width:140px;border-radius:12px;display:block;margin-bottom:8px}.sj-form label{display:flex;gap:6px;align-items:center;font-size:13px;line-height:2}.sj-tags{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.sj-tags label{background:#f3f1fb;border-radius:12px;padding:2px 10px}.sj-form textarea{width:100%;box-sizing:border-box;min-height:56px;border-radius:12px;border:1px solid #dde1ef;padding:8px;font:inherit;font-size:13px}.sj-msg{font-size:13px;line-height:1.9;margin-top:8px;color:#29506f}.sj-msg.bad{color:#9b2d3c}.sj details{margin-top:10px;font-size:13px;line-height:2;color:#46506a}.sj details summary{cursor:pointer;font-weight:700}.sj-view{position:fixed;inset:0;background:rgba(20,22,35,.86);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:10px}.sj-view img{max-width:100%;max-height:70vh;border-radius:14px}.sj-view p{color:#fff;font-size:13px;line-height:1.9;margin:0;text-align:center;max-width:520px}.sj-streak{font-size:13px;color:#4c3a74;margin:4px 0 0}.sj-lock{font-size:12.5px;line-height:1.9;color:#2f5a4a;background:#eef8f3;border-radius:12px;padding:7px 11px;margin:0 0 8px}.sj-lock:empty{display:none}.sj-lock button{padding:3px 10px!important;font-size:12px!important}.sj-code{border-radius:16px;padding:12px 13px;margin:8px 0;background:#fff6e9;color:#5b4119;font-size:13px;line-height:2}.sj-code code{display:block;direction:ltr;text-align:center;font-size:15px;font-weight:700;letter-spacing:.5px;background:#fff;border-radius:10px;padding:8px;margin:6px 0;user-select:all;word-break:break-all}.sj-restore input{width:100%;box-sizing:border-box;direction:ltr;text-align:center;border-radius:12px;border:1px solid #dde1ef;padding:9px;font:inherit;margin:6px 0}.sj-nudge{position:fixed;left:12px;right:12px;bottom:84px;z-index:9998;background:#fff;border-radius:18px;box-shadow:0 10px 30px rgba(60,60,120,.22);padding:12px 14px;display:flex;gap:10px;align-items:center;font-size:14px;line-height:1.8;max-width:520px;margin:auto}.sj-nudge b{flex:1}.sj-nudge button{border:0;border-radius:12px;padding:8px 12px;font:inherit;font-size:13px;background:#f2f4fb}.sj-nudge .go{background:linear-gradient(135deg,#7aa7ff,#c08cff);color:#fff}';
var root,pending=null,msgT,showCode=false;
function msg(t,bad){var m=$('.sj-msg',root);if(!m)return;m.textContent=t;m.className='sj-msg'+(bad?' bad':'');clearTimeout(msgT);if(!bad)msgT=setTimeout(function(){m.textContent=''},8000)}
function codeCard(v){return '<div class="sj-code"><b>کد بازیابی عکس‌هایت</b><code>'+esc(v.code)+'</code>این کد کلید قفل عکس‌هاست. اگر گوشی عوض شد یا مرورگر پاک شد، با همین کد عکس‌ها برمی‌گردند. ما این کد را نداریم و بدون آن هیچ‌کس، حتی تیم بیوتی‌ولت، نمی‌تواند عکس‌ها را باز کند؛ پس جای امن نگهش دار و به کسی نده.'+
  '<div class="sj-row"><button type="button" data-sj="copy">کپی کد</button><button type="button" data-sj="tg">ذخیره در تلگرام</button>'+(v.saved?'<button type="button" data-sj="hide-code">بستن</button>':'<button type="button" class="sj-main" data-sj="saved">کد را ذخیره کردم</button>')+'</div></div>'}
function render(){if(!root)return Promise.resolve();return all().then(function(list){
  var p=plan(list),s=streak(),v=vault(),h='';
  h+='<h3>دفترچه‌ی عکس پوست من</h3><p class="sj-sub">عکس‌ها روی گوشی خودت قفل (رمز) می‌شوند و فقط نسخه‌ی قفل‌شده برای پشتیبان به فضای امن ما می‌رود. کلیدش فقط دست توست؛ هیچ‌کس، حتی تیم بیوتی‌ولت، نمی‌تواند عکس‌هایت را ببیند. عکس برای مقایسه است، نه تشخیص.</p><div class="sj-lock" role="status"></div>';
  if(v&&list.length&&(!v.saved||showCode))h+=codeCard(v);
  if(p.state==='empty')h+='<div class="sj-next"><b>اولین عکس، نقطه‌ی شروع توست.</b>قبل از شروع یک محصول یا روتین تازه ثبتش کن تا بعداً منصفانه مقایسه کنی.</div>';
  else if(p.state==='due')h+='<div class="sj-next due"><b>امروز وقت عکس '+p.label+' است.</b>همان نور و همان فاصله‌ی عکس شروع را رعایت کن تا مقایسه درست باشد.</div>';
  else if(p.state==='wait')h+='<div class="sj-next"><b>عکس بعدی: '+p.label+' ('+(p.left<=1?'فردا':fa(p.left)+' روز دیگر')+')</b>مقایسه‌ی روزبه‌روز گمراه‌کننده است؛ لایه‌ی سطحی پوست حدود ۴ تا ۶ هفته طول می‌کشد تا نو شود.</div>';
  else h+='<div class="sj-next"><b>برنامه‌ی یک‌ساله کامل شد.</b>هر وقت روتین را عوض کردی، یک عکس تازه ثبت کن.</div>';
  if(s>1)h+='<p class="sj-streak">✦ '+fa(s)+' روز پشت سر هم روتینت را ثبت کرده‌ای.</p>';
  h+='<div class="sj-row"><label class="sj-btn sj-main" for="sjFile">'+(list.length?'＋ ثبت عکس تازه':'＋ ثبت عکس شروع')+'</label><input id="sjFile" type="file" accept="image/*" capture="user" hidden></div>';
  h+='<div class="sj-slot"></div><div class="sj-msg" role="status" aria-live="polite"></div>';
  if(list.length>1){var a=list[0],b=list[list.length-1];h+='<div class="sj-cmp"><figure><img src="'+urlOf(a)+'" alt="عکس شروع"><figcaption>شروع · '+esc(faDate(a.date))+'</figcaption></figure><figure><img src="'+urlOf(b)+'" alt="آخرین عکس"><figcaption>'+esc(dayLabel(b,a))+' · '+esc(faDate(b.date))+'</figcaption></figure></div>'}
  if(list.length)h+='<div class="sj-grid">'+list.slice().reverse().map(function(e){return '<button type="button" class="sj-item" data-sj-open="'+e.id+'"><img loading="lazy" src="'+urlOf(e)+'" alt=""><i>'+esc(dayLabel(e,list[0]))+'</i><span>'+esc(faDate(e.date))+(e.tags&&e.tags.length?'<br>'+esc(e.tags.slice(0,2).join('، ')):'')+'</span></button>'}).join('')+'</div>';
  h+='<details class="sj-restore"'+(list.length?'':' open')+'><summary>'+(list.length?'گوشی را عوض کرده‌ای؟ بازگردانی با کد':'قبلاً عکس ثبت کرده‌ای؟ بازگردانی با کد')+'</summary>کد بازیابی را وارد کن تا عکس‌های قفل‌شده‌ات از فضای امن برگردند و همین‌جا باز شوند.<input id="sjCode" placeholder="BW-XXXX-XXXX-…" autocomplete="off" autocapitalize="characters" spellcheck="false"><button type="button" data-sj="restore-code">بازگردانی عکس‌ها</button></details>';
  h+='<details><summary>چطور عکس قابل‌مقایسه بگیرم؟</summary>هر بار در یک جا و یک نور بایست؛ بهترین نور، نور روز روبه‌روی پنجره است. صورت شسته و بدون آرایش و کرم باشد (حدود ۱۵ دقیقه بعد از شستشو). حالت زیبایی و فیلتر دوربین را خاموش کن. گوشی را به فاصله‌ی یک دست و هم‌سطح چشم نگه دار و مستقیم به دوربین نگاه کن. اگر بخش خاصی مثل گونه یا چانه مهم است، یک عکس نیم‌رخ هم بگیر.<br>اگر سوزش، قرمزی شدید یا تورم دیدی، مصرف محصول تازه را متوقف کن و با پزشک مشورت کن.</details>';
  h+='<details><summary>امنیت عکس‌ها و گزینه‌های بیشتر</summary>۱. عکس روی گوشی کوچک و ذخیره می‌شود. ۲. روی همین گوشی با کلیدی که از کد بازیابی ساخته شده قفل می‌شود (رمزنگاری AES-256). ۳. فقط نسخه‌ی قفل‌شده به فضای امن بیوتی‌ولت می‌رود؛ کلید هرگز ارسال نمی‌شود. ۴. با کد بازیابی، روی هر گوشی باز می‌شود. سقف فضای امن '+fa(MAX_PHOTOS)+' عکس است.'+
    '<div class="sj-row">'+(v&&list.length?'<button type="button" data-sj="show-code">نمایش کد بازیابی</button>':'')+(list.length?'<button type="button" data-sj="backup">فایل پشتیبان روی گوشی</button>':'')+'<label class="sj-btn" for="sjRestore">بازگردانی از فایل</label><input id="sjRestore" type="file" accept=".bwjournal,.json,application/json" hidden>'+(v&&v.on!==false?'<button type="button" data-sj="vault-off">حذف عکس‌ها از فضای امن</button>':'')+'</div></details>';
  revokeUnused(list);root.innerHTML=h;paintSync();window.dispatchEvent(new CustomEvent('bw-journal',{detail:p}))}).catch(function(){root.innerHTML='<h3>دفترچه‌ی عکس پوست من</h3><p class="sj-sub">این مرورگر اجازه‌ی ذخیره‌ی عکس روی گوشی را نمی‌دهد (مثلاً در حالت خصوصی). در مرورگر معمولی یا نسخه‌ی نصب‌شده باز کن.</p>'})}
function revokeUnused(list){var keep={};list.forEach(function(e){keep[e.id]=1});Object.keys(urls).forEach(function(id){if(!keep[id])dropUrl(id)})}
function dayLabel(e,base){var n=dayIndex(e.date)-dayIndex(base.date);if(e.id===base.id)return 'شروع';if(n<1)return 'همان روز';return n%7===0?'هفته‌ی '+fa(n/7):'روز '+fa(n)}

function pick(file){if(!file)return;if(!/^image\//.test(file.type||'image/'))return msg('لطفاً یک فایل عکس انتخاب کن.',true);if(file.size>25*1024*1024)return msg('این عکس خیلی بزرگ است؛ عکس کوچک‌تری انتخاب کن.',true);
  all().then(function(list){if(list.length>=MAX_PHOTOS)return msg('به سقف '+fa(MAX_PHOTOS)+' عکس رسیده‌ای. یک عکس قدیمی (به‌جز عکس شروع) را باز کن و حذف کن، بعد عکس تازه بگیر.',true);
  msg('در حال آماده‌سازی عکس روی گوشی…');
  loadImage(file).then(toJpeg).then(function(img){pending=img;var u=URL.createObjectURL(new Blob([img.data],{type:img.type}));
    $('.sj-slot',root).innerHTML='<form class="sj-form" id="sjForm"><img src="'+u+'" alt="پیش‌نمایش"><b style="font-size:14px">قبل از ذخیره:</b>'+
    '<label><input type="checkbox" name="c1"> بدون آرایش، کرم و فیلتر</label><label><input type="checkbox" name="c2"> همان نور و جای عکس‌های قبلی</label>'+
    '<div style="font-size:13px;margin-top:6px">حال پوست (اختیاری):</div><div class="sj-tags">'+TAGS.map(function(t){return '<label><input type="checkbox" name="tag" value="'+esc(t)+'"> '+esc(t)+'</label>'}).join('')+'</div>'+
    '<textarea name="note" maxlength="300" placeholder="یادداشت کوتاه؛ مثلاً از کدام شب رتینول را شروع کردی"></textarea>'+
    '<label><input type="checkbox" name="consent" required> موافقم این عکس روی گوشی‌ام ذخیره شود و نسخه‌ی قفل‌شده‌اش (که فقط با کد من باز می‌شود) در فضای امن پشتیبان بماند</label>'+
    '<div class="sj-row"><button type="submit" class="sj-main">ذخیره</button><button type="button" data-sj="cancel">انصراف</button></div></form>';
    $('#sjForm img',root).onload=function(){setTimeout(function(){URL.revokeObjectURL(u)},500)};msg('')}).catch(function(){msg('این عکس باز نشد؛ یک عکس JPG یا PNG دیگر امتحان کن.',true)})})}
function save(form){if(!pending)return;var fd=new FormData(form);if(!fd.has('consent'))return msg('برای ذخیره، تیک رضایت را بزن.',true);
  var btn=form.querySelector('button[type=submit]');btn.disabled=true;msg('در حال ذخیره و بررسی…');
  var e={id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),date:new Date().toISOString(),data:pending.data,type:pending.type,w:pending.w,h:pending.h,
    bare:fd.has('c1'),sameLight:fd.has('c2'),tags:fd.getAll('tag').map(String).slice(0,7),note:String(fd.get('note')||'').trim().slice(0,300),routine:routineNames(),synced:false,v:1};
  askPersist().then(function(){return put(e)}).then(function(){pending=null;ensureVault();try{window.bwTrack&&window.bwTrack('journal_photo')}catch(x){}
    return render().then(function(){msg('عکس روی گوشی ذخیره و بازخوانی شد ✓ ('+faDate(e.date)+'). حالا نسخه‌ی قفل‌شده‌اش به فضای امن می‌رود.');syncNow()})})
  .catch(function(err){btn.disabled=false;var full=err&&(err.name==='QuotaExceededError'||/quota/i.test(err.message||''));
    msg(full?'فضای ذخیره‌ی گوشی پر است؛ عکس ذخیره نشد. چند عکس قدیمی را حذف کن.':'عکس ذخیره نشد. دوباره امتحان کن؛ اگر باز نشد، مرورگر را از حالت خصوصی خارج کن.',true)})}
function view(id){get(id).then(function(e){if(!e)return;all().then(function(list){var v=document.createElement('div');v.className='sj-view';v.setAttribute('role','dialog');
  v.innerHTML='<img src="'+urlOf(e)+'" alt=""><p>'+esc(dayLabel(e,list[0]))+' · '+esc(faDate(e.date))+(e.synced?' · 🔒 پشتیبان امن دارد':'')+(e.tags&&e.tags.length?'<br>'+esc(e.tags.join('، ')):'')+(e.note?'<br>'+esc(e.note):'')+(e.routine&&e.routine.length?'<br><small>روتین آن زمان: '+esc(e.routine.join('، '))+'</small>':'')+(e.bare===false||e.sameLight===false?'<br><small>این عکس با شرایط استاندارد گرفته نشده؛ در مقایسه احتیاط کن.</small>':'')+'</p><div class="sj-row"><button type="button" data-v="close">بستن</button><button type="button" data-v="del">حذف این عکس</button></div>';
  v.addEventListener('click',function(ev){var b=ev.target.closest('button');if(ev.target===v||(b&&b.dataset.v==='close'))return v.remove();
    if(b&&b.dataset.v==='del'){if(!confirm('این عکس از گوشی و از فضای امن حذف شود؟ این کار برگشت‌پذیر نیست.'))return;
      del(e.id).then(function(){dropUrl(e.id);if(e.synced){var t=readJ(VDEL,[]);if(t.indexOf(e.id)<0)t.push(e.id);writeJ(VDEL,t.slice(-200))}v.remove();return render().then(function(){msg('عکس حذف شد.');syncNow()})})}});
  document.body.appendChild(v)})})}

/* ---------- restore with the recovery code ---------- */
function restoreCode(code){if(!canVault())return msg('این مرورگر رمزنگاری را پشتیبانی نمی‌کند.',true);if(!codeBytes(code))return msg('کد درست نیست؛ باید شبیه BW-XXXX-XXXX-… با ۳۲ حرف و عدد باشد.',true);
  msg('در حال دریافت و باز کردن عکس‌های قفل‌شده…');var norm='BW-'+codeChars(code).match(/.{4}/g).join('-'),got=0;
  keysFor(norm).then(function(k){return api(k,'GET').then(function(r){if(!r.ok)throw Error('net');return r.json()}).then(function(j){var ids=(j.photos||[]).map(function(p){return p.id});
    if(!ids.length)throw Error('none');return all().then(function(have){var own={};have.forEach(function(e){own[e.id]=1});
      return ids.filter(function(id){return !own[id]}).reduce(function(c,id){return c.then(function(){return api(k,'GET',id).then(function(r){if(!r.ok)throw Error('net');return r.arrayBuffer()}).then(function(buf){return open_(k,buf)}).then(function(e){got++;return put(e)})})},askPersist())})})
    .then(function(){var cur=vault();if(cur&&cur.code===norm)return render();
      writeJ(VK,{code:norm,saved:true,on:true,created:new Date().toISOString()});writeJ(VDEL,[]);
      // photos that were only in the previous vault now go to this one too (one code for everything)
      return all().then(function(list){return Promise.all(list.map(function(e){if(!e.synced||!cur)return;e.synced=false;return put(e)}))}).then(render)})})
  .then(function(){try{window.bwTrack&&window.bwTrack('vault_restore')}catch(x){}msg(got?fa(got)+' عکس برگشت و باز شد ✓':'همه‌ی عکس‌های این کد از قبل روی گوشی بودند ✓');syncNow()})
  .catch(function(err){var m=err&&err.message;msg(m==='none'?'با این کد عکسی در فضای امن پیدا نشد. کد را دوباره با دقت وارد کن.':m==='net'?'ارتباط برقرار نشد؛ اینترنت را بررسی کن و دوباره امتحان کن.':'باز کردن عکس‌ها با این کد ممکن نشد؛ کد را دوباره بررسی کن.',true)})}

/* ---------- file backup (extra, optional) ---------- */
function b64(buf){var s='',a=new Uint8Array(buf);for(var i=0;i<a.length;i+=32768)s+=String.fromCharCode.apply(null,a.subarray(i,i+32768));return btoa(s)}
function unb64(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer}
function backup(){all().then(function(list){if(!list.length)return;var out={app:'BeautyWallet',kind:'skin-journal',version:1,exported:new Date().toISOString(),photos:list.map(function(e){var c={};for(var k in e)if(k!=='data'&&k!=='synced')c[k]=e[k];c.data=b64(e.data);return c})};
  var blob=new Blob([JSON.stringify(out)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='BeautyWallet-skin-photos-'+tehranDay(Date.now())+'.bwjournal';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},30000);
  msg('فایل پشتیبان روی گوشی‌ات ذخیره شد. این فایل قفل نیست؛ آن را جای امن نگه دار.')}).catch(function(){msg('پشتیبان ساخته نشد؛ دوباره امتحان کن.',true)})}
function restoreFile(file){if(!file)return;msg('در حال بازگردانی…');file.text().then(function(t){var j=JSON.parse(t);if(!j||j.kind!=='skin-journal'||!Array.isArray(j.photos))throw Error('format');
  return all().then(function(have){var ids={};have.forEach(function(e){ids[e.id]=1});var add=j.photos.filter(function(p){return p&&typeof p.id==='string'&&!ids[p.id]&&typeof p.data==='string'&&/^\d{4}-\d\d-\d\dT/.test(p.date||'')}).slice(0,Math.max(0,MAX_PHOTOS-have.length));
    return add.reduce(function(chain,p){return chain.then(function(){return put({id:p.id.slice(0,40),date:p.date,data:unb64(p.data),type:'image/jpeg',w:+p.w||0,h:+p.h||0,bare:!!p.bare,sameLight:!!p.sameLight,tags:(Array.isArray(p.tags)?p.tags:[]).map(String).slice(0,7),note:String(p.note||'').slice(0,300),routine:(Array.isArray(p.routine)?p.routine:[]).map(String).slice(0,12),synced:false,v:1})})},askPersist()).then(function(){return add.length})})})
  .then(function(n){if(n)ensureVault();return render().then(function(){msg(n?fa(n)+' عکس بازگردانی شد ✓':'عکس تازه‌ای در این فایل نبود.');syncNow()})}).catch(function(){msg('این فایل پشتیبانِ دفترچه‌ی عکس بیوتی‌ولت نیست یا خراب است.',true)})}

/* ---------- one-time move of the old single photo (localStorage) into the journal ---------- */
function migrate(){var raw='';try{raw=localStorage.getItem(LEGACY)||''}catch(e){return Promise.resolve()}
  var m=/^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$/.exec(raw);if(!m){if(raw)try{localStorage.removeItem(LEGACY)}catch(e){}return Promise.resolve()}
  var blob=new Blob([unb64(m[2])],{type:m[1]});
  return loadImage(blob).then(toJpeg).then(function(img){return put({id:'legacy-face',date:new Date().toISOString(),data:img.data,type:img.type,w:img.w,h:img.h,bare:true,sameLight:true,tags:[],note:'عکس مرجعی که قبلاً ثبت کرده بودی (تاریخ دقیقش ذخیره نشده بود).',routine:[],synced:false,v:1,migrated:true})})
    .then(function(){try{localStorage.removeItem(LEGACY)}catch(e){}ensureVault()}).catch(function(){/* keep the old copy if anything fails */})}

/* ---------- gentle reminders when the app opens (once a day each) ---------- */
function nudge(text,go){var k=SEEN+tehranDay(Date.now())+'-'+go;try{if(localStorage.getItem(k))return;localStorage.setItem(k,'1')}catch(e){return}
  var n=document.createElement('div');n.className='sj-nudge';n.setAttribute('role','status');n.innerHTML='<b>'+esc(text)+'</b><button type="button" class="go">برو</button><button type="button" aria-label="بستن">✕</button>';
  n.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;n.remove();if(b.classList.contains('go')&&typeof window.switchTab==='function'){window.switchTab('track');setTimeout(function(){var t=go==='routine'?document.querySelector('#track .track-grid'):root;t&&t.scrollIntoView({behavior:'smooth',block:'start'})},250)}});
  document.body.appendChild(n);setTimeout(function(){n.remove()},14000)}
function nudges(){all().then(function(list){var v=vault();if(list.length&&v&&!v.saved)return nudge('کد بازیابی عکس‌هایت را هنوز ذخیره نکرده‌ای؛ بدون آن، عکس‌ها روی گوشی دیگر باز نمی‌شوند.','code');
  var p=plan(list);if(p.state==='due')return nudge('امروز وقت عکس '+p.label+' پوستت است؛ یک دقیقه طول می‌کشد.','photo');
  var miss=todayMissing();if(miss)nudge('روتین '+miss+' امروز هنوز ثبت نشده؛ فقط تیکش را بزن.','routine')}).catch(function(){})}

/* ---------- public API (used by the calendar export in routine-reminder.js) ---------- */
window.BWSkinJournal={plan:function(){return all().then(plan)},upcoming:function(){return all().then(function(list){if(!list.length)return [];var d0=dayIndex(list[0].date),last=dayIndex(list[list.length-1].date)-d0;
  return SCHEDULE.filter(function(c){return c>last+6}).slice(0,4).map(function(c){return {day:c,label:c%7===0?'هفته‌ی '+fa(c/7):'روز '+fa(c),date:new Date((d0+c)*DAY).toISOString().slice(0,10)}})})},render:render,sync:syncNow};

function copyText(t){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t);return new Promise(function(ok,bad){var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(e){bad(e)}a.remove()})}
function init(){root=document.getElementById('skinJournal');if(!root)return;root.classList.add('sj');
  var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  root.addEventListener('change',function(e){if(e.target.id==='sjFile'){pick(e.target.files&&e.target.files[0]);e.target.value=''}if(e.target.id==='sjRestore'){restoreFile(e.target.files&&e.target.files[0]);e.target.value=''}});
  root.addEventListener('submit',function(e){if(e.target.id==='sjForm'){e.preventDefault();save(e.target)}});
  root.addEventListener('click',function(e){var b=e.target.closest('[data-sj],[data-sj-open]');if(!b)return;if(b.dataset.sjOpen)return view(b.dataset.sjOpen);
    var a=b.dataset.sj,v=vault();
    if(a==='cancel'){pending=null;$('.sj-slot',root).innerHTML='';msg('')}
    if(a==='backup')backup();
    if(a==='copy'&&v)copyText(v.code).then(function(){msg('کد کپی شد. آن را در یادداشت‌ها یا پیام‌های ذخیره‌شده‌ی تلگرام بگذار.')},function(){msg('کپی نشد؛ کد را از روی کادر بنویس.',true)});
    if(a==='tg'&&v)window.open('https://t.me/share/url?url='+encodeURIComponent('https://beautywallet.liara.run/app')+'&text='+encodeURIComponent('کد بازیابی عکس‌های پوست من در بیوتی‌ولت (به کسی نده): '+v.code),'_blank','noopener');
    if(a==='saved'&&v){v.saved=true;writeJ(VK,v);showCode=false;render().then(function(){msg('عالی ✓ هر وقت لازم شد، کد در «امنیت عکس‌ها» هم هست.')})}
    if(a==='show-code'){showCode=true;render()}
    if(a==='hide-code'){showCode=false;render()}
    if(a==='restore-code')restoreCode(($('#sjCode',root)||{}).value||'');
    if(a==='vault-on'&&v){v.on=true;writeJ(VK,v);all().then(function(list){return Promise.all(list.map(function(e){e.synced=false;return put(e)}))}).then(function(){paintSync();syncNow()})}
    if(a==='vault-off'&&v){if(!confirm('نسخه‌های قفل‌شده از فضای امن حذف شوند؟ عکس‌ها روی همین گوشی می‌مانند، ولی اگر گوشی عوض شود یا مرورگر پاک شود، دیگر برنمی‌گردند.'))return;
      keysFor(v.code).then(function(k){return api(k,'DELETE')}).then(function(r){if(!r.ok)throw Error();v.on=false;writeJ(VK,v);writeJ(VDEL,[]);return all().then(function(list){return Promise.all(list.map(function(e){e.synced=false;return put(e)}))})}).then(function(){render().then(function(){msg('عکس‌ها از فضای امن حذف شدند؛ فقط روی همین گوشی هستند.')})}).catch(function(){msg('حذف از فضای امن انجام نشد؛ دوباره امتحان کن.',true)})}});
  window.addEventListener('online',function(){syncNow()});
  try{if(navigator.storage&&navigator.storage.persisted)navigator.storage.persisted().then(function(p){persisted=p})}catch(e){}
  migrate().then(function(){return all()}).then(function(list){if(list.length)ensureVault()}).catch(function(){}).then(render).then(function(){syncNow();setTimeout(nudges,2500)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
