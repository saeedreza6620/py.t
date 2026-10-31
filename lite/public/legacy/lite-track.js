/* BeautyWallet lite: anonymous usage counts for the owner's admin panel.
   A random device id (no name, phone or e-mail) + event type. Nothing about skin or products is sent. */
(function(){'use strict';
var KEY='bw_device';var id='';
try{id=localStorage.getItem(KEY)||'';if(!/^[a-z0-9]{12,40}$/.test(id)){id=(Date.now().toString(36)+Math.random().toString(36).slice(2,12)).slice(0,24);localStorage.setItem(KEY,id)}}catch(e){id=''}
var standalone=false;try{standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){}
var page=location.pathname.indexOf('/legacy/')===0?'app':'site';
function regPhone(){try{var r=JSON.parse(localStorage.getItem('bw_reg')||'null');return r&&r.phone?String(r.phone).slice(0,15):''}catch(e){return ''}}
function send(type,x){if(!id)return;var o={type:type,d:id,sa:standalone,page:page};if(x)o.x=String(x).slice(0,80);if(/^app_open/.test(type)){var ph=regPhone();if(ph)o.p=ph}var body=JSON.stringify(o);
  try{if(navigator.sendBeacon&&navigator.sendBeacon('/api/event',new Blob([body],{type:'text/plain'})))return}catch(e){}
  try{fetch('/api/event',{method:'POST',headers:{'Content-Type':'text/plain'},body:body,keepalive:true}).catch(function(){})}catch(e){}}
window.bwTrack=send;
send(page==='site'?'site_open':standalone?'app_open_installed':'app_open');
window.addEventListener('appinstalled',function(){send('install')});
window.addEventListener('beforeinstallprompt',function(e){send('install_offer')});
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('#installAppButton,#installHomeButton,[data-act="install"],[data-install]');if(b)send('install_click')},true);
// count product checks once the review bundle is ready (debounced, no content sent)
var last={};function once(type){var now=Date.now();if(last[type]&&now-last[type]<4000)return;last[type]=now;send(type)}
function wrap(){var R=window.BWReview;if(!R||R.__tracked)return !!R;R.__tracked=true;
  ['catalogPurchaseCheck'].forEach(function(n){var f=R[n];if(typeof f!=='function')return;R[n]=function(){var r=f.apply(this,arguments);try{if(r){once('check');var pid=arguments[1];var b=String(r.basis||''),id2=r.productId||pid;if(b&&!/inci/.test(b)&&typeof id2==='string')send('check_noinci',id2)}}catch(e){}return r}});return true}
if(!wrap()){var t=setInterval(function(){if(wrap())clearInterval(t)},500);setTimeout(function(){clearInterval(t)},20000)}
})();
