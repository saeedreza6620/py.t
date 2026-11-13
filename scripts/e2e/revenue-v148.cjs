// v148 revenue model v2: first purchase (once), chat as a 24-hour pass, alternatives after «نخر», the 4-week care report.
// Local server only, fake card, no real money. Usage: node scripts/e2e/revenue-v148.cjs OUT
const {chromium}=require('playwright');const S=process.argv[2];const B='http://localhost:3917';
(async()=>{const br=await chromium.launch();const errs=[];const log=(...a)=>console.log(...a);
const T=`(t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran'}).format(new Date(t)))`;
const ctx=await br.newContext({viewport:{width:400,height:860},deviceScaleFactor:2});const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(B+'/legacy/');
// a returning user: profile, routine (incl. a product the engine rejects for dry skin), 24 days of ticks, follow-up answers
await pg.evaluate(T=>{T=eval(T);sessionStorage.setItem('bw_wel_v1','1');localStorage.setItem('bw_reg',JSON.stringify({phone:'09120000003',name:'مینا تست'}));
  localStorage.setItem('bw_profile_v1_full',JSON.stringify({skinBase:'خشک',serviceConsent:true,pregnancy:'none'}));
  localStorage.setItem('bw_check_products',JSON.stringify(['dr-althea-345','boj-relief','garnier-dry']));
  const s=T(Date.now()-30*864e5);localStorage.setItem('bw_fu_start',JSON.stringify({'dr-althea-345':s,'boj-relief':s,'garnier-dry':s}));
  localStorage.setItem('bw_fu_answers',JSON.stringify({'dr-althea-345':{3:{v:'ok'},14:{v:'good'}},'garnier-dry':{3:{v:'tight'}}}));
  for(let i=0;i<24;i++){if(i%3===2)continue;localStorage.setItem('bw_track_'+T(Date.now()-i*864e5),JSON.stringify({'am-cleanse':true,'am-care':true,'am-spf':i%2===0,'pm-cleanse':true,'pm-moist':true}))}},T);
const keep=()=>pg.evaluate(()=>{const o={};Object.keys(localStorage).sort().forEach(k=>{if(/^bw_(reg|profile_v1_full|check_products|check_times|fu_answers|track_20|calm_hist|wallet)/.test(k))o[k]=localStorage.getItem(k)});return JSON.stringify(o)});
await pg.reload();await pg.waitForTimeout(3000);const before=await keep();
// 1) the 4-week report offer on «امروز», preview, pay (no diamonds → diamond sheet with the first purchase on top)
log('report offer:',await pg.evaluate(()=>{const b=document.querySelector('[data-care="report"]');return b?b.innerText.replace(/\s+/g,' '):'none'}));
await pg.evaluate(()=>document.querySelector('[data-care="report"]').click());await pg.waitForTimeout(400);
log('preview:',await pg.evaluate(()=>(document.querySelector('.cr-in')||{}).innerText.replace(/\s+/g,' ').slice(0,260)));
await pg.screenshot({path:S+'/v148_report_preview.png'});
await pg.evaluate(()=>document.querySelector('[data-crbuy]').click());await pg.waitForTimeout(900);
const packs=await pg.evaluate(()=>[...document.querySelectorAll('#swSheet .sw-pack')].map(b=>b.innerText.replace(/\s+/g,' ')));log('diamond sheet:',JSON.stringify(packs));
await pg.screenshot({path:S+'/v148_packs.png'});
// 2) first purchase → checkout → card order at the starter price
await pg.evaluate(()=>document.querySelector('#swSheet [data-pack="s"]').click());await pg.waitForTimeout(400);
log('checkout:',await pg.evaluate(()=>(document.querySelector('.co-sum')||{}).innerText.replace(/\s+/g,' ')));
await pg.evaluate(()=>{document.getElementById('coOk').checked=true;document.getElementById('coGo').click()});await pg.waitForTimeout(1500);
const exact=await pg.evaluate(()=>(document.querySelector('.sw-exact')||{}).innerText||'');log('card step amount:',exact);
const ref=await pg.evaluate(()=>JSON.parse(localStorage.getItem('bw_pay_pending')||'{}').ref);
await pg.evaluate(()=>{document.getElementById('cLast4').value='1234';document.getElementById('cSend').click()});await pg.waitForTimeout(1500);
// the owner approves in the panel
const r1=await fetch(B+'/admin?token=testtoken123',{redirect:'manual'});const ck=(r1.headers.get('set-cookie')||'').split(';')[0];
const r2=await fetch(B+'/admin/req',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:ck,Origin:B},body:new URLSearchParams({ref,a:'approve'})});log('approve:',r2.status);
const dev=await pg.evaluate(()=>localStorage.getItem('bw_device'));const w=await (await fetch(B+'/wallet?d='+dev)).json();log('wallet after approve:',JSON.stringify(w));
const again=await fetch(B+'/buy-request',{method:'POST',headers:{'Content-Type':'application/json',Origin:B},body:JSON.stringify({kind:'negin',method:'card',pack:'starter',d:dev})});log('second first-purchase refused:',again.status,(await again.json()).error);
// 3) the report opens with the diamonds she now has (it continues by itself after paying, or tap again)
await pg.evaluate(()=>{window.bwSyncWallet&&window.bwSyncWallet();const x=document.querySelector('.cr-sheet');x&&x.remove()});await pg.waitForTimeout(600);
await pg.evaluate(()=>{document.querySelector('#swSheet [data-close]')&&document.querySelector('#swSheet [data-close]').click();window.BWCare.open('report')});await pg.waitForTimeout(400);
await pg.evaluate(()=>{const b=document.querySelector('[data-crbuy]');b&&b.click()});await pg.waitForTimeout(1200);
log('report:',await pg.evaluate(()=>(document.querySelector('.cr-in')||{}).innerText.replace(/\s+/g,' ').slice(0,700)));
await pg.screenshot({path:S+'/v148_report.png'});
await pg.evaluate(()=>{const b=document.querySelector('.cr-in [data-cr="season"]');b&&b.click()});await pg.waitForTimeout(400);
log('season preview:',await pg.evaluate(()=>(document.querySelector('.cr-in')||{}).innerText.replace(/\s+/g,' ').slice(0,200)));
await pg.evaluate(()=>{const x=document.querySelector('.cr-sheet');x&&x.remove()});
log('report again is free:',await pg.evaluate(()=>{window.BWCare.open('report');return !document.querySelector('[data-crbuy]')&&/روزهایی که روتینت رو زدی/.test(document.querySelector('.cr-in').innerText)}));
await pg.evaluate(()=>{const x=document.querySelector('.cr-sheet');x&&x.remove()});
log('tune content:',await pg.evaluate(()=>{const d=document.createElement('div');d.innerHTML=window.BWCare.tune(window.BWCare.data());return d.innerText.replace(/\s+/g,' ').slice(0,700)}));
// 4) product check: a «نخر» shows one alternative free and the rest behind a diamond
await pg.evaluate(()=>window.bwCheckProduct('bioderma-sebium'));await pg.waitForTimeout(800);
log('check:',await pg.evaluate(()=>{const c=document.querySelector('.sw-result');return c?c.querySelector('.sw-stamp').innerText+' | alts free: '+c.querySelectorAll('.sw-alts [data-pick]').length+' | lock: '+((c.querySelector('[data-altlock]')||{}).innerText||'none'):'no card'}));
await pg.screenshot({path:S+'/v148_check.png'});
// 5) chat: gift messages → paywall says 24-hour pass
await pg.evaluate(()=>{localStorage.removeItem('bw_gem_chat_v1')});
const st=await (await fetch(B+'/api/skinchat/state?d='+dev)).json();log('chat state:',JSON.stringify(st));
log('user data kept:',before===await keep());log('errors:',JSON.stringify(errs));await br.close()})();
