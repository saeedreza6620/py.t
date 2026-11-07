/* BeautyWallet — layer-1 advantages (useful today, even with one user) that quietly collect what layer 2 needs.
   1) Authenticity with TTAC/Titak, right after a product check: the code, one tap to the official check, the answer
      and where it was bought — kept next to the product in the wallet.
   2) Today's tip for her city (UV, humidity, dust) — from the server's weather cache, or a seasonal tip offline.
   3) «Since you started X»: the photo before a product and the latest one at least two weeks after it.
   4) A reaction photo offered when a follow-up answer says the skin is unhappy, linked to that product.
   5) «My monthly skin report» and 6) a short film of her photos (made on the phone, never uploaded).
   Every authenticity check, follow-up answer, product check and photo also goes out as ONE tagged row
   (product id, seller, city, skin type, date — no photo, no name, no number) for layer 2: see lite/layer2.mjs.
   Storage: only NEW keys (bw_city, bw_sellers, bw_auth_v1 — backed up with her number; bw_l2_q — a send queue).
   Nothing here renames, rewrites or deletes anything she already saved. */
(function(){'use strict';
var DAY=864e5,Q='bw_l2_q';
function rj(k,d){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}}
function wj(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function fa(n){return String(n).replace(/[0-9]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d]})}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function tday(t){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t==null?Date.now():t))}
function dnum(s){var p=String(s).slice(0,10).split('-');return Math.round(Date.UTC(+p[0],p[1]-1,+p[2])/DAY)}
function faDate(iso){try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',month:'long',day:'numeric'}).format(new Date(iso))}catch(e){return String(iso).slice(0,10)}}
function dev(){try{return localStorage.getItem('bw_device')||''}catch(e){return ''}}
function track(n){try{window.bwTrack&&window.bwTrack(n)}catch(e){}}
function pname(id){var L=typeof PRODUCTS!=='undefined'?PRODUCTS:(window.PRODUCTS||[]);for(var i=0;i<L.length;i++)if(L[i].id===id)return L[i].name;return ''}
function toast(t){try{var d=document.createElement('div');d.className='sw-toast';d.textContent=t;document.body.append(d);setTimeout(function(){d.remove()},3200)}catch(e){}}
function copy(t){try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t)}catch(e){}return new Promise(function(ok){var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e){}a.remove();ok()})}

/* ---------- layer-2 rows: tagged at the source, queued on the phone, sent when online ---------- */
var CITY={tehran:'تهران',mashhad:'مشهد',isfahan:'اصفهان',karaj:'کرج',shiraz:'شیراز',tabriz:'تبریز',qom:'قم',ahvaz:'اهواز',kermanshah:'کرمانشاه',urmia:'ارومیه',rasht:'رشت',zahedan:'زاهدان',kerman:'کرمان',hamedan:'همدان',yazd:'یزد',ardabil:'اردبیل',bandarabbas:'بندرعباس',arak:'اراک',zanjan:'زنجان',sari:'ساری',qazvin:'قزوین',gorgan:'گرگان',sanandaj:'سنندج',bushehr:'بوشهر',khorramabad:'خرم‌آباد',semnan:'سمنان',kish:'کیش'};
var ZONE={ahvaz:'hot',bandarabbas:'hot',bushehr:'hot',kish:'hot',rasht:'humid',sari:'humid',gorgan:'humid',tabriz:'cold',kermanshah:'cold',urmia:'cold',hamedan:'cold',ardabil:'cold',arak:'cold',zanjan:'cold',qazvin:'cold',sanandaj:'cold',khorramabad:'cold'};
function city(){var c=rj('bw_city','');return CITY[c]?c:''}
function skin(){var p=rj('bw_profile_v1_full',{});return String((p&&p.skinBase)||'').slice(0,20)}
var flushing=false;
function flush(){if(flushing||!dev()||navigator.onLine===false)return;var q=rj(Q,[]);if(!q.length)return;var n=Math.min(40,q.length);flushing=true;
  fetch('/api/l2/rec',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({d:dev(),recs:q.slice(0,n)})})
  .then(function(r){if(r.ok){wj(Q,rj(Q,[]).slice(n));if(rj(Q,[]).length)setTimeout(function(){flushing=false;flush()},500)}}).catch(function(){}).then(function(){flushing=false})}
window.bwL2=function(r){if(!r||!r.t)return;r.day=r.day||tday();r.city=r.city||city();r.skin=r.skin||skin();
  if(r.pid&&!r.seller){var sl=rj('bw_sellers',{});r.seller=(sl&&sl[r.pid])||''}
  var q=rj(Q,[]);q.push(r);wj(Q,q.slice(-300));setTimeout(flush,800)};
window.addEventListener('online',flush);document.addEventListener('visibilitychange',function(){if(!document.hidden)flush()});

/* ---------- styles ---------- */
var CSS='.l1{direction:rtl}.l1-card{background:#fff;border:1px solid #ece6ff;border-radius:18px;padding:12px 14px;margin:0 0 12px;line-height:1.9;font-size:14px;color:#241a4f}.l1-card h4{margin:0 0 4px;font-size:15px}.l1-card p{margin:4px 0}.l1-card small{color:#7b6fb8}'+
 '.l1 button,.l1-sheet button{font:inherit;border:0;border-radius:14px;padding:9px 13px;cursor:pointer;background:#f1edff;color:#241a4f;font-size:14px}.l1 .go,.l1-sheet .go{background:linear-gradient(135deg,#7c5cf0,#c86dd7);color:#fff;font-weight:800}.l1-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}'+
 '.l1 select{font:inherit;border:1px solid #ddd6ff;border-radius:12px;padding:7px;background:#fff}.l1-tip{background:#f6f3ff;border-radius:14px;padding:8px 11px;margin:6px 0;font-size:13.5px}.l1-pair{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.l1-pair img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:14px;display:block}.l1-pair figure{margin:0}.l1-pair figcaption{font-size:12px;text-align:center;color:#4d5670;line-height:1.7;margin-top:3px}'+
 '.l1-auth{margin-top:10px;border-top:1px dashed #e4ddff;padding-top:9px;font-size:13.5px;line-height:1.9}.l1-auth b{display:block}.l1-auth .ok{color:#1f6a45}.l1-auth .bad{color:#9b2d3c}'+
 '.l1-sheet{position:fixed;inset:0;z-index:9990;background:rgba(25,18,60,.5);display:flex;align-items:flex-end;justify-content:center}.l1-sheet .in{background:#fff;width:100%;max-width:560px;max-height:92vh;overflow:auto;border-radius:22px 22px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom,0px));direction:rtl;line-height:1.9;font-size:14px;color:#241a4f}'+
 '.l1-sheet h3{margin:0 0 6px;font-size:17px}.l1-sheet input[type=text]{width:100%;box-sizing:border-box;direction:ltr;text-align:center;font:inherit;font-size:18px;letter-spacing:1px;border:1px solid #ddd6ff;border-radius:14px;padding:10px;margin:6px 0}.l1-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.l1-chips button.on{background:#7c5cf0;color:#fff}'+
 '.l1-step{background:#f6f3ff;border-radius:14px;padding:8px 11px;margin:8px 0}.l1-step b{color:#5b3fd0}.l1-note{font-size:12.5px;color:#6d6496}.l1-rep h2{font-size:18px;margin:0}.l1-rep .k{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.l1-rep .k div{background:#f6f3ff;border-radius:14px;padding:8px;text-align:center}.l1-rep .k b{display:block;font-size:20px}.l1-rep ul{margin:4px 0;padding-inline-start:18px}'+
 '.l1-scan{position:fixed;inset:0;z-index:9995;background:#000}.l1-scan video{width:100%;height:100%;object-fit:cover}.l1-scan p{position:absolute;top:16px;left:12px;right:12px;color:#fff;text-align:center;background:rgba(0,0,0,.5);border-radius:14px;padding:8px;direction:rtl}.l1-scan button{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);border:0;border-radius:999px;padding:12px 20px;font:inherit}'+
 '.l1 .bw-action-icon::before,.l1 .bw-action-icon::after,.l1-sheet .bw-action-icon::before,.l1-sheet .bw-action-icon::after{display:none!important;content:none!important}'+
 '@media print{body>*:not(.l1-sheet){display:none!important}.l1-sheet{position:static;background:none}.l1-sheet .in{max-height:none;box-shadow:none}.l1-sheet .l1-row{display:none}}';
function style(){if(document.getElementById('l1Css'))return;var s=document.createElement('style');s.id='l1Css';s.textContent=CSS;document.head.appendChild(s)}
function sheet(html){style();var o=document.createElement('div');o.className='l1-sheet';o.setAttribute('role','dialog');o.innerHTML='<div class="in">'+html+'</div>';
  o.addEventListener('click',function(e){if(e.target===o||e.target.closest('[data-l1x]'))o.remove()});document.body.appendChild(o);return o}

/* ---------- 1) authenticity (TTAC / Titak) ---------- */
var SELLERS=[['big','فروشگاه اینترنتی بزرگ'],['pharmacy','داروخانه'],['shop','مغازه‌ی حضوری'],['social','پیج اینستاگرام یا تلگرام'],['smallsite','سایت کوچک'],['gift','هدیه / نمی‌دانم']];
var RES={ok:'اصل بود',bad:'مشکل داشت',noreply:'جوابی نیامد'};
function authOf(pid){var a=rj('bw_auth_v1',{});return (a&&Array.isArray(a[pid]))?a[pid]:[]}
function authLine(pid){var l=authOf(pid);if(!l.length)return '';var x=l[l.length-1],s=(SELLERS.find(function(y){return y[0]===x.seller})||[])[1]||'';
  return '<span class="'+(x.res==='bad'?'bad':'ok')+'">'+(x.res==='ok'?'✓ ':x.res==='bad'?'⚠️ ':'')+'اصالت '+esc(faDate(x.at))+': '+esc(RES[x.res]||'')+(s?' · از '+esc(s):'')+'</span>'}
function authCard(pid){return '<div class="l1-auth" data-l1-auth="'+esc(pid)+'">'+(authOf(pid).length?authLine(pid)+' <button type="button" data-l1="auth" data-pid="'+esc(pid)+'" style="padding:4px 10px;font-size:12px">دوباره</button>':
  '<b>🛡 محصول دستته؟ اصالتش رو هم ببینیم</b><span class="l1-note">کد اصالت روی برچسب اصالت جعبه است؛ کمتر از یک دقیقه.</span><div class="l1-row"><button type="button" class="go" data-l1="auth" data-pid="'+esc(pid)+'">بررسی اصالت</button></div>')+'</div>'}
function digits(s){return String(s||'').replace(/[۰-۹]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)}).replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).replace(/\D/g,'')}
function scan(onCode){if(!('BarcodeDetector' in window)||!navigator.mediaDevices)return false;var det;try{det=new window.BarcodeDetector()}catch(e){return false}
  var ov=document.createElement('div'),stream=null,alive=true;ov.className='l1-scan';ov.innerHTML='<video playsinline muted autoplay></video><p>دوربین را روی کد یا بارکد برچسب اصالت بگیر…</p><button type="button">بستن</button>';document.body.appendChild(ov);var v=ov.querySelector('video');
  function stop(){alive=false;try{stream&&stream.getTracks().forEach(function(t){t.stop()})}catch(e){}ov.remove()}
  ov.querySelector('button').onclick=stop;
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false}).then(function(s){stream=s;v.srcObject=s;(function tick(){if(!alive)return;det.detect(v).then(function(r){var c=r&&r.map(function(x){return digits(x.rawValue)}).find(function(d){return d.length>=10});if(c){stop();onCode(c)}else setTimeout(tick,350)}).catch(function(){setTimeout(tick,600)})})()})
  .catch(function(){stop();toast('دوربین باز نشد؛ کد را تایپ کن.')});return true}
function authSheet(pid){var name=pname(pid)||'این محصول',st={code:'',src:'typed',res:'',seller:rj('bw_sellers',{})[pid]||''};track('l1_auth');
  var o=sheet('<h3>🛡 اصالت «'+esc(name)+'»</h3><p class="l1-note">استعلام را سامانه‌ی رسمی TTAC انجام می‌دهد؛ ما فقط کمکت می‌کنیم سریع‌تر برسی و جوابش را کنار محصولت نگه می‌داریم.</p>'+
   '<div class="l1-step"><b>۱.</b> کد اصالت را از روی برچسب اصالت جعبه بنویس'+('BarcodeDetector' in window?' یا اسکن کن':'')+':<input type="text" id="l1Code" inputmode="numeric" autocomplete="off" placeholder="کد عددی برچسب">'+('BarcodeDetector' in window?'<button type="button" data-a="scan">📷 اسکن کد</button>':'')+'</div>'+
   '<div class="l1-step"><b>۲.</b> کد کپی می‌شود؛ در اپ «تیتک» یا سایت TTAC بزن و جواب را ببین.<div class="l1-row"><button type="button" class="go" data-a="site">کپی کد و رفتن به سایت TTAC</button><button type="button" data-a="copy">فقط کپی (اپ تیتک دارم)</button></div><span class="l1-note">پیامک را ترجیح می‌دهی؟ شماره‌ی پیامک روی خود برچسب نوشته شده.</span></div>'+
   '<div class="l1-step"><b>۳.</b> جواب چه بود؟<div class="l1-chips" data-g="res">'+Object.keys(RES).map(function(k){return '<button type="button" data-v="'+k+'">'+RES[k]+'</button>'}).join('')+'</div>از کجا خریدی؟<div class="l1-chips" data-g="seller">'+SELLERS.map(function(x){return '<button type="button" data-v="'+x[0]+'"'+(st.seller===x[0]?' class="on"':'')+'>'+x[1]+'</button>'}).join('')+'</div></div>'+
   '<div class="l1-row"><button type="button" class="go" data-a="save">ثبت کنار محصول</button><button type="button" data-l1x="1">بعداً</button></div><p class="l1-msg l1-note" role="status"></p>');
  var inp=o.querySelector('#l1Code'),m=o.querySelector('.l1-msg');
  o.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var g=b.parentNode.dataset&&b.parentNode.dataset.g;
    if(g){st[g]=b.dataset.v;[].forEach.call(b.parentNode.children,function(x){x.classList.toggle('on',x===b)});return}
    var a=b.dataset.a;if(!a)return;st.code=digits(inp.value);
    if(a==='scan'){scan(function(c){inp.value=c;st.code=c;st.src='scan';m.textContent='کد خوانده شد ✓ حالا قدم ۲.'});return}
    if(a==='site'||a==='copy'){if(st.code.length<8){m.textContent='اول کد را بنویس (فقط عددها).';inp.focus();return}copy(st.code).then(function(){m.textContent='کد کپی شد ✓ جواب را که دیدی، قدم ۳ را بزن.'});if(a==='site')window.open('https://ttac.ir','_blank','noopener');return}
    if(a==='save'){if(!st.res){m.textContent='جواب استعلام را انتخاب کن.';return}
      var all=rj('bw_auth_v1',{});if(!all||typeof all!=='object')all={};var l=Array.isArray(all[pid])?all[pid]:[];l.push({at:new Date().toISOString(),res:st.res,seller:st.seller||'',src:st.src,tail:st.code.slice(-4)});all[pid]=l.slice(-5);wj('bw_auth_v1',all);
      if(st.seller){var sl=rj('bw_sellers',{});if(!sl||typeof sl!=='object')sl={};sl[pid]=st.seller;wj('bw_sellers',sl)}
      window.bwL2({t:'auth',pid:pid,res:st.res,seller:st.seller||'',src:st.src});
      [].forEach.call(document.querySelectorAll('[data-l1-auth="'+pid+'"]'),function(x){x.outerHTML=authCard(pid)});
      if(st.res==='bad'){o.querySelector('.in').innerHTML='<h3>⚠️ این محصول را فعلاً استفاده نکن</h3><p>جعبه و فاکتور را نگه دار. می‌توانی موضوع را از راه سامانه‌ی پاسخگویی سازمان غذا و دارو گزارش کنی و از فروشنده پس بگیری.</p><p class="l1-note">جواب استعلام را خودت ثبت کردی؛ بیوتی‌ولت جای سامانه‌ی رسمی تصمیم نمی‌گیرد.</p><div class="l1-row"><button type="button" class="go" data-l1x="1">باشه</button></div>'}
      else{o.remove();toast(st.res==='ok'?'ثبت شد ✓ کنار محصولت در ولت می‌ماند':'ثبت شد؛ هر وقت جواب آمد، دوباره ثبتش کن')}}})}

/* product check → tag the check (layer 2) and offer the authenticity step inside the result card */
function watchChecks(){var box=document.getElementById('swResult');if(!box||box.__l1)return;box.__l1=1;
  new MutationObserver(function(){var card=box.querySelector('.sw-result');if(!card||card.querySelector('.l1-auth'))return;var pid=rj('bw_last_check','');if(!pid||typeof pid!=='string')return;
    style();card.insertAdjacentHTML('beforeend',authCard(pid));var stp=card.querySelector('.sw-stamp'),dec=stp&&(stp.className.match(/st-([a-z_]+)/)||[])[1]||'';
    if(box.__last!==pid+'|'+dec){box.__last=pid+'|'+dec;window.bwL2({t:'check',pid:pid,dec:dec})}}).observe(box,{childList:true,subtree:true})}
document.addEventListener('click',function(e){var b=e.target.closest('[data-l1="auth"]');if(b){e.preventDefault();authSheet(b.dataset.pid)}});

/* ---------- 4) follow-up answer → tag it; when the skin is unhappy, offer a reaction photo for this product ---------- */
var BAD={mild:1,bad:1,peel:1,new:1,tight:1};
window.addEventListener('bw-fu-answer',function(ev){var d=ev.detail||{};if(!d.pid)return;window.bwL2({t:'fu',pid:d.pid,c:d.c,k:d.k,v:d.v});
  if(!BAD[d.v])return;setTimeout(function(){style();var o=sheet('<h3>📍 یه عکس از همین الان؟</h3><p>اگه الان یه عکس بگیری، به «'+esc(d.name||pname(d.pid)||'این محصول')+'» وصل می‌شه؛ چند روز بعد کنار عکس تازه می‌بینی آروم‌تر شده یا نه. عکس روی گوشیت می‌مونه.</p><div class="l1-row"><button type="button" class="go" data-r="1">📷 عکس واکنش</button><button type="button" data-l1x="1">نه، ممنون</button></div>');
    o.querySelector('[data-r]').onclick=function(){o.remove();window.bwReactCtx={pid:d.pid,name:d.name||pname(d.pid),at:Date.now()};if(typeof window.switchTab==='function')window.switchTab('track');
      setTimeout(function(){var j=document.getElementById('skinJournal');j&&j.scrollIntoView({behavior:'smooth',block:'start'});window.BWSkinJournal&&window.BWSkinJournal.photo&&window.BWSkinJournal.photo()},350)}},2600)});

/* ---------- 2) today's tip for her city ---------- */
function seasonal(z){var m=+new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:'Asia/Tehran',month:'numeric'}).format(new Date());var summer=m>=3&&m<=6,winter=m>=9;
  if(z==='hot')return summer?'گرما و تعریق بالاست؛ ضدآفتاب سبک و تمدیدش بیرون از خانه، و شب شستن کامل صورت.':'هوا ملایم‌تره؛ ضدآفتاب صبح رو فراموش نکن.';
  if(z==='humid')return summer?'هوا شرجیه؛ مرطوب‌کننده‌ی سبک کافیه و لایه‌ها رو کم کن.':'رطوبت هوا خوبه؛ اگه اکتیو می‌زنی، کنارش مرطوب‌کننده بزن.';
  if(z==='cold')return winter?'سرما و باد پوست رو خشک می‌کنه؛ مرطوب‌کننده‌ی غنی‌تر شب‌ها، و اکتیوها رو کمتر.':'آفتاب ارتفاعات قویه؛ ضدآفتاب صبح مهمه.';
  return winter?'هوا خشکه؛ مرطوب‌کننده روی پوست کمی نمناک بزن.':summer?'آفتاب قویه؛ ضدآفتاب قبل از بیرون رفتن و تمدیدش.':'ضدآفتاب صبح و مرطوب‌کننده‌ی شب، پایه‌ی امروزه.'}
function tipsFrom(w,c){var t=[];if(!w)return [seasonal(ZONE[c]||'dry')];
  if(w.uv!=null){if(w.uv>=8)t.push('شاخص UV امروز '+fa(Math.round(w.uv))+' است (خیلی بالا)؛ ضدآفتاب قبل از بیرون رفتن و هر دو ساعت بیرون تمدید.');else if(w.uv>=5)t.push('UV امروز '+fa(Math.round(w.uv))+' است؛ ضدآفتاب صبح لازمه.');else t.push('UV امروز پایینه ('+fa(Math.round(w.uv))+')؛ ضدآفتاب صبح کافیه.')}
  if(w.hum!=null){if(w.hum<=25)t.push('رطوبت هوا '+fa(Math.round(w.hum))+'٪ است و خشکه؛ مرطوب‌کننده روی پوست نمناک، و امشب اکتیو سبک‌تر.');else if(w.hum>=70)t.push('رطوبت '+fa(Math.round(w.hum))+'٪ است؛ مرطوب‌کننده‌ی سبک کافیه.')}
  if((w.pm25!=null&&w.pm25>55)||(w.dust!=null&&w.dust>100)||(w.pm10!=null&&w.pm10>150))t.push('هوا آلوده یا غباریه؛ امشب صورت رو کامل بشور (اگه ضدآفتاب یا آرایش داشتی، دو مرحله).');
  return t.length?t:[seasonal(ZONE[c]||'dry')]}
function climateHtml(c,w,live){return '<div class="l1-card"><h4>🌤 پوستت امروز در '+esc(CITY[c])+'</h4>'+tipsFrom(w,c).map(function(x){return '<div class="l1-tip">'+esc(x)+'</div>'}).join('')+'<small>'+(live?'از هوای امروز '+esc(CITY[c])+' (Open-Meteo)':'نکته‌ی فصل؛ هوای زنده‌ی امروز در دسترس نبود')+' · <a href="#" data-l1="city">تغییر شهر</a></small></div>'}
function cityAsk(){return '<div class="l1-card"><h4>🌤 شهرت کجاست؟</h4><p>تا نکته‌ی هر روزِ پوستت رو با هوای همون‌جا بگم (آفتاب، رطوبت، غبار).</p><div class="l1-row"><select id="l1City"><option value="">انتخاب شهر</option>'+Object.keys(CITY).map(function(k){return '<option value="'+k+'">'+CITY[k]+'</option>'}).join('')+'</select><button type="button" class="go" data-l1="city-save">ذخیره</button></div></div>'}
function climate(el){var c=city();if(!c){el.innerHTML=cityAsk();return}var k='bw_l1_w_'+c,hit=null;try{hit=JSON.parse(sessionStorage.getItem(k)||'null')}catch(e){}
  if(hit&&Date.now()-hit.at<3*3600e3){el.innerHTML=climateHtml(c,hit.w,!!hit.w);return}el.innerHTML=climateHtml(c,null,false);
  fetch('/api/l2/climate?c='+c,{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){var w=j&&j.w;try{sessionStorage.setItem(k,JSON.stringify({at:Date.now(),w:w}))}catch(e){}if(w&&city()===c)el.innerHTML=climateHtml(c,w,true)}).catch(function(){})}

/* ---------- 3) «since you started X» ---------- */
function sinceHtml(list){var st=rj('bw_fu_start',{}),out=[];if(!st||typeof st!=='object')return '';
  Object.keys(st).forEach(function(pid){var s=dnum(st[pid]);if(!isFinite(s))return;var before=null,after=null;
    list.forEach(function(e){var d=dnum(new Date(e.date).toISOString());if(d<=s+2)before=e;if(d>=s+14)after=e});
    if(before&&after&&before!==after)out.push({pid:pid,b:before,a:after,n:dnum(new Date(after.date).toISOString())-s})});
  if(!out.length)return list.length?'<div class="l1-card"><h4>✨ «از وقتی … رو شروع کردی»</h4><p>وقتی محصول تازه‌ای به روتینت اضافه کردی، همون روزها یه عکس بگیر؛ دو هفته بعد اینجا عکس قبل و بعدش رو کنار هم می‌بینی.</p></div>':'';
  var u=window.BWSkinJournal.url;
  return out.slice(0,2).map(function(x){var nm=pname(x.pid)||'محصول تازه';return '<div class="l1-card"><h4>✨ از وقتی «'+esc(nm)+'» رو شروع کردی</h4><div class="l1-pair"><figure><img src="'+u(x.b)+'" alt="قبل"><figcaption>قبل · '+esc(faDate(x.b.date))+'</figcaption></figure><figure><img src="'+u(x.a)+'" alt="بعد"><figcaption>روز '+fa(x.n)+' · '+esc(faDate(x.a.date))+(x.a.adh!=null?'<br>روتین '+fa(x.a.adh)+'/۱۴ روز':'')+'</figcaption></figure></div>'+
    ((x.a.std&&x.b.std)?'':'<small>یکی از دو عکس در شرایط استاندارد (نور و بدون آرایش) گرفته نشده؛ با احتیاط مقایسه کن.</small>')+'<br><small>مقایسه با چشم خودته؛ بیوتی‌ولت عکس رو تحلیل یا تشخیص نمی‌کنه.</small></div>'}).join('')}

/* ---------- 5) monthly report ---------- */
var VL={ok:'خوب',good:'خوب',none:'بدون جوش تازه',most:'تقریباً هر روز',done:'عکس گرفته شد',mild:'کمی سوزش/قرمزی',tight:'کشیدگی',peel:'پوسته‌ریزی',meh:'بی‌تغییر',same:'جوش در جای همیشگی',some:'بعضی روزها',rare:'کم',bad:'اذیت شد',new:'جوش تازه'};
function ticksIn(n){var c=0;for(var i=0;i<n;i++){var t=rj('bw_track_'+tday(Date.now()-i*DAY),{});if(t&&Object.keys(t).some(function(k){return t[k]===true}))c++}return c}
function report(){var J=window.BWSkinJournal;if(!J||!J.list)return;track('l1_report');J.list().then(function(list){var now=dnum(tday()),from=now-30;
  var inM=list.filter(function(e){return dnum(new Date(e.date).toISOString())>=from}),a=inM[0]||list[0],b=list[list.length-1],days=ticksIn(30);
  var ans=rj('bw_fu_answers',{}),rows=[],badP='';Object.keys(ans||{}).forEach(function(pid){Object.keys(ans[pid]||{}).forEach(function(c){var x=ans[pid][c];if(!x||!x.at||x.v==='later'||dnum(x.at)<from)return;rows.push({pid:pid,c:+c,v:x.v,at:x.at});if(BAD[x.v]&&x.v!=='tight')badP=pid})});
  rows.sort(function(x,y){return x.at<y.at?-1:1});
  var au=rj('bw_auth_v1',{}),auN=0;Object.keys(au||{}).forEach(function(pid){(au[pid]||[]).forEach(function(x){if(dnum(new Date(x.at).toISOString())>=from)auN++})});
  var sug=badP?'«'+(pname(badP)||'محصولی که اذیتت کرد')+'» رو فعلاً کنار بذار تا پوستت آروم بشه؛ فقط شوینده‌ی ملایم، مرطوب‌کننده و ضدآفتاب. اگه قرمزی یا تورم ادامه داشت، با پزشک مشورت کن.':
    days<15?'ماه بعد اول روتین رو منظم کن: هدف ۲۰ روز از ۳۰. بدون مصرف منظم، هیچ عکسی منصفانه نشون نمی‌ده محصول جواب داده یا نه.':
    'همین روتین رو ادامه بده و ماه بعد محصول تازه‌ای اضافه نکن؛ این‌طوری اثر همین‌ها توی عکس بعدی معلوم می‌شه.';
  var pair=a&&b&&a!==b?'<div class="l1-pair"><figure><img src="'+J.url(a)+'" alt=""><figcaption>'+esc(faDate(a.date))+'</figcaption></figure><figure><img src="'+J.url(b)+'" alt=""><figcaption>'+esc(faDate(b.date))+'</figcaption></figure></div>'+((a.std&&b.std)?'':'<p class="l1-note">نور یا شرایط این دو عکس یکی نبوده؛ مقایسه رو با احتیاط ببین.</p>'):'<p class="l1-note">برای مقایسه حداقل دو عکس لازمه؛ عکس بعدی رو با «دوربین با قاب صورت» بگیر.</p>';
  sheet('<div class="l1-rep"><small>بیوتی‌ولت · پیش‌نمایش رایگان در دوره‌ی آزمایشی</small><h2>📄 گزارش ماهانه‌ی پوست من</h2><p class="l1-note">۳۰ روز گذشته، تا '+esc(faDate(new Date().toISOString()))+'</p>'+pair+
   '<div class="k"><div><b>'+fa(days)+'/۳۰</b>روز روتین تیک خورد</div><div><b>'+fa(inM.length)+'</b>عکس این ماه</div><div><b>'+fa(rows.length)+'</b>جواب پیگیری</div><div><b>'+fa(auN)+'</b>استعلام اصالت</div></div>'+
   (rows.length?'<b>پوستت با هر محصول</b><ul>'+rows.slice(-8).map(function(r){return '<li>'+esc(pname(r.pid)||r.pid)+' · روز '+fa(r.c)+': '+esc(VL[r.v]||r.v)+'</li>'}).join('')+'</ul>':'')+
   '<div class="l1-step"><b>پیشنهاد ماه بعد:</b> '+esc(sug)+'</div><p class="l1-note">این گزارش فقط از عکس‌ها، تیک‌ها و جواب‌های خودت ساخته شده؛ تحلیل تصویری یا پزشکی نیست و عکس‌هایت از گوشی بیرون نمی‌روند.</p>'+
   '<div class="l1-row"><button type="button" class="go" onclick="window.print()">ذخیره به PDF</button><button type="button" data-l1x="1">بستن</button></div></div>')}).catch(function(){toast('گزارش ساخته نشد؛ دوباره امتحان کن.')})}

/* ---------- 6) short film of her photos, made on the phone ---------- */
function loadImg(src){return new Promise(function(ok,bad){var i=new Image();i.onload=function(){ok(i)};i.onerror=bad;i.src=src})}
function film(){var J=window.BWSkinJournal;if(!J||!J.list)return;J.list().then(function(list){if(list.length<2)return toast('برای فیلم حداقل دو عکس لازمه.');track('l1_film');
  var o=sheet('<h3>🎞 فیلم کوتاه روند پوستم</h3><p>عکس‌هایت به ترتیب تاریخ، هر کدام کمتر از یک ثانیه. فیلم روی همین گوشی ساخته می‌شود و جایی فرستاده نمی‌شود.</p><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="l1Eyes" checked> نوار روی چشم‌ها (تقریبی؛ قبل از فرستادن نگاهش کن)</label><canvas id="l1Cv" width="540" height="720" style="width:100%;max-width:300px;display:block;margin:8px auto;border-radius:16px;background:#111"></canvas><div class="l1-row"><button type="button" class="go" data-f="go">ساخت فیلم</button><button type="button" data-l1x="1">بستن</button></div><p class="l1-msg l1-note" role="status"></p>');
  var cv=o.querySelector('#l1Cv'),x=cv.getContext('2d'),m=o.querySelector('.l1-msg'),d0=dnum(new Date(list[0].date).toISOString());
  function frame(img,e){var W=540,H=720,r=Math.max(W/img.width,H/img.height),w=img.width*r,h=img.height*r;x.fillStyle='#111';x.fillRect(0,0,W,H);x.drawImage(img,(W-w)/2,(H-h)/2,w,h);
    if(o.querySelector('#l1Eyes').checked){x.fillStyle='#000';x.fillRect(W*.14,H*.33,W*.72,H*.09)}
    x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,H-74,W,74);x.fillStyle='#fff';x.textAlign='center';x.font='bold 28px Vazirmatn, Tahoma, sans-serif';var n=dnum(new Date(e.date).toISOString())-d0;
    x.fillText((n?'روز '+fa(n):'شروع')+' · '+faDate(e.date),W/2,H-30);x.font='16px Vazirmatn, Tahoma, sans-serif';x.fillText('بیوتی‌ولت · دفترچه‌ی پوست من',W/2,30)}
  o.querySelector('[data-f]').onclick=function(){var btn=this;btn.disabled=true;m.textContent='در حال ساخت…';
    Promise.all(list.map(function(e){return loadImg(J.url(e))})).then(function(imgs){
      var types=['video/mp4','video/webm;codecs=vp9','video/webm'],mt=window.MediaRecorder&&cv.captureStream?types.find(function(t){try{return MediaRecorder.isTypeSupported(t)}catch(e){return false}}):null;
      if(!mt){frame(imgs[imgs.length-1],list[list.length-1]);cv.toBlob(function(b){done(b,'png')});return}
      var rec=new MediaRecorder(cv.captureStream(30),{mimeType:mt}),ch=[];rec.ondataavailable=function(ev){if(ev.data&&ev.data.size)ch.push(ev.data)};rec.onstop=function(){done(new Blob(ch,{type:mt.split(';')[0]}),mt.indexOf('mp4')>=0?'mp4':'webm')};
      rec.start();var i=0;(function next(){if(i>=imgs.length){setTimeout(function(){rec.stop()},900);return}frame(imgs[i],list[i]);i++;setTimeout(next,850)})()}).catch(function(){btn.disabled=false;m.textContent='فیلم ساخته نشد؛ دوباره امتحان کن.'});
    function done(b,ext){btn.disabled=false;var f;try{f=new File([b],'BeautyWallet-skin.'+ext,{type:b.type})}catch(e){f=b}
      if(navigator.canShare&&f instanceof File&&navigator.canShare({files:[f]})){m.innerHTML='آماده‌ست ✓ <button type="button" data-f="share">فرستادن</button>';o.querySelector('[data-f="share"]').onclick=function(){navigator.share({files:[f]}).catch(function(){})}}
      else{var u=URL.createObjectURL(b);m.innerHTML='آماده‌ست ✓ <a href="'+u+'" download="BeautyWallet-skin.'+ext+'">ذخیره روی گوشی</a>'}
      if(ext==='png')m.insertAdjacentHTML('beforeend','<br>این مرورگر فیلم نمی‌سازد؛ آخرین عکس با تاریخ ذخیره شد.')}}}).catch(function(){})}

/* ---------- the layer-1 block in the پیگیری tab (above the photo journal) ---------- */
function paint(){var j=document.getElementById('skinJournal');if(!j)return;style();var el=document.getElementById('bwL1');
  if(!el){el=document.createElement('div');el.id='bwL1';el.className='l1';el.innerHTML='<div class="l1-cl"></div><div class="l1-since"></div><div class="l1-card l1-tools" hidden><h4>📄 خلاصه‌ی پوست من</h4><div class="l1-row"><button type="button" class="go" data-l1="report">گزارش ماهانه‌ی پوستم</button><button type="button" data-l1="film">🎞 فیلم کوتاه روندم</button></div></div>';j.parentNode.insertBefore(el,j)}
  climate(el.querySelector('.l1-cl'));
  var J=window.BWSkinJournal;if(J&&J.list)J.list().then(function(list){el.querySelector('.l1-since').innerHTML=sinceHtml(list);var t=el.querySelector('.l1-tools');t.hidden=!list.length;t.querySelector('[data-l1="film"]').hidden=list.length<2}).catch(function(){})}
document.addEventListener('click',function(e){var b=e.target.closest('[data-l1]');if(!b)return;var a=b.dataset.l1;
  if(a==='report'){e.preventDefault();report()}else if(a==='film'){e.preventDefault();film()}
  else if(a==='city'){e.preventDefault();var el=document.querySelector('#bwL1 .l1-cl');if(el)el.innerHTML=cityAsk()}
  else if(a==='city-save'){var s=document.getElementById('l1City');if(!s||!s.value)return;wj('bw_city',s.value);track('l1_city');paint()}});
window.addEventListener('bw-journal',function(){setTimeout(paint,50)});
function start(){watchChecks();paint();flush()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(start,600)});else setTimeout(start,600);
window.BWLayer1={report:report,film:film,auth:authSheet,paint:paint,flush:flush};
})();
