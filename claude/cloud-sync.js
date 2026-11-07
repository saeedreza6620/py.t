/* BeautyWallet — her routine, profile and reminder times follow her mobile number.
   Everything still lives on the phone first; once she is signed in, a copy is kept on the BeautyWallet
   server under her number (lite/cloud.mjs). After an update, a reinstall, a new phone or a cleared browser,
   signing in with the same number brings it all back — including every change she made since.
   Rules: an empty phone takes the saved copy; a phone that already has things (e.g. she added a product
   before signing in) is merged with it, nothing dropped; afterwards, whichever device saved last wins.
   Skin photos are not part of this (they have their own encrypted backup). */
(function(){'use strict';
var LS;try{LS=window.localStorage;LS.getItem('x')}catch(e){return}if(!window.fetch)return;
var KEYS=['bw_reg','bw_profile_v1_full','bw_profile','bw_skin_quick_v1','bw_check_products','bw_check_times','bw_routine_set','bw_routine_map','bw_routine_synced',
  'bw_own_products','bw_wallet','bw_reminder_v1','bw_fu_notif','bw_fu_start','bw_fu_answers','bw_life','bw_refill','bw_supplements_v1','bw_regret_v1','bw_quick_routine_v1',
  'bw_budget_v1','bw_reviews_v1','bw_last_check','bw_city','bw_sellers','bw_auth_v1'];
var PRE=/^bw_(track|note|mood)_\d{4}-\d{2}-\d{2}$/,BASE='bw_cloud_base',CAP={bw_check_products:10};
var hydrating=false,timer=null,running=false,lastStart=0;
function ok(k){return KEYS.indexOf(k)>=0||PRE.test(k)}
function get(k){try{return LS.getItem(k)}catch(e){return null}}
function put(k,v){try{orig.call(LS,k,v)}catch(e){}}
function del(k){try{origDel.call(LS,k)}catch(e){}}
function phone(){try{var r=JSON.parse(get('bw_reg')||'null');return r&&r.phone?String(r.phone):''}catch(e){return ''}}
function dev(){return get('bw_device')||''}
function snap(){var o={};for(var i=0;i<LS.length;i++){var k=LS.key(i);if(k&&ok(k)){var v=get(k);if(v!=null)o[k]=v}}return o}
function mine(o){return Object.keys(o).filter(function(k){return k!=='bw_reg'}).length>0}
function parse(v){try{return JSON.parse(v)}catch(e){return undefined}}
// local first, then whatever only the saved copy has; lists are joined, objects filled in, nothing dropped
function merge(local,cloud){var out={},k;for(k in cloud)out[k]=cloud[k];
  for(k in local){if(!(k in cloud)){out[k]=local[k];continue}var a=parse(local[k]),b=parse(cloud[k]);
    if(Array.isArray(a)&&Array.isArray(b)){var seen={},u=[];a.concat(b).forEach(function(x){var s=JSON.stringify(x);if(!seen[s]){seen[s]=1;u.push(x)}});if(CAP[k])u=u.slice(0,CAP[k]);out[k]=JSON.stringify(u)}
    else if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){var m={},x;for(x in b)m[x]=b[x];for(x in a)m[x]=a[x];out[k]=JSON.stringify(m)}
    else out[k]=local[k]}return out}
async function save(force){if(!phone()||!dev())return;var data=snap();if(!mine(data))return;
  try{var r=await fetch('/api/cloud/save',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({d:dev(),base:Number(get(BASE)||0),force:!!force,data:data})});
    if(r.status===409){lastStart=0;return start()}if(r.ok){var j=await r.json();if(j.at)put(BASE,String(j.at))}}catch(e){}}
function dirty(){if(timer)return;timer=setTimeout(function(){timer=null;save()},3000)} // at most one save every 3 s, even if the app keeps writing
function note(t){try{var d=document.createElement('div');d.className='sw-toast';d.textContent=t;document.body.append(d);setTimeout(function(){d.remove()},3200)}catch(e){}}
async function start(){if(running||!phone()||!dev())return;if(Date.now()-lastStart<20000)return;lastStart=Date.now();running=true;
  try{var r=await fetch('/api/cloud/load?d='+encodeURIComponent(dev()),{cache:'no-store'});if(!r.ok)return;var j=await r.json();
    var base=Number(get(BASE)||0),local=snap();
    if(!j.data){if(mine(local))await save(true);return}          // nothing saved yet: this phone becomes the copy
    if(j.at<=base)return;                                         // the saved copy is this phone's own last save
    var next=base?j.data:(mine(local)?merge(local,j.data):j.data); // first time on this phone: merge; later: newest wins
    var changed=false,k;hydrating=true;
    try{for(k in next)if(local[k]!==next[k]){put(k,next[k]);changed=true}
      if(base)for(k in local)if(!(k in next)&&k!=='bw_reg'){del(k);changed=true}}finally{hydrating=false}
    put(BASE,String(j.at));
    if(!base&&mine(local)&&JSON.stringify(next)!==JSON.stringify(j.data))await save(true); // send the merged result back
    if(changed){var last=Number(sessionStorage.getItem('bw_cloud_reload')||0);
      if(Date.now()-last>30000){sessionStorage.setItem('bw_cloud_reload',String(Date.now()));sessionStorage.setItem('bw_cloud_note','1');location.reload()}}
  }catch(e){}finally{running=false}}
// every change to her things is saved a few seconds later; signing in pulls her saved copy
var orig=LS.setItem,origDel=LS.removeItem;
LS.setItem=function(k,v){orig.apply(this,arguments);if(hydrating||!ok(k))return;if(k==='bw_reg'){lastStart=0;setTimeout(start,400);return}dirty()};
LS.removeItem=function(k){origDel.apply(this,arguments);if(!hydrating&&ok(k)&&k!=='bw_reg')dirty()};
document.addEventListener('visibilitychange',function(){if(document.hidden){if(timer){clearTimeout(timer);timer=null;save()}}else start()});
// ask the browser to keep this site's storage (routine, photos) even when the phone is short of space
function keep(){try{if(phone()&&navigator.storage&&navigator.storage.persist)navigator.storage.persisted().then(function(p){if(!p)navigator.storage.persist()}).catch(function(){})}catch(e){}}
setTimeout(keep,2500);
window.bwCloud={start:function(){lastStart=0;return start()},save:save};
setTimeout(function(){try{if(sessionStorage.getItem('bw_cloud_note')){sessionStorage.removeItem('bw_cloud_note');note('روتین، یادآورها و پروفایلت برگشت 💜')}}catch(e){}start()},1200);
})();
