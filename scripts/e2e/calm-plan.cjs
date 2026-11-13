// v147: «پوستم به هم ریخته» — a suspect is never suggested back in the calm routine (the reported bug), the daily card
// shows the same plan, a program started before v147 keeps working, and no other user data changes.
const {chromium}=require('playwright');const S=process.argv[2];(async()=>{const br=await chromium.launch();const errs=[];
const T=`(t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran'}).format(new Date(t)))`;
const ctx=await br.newContext({viewport:{width:400,height:860},deviceScaleFactor:2});const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:3917/legacy/');
// the reported case: routine = Garnier micellar + Beauty of Joseon sunscreen + Dr.Althea 345 + a BHA toner; micellar + sunscreen started 4 days ago
await pg.evaluate(T=>{T=eval(T);sessionStorage.setItem('bw_wel_v1','1');localStorage.setItem('bw_reg',JSON.stringify({phone:'09120000000',name:'سارا تست'}));
  localStorage.setItem('bw_profile_v1_full',JSON.stringify({skinBase:'خشک',serviceConsent:true,pregnancy:'none'}));
  localStorage.setItem('bw_check_products',JSON.stringify(['garnier-dry','boj-relief','dr-althea-345','axisy-ahabha']));
  const d=T(Date.now()-4*864e5),old=T(Date.now()-60*864e5);localStorage.setItem('bw_fu_start',JSON.stringify({'garnier-dry':d,'boj-relief':d,'dr-althea-345':old,'axisy-ahabha':old}));
  localStorage.setItem('bw_track_'+T(Date.now()-864e5),JSON.stringify({'am-cleanse':true}))},T);
const keep=()=>pg.evaluate(()=>{const o={};Object.keys(localStorage).sort().forEach(k=>{if(!/nudge|bw_device|bw_cloud|wizard|bw_calm_v1|bw_last|_seen|bw_track_ev|bw_l2_q/.test(k))o[k]=localStorage.getItem(k)});return JSON.stringify(o)});
await pg.reload();await pg.waitForTimeout(2500);const before=await keep();
await pg.evaluate(()=>window.BWCalm.open());await pg.waitForTimeout(300);
const click=async sel=>{await pg.evaluate(s=>{const b=document.querySelector(s);if(!b)throw new Error('no '+s);b.click()},sel);await pg.waitForTimeout(250)};
await click('.cm-in [data-a="go"]');await click('.cm-in [data-a="none"]');
await pg.evaluate(()=>{const q=(g,v)=>document.querySelector('.cm-in [data-g="'+g+'"] [data-v="'+v+'"]').click();q('sym','red');q('sym','dry');q('since','3');q('n_itch','4');q('n_burn','5');q('n_red','2');q('n_bumps','0')});
await click('.cm-in [data-a="next"]');
console.log('suspects ticked:',await pg.evaluate(()=>[...document.querySelectorAll('input[name=sus]:checked')].map(x=>x.value).join(',')));
// make sure both reported products are ticked, as in the screenshot
await pg.evaluate(()=>['garnier-dry','boj-relief'].forEach(v=>{const x=document.querySelector('input[name=sus][value="'+v+'"]');if(x&&!x.checked)x.click()}));
await click('.cm-in [data-a="next"]');
const plan=await pg.evaluate(()=>{const g=s=>(document.querySelector(s)||{}).innerText||'';return {stop:g('.cm-in .cm-warn'),aside:g('.cm-in .cm-pp'),routine:g('.cm-in .cm-ok'),tips:g('.cm-in .cm-box')}});
console.log('STOP:',plan.stop.replace(/\s+/g,' '));console.log('ASIDE:',plan.aside.replace(/\s+/g,' '));console.log('ROUTINE:',plan.routine.replace(/\s+/g,' '));
const bad=['میسلار واتر گارنیه','بیوتی آف جوسان'].filter(n=>plan.routine.includes(n));
console.log('suspect named in routine:',bad.length?bad.join(','):'none');
console.log('BHA toner put aside, not in routine:',/AHA|BHA|اکسیسی|آکسیسی/i.test(plan.aside),!/AHA|BHA|اکسیسی|آکسیسی/i.test(plan.routine));
await pg.screenshot({path:S+'/v147_plan.png'});
await pg.evaluate(()=>{const i=document.querySelector('.cm-in');i.scrollTop=i.scrollHeight});await pg.screenshot({path:S+'/v147_plan_bottom.png'});
await click('.cm-in [data-a="nophoto"]');await pg.waitForTimeout(800);
const card=await pg.evaluate(()=>{const c=document.getElementById('bwCalm');if(!c)return 'no card';c.querySelector('details').open=true;return c.innerText.replace(/\s+/g,' ')});
console.log('CARD:',card.slice(0,600));
console.log('card routine names suspect:',/روتین ساده[^]*?(میسلار واتر گارنیه|بیوتی آف جوسان)[^]*$/.test(card.split('روتین ساده تا آروم شدن')[1]||'')?'YES (bad)':'no');
await pg.evaluate(()=>document.getElementById('bwCalm').scrollIntoView());await pg.screenshot({path:S+'/v147_card.png'});
// a program saved before v147 (no extra fields) still opens and keeps its days
await pg.evaluate(T=>{T=eval(T);const s={v:1,scale:2,id:'old',start:T(Date.now()-3*864e5),since:'3',sym:['burn'],base:{itch:6,burn:6,red:2,bumps:0},sus:['boj-relief'],extra:['ماسک دوستم'],days:{},phase:'calm',unlocked:false};s.days[s.start]=s.base;localStorage.setItem('bw_calm_v1',JSON.stringify(s));window.BWCalm.paint()},T);await pg.waitForTimeout(300);
console.log('old program card:',await pg.evaluate(()=>{const c=document.getElementById('bwCalm');return c?c.innerText.replace(/\s+/g,' ').slice(0,160):'none'}));
console.log('old program days kept:',await pg.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('bw_calm_v1')).days).length));
const after=await keep();console.log('user data kept:',before===after);if(before!==after){const a=JSON.parse(before),b=JSON.parse(after);for(const k of new Set([...Object.keys(a),...Object.keys(b)]))if(a[k]!==b[k])console.log('  diff',k,String(a[k]).slice(0,90),'=>',String(b[k]).slice(0,90))}
console.log('errors:',JSON.stringify(errs));await br.close()})();
