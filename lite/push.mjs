// Notifications outside the app (Web Push to the installed app). No third-party service and no
// library: VAPID keys live on the server's own disk; pushes carry NO content — the phone writes the
// message from the shopper's own routine (see sw.js). The server keeps only: the push address,
// the time she chose, whether she wants a daily note, and which dates have a follow-up.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
export function makePush({DATA,send,ip,sameOrigin,readBody,E}){
  const KEYF=path.join(DATA,'push-vapid.json'),SUBS=path.join(DATA,'push-subs.json'),LOG=path.join(DATA,'push-log.jsonl');
  let key;try{key=JSON.parse(fs.readFileSync(KEYF,'utf8'))}catch{const k=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
    key={priv:k.privateKey.export({type:'pkcs8',format:'pem'}),pub:k.publicKey.export({type:'spki',format:'der'}).subarray(-65).toString('base64url')};try{fs.writeFileSync(KEYF,JSON.stringify(key),{mode:0o600})}catch(e){console.error('push key',e.message)}}
  const privKey=crypto.createPrivateKey(key.priv);
  let subs={};try{subs=JSON.parse(fs.readFileSync(SUBS,'utf8'))}catch{}
  const save=()=>{try{fs.writeFileSync(SUBS+'.tmp',JSON.stringify(subs));fs.renameSync(SUBS+'.tmp',SUBS)}catch(e){console.error('push save',e.message)}};
  const HOSTS=/(^|\.)(fcm\.googleapis\.com|android\.googleapis\.com|push\.services\.mozilla\.com|web\.push\.apple\.com|notify\.windows\.com|push\.apple\.com)$/;
  const okEndpoint=u=>{try{const x=new URL(u);return x.protocol==='https:'&&HOSTS.test(x.hostname)&&u.length<1200}catch{return false}};
  const idOf=ep=>crypto.createHash('sha256').update(ep).digest('hex').slice(0,32);
  const tehran=(o)=>new Intl.DateTimeFormat(o==='day'?'en-CA':'en-GB',o==='day'?{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}:{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
  const jwtCache=new Map();
  function vapid(endpoint){const aud=new URL(endpoint).origin,c=jwtCache.get(aud);if(c&&c.exp-Date.now()>3600e3)return c.h;
    const exp=Math.floor(Date.now()/1000)+12*3600,enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
    const data=enc({typ:'JWT',alg:'ES256'})+'.'+enc({aud,exp,sub:E.PUSH_CONTACT||'https://beautywallet.liara.run'});
    const sig=crypto.sign('sha256',Buffer.from(data),{key:privKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
    const h=`vapid t=${data}.${sig}, k=${key.pub}`;jwtCache.set(aud,{h,exp:exp*1000});return h}
  async function pushTo(id,why){const s=subs[id];if(!s)return {status:0};let status=0,err='';
    try{const r=await fetch(s.endpoint,{method:'POST',headers:{Authorization:vapid(s.endpoint),TTL:'43200',Urgency:'normal','Content-Length':'0'},signal:AbortSignal.timeout(15000)});status=r.status;if(!r.ok)err=(await r.text().catch(()=>'')).slice(0,160)}
    catch(e){err=e.message.slice(0,160)}
    if(status===404||status===410){delete subs[id];save()}
    fs.appendFile(LOG,JSON.stringify({at:new Date().toISOString(),why,host:new URL(s.endpoint).hostname,status,err:err||undefined})+'\n',()=>{});return {status,err}}
  // every minute: whoever chose this minute (Tehran time) and has something today
  // every minute: morning and evening slots at the times she chose (Tehran time); the follow-up of the day goes on her chosen slot
  let lastMin='';setInterval(async()=>{const hm=tehran('time'),day=tehran('day');if(hm===lastMin)return;lastMin=hm;
    for(const [id,s] of Object.entries(subs))for(const slot of ['am','pm']){if(s[slot]!==hm||s['sent_'+slot]===day)continue;
      const task=(s.days||[]).includes(day)&&(s.taskSlot||'am')===slot;if(!(task||s[slot+'Daily']))continue;s['sent_'+slot]=day;save();await pushTo(id,slot)}},20e3).unref();
  const hits=new Map();const limited=req=>{const a=ip(req),now=Date.now(),l=(hits.get(a)||[]).filter(t=>now-t<600e3);l.push(now);hits.set(a,l);if(hits.size>5000)hits.clear();return l.length>60};
  const H={'Cache-Control':'no-store'},j=(res,st,b)=>send(res,st,b,'application/json',H);
  async function handle(req,res,url){
    if(!sameOrigin(req))return j(res,403,{error:'forbidden'});
    if(url.pathname==='/api/push/key')return j(res,200,{key:key.pub});
    if(limited(req))return j(res,429,{error:'کمی بعد دوباره امتحان کن'});
    const b=await readBody(req,6000),ep=String(b.endpoint||(b.sub&&b.sub.endpoint)||'');if(!okEndpoint(ep))return j(res,400,{error:'bad'});const id=idOf(ep);
    if(url.pathname==='/api/push/sub'&&req.method==='PUT'){
      const T=v=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v))?String(v):'';const am=T(b.am||b.time)||'09:00',pm=T(b.pm)||'21:00';
      const days=(Array.isArray(b.days)?b.days:[]).filter(d=>/^\d{4}-\d\d-\d\d$/.test(d)).slice(0,120);
      const old=subs[id]||{};subs[id]={endpoint:ep,am,pm,amDaily:b.amDaily===undefined?!!b.daily:!!b.amDaily,pmDaily:!!b.pmDaily,taskSlot:b.taskSlot==='pm'?'pm':'am',days,d:String(b.d||'').replace(/[^a-z0-9]/g,'').slice(0,40),since:old.since||new Date().toISOString(),sent_am:old.sent_am||old.sent||'',sent_pm:old.sent_pm||''};save();return j(res,200,{ok:true})}
    if(url.pathname==='/api/push/sub'&&req.method==='DELETE'){delete subs[id];save();return j(res,200,{ok:true})}
    if(url.pathname==='/api/push/test'&&req.method==='POST'){if(!subs[id])return j(res,404,{error:'none'});const r=await pushTo(id,'test');return j(res,r.status>=200&&r.status<300?200:502,{status:r.status,error:r.err||undefined})}
    return j(res,404,{error:'none'})}
  function stats(){let rows=[];try{rows=fs.readFileSync(LOG,'utf8').trim().split('\n').filter(Boolean).slice(-2000).map(l=>JSON.parse(l))}catch{}
    const wk=rows.filter(r=>Date.now()-Date.parse(r.at)<7*864e5),ok=wk.filter(r=>r.status>=200&&r.status<300).length,bad=wk.filter(r=>!(r.status>=200&&r.status<300));
    const byHost={};for(const r of wk){const k=r.host.replace(/^.*?(fcm\.googleapis\.com|push\.apple\.com|mozilla\.com|windows\.com).*$/,'$1');(byHost[k]||(byHost[k]={ok:0,bad:0}))[r.status>=200&&r.status<300?'ok':'bad']++}
    return {subs:Object.keys(subs).length,daily:Object.values(subs).filter(s=>s.amDaily||s.pmDaily||s.daily).length,sent7:wk.length,ok7:ok,lastErr:bad.at(-1)||null,byHost}}
  return {handle,stats};
}
