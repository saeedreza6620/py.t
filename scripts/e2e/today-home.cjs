const {chromium}=require('playwright');const S=process.argv[2];(async()=>{const br=await chromium.launch();const errs=[];
const T=`(t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran'}).format(new Date(t)))`;
// returning user with history
let ctx=await br.newContext({viewport:{width:400,height:860},deviceScaleFactor:2});let pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:3917/legacy/');
await pg.evaluate(T=>{T=eval(T);sessionStorage.setItem('bw_wel_v1','1');localStorage.setItem('bw_reg',JSON.stringify({phone:'09120000000',name:'سارا رضایی'}));localStorage.setItem('bw_profile_v1_full',JSON.stringify({skinBase:'خشک',goals:['aging'],serviceConsent:true,pregnancy:'none'}));
 localStorage.setItem('bw_check_products',JSON.stringify(['dr-althea-aqua','anaparla-hydrodermie']));
 for(let i=1;i<20;i++){if(i%4===0)continue;const m={};['am-cleanse','am-care','am-spf','pm-cleanse','pm-moist'].forEach((k,j)=>{if((i+j)%3)m[k]=true});localStorage.setItem('bw_track_'+T(Date.now()-i*864e5),JSON.stringify(m))}},T);
const before=await pg.evaluate(()=>{const o={};Object.keys(localStorage).sort().forEach(k=>{if(!/^bw_track_|nudge|bw_device|bw_cloud|wizard/.test(k))o[k]=localStorage.getItem(k)});return JSON.stringify(o)});
await pg.reload();await pg.waitForTimeout(3000);
console.log('today text:',await pg.evaluate(()=>{const b=document.getElementById('bwToday');return b?b.innerText.replace(/\s+/g,' '):'NONE'}));
await pg.screenshot({path:S+'/v141_home.png'});
// tick first item, check routine tab sync
await pg.evaluate(()=>document.querySelector('#bwToday [data-td]').click());await pg.waitForTimeout(300);
const k=await pg.evaluate(()=>document.querySelector('#bwToday [data-td]').dataset.td);
console.log('after tick:',await pg.evaluate(()=>document.querySelector('#bwToday .td-top small').textContent));
await pg.evaluate(()=>document.querySelector('#bwToday [data-tq="routine"]').click());await pg.waitForTimeout(500);
console.log('routine tab shows tick:',await pg.evaluate(k=>{const b=document.querySelector('[data-tk="'+k+'"]');return b?b.getAttribute('aria-pressed'):'no btn'},k));
await pg.evaluate(()=>window.switchTab('sw-home'));await pg.waitForTimeout(400);
// tick all → yay
for(let j=0;j<3;j++){await pg.evaluate(()=>{const b=document.querySelector('#bwToday [data-td]:not(.on)');b&&b.click()});await pg.waitForTimeout(150)}await pg.waitForTimeout(400);
console.log('all done:',await pg.evaluate(()=>(document.querySelector('.td-yay')||{}).textContent),'| toast:',await pg.evaluate(()=>(document.querySelector('.sw-toast')||{}).textContent));
await pg.screenshot({path:S+'/v141_done.png'});
await pg.screenshot({path:S+'/v141_full.png',fullPage:true});
// calm program active → waiting card
await pg.evaluate(T=>{T=eval(T);const s={v:1,scale:2,id:'x',start:T(Date.now()-2*864e5),since:'3',sym:['red'],base:{itch:5,burn:3,red:2,bumps:0},sus:['anaparla-hydrodermie'],extra:[],days:{},phase:'calm',unlocked:false};s.days[s.start]=s.base;localStorage.setItem('bw_calm_v1',JSON.stringify(s));window.BWToday.paint()},T);await pg.waitForTimeout(300);
console.log('waiting:',await pg.evaluate(()=>{const w=document.getElementById('tdWait');return w.hidden?'hidden':w.innerText.replace(/\s+/g,' ')}));
await pg.evaluate(()=>document.querySelector('#tdWait [data-tq]').click());await pg.waitForTimeout(700);
console.log('went to calm card:',await pg.evaluate(()=>{const c=document.getElementById('bwCalm');return c?('h='+c.getBoundingClientRect().height+' top='+Math.round(c.getBoundingClientRect().top)+' '+c.innerText.slice(0,50)):'none; journal:'+!!document.getElementById('skinJournal')+' active:'+[...document.querySelectorAll('section,.panel')].filter(x=>x.offsetHeight>0).map(x=>x.id).join(',')}));
await pg.evaluate(()=>{localStorage.removeItem('bw_calm_v1');window.switchTab('sw-home')});await pg.waitForTimeout(300);
// quick: chat opens gem chat
await pg.evaluate(()=>document.querySelector('#bwToday [data-tq="chat"]').click());await pg.waitForTimeout(600);
console.log('chat opened:',await pg.evaluate(()=>!!document.querySelector('.gc-sheet,.gem-chat,[class*="gc-"]')));
const after=await pg.evaluate(()=>{const o={};Object.keys(localStorage).sort().forEach(k=>{if(!/^bw_track_|nudge|bw_device|bw_cloud|wizard|bw_calm_v1/.test(k))o[k]=localStorage.getItem(k)});return JSON.stringify(o)});
console.log('other data unchanged:',before===after);if(before!==after){const a=JSON.parse(before),b=JSON.parse(after);for(const k of new Set([...Object.keys(a),...Object.keys(b)]))if(a[k]!==b[k])console.log('  diff',k,String(a[k]).slice(0,80),'=>',String(b[k]).slice(0,80))}
await ctx.close();
// new user: welcome untouched, no today card
ctx=await br.newContext({viewport:{width:400,height:860}});pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:3917/legacy/');await pg.waitForTimeout(3000);
console.log('new user welcome:',await pg.evaluate(()=>!!document.querySelector('.bw-wel')),'today card:',await pg.evaluate(()=>!!document.getElementById('bwToday')));
console.log('errors:',errs);await br.close()})();
