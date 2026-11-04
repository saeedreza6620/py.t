/* BeautyWallet — messages from the BeautyWallet team (the panel's «استودیوی پیام»), shown as one small card
   at the top of the app, and the notification permission asked once, right after the app is installed,
   so she doesn't have to find the reminder settings herself. */
(function(){'use strict';
function dev(){try{return localStorage.getItem('bw_device')||''}catch(e){return ''}}
function signed(){try{var r=JSON.parse(localStorage.getItem('bw_reg')||'null');return !!(r&&r.phone)}catch(e){return false}}
var CSS='.bw-ib{position:fixed;top:calc(env(safe-area-inset-top,0px) + 64px);left:12px;right:12px;z-index:60;max-width:520px;margin:0 auto;background:#fff;border-radius:20px;padding:14px 16px 12px;box-shadow:0 18px 40px -16px rgba(80,50,170,.55);border:1px solid #ece6ff;direction:rtl;font-family:inherit;animation:bwIbIn .35s ease}'+
 '@keyframes bwIbIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}.bw-ib small{color:#7b6fb8;font-size:12px}.bw-ib p{margin:6px 0 10px;line-height:1.85;font-size:15px;color:#241a4f}'+
 '.bw-ib .r{display:flex;gap:8px;align-items:center}.bw-ib button{font:inherit;border:0;border-radius:14px;padding:9px 14px;font-weight:800;cursor:pointer}.bw-ib .go{background:linear-gradient(135deg,#7c5cf0,#c86dd7);color:#fff}.bw-ib .x{background:#f1edff;color:#241a4f}'+
 '.bw-ib .no{background:none;color:#9a91c7;font-size:12px;font-weight:400;margin-inline-start:auto;padding:4px}';
function style(){if(document.getElementById('bwIbCss'))return;var s=document.createElement('style');s.id='bwIbCss';s.textContent=CSS;document.head.appendChild(s)}
function ev(id,a){if(!dev())return;try{fetch('/api/inbox/ev',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({d:dev(),id:id,a:a})})}catch(e){}}
function act(cta){var t=window.switchTab;try{
  if(cta==='check'){t&&t('sw-home');setTimeout(function(){var i=document.getElementById('swAsk');if(i){i.focus();i.scrollIntoView({block:'center',behavior:'smooth'})}},250)}
  else if(cta==='routine')t&&t('sw-routine');else if(cta==='gift')t&&t('sw-gift');
  else if(cta==='wallet'){if(window.bwNegin)window.bwNegin();else t&&t('wallet')}
  else if(cta==='chat'&&window.BWGem)window.BWGem.open()}catch(e){}}
var shown={},busy=false,lastAt=0;
function show(m){style();var old=document.querySelector('.bw-ib');if(old)old.remove();var d=document.createElement('div');d.className='bw-ib';d.setAttribute('role','status');
  d.innerHTML='<small>💜 از طرف بیوتی‌ولت</small><p></p><div class="r">'+(m.cta?'<button type="button" class="go"></button>':'')+'<button type="button" class="x">باشه</button><button type="button" class="no">دیگه از این پیام‌ها نفرست</button></div>';
  d.querySelector('p').textContent=m.text;if(m.cta)d.querySelector('.go').textContent=m.label||'بزن بریم';document.body.appendChild(d);shown[m.id]=1;ev(m.id,'seen');
  d.onclick=function(e){if(e.target.closest('.go')){ev(m.id,'click');d.remove();act(m.cta)}else if(e.target.closest('.x')){ev(m.id,'close');d.remove()}
    else if(e.target.closest('.no')){ev(m.id,'optout');d.remove();try{var tt=document.createElement('div');tt.className='sw-toast';tt.textContent='باشه عزیزم، دیگه پیامی نمی‌فرستیم 💜';document.body.append(tt);setTimeout(function(){tt.remove()},2600)}catch(_){}}}}
function check(){if(busyUI()){if(!check.w){check.w=1;setTimeout(function(){check.w=0;check()},4000)}return}if(busy||!signed()||!dev()||Date.now()-lastAt<15000)return;busy=true;lastAt=Date.now();
  fetch('/api/inbox?d='+encodeURIComponent(dev()),{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){var m=(j.msgs||[]).filter(function(x){return !shown[x.id]})[0];if(m&&!document.querySelector('.bw-ib'))show(m)}).catch(function(){}).then(function(){busy=false})}
document.addEventListener('visibilitychange',function(){if(!document.hidden)check()});
try{navigator.serviceWorker&&navigator.serviceWorker.addEventListener('message',function(e){if(e.data&&e.data.bw==='notif-open'){lastAt=0;check()}})}catch(e){}

/* notification permission, once, right after installing */
var standalone=false;try{standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){}
function canAsk(){return 'Notification' in window&&'serviceWorker' in navigator&&'PushManager' in window&&Notification.permission==='default'}
// wait until the welcome screen and any open sheet are gone, so nothing covers the question
function busyUI(){var w=document.querySelector('.bw-wel'),sh=document.getElementById('swSheet'),bk=sh&&sh.parentElement;return !!(w||(bk&&!bk.hidden&&bk.offsetParent!==null))}
function whenFree(fn,n){n=n||0;if(busyUI()&&n<120){setTimeout(function(){whenFree(fn,n+1)},1500);return}fn()}
var forced=/[?&]perm=1\b/.test(location.search); // a personal link «…/legacy/?perm=1» asks at once, even in the browser
function askPerm(){try{if(sessionStorage.getItem('bw_wel_perm'))return}catch(e){}if(busyUI())return whenFree(askPerm);var K='bw_perm_asked';try{if(!forced&&Date.now()-Number(localStorage.getItem(K)||0)<3*864e5)return;localStorage.setItem(K,String(Date.now()))}catch(e){}
  if(!canAsk()||document.querySelector('.bw-ib'))return;style();var d=document.createElement('div');d.className='bw-ib';
  var nm='';try{nm=(JSON.parse(localStorage.getItem('bw_reg')||'null')||{}).name||''}catch(_){}nm=String(nm).trim().split(/\s+/)[0]||'';
  d.innerHTML='<small>🔔 یه قدم کوچیک</small><p>'+(nm?nm.replace(/[<>&]/g,'')+' جان، ':'')+'بذار یادآور روتینت و پیام‌های بیوتی‌ولت روی گوشیت بیاد؛ صبح‌ها ساعت ۹ و شب‌ها ساعت ۹ (بعداً هر وقت خواستی عوضش کن).</p><div class="r"><button type="button" class="go">اجازه بده 💜</button><button type="button" class="x">بعداً</button></div>';
  document.body.appendChild(d);if(window.bwTrack)try{window.bwTrack('install_offer')}catch(e){}
  d.onclick=function(e){if(e.target.closest('.go')){d.remove();try{var n=JSON.parse(localStorage.getItem('bw_fu_notif')||'{}');if(n.amOn===undefined)n.amOn=true;if(n.pmOn===undefined)n.pmOn=true;localStorage.setItem('bw_fu_notif',JSON.stringify(n))}catch(_){}if(window.BWFollowup&&window.BWFollowup.enable)window.BWFollowup.enable();else try{Notification.requestPermission()}catch(_){}}else if(e.target.closest('.x'))d.remove()}}
window.addEventListener('appinstalled',function(){setTimeout(askPerm,1500)});
// installed app, the personal link, or anyone signed in who never turned notifications on (browser too): asked on opening
setTimeout(function(){if((standalone||forced||signed())&&canAsk())askPerm();check()},3500);
setInterval(check,5*60e3);
window.BWInbox={check:function(){lastAt=0;check()},askPerm:askPerm};
})();
