const {chromium,devices}=require('playwright');const S=process.argv[2];(async()=>{const br=await chromium.launch();
// ---- Android app (mock Capacitor bridge) ----
const ctx=await br.newContext({viewport:{width:400,height:860},userAgent:'Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0 Mobile Safari/537.36'});
await ctx.addInitScript(()=>{window.__calls=[];let pending=[];window.Capacitor={isNativePlatform:()=>true,isPluginAvailable:n=>n==='LocalNotifications',getPlatform:()=>'android',
 nativePromise:(p,m,o)=>{window.__calls.push({m,o:JSON.parse(JSON.stringify(o||{}))});
  if(m==='requestPermissions'||m==='checkPermissions')return Promise.resolve({display:'granted'});
  if(m==='checkExactNotificationSetting')return Promise.resolve({exact_alarm:'denied'});
  if(m==='getPending')return Promise.resolve({notifications:pending.map(x=>({id:x.id}))});
  if(m==='schedule'){pending=pending.concat(o.notifications.filter(x=>x.id!==9));return Promise.resolve({notifications:o.notifications.map(x=>({id:x.id}))})}
  if(m==='cancel'){const ids=new Set(o.notifications.map(x=>x.id));pending=pending.filter(x=>!ids.has(x.id));return Promise.resolve()}
  return Promise.resolve({})}}});
const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:3917/legacy/');
await pg.evaluate(()=>{sessionStorage.setItem('bw_wel_v1','1');localStorage.setItem('bw_reg',JSON.stringify({phone:'09120000000',name:'سارا'}));localStorage.setItem('bw_profile_v1_full',JSON.stringify({skinBase:'چرب',serviceConsent:true,pregnancy:'none'}));
 localStorage.setItem('bw_check_products',JSON.stringify(['dr-althea-aqua','anaparla-hydrodermie']));const T=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran'}).format(new Date(t));localStorage.setItem('bw_fu_start',JSON.stringify({'anaparla-hydrodermie':T(Date.now()-1*864e5)}))});
const before=await pg.evaluate(()=>localStorage.getItem('bw_reg')+localStorage.getItem('bw_profile_v1_full')+localStorage.getItem('bw_check_products'));
await pg.reload();await pg.waitForTimeout(3500);
console.log('html.bw-native:',await pg.evaluate(()=>document.documentElement.classList.contains('bw-native')),'| install btn visible:',await pg.evaluate(()=>{const b=document.getElementById('installHomeButton')||document.getElementById('installAppButton');return b?b.offsetHeight>0:'none'}));
console.log('reminder card:',await pg.evaluate(()=>{const c=document.querySelector('#fuToday .fu')||document.querySelector('#fuToday');return c?c.innerText.replace(/\s+/g,' ').slice(0,200):'none'}));
// enable reminders through the app's own flow
await pg.evaluate(()=>window.BWFollowup.enable());await pg.waitForTimeout(2500);
console.log('after enable:',await pg.evaluate(()=>{const c=document.querySelector('#fuToday');return c?c.innerText.replace(/\s+/g,' ').slice(0,220):'none'}));
const calls=await pg.evaluate(()=>window.__calls);
console.log('calls:',calls.map(c=>c.m).join(','));
const sch=calls.filter(c=>c.m==='schedule').flatMap(c=>c.o.notifications);
sch.forEach(n=>console.log('  #'+n.id,JSON.stringify(n.schedule),'|',n.title,'|',(n.body||'').slice(0,60)));
console.log('keys:',await pg.evaluate(()=>localStorage.getItem('bw_native_notif')+' | on='+JSON.parse(localStorage.getItem('bw_fu_notif')||'{}').on));
await pg.waitForTimeout(6500);console.log('exact hint:',await pg.evaluate(()=>{const d=document.querySelector('.bw-iosn');return d?d.innerText.replace(/\s+/g,' ').slice(0,80):'none'}));
await pg.screenshot({path:S+'/v144_native.png'});
// change evening on → reschedule
await pg.evaluate(()=>{const n=JSON.parse(localStorage.getItem('bw_fu_notif'));n.pmOn=true;n.pm='22:15';localStorage.setItem('bw_fu_notif',JSON.stringify(n));window.BWFollowup.render&&window.BWFollowup.render()});
await pg.evaluate(()=>{window.__calls=[]});await pg.waitForTimeout(500);await pg.evaluate(()=>window.BWNative.schedule(true));await pg.waitForTimeout(800);
console.log('reschedule:',await pg.evaluate(()=>window.__calls.filter(c=>c.m==='schedule').flatMap(c=>c.o.notifications).map(n=>n.id+':'+JSON.stringify(n.schedule.on||n.schedule.at)).join(' ')));
console.log('user data kept:',before===await pg.evaluate(()=>localStorage.getItem('bw_reg')+localStorage.getItem('bw_profile_v1_full')+localStorage.getItem('bw_check_products')));
console.log('errors:',errs);await ctx.close();
// ---- iPhone Safari (not on home screen) ----
const ic=await br.newContext({...devices['iPhone 13']});const ip=await ic.newPage();const e2=[];ip.on('pageerror',e=>e2.push(e.message));
await ip.goto('http://localhost:3917/legacy/');await ip.evaluate(()=>{sessionStorage.setItem('bw_wel_v1','1');localStorage.setItem('bw_reg',JSON.stringify({phone:'09120000000',name:'سارا'}));localStorage.setItem('bw_profile_v1_full',JSON.stringify({skinBase:'چرب'}))});
await ip.reload();await ip.waitForTimeout(11000);
console.log('ios nudge:',await ip.evaluate(()=>{const d=document.querySelector('.bw-iosn');return d?d.innerText.replace(/\s+/g,' ').slice(0,90):'none'}));
await ip.evaluate(()=>{const b=document.querySelector('.bw-iosn [data-a="go"]');b&&b.click()});await ip.waitForTimeout(600);
console.log('ios guide open:',await ip.evaluate(()=>{const d=document.getElementById('installDialog');return d?(d.open||d.offsetHeight>0)+' '+(document.getElementById('installGuideSteps')||{}).innerText.replace(/\s+/g,' ').slice(0,120):'none'}));
await ip.screenshot({path:S+'/v144_ios.png'});
console.log('ios errors:',e2);
// ---- normal Android Chrome: no native, no nudge ----
const ac=await br.newContext({...devices['Pixel 7']});const ap=await ac.newPage();await ap.goto('http://localhost:3917/legacy/');await ap.waitForTimeout(3000);
console.log('chrome: native',await ap.evaluate(()=>window.BWNative&&window.BWNative.on),'nudge',await ap.evaluate(()=>!!document.querySelector('.bw-iosn')));
await br.close()})();
