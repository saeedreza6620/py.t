const {chromium}=require('playwright');const S=process.argv[2];(async()=>{const br=await chromium.launch();
for(const who of ['new','returning']){const ctx=await br.newContext({viewport:{width:400,height:860}});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 const cdp=await ctx.newCDPSession(pg);await cdp.send('Emulation.setCPUThrottlingRate',{rate:6});await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:300,downloadThroughput:200000,uploadThroughput:100000});
 if(who==='returning'){await pg.goto('http://localhost:3917/legacy/');await pg.evaluate(()=>{localStorage.setItem('bw_reg',JSON.stringify({phone:'09120000000',name:'سارا'}));localStorage.setItem('bw_profile_v1_full',JSON.stringify({skinBase:'خشک',serviceConsent:true}))});}
 const seen=new Set();let n=0;const p=pg.goto('http://localhost:3917/legacy/',{waitUntil:'commit'});await p;
 const t0=Date.now();while(Date.now()-t0<9000){try{const st=await pg.evaluate(()=>{const r=document.documentElement.classList.contains('bw-ready');const old=[...document.querySelectorAll('h1,h2,button')].find(e=>/ثبت اطلاعات من و شروع بررسی|ببین واقعاً بهش نیاز/.test(e.textContent)&&e.offsetParent&&getComputedStyle(e).visibility!=='hidden');return {r,old:!!old}});
   const k=(st.r?'ready':'cover')+(st.old?'+OLDVISIBLE':'');if(!seen.has(k)){seen.add(k);console.log(who,Math.round((Date.now()-t0)),'ms',k);await pg.screenshot({path:S+'/flash_'+who+'_'+(n++)+'.png'})}if(st.r&&Date.now()-t0>1500)break}catch(e){}await pg.waitForTimeout(40)}
 console.log(who,'errors',errs);await ctx.close()}
await br.close()})();
