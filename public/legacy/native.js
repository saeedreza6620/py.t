/* BeautyWallet v144 — the Android app (Capacitor, ir.beautywallet.app) and the iPhone home-screen nudge.
 * Android app: the page is the same live site; Capacitor's bridge (injected at document start for this origin, also when the
 * service worker serves the page offline) gives us LocalNotifications. Routine reminders are then scheduled ON THE PHONE,
 * so they arrive at her time even with no internet — the one thing the web app cannot do.
 *   - The reminder plan is the same one followup.js writes for the service worker (IndexedDB bw-followup/kv 'plan').
 *   - Morning 'am' and night 'pm' repeat daily at her times; follow-up questions are one-off on their day.
 *   - Reads her settings; writes only two NEW keys: bw_native_notif ('granted'|'denied') and bw_native_sig.
 * iPhone in Safari (not added to the home screen): reminders need «Add to Home Screen» (iOS 16.4+), so a gentle card
 * offers the existing install guide, at most once every 4 days. Nothing here changes any user data. */
(function(){'use strict';
var C=window.Capacitor;
function nat(){try{return !!(C&&C.isNativePlatform&&C.isNativePlatform()&&C.isPluginAvailable&&C.isPluginAvailable('LocalNotifications'))}catch(e){return false}}
function rj(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}}
function track(n){try{window.bwTrack&&window.bwTrack(n)}catch(e){}}

/* ---------- iPhone: add to home screen so reminders can work ---------- */
function iosNudge(){var ua=navigator.userAgent,ios=/iphone|ipad|ipod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var standalone=window.navigator.standalone===true||window.matchMedia('(display-mode: standalone)').matches;if(!ios||standalone)return;
  var last=Number(ls('bw_ios_nudge')||0);if(Date.now()-last<4*864e5)return;
  setTimeout(function(){if(document.querySelector('.bw-wel'))return;var btn=document.getElementById('installHomeButton')||document.getElementById('installAppButton');if(!btn)return;
    ls('bw_ios_nudge',String(Date.now()));track('ios_nudge');
    var d=document.createElement('div');d.className='bw-iosn';d.innerHTML='<b>📲 بیوتی‌ولت رو به صفحه‌ی اصلی آیفونت اضافه کن</b><small>اون‌وقت مثل یه اپ باز می‌شه و یادآور روتینت هم می‌رسه. سه قدم ساده‌ست.</small><div><button type="button" data-a="go">نشونم بده</button><button type="button" data-a="no">بعداً</button></div>';
    document.body.append(d);d.addEventListener('click',function(e){var a=e.target.closest('[data-a]');if(!a)return;d.remove();if(a.dataset.a==='go'){track('ios_nudge_go');btn.click()}})},9000)}

var CSS='.bw-iosn{position:fixed;left:12px;right:12px;bottom:calc(96px + env(safe-area-inset-bottom));z-index:9990;background:#fff;border:1px solid #e6defa;border-radius:20px;padding:14px 16px;box-shadow:0 18px 40px -18px rgba(70,50,140,.45);text-align:right;font-family:inherit}'+
'.bw-iosn b{display:block;font-size:15px;color:#1f2a44}.bw-iosn small{display:block;font-size:13px;color:#6d6688;line-height:1.8;margin:4px 0 10px}.bw-iosn div{display:flex;gap:8px}'+
'.bw-iosn button{flex:1;min-height:44px;border-radius:14px;border:0;font:800 14px inherit;cursor:pointer}.bw-iosn [data-a=go]{background:linear-gradient(135deg,#8fd3ff,#c79bff);color:#fff}.bw-iosn [data-a=no]{background:#f4f1fb;color:#5b5675}'+
'html.bw-native #installAppButton,html.bw-native #installHomeButton,html.bw-native .install-app,html.bw-native [data-install]{display:none!important}';
function css(){if(document.getElementById('bwNativeCss'))return;var s=document.createElement('style');s.id='bwNativeCss';s.textContent=CSS;document.head.append(s)}

/* ---------- Android app: on-time reminders scheduled on the phone ---------- */
function LN(m,o){return C.nativePromise('LocalNotifications',m,o||{})}
function granted(){return ls('bw_native_notif')==='granted'}
function plan(){return new Promise(function(ok){try{var r=indexedDB.open('bw-followup',1);r.onupgradeneeded=function(){r.result.createObjectStore('kv')};
  r.onsuccess=function(){try{var q=r.result.transaction('kv','readonly').objectStore('kv').get('plan');q.onsuccess=function(){ok(q.result||null)};q.onerror=function(){ok(null)}}catch(e){ok(null)}};r.onerror=function(){ok(null)}}catch(e){ok(null)}})}
function hm(t){var m=/^(\d{1,2}):(\d{2})$/.exec(String(t||''));return m?{hour:+m[1],minute:+m[2]}:null}
function morning(t){t=String(t||'');return /صبح/.test(t)?t:'صبحت بخیر 🌸 '+t}
function channel(){return LN('createChannel',{id:'routine',name:'یادآور روتین',description:'یادآور روتین صبح و شب و پیگیری محصولات',importance:4,visibility:1,vibration:true}).catch(function(){})}
var busy=false;
function schedule(force){if(busy)return Promise.resolve();busy=true;
  return plan().then(function(p){var n=rj('bw_fu_notif',{}),list=[];
    if(granted()&&n.on&&p){
      var am=hm(p.amTime),pm=hm(p.pmTime);
      if(p.am&&am)list.push({id:1,title:morning(p.am.title),body:p.am.body||'',channelId:'routine',smallIcon:'ic_stat_bw',schedule:{on:am,allowWhileIdle:true}});
      if(p.pm&&pm)list.push({id:2,title:p.pm.title||'',body:p.pm.body||'',channelId:'routine',smallIcon:'ic_stat_bw',schedule:{on:pm,allowWhileIdle:true}});
      var slot=hm(p.taskSlot==='pm'?p.pmTime:p.amTime)||{hour:9,minute:0},now=Date.now();
      (p.days||[]).slice(0,40).forEach(function(x,i){var mm=slot.minute+2,hh=slot.hour+Math.floor(mm/60);mm%=60;
        var at=new Date(x.date+'T'+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+':00+03:30');if(isNaN(at)||at.getTime()<now+60e3)return;
        list.push({id:100+i,title:x.title||'بیوتی‌ولت',body:x.body||'',channelId:'routine',smallIcon:'ic_stat_bw',schedule:{at:at.toISOString(),allowWhileIdle:true}})})}
    var sig=JSON.stringify(list);if(!force&&sig===ls('bw_native_sig'))return;
    return LN('getPending').then(function(r){var ids=((r&&r.notifications)||[]).map(function(x){return {id:x.id}}).filter(function(x){return x.id<1000});return ids.length?LN('cancel',{notifications:ids}):null})
      .then(function(){return list.length?LN('schedule',{notifications:list}):null}).then(function(){ls('bw_native_sig',sig);track(list.length?'native_sched':'native_clear')})})
  .catch(function(){}).then(function(){busy=false})}
function exactHint(){return LN('checkExactNotificationSetting').then(function(r){if(!r||r.exact_alarm==='granted')return;
  var d=document.createElement('div');d.className='bw-iosn';d.innerHTML='<b>⏰ یه قدم برای دقیق شدن یادآورها</b><small>اندروید برای اینکه یادآور دقیقاً سر ساعت بیاد، اجازه‌ی «آلارم و یادآور» می‌خواد. بدون اون هم میاد، فقط ممکنه چند دقیقه دیرتر.</small><div><button type="button" data-a="go">روشنش کن</button><button type="button" data-a="no">باشه، همین خوبه</button></div>';
  document.body.append(d);d.addEventListener('click',function(e){var a=e.target.closest('[data-a]');if(!a)return;d.remove();if(a.dataset.a==='go'){track('native_exact_go');LN('changeExactNotificationSetting').catch(function(){})}})}).catch(function(){})}
// called by followup.js instead of web push when inside the Android app
function enable(){track('native_enable');return channel().then(function(){return LN('requestPermissions')}).then(function(r){var ok=r&&r.display==='granted';ls('bw_native_notif',ok?'granted':'denied');track(ok?'native_granted':'native_denied');
  if(!ok)return false;return schedule(true).then(function(){return LN('schedule',{notifications:[{id:9,title:'یادآور روشن شد 🔔',body:'از این به بعد سر ساعت میام، حتی وقتی اینترنت نداری 💜',channelId:'routine',smallIcon:'ic_stat_bw',schedule:{at:new Date(Date.now()+4000).toISOString(),allowWhileIdle:true}}]}).catch(function(){})})
    .then(function(){setTimeout(exactHint,6000);return true})}).catch(function(){return false})}

window.BWNative={on:nat(),enable:enable,schedule:schedule,granted:granted};
function start(){css();if(!nat())return iosNudge();
  document.documentElement.classList.add('bw-native');track('native_open');
  if(granted())LN('checkPermissions').then(function(r){if(!r||r.display!=='granted')ls('bw_native_notif','denied')}).catch(function(){});
  setTimeout(function(){schedule(false)},2500);setInterval(function(){schedule(false)},60e3);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)schedule(false)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
