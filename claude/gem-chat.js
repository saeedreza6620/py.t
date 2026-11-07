/* BeautyWallet — the gem: a free, caring skin chat (no login). Opens from the floating gem on the home
   screen ("دستیار پوست قشنگتم؛ بزن روی الماس بیا صحبت کنیم") and from the corner gem. It gets to know the
   skin one question at a time, answers from current dermatology, and offers a BeautyWallet feature only
   when it truly answers her need (check before buying, routine, photo journal, follow-up). */
(function(){'use strict';
var K='bw_gem_chat',MAX=40;
var $=function(s,r){return (r||document).querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
function rj(k,d){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}}
function wj(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var track=function(t){try{window.bwTrack&&window.bwTrack(t)}catch(e){}};
var HELLO='سلام قشنگم 💎 من دستیار پوستتم. سؤال پوستی داری، یا می‌خوای روتینت رو با هم بچینیم؟ اگه هم چیزی اذیتت می‌کنه، از همین پایین انتخابش کن 💜';
var ACTS='<button type="button" data-gc="ask">💭 یه سؤال دارم</button><button type="button" data-offer="build_routine">🧴 روتینم رو با هم بچینیم</button>';
var START=['جوش دارم 🔴','لک دارم 🌤','پوستم خشکه 🍂','چربی و براقی 💧','منافذ باز','قرمزی و حساسیت 🌹','چین و چروک','نمی‌دونم پوستم چیه 🤍'];
var READY=['یه روتین ساده برای شروع می‌خوام','فرق نیاسینامید و ویتامین C چیه؟','ضدآفتاب رو چطور درست بزنم؟','این محصول به پوستم می‌خوره؟'];
var OFFER={open_journal:'📒 دفترچه‌ی عکس پوستم توی ولت',check_product:'🔍 بررسی یه محصول با پوستم',build_routine:'🧴 روتینم رو بچین',photo_journal:'📷 عکس شروع پوستم',add_routine:'➕ اضافه به روتینم',send_photo:'📷 عکس همون جا رو بفرستم'};

function state(){var s=rj(K,null);if(!s||!Array.isArray(s.m))s={m:[]};return s}
function save(s){s.m=s.m.slice(-MAX);wj(K,s)}
function profileCtx(){var p=rj('bw_profile_v1_full',{})||{},ids=rj('bw_check_products',[]),names=[];
  try{names=(Array.isArray(ids)?ids:[]).slice(0,10).map(function(id){var f=window.BWCatalog&&BWCatalog.formula(id);return f&&f.name||''}).filter(Boolean)}catch(e){}
  var careful=false;try{careful=!!(window.BWFollowup&&BWFollowup.careful())}catch(e){}
  return {skinBase:p.skinBase||'',skinToday:p.skinToday||'',symptoms:p.symptoms||[],goal1:p.goal1||'',routine:names,careful:careful,registered:!!rj('bw_reg',null)}}
function learn(pr){if(!pr)return '';var p=rj('bw_profile_v1_full',{})||{},said=[];
  if(pr.skinBase&&!p.skinBase){p.skinBase=pr.skinBase;said.push('پوست '+pr.skinBase)}
  var map={'جوش':'جوش فعال','لک':'لک و تیرگی','خشکی':'خشکی','چربی':'چربی و براقی زیاد','منافذ باز':'منافذ باز','قرمزی و حساسیت':'قرمزی','چین و چروک':'خطوط ریز و چین‌وچروک'};
  var sym=Array.isArray(p.symptoms)?p.symptoms.slice():[];(pr.concerns||[]).forEach(function(c){var v=map[c];if(v&&sym.indexOf(v)<0){sym.push(v);said.push(c)}});
  if(!said.length)return '';p.symptoms=sym;wj('bw_profile_v1_full',p);return said.join('، ')}

/* ---------- UI ---------- */
var CSS='@keyframes gemFloat{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-7px) rotate(3deg)}}@keyframes gemGlow{0%,100%{filter:drop-shadow(0 6px 14px rgba(120,170,255,.45))}50%{filter:drop-shadow(0 8px 22px rgba(255,140,200,.6))}}'+
'#swHeroGem svg,.sw-fab-gem svg{animation:gemFloat 3.2s ease-in-out infinite,gemGlow 3.2s ease-in-out infinite!important}'+
'.gc-cap{display:block;text-align:center;font-size:13.5px;color:#4b3f7a;margin:2px auto 8px;line-height:1.8;cursor:pointer}.gc-cap b{color:#7a4fd0}'+
'.gc{position:fixed;inset:0;z-index:10050;background:linear-gradient(170deg,#f4f8ff,#f8f1ff 55%,#fff3f8);display:flex;flex-direction:column;font-size:15px}.gc[hidden]{display:none}'+
'.gc-top{display:flex;align-items:center;gap:10px;padding:12px 14px calc(10px) 14px;padding-top:calc(12px + env(safe-area-inset-top,0px));border-bottom:1px solid #ece6fb;background:rgba(255,255,255,.7);backdrop-filter:blur(8px)}.gc-top b{flex:1;font-size:15.5px;color:#2d2a4a}.gc-top small{display:block;font-weight:400;color:#8a83a8;font-size:12px}.gc-top svg{width:38px;height:38px;animation:gemFloat 3.2s ease-in-out infinite}.gc-top button{border:0;background:#f0eefb;border-radius:12px;padding:8px 11px;font:inherit;font-size:13px;color:#4b3f7a}'+
'.gc-list{flex:1;overflow-y:auto;padding:14px 12px 8px;-webkit-overflow-scrolling:touch}.gc-m{max-width:86%;margin:6px 0;padding:10px 13px;border-radius:18px;line-height:1.95;white-space:pre-wrap;word-wrap:break-word}.gc-b{background:#fff;color:#2d2a4a;border-bottom-right-radius:6px;box-shadow:0 4px 14px rgba(110,90,190,.10)}.gc-u{margin-inline-start:auto;background:linear-gradient(135deg,#7aa7ff,#b892ff);color:#fff;border-bottom-left-radius:6px}'+
'.gc-chips{display:flex;flex-wrap:wrap;gap:7px;margin:6px 0 4px}.gc-acts button{background:linear-gradient(135deg,#7aa7ff,#c08cff)!important;color:#fff!important;border:0!important;font-weight:700}.gc-chips button{border:1px solid #e3dbfa;background:#fff;border-radius:16px;padding:8px 12px;font:inherit;font-size:13.5px;color:#4b3f7a;cursor:pointer}.gc-offer{display:block;margin:6px 0;border:0;border-radius:16px;padding:10px 14px;font:inherit;font-size:14px;background:linear-gradient(135deg,#7aa7ff,#c08cff 60%,#ff9cc7);color:#fff;cursor:pointer}'+
'.gc-src{font-size:11.5px;color:#8a83a8;margin:2px 4px 6px}.gc-src a{color:#6a5bb0}.gc-note{font-size:12px;color:#5d7a63;background:#eef8f1;border-radius:12px;padding:5px 10px;margin:4px 0;display:inline-block}'+
'.gc-typing{display:inline-flex;gap:4px}.gc-typing i{width:7px;height:7px;border-radius:50%;background:#b8a8ef;animation:gemFloat 1s infinite}.gc-typing i:nth-child(2){animation-delay:.15s}.gc-typing i:nth-child(3){animation-delay:.3s}'+
'.gc-photo{padding:10px 12px;background:#fff;border-top:1px solid #ece6fb}.gc-photo[hidden]{display:none}.gc-photo img{max-width:150px;max-height:150px;border-radius:14px;display:block;margin-bottom:8px;object-fit:cover}.gc-photo label{display:flex;gap:7px;font-size:12.5px;color:#4b3f7a;line-height:1.85;margin-bottom:8px}.gc-photo label input{flex:none;margin-top:3px}.gc-prow{display:flex;gap:8px}.gc-photo button{border:0;border-radius:13px;padding:9px 13px;font:inherit;font-size:13.5px;background:#f0eefb;color:#4b3f7a}.gc-photo .gc-psave{background:linear-gradient(135deg,#7aa7ff,#c08cff);color:#fff}.gc-photo .gc-pmsg{font-size:12.5px;color:#9b2d3c;margin:0 0 8px}'+
'.gc-in{display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid #ece6fb;background:#fff}.gc-in textarea{flex:1;resize:none;border:1px solid #e3dbfa;border-radius:16px;padding:10px 12px;font:inherit;font-size:15px;min-height:22px;max-height:110px}.gc-in button{border:0;border-radius:16px;padding:0 16px;font:inherit;background:linear-gradient(135deg,#7aa7ff,#c08cff);color:#fff;font-size:15px}.gc-ready{display:flex;gap:7px;overflow-x:auto;padding:0 12px 8px;background:#fff}.gc-ready button{flex:0 0 auto;border:0;background:#f4f1fd;border-radius:14px;padding:7px 11px;font:inherit;font-size:12.5px;color:#4b3f7a}';
var root,list,busy=false;
function gem(){try{var b=document.querySelector('#swHeroGem svg');if(b)return b.outerHTML}catch(e){}return '<span style="font-size:30px">💎</span>'}
function build(){if(root)return;var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  root=document.createElement('section');root.className='gc';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-label','دستیار پوست بیوتی‌ولت');
  root.innerHTML='<div class="gc-top">'+gem()+'<b>دستیار پوست قشنگت<small>رایگان · همین‌جا کنارتم 💜</small></b><button type="button" data-gc="new">گفت‌وگوی تازه</button><button type="button" data-gc="close" aria-label="بستن">✕</button></div><div class="gc-list" aria-live="polite"></div><div class="gc-photo" id="gcPhoto" hidden></div><div class="gc-ready"></div><form class="gc-in" autocomplete="off"><textarea rows="1" placeholder="هر چی دلت می‌خواد بپرس…" aria-label="پیام"></textarea><button type="submit" aria-label="ارسال">↑</button></form><input type="file" id="gcFile" accept="image/*" capture="environment" hidden>';
  document.body.appendChild(root);list=$('.gc-list',root);
  $('.gc-ready',root).innerHTML='<button type="button" data-offer="build_routine">🧴 روتین و محصولاتم</button><button type="button" data-offer="send_photo">📷 عکس بفرستم</button>'+READY.map(function(q){return '<button type="button" data-q="'+esc(q)+'">'+esc(q)+'</button>'}).join('');
  root.addEventListener('click',function(e){var b=e.target.closest('button,a');if(!b)return;
    if(b.dataset.gc==='close')return close();
    if(b.dataset.gc==='new'){wj(K,{m:[]});return paint()}
    if(b.dataset.gc==='ask'){var t=$('textarea',root);if(t){t.placeholder='سؤالت رو بنویس عزیزم…';t.focus()}return}
    if(b.id==='gcPSave')return savePhoto();
    if(b.id==='gcPCancel')return cancelPhoto();
    if(b.dataset.q)return sendMsg(b.dataset.q);
    if(b.dataset.offer){track('gem_offer');return offer(b.dataset.offer)}});
  root.addEventListener('change',function(e){if(e.target.id==='gcFile'){var f=e.target.files&&e.target.files[0];e.target.value='';if(f)handlePhoto(f)}});
  var ta=$('textarea',root);ta.addEventListener('input',function(){ta.style.height='auto';ta.style.height=Math.min(110,ta.scrollHeight)+'px'});
  ta.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('form',root).requestSubmit()}});
  $('form',root).addEventListener('submit',function(e){e.preventDefault();var v=ta.value.trim();if(!v)return;ta.value='';ta.style.height='auto';sendMsg(v)});
  window.addEventListener('popstate',function(){if(!root.hidden)close(true)})}
function bubble(m,i,last){var h='<div class="gc-m '+(m.role==='user'?'gc-u':'gc-b')+'">'+esc(m.content)+'</div>';
  if(m.role!=='user'){if(m.note)h+='<span class="gc-note">📝 '+esc(m.note)+'</span>';
    if(m.sources&&m.sources.length)h+='<div class="gc-src">منبع: '+m.sources.map(function(s){var u;try{u=new URL(s.url)}catch(e){return ''}return '<a href="'+esc(u.href)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'</a>'}).join(' · ')+'</div>';
    if(last&&m.offer)h+='<button type="button" class="gc-offer" data-offer="'+esc(m.offer.kind)+'">'+esc(OFFER[m.offer.kind]||m.offer.text)+(m.offer.text?' <small style="display:block;font-weight:400;opacity:.9">'+esc(m.offer.text)+'</small>':'')+'</button>';
    if(last&&m.acts)h+='<div class="gc-chips gc-acts">'+m.acts+'</div>';
    if(last&&m.chips&&m.chips.length)h+='<div class="gc-chips">'+m.chips.map(function(c){return '<button type="button" data-q="'+esc(c)+'">'+esc(c)+'</button>'}).join('')+'</div>'}
  return h}
function paint(typing){var s=state(),h=bubble({role:'assistant',content:HELLO,chips:s.m.length?[]:START,acts:s.m.length?'':ACTS},0,!s.m.length);
  s.m.forEach(function(m,i){h+=bubble(m,i,i===s.m.length-1&&!typing)});if(typing)h+='<div class="gc-m gc-b"><span class="gc-typing"><i></i><i></i><i></i></span></div>';
  list.innerHTML=h;list.scrollTop=list.scrollHeight}
function sendMsg(text){if(busy)return;busy=true;var s=state();s.m.push({role:'user',content:String(text).slice(0,900)});save(s);paint(true);track('gem_msg');
  var dev='';try{dev=localStorage.getItem('bw_device')||''}catch(e){}
  fetch('/api/skinchat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({d:dev,profile:profileCtx(),messages:s.m.slice(-10).map(function(m){return {role:m.role,content:m.content}})})})
  .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})
  .then(function(x){var j=x.j||{},s2=state();if(!x.ok&&!j.reply){s2.m.push({role:'assistant',content:j.error||'یه لحظه حواسم پرت شد عزیزم؛ دوباره بفرست 💜',chips:[text]});save(s2);return}
    var note=learn(j.profile);s2.m.push({role:'assistant',content:j.reply,chips:j.chips||[],offer:j.offer||null,sources:j.sources||[],note:note?'تو پروفایلت نوشتم: '+note:''});save(s2)})
  .catch(function(){var s2=state();s2.m.push({role:'assistant',content:'اینترنتت یه لحظه قطع شد قشنگم؛ دوباره بفرست 💜',chips:[text]});save(s2)})
  .then(function(){busy=false;paint()})}
function offer(k){if(k==='send_photo')return startPhoto();
  // building a routine is personal: it needs her login first (then it's remembered and tailored to her)
  if(k==='build_routine'&&!registeredNow()){close();setTimeout(function(){if(typeof window.bwRegister==='function')window.bwRegister(function(){offer('build_routine')},window.bwRoutineWhy)},150);return}
  close();setTimeout(function(){
  if(k==='check_product'){if(typeof window.switchTab==='function')window.switchTab('sw-home');var a=document.getElementById('swAsk');if(a){a.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(function(){a.focus()},350)}}
  else if(k==='build_routine'){if(typeof window.switchTab==='function')window.switchTab('sw-home');var g=document.getElementById('sw-home');var gd=g&&g.querySelector('#swGuide');if(gd&&gd.hidden){bypass=true;var hg=g.querySelector('#swHeroGem');hg&&hg.click()}setTimeout(function(){var c=document.querySelector('#swGuide [data-g="start"],#swGuide [data-g="myrtn"]');c&&c.click()},250)}
  else if(k==='photo_journal'||k==='open_journal'){if(typeof window.switchTab==='function')window.switchTab('track');setTimeout(function(){var j=document.getElementById('skinJournal');j&&j.scrollIntoView({behavior:'smooth',block:'start'})},300)}
  else if(k==='add_routine'){if(typeof window.switchTab==='function')window.switchTab('sw-routine')}},120)}

/* ---------- send a photo from inside the chat: needs login first (photos only ever belong to
   a member's own secured journal), then reuses skin-journal.js's resize/encrypt/sync pipeline ---------- */
var pendingImg=null;
function startPhoto(){
  // the native file-picker only opens from a direct tap, not after an async login step — so after
  // registering we just reopen the chat and ask her to tap "عکس بفرستم" once more, rather than
  // auto-clicking the hidden input (that silently fails to open the picker on iOS Safari)
  if(!registeredNow()){close();
    setTimeout(function(){if(typeof window.bwRegister==='function')window.bwRegister(function(){var s=state();s.m.push({role:'assistant',content:'خوش اومدی 💜 حالا برای فرستادن عکس، یه بار دیگه روی «📷 عکس بفرستم» بزن.'});save(s);open()})},150);
    return}
  var f=$('#gcFile',root);f&&f.click()}
function registeredNow(){return !!rj('bw_reg',null)}
function handlePhoto(file){if(!window.BWSkinJournal||!window.BWSkinJournal.prepare){var s=state();s.m.push({role:'assistant',content:'این مرورگر الان عکس رو نمی‌پذیره؛ از تب «روتین → پیگیری» امتحان کن 💜'});save(s);return paint()}
  var box=$('#gcPhoto',root);if(box){box.hidden=false;box.innerHTML='<p class="gc-pmsg" style="color:#4b3f7a">در حال آماده‌سازی عکس روی گوشی…</p>'}
  window.BWSkinJournal.prepare(file).then(function(img){pendingImg=img;showPhotoConsent(URL.createObjectURL(new Blob([img.data],{type:img.type})))})
    .catch(function(){if(box){box.hidden=true;box.innerHTML=''}var s=state();s.m.push({role:'assistant',content:'این عکس باز نشد؛ یه عکس JPG یا PNG دیگه امتحان کن 💜'});save(s);paint()})}
function showPhotoConsent(url){var box=$('#gcPhoto',root);if(!box)return;
  box.innerHTML='<img src="'+url+'" alt="پیش‌نمایش عکس"><label><input type="checkbox" id="gcConsent" checked> مثل همیشه، این عکس روی گوشی‌ام رمز می‌شود و نسخه‌ی رمزشده‌اش در فضای امن بیوتی‌ولت پشتیبان می‌ماند؛ در دفترچه‌ی عکس پوستم ثبت شود</label><div class="gc-prow"><button type="button" class="gc-psave" id="gcPSave">ثبت عکس</button><button type="button" id="gcPCancel">انصراف</button></div>';}
function cancelPhoto(){pendingImg=null;var box=$('#gcPhoto',root);if(box){box.hidden=true;box.innerHTML=''}}
function savePhoto(){if(!pendingImg)return;var ck=$('#gcConsent',root);if(ck&&!ck.checked)return;
  var btn=$('#gcPSave',root);if(btn)btn.disabled=true;var img=pendingImg;
  var s0=state(),lastUser=(s0.m.slice().reverse().filter(function(m){return m.role==='user'})[0]||{}).content||'';
  window.BWSkinJournal.commit(img,{note:'از گفت‌وگوی دستیار: '+String(lastUser).slice(0,120)}).then(function(){pendingImg=null;
    var box=$('#gcPhoto',root);if(box){box.hidden=true;box.innerHTML=''}
    var s=state(),nth=s.m.filter(function(m){return m.photo}).length;
    // first photo in this chat: what happens next in daily care, honestly; later photos: short
    var txt=nth?'این عکس هم کنار قبلی، با تاریخ امروز، توی دفترچه‌ی عکس پوستت ثبت شد 💜 بگو این یکی مال کجای صورته و چی توش می‌بینی تا همین‌جا راهنماییت کنم.'
      :'عکست امن توی «دفترچه‌ی عکس پوست من» در ولتت ثبت شد 💜 این عکس، نقطه‌ی شروع مراقبت روزانه‌ته:\n'+
       '۱. هر صبح و شب روتینت رو تیک می‌زنی؛ یادآور روتین هم اگه روشنش کنی میاد.\n'+
       '۲. روز ۱۴، روز ۲۸ و هفته‌ی ۸ و ۱۲، توی ولتت نشونت می‌دیم وقت عکس بعدیه؛ با همون نور و همون فاصله.\n'+
       '۳. هر عکس با روتین همون روزها کنار هم می‌مونه تا تغییر واقعی پوستت معلوم بشه، نه حس یه روز.\n'+
       'من خودم عکس رو نمی‌بینم؛ پس بگو دقیقاً کجای صورته و چی می‌بینی (جوش، لک، قرمزی، رنگ) تا همین‌جا برای خودت راهنماییت کنم.';
    s.m.push({role:'assistant',content:txt,photo:1,offer:{kind:'open_journal',text:''}});save(s);paint();track('journal_photo')})
  .catch(function(){if(btn)btn.disabled=false;var box=$('#gcPhoto',root);if(box){var m=document.createElement('p');m.className='gc-pmsg';m.textContent='عکس ذخیره نشد؛ دوباره امتحان کن.';box.insertBefore(m,box.firstChild)}})}
function open(){build();root.hidden=false;document.body.style.overflow='hidden';try{history.pushState({gc:1},'')}catch(e){}paint();track('gem_open');setTimeout(function(){var t=$('textarea',root);if(t&&window.innerWidth>700)t.focus()},200)}
function close(fromPop){if(!root||root.hidden)return;root.hidden=true;document.body.style.overflow='';if(!fromPop){try{if(history.state&&history.state.gc)history.back()}catch(e){}}}

/* ---------- the gem on the home screen opens the chat ---------- */
var bypass=false;
function caption(){var say=document.getElementById('swHeroSay');if(say&&!say.dataset.gc){say.dataset.gc='1';say.innerHTML='<b>دستیار پوست قشنگتم 💎</b><br>بزن روی الماس، بیا با هم صحبت کنیم'}}
document.addEventListener('click',function(e){var t=e.target.closest('#swHeroGem,#swHeroSay,.sw-fab');if(!t)return;if(bypass){bypass=false;return}
  e.preventDefault();e.stopImmediatePropagation();open()},true);
function init(){caption();if(!document.getElementById('swHeroSay'))setTimeout(init,600)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.BWGem={open:open,close:close};
})();
