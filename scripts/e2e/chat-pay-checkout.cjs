const {chromium}=require('playwright');const S=process.argv[2];(async()=>{const br=await chromium.launch();const errs=[];
const ctx=await br.newContext({viewport:{width:400,height:860},deviceScaleFactor:2});const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:3917/legacy/');
await pg.evaluate(()=>{sessionStorage.setItem('bw_wel_v1','1');localStorage.setItem('bw_reg',JSON.stringify({phone:'09120000000',name:'مینا'}));localStorage.setItem('bw_profile_v1_full',JSON.stringify({skinBase:'چرب',serviceConsent:true,pregnancy:'none'}))});
await pg.reload();await pg.waitForTimeout(3000);
const dev=await pg.evaluate(()=>localStorage.getItem('bw_device'));
const before=await pg.evaluate(()=>localStorage.getItem('bw_reg')+localStorage.getItem('bw_profile_v1_full'));
// open chat and send 3 messages (2 free)
await pg.evaluate(()=>document.getElementById('swHeroGem').click());await pg.waitForTimeout(600);
const send=async t=>{await pg.fill('.gc textarea',t);await pg.evaluate(()=>{const f=document.querySelector('.gc form');f.requestSubmit()});await pg.waitForTimeout(900)};
await send('پوستم چربه، شوینده چی بزنم؟');console.log('msg1 note:',await pg.evaluate(()=>[...document.querySelectorAll('.gc-note')].map(x=>x.textContent).join('|')));
await send('ضدآفتاب چی؟');console.log('msg2 note:',await pg.evaluate(()=>[...document.querySelectorAll('.gc-note')].map(x=>x.textContent).join('|')));
await send('تونر لازمه؟');console.log('msg3 →',await pg.evaluate(()=>{const b=[...document.querySelectorAll('.gc-b')].pop();return b.textContent}),'| pay btn:',await pg.evaluate(()=>!!document.querySelector('[data-gcunlock]')));
await pg.screenshot({path:S+'/v142_paywall.png'});
// safety question is free even now
await send('لبم ورم کرده');console.log('safety answered:',await pg.evaluate(()=>[...document.querySelectorAll('.gc-b')].pop().textContent.slice(0,40)));
// back: remove safety exchange to test unlock from the paywall message? the pay message is no longer last; send another normal msg
await send('تونر لازمه؟');
await pg.evaluate(()=>document.querySelector('[data-gcunlock]').click());await pg.waitForTimeout(900);
console.log('negin sheet:',await pg.evaluate(()=>{const s=document.querySelector('#swSheet');return s?s.innerText.replace(/\s+/g,' ').slice(0,160):'none'}));
await pg.evaluate(()=>document.querySelector('#swSheet [data-pack="0"]').click());await pg.waitForTimeout(400);
await pg.screenshot({path:S+'/v142_checkout.png'});
console.log('checkout:',await pg.evaluate(()=>document.querySelector('#swSheet').innerText.replace(/\s+/g,' ').slice(0,420)));
await pg.evaluate(()=>document.getElementById('coGo').click());await pg.waitForTimeout(300);console.log('no tick →',await pg.evaluate(()=>(document.querySelector('.sw-toast')||{}).textContent));
await pg.evaluate(()=>{document.getElementById('coOk').checked=true;document.getElementById('coGo').click()});await pg.waitForTimeout(1500);
console.log('card step:',await pg.evaluate(()=>document.querySelector('#swSheet').innerText.replace(/\s+/g,' ').slice(0,300)));
await pg.setInputFiles('#cRcpt',S+'/rcpt.jpg');await pg.fill('#cLast4','4321');
await pg.screenshot({path:S+'/v142_card.png'});
await pg.evaluate(()=>document.getElementById('cSend').click());await pg.waitForTimeout(4500);
console.log('after pay → chat last:',await pg.evaluate(()=>{const b=[...document.querySelectorAll('.gc-b')].pop();return b?b.textContent.slice(0,60):'none'}),'| sheet open:',await pg.evaluate(()=>{const s=document.querySelector('#swSheet');return !!s&&!s.hidden&&s.offsetHeight>0}));
const st=await pg.evaluate(async d=>(await fetch('/api/skinchat/state?d='+d)).json(),dev);console.log('chat state:',JSON.stringify(st));
await pg.screenshot({path:S+'/v142_after.png'});
console.log('user data kept:',before===await pg.evaluate(()=>localStorage.getItem('bw_reg')+localStorage.getItem('bw_profile_v1_full')));
console.log('errors:',errs);await br.close()})();
