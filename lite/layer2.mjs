// Layer-2 records: every authenticity check, follow-up answer and skin photo is also kept here as ONE tagged
// row — product id, seller, city, skin type, date — so the advantages that need many people later
// («N people with skin like yours tolerated it», safe sellers, each city's seasons, products that really
// changed skin) can be built from data collected from day one. Append-only; nothing is ever rewritten.
// No photos, no names, no phone numbers: a person is a one-way hash. The app keeps working if this is down.
// Also: today's weather for her city (UV, humidity, dust) from Open-Meteo, cached; null when unreachable.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';

export const CITIES={
  tehran:{n:'تهران',lat:35.69,lon:51.39,z:'dry'},mashhad:{n:'مشهد',lat:36.30,lon:59.60,z:'dry'},isfahan:{n:'اصفهان',lat:32.65,lon:51.67,z:'dry'},
  karaj:{n:'کرج',lat:35.84,lon:50.94,z:'dry'},shiraz:{n:'شیراز',lat:29.59,lon:52.58,z:'dry'},tabriz:{n:'تبریز',lat:38.08,lon:46.29,z:'cold'},
  qom:{n:'قم',lat:34.64,lon:50.88,z:'dry'},ahvaz:{n:'اهواز',lat:31.32,lon:48.67,z:'hot'},kermanshah:{n:'کرمانشاه',lat:34.31,lon:47.07,z:'cold'},
  urmia:{n:'ارومیه',lat:37.55,lon:45.08,z:'cold'},rasht:{n:'رشت',lat:37.28,lon:49.58,z:'humid'},zahedan:{n:'زاهدان',lat:29.50,lon:60.86,z:'dry'},
  kerman:{n:'کرمان',lat:30.28,lon:57.08,z:'dry'},hamedan:{n:'همدان',lat:34.80,lon:48.51,z:'cold'},yazd:{n:'یزد',lat:31.90,lon:54.36,z:'dry'},
  ardabil:{n:'اردبیل',lat:38.25,lon:48.29,z:'cold'},bandarabbas:{n:'بندرعباس',lat:27.18,lon:56.27,z:'hot'},arak:{n:'اراک',lat:34.09,lon:49.69,z:'cold'},
  zanjan:{n:'زنجان',lat:36.67,lon:48.48,z:'cold'},sari:{n:'ساری',lat:36.57,lon:53.06,z:'humid'},qazvin:{n:'قزوین',lat:36.27,lon:50.00,z:'cold'},
  gorgan:{n:'گرگان',lat:36.84,lon:54.43,z:'humid'},sanandaj:{n:'سنندج',lat:35.31,lon:47.00,z:'cold'},bushehr:{n:'بوشهر',lat:28.97,lon:50.84,z:'hot'},
  khorramabad:{n:'خرم‌آباد',lat:33.49,lon:48.36,z:'cold'},semnan:{n:'سمنان',lat:35.58,lon:53.39,z:'dry'},kish:{n:'کیش',lat:26.53,lon:53.98,z:'hot'}};
const TYPES=new Set(['auth','fu','photo','check','calm','refill']);
const s=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,n);
const DAYRE=/^\d{4}-\d{2}-\d{2}$/;

export function makeLayer2({DATA,send,readBody,sameOrigin,BANK}){
  const DIR=path.join(DATA,'l2');try{fs.mkdirSync(DIR,{recursive:true})}catch{}
  const FILE=path.join(DIR,'records.jsonl');
  const hits=new Map();
  const limited=d=>{const now=Date.now(),l=(hits.get(d)||[]).filter(t=>now-t<3600e3);l.push(now);hits.set(d,l);if(hits.size>20000)hits.clear();return l.length>300};
  const person=d=>{let ph='';try{ph=(BANK.trust(d)||{}).phone||''}catch{}return crypto.createHash('sha256').update('bw-l2|'+(ph||'d:'+d)).digest('hex').slice(0,20)};
  function row(d,r){if(!r||!TYPES.has(r.t))return null;
    const o={t:r.t,u:person(d),day:DAYRE.test(r.day||'')?r.day:new Date().toISOString().slice(0,10),pid:s(r.pid,60),seller:s(r.seller,30),city:CITIES[r.city]?r.city:'',skin:s(r.skin,20)};
    if(r.t==='auth'){o.res=['ok','bad','noreply'].includes(r.res)?r.res:'';if(!o.res)return null;o.src=r.src==='scan'?'scan':'typed'}
    if(r.t==='fu'){o.c=Math.max(0,Math.min(400,Number(r.c)||0));o.k=s(r.k,12);o.v=s(r.v,12);if(!o.pid||!o.v)return null}
    if(r.t==='photo'){o.pids=(Array.isArray(r.pids)?r.pids:[]).map(x=>s(x,60)).filter(Boolean).slice(0,15);o.adh=Math.max(0,Math.min(14,Number(r.adh)||0));
      o.std=!!r.std;o.light=['ok','dark','bright','warm','cool','uneven'].includes(r.light)?r.light:'';o.react=!!r.react;o.n=Math.max(0,Math.min(60,Number(r.n)||0))}
    if(r.t==='check'){o.dec=s(r.dec,12);if(!o.pid)return null}
    if(r.t==='refill'){o.ev=['due','worked','notworked','alt_offer','alt','buy','renewed'].includes(r.ev)?r.ev:'';if(!o.ev||!o.pid)return null}
    if(r.t==='calm'){o.ev=['start','red','unlock','test','ready','done','stop','alt'].includes(r.ev)?r.ev:'';if(!o.ev)return null;const ids=x=>(Array.isArray(x)?x:[]).map(y=>s(y,60)).filter(Boolean).slice(0,8);
      o.sus=ids(r.sus);o.culprit=ids(r.culprit);o.safe=ids(r.safe);o.dn=Math.max(0,Math.min(60,Number(r.dayn)||0));o.base=Math.max(0,Math.min(10,Number(r.base)||0));o.now=Math.max(0,Math.min(10,Number(r.now)||0));o.sym=(Array.isArray(r.sym)?r.sym:[]).map(y=>s(y,12)).slice(0,8);o.since=s(r.since,8)}
    return o}
  const cache=new Map();
  async function weather(key){const c=CITIES[key];if(!c)return null;const hit=cache.get(key);if(hit&&Date.now()-hit.at<3*3600e3)return hit.v;
    const get=async u=>{const ac=new AbortController(),t=setTimeout(()=>ac.abort(),6000);try{const r=await fetch(u,{signal:ac.signal});return r.ok?await r.json():null}catch{return null}finally{clearTimeout(t)}};
    const [w,a]=await Promise.all([get(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,relative_humidity_2m&daily=uv_index_max&timezone=Asia%2FTehran&forecast_days=1`),
      get(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${c.lat}&longitude=${c.lon}&current=pm10,pm2_5,dust&timezone=Asia%2FTehran`)]);
    const v=w&&w.current?{temp:w.current.temperature_2m,hum:w.current.relative_humidity_2m,uv:w.daily&&w.daily.uv_index_max?w.daily.uv_index_max[0]:null,
      pm10:a&&a.current?a.current.pm10:null,pm25:a&&a.current?a.current.pm2_5:null,dust:a&&a.current?a.current.dust:null}:null;
    cache.set(key,{at:hit&&!v?hit.at:Date.now(),v:v||(hit&&hit.v)||null});return v||(hit&&hit.v)||null}
  async function handle(req,res,url){
    if(url.pathname==='/api/l2/rec'&&req.method==='POST'){if(!sameOrigin(req))return send(res,403,{error:'forbidden'});
      let b;try{b=await readBody(req,64*1024)}catch{return send(res,400,{error:'bad'})}
      const d=s(b&&b.d,40).replace(/[^a-z0-9]/g,'');if(!d)return send(res,400,{error:'device'});if(limited(d))return send(res,429,{error:'slow'});
      const rows=(Array.isArray(b.recs)?b.recs:[]).slice(0,40).map(r=>row(d,r)).filter(Boolean);
      if(rows.length)fs.appendFileSync(FILE,rows.map(r=>JSON.stringify({at:new Date().toISOString(),...r})).join('\n')+'\n');
      return send(res,200,{ok:true,n:rows.length})}
    if(url.pathname==='/api/l2/climate'&&req.method==='GET'){const key=s(url.searchParams.get('c'),20);if(!CITIES[key])return send(res,400,{error:'city'});
      return send(res,200,{city:key,w:await weather(key)},'application/json',{'Cache-Control':'no-store'})}
    return send(res,404,{error:'not found'})}
  function rows(){try{return fs.readFileSync(FILE,'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean)}catch{return []}}
  // how far each layer-2 advantage is from being shown to anyone (≥10 records per product/seller/city)
  function summary(){const R=rows(),by=t=>R.filter(r=>r.t===t),cnt=(a,f)=>{const m={};a.forEach(r=>{const k=f(r);if(k)m[k]=(m[k]||0)+1});return m};
    const fu=by('fu'),au=by('auth'),ph=by('photo'),ca=by('calm'),ready=m=>Object.values(m).filter(n=>n>=10).length;
    const fuP=cnt(fu.filter(r=>r.skin),r=>r.pid+'|'+r.skin),auS=cnt(au.filter(r=>r.seller),r=>r.seller),cityM=cnt(R.filter(r=>r.city),r=>r.city);
    const tagged=a=>a.length?Math.round(100*a.filter(r=>r.pid&&r.city).length/a.length):0;
    return {total:R.length,people:new Set(R.map(r=>r.u)).size,calmStart:ca.filter(r=>r.ev==='start').length,calmRed:ca.filter(r=>r.ev==='red').length,calmUnlock:ca.filter(r=>r.ev==='unlock').length,calmDone:ca.filter(r=>r.ev==='done').length,calmFound:ca.filter(r=>r.ev==='done'&&r.culprit&&r.culprit.length).length,calmAlt:ca.filter(r=>r.ev==='alt').length,calmReady:ca.filter(r=>r.ev==='ready').length,refDue:by('refill').filter(r=>r.ev==='due').length,refWorked:by('refill').filter(r=>r.ev==='worked').length,refNot:by('refill').filter(r=>r.ev==='notworked').length,refAltOffer:by('refill').filter(r=>r.ev==='alt_offer').length,refAlt:by('refill').filter(r=>r.ev==='alt').length,refBuy:by('refill').filter(r=>r.ev==='buy').length,refRenew:by('refill').filter(r=>r.ev==='renewed').length,fu:fu.length,auth:au.length,photo:ph.length,std:ph.filter(r=>r.std).length,react:ph.filter(r=>r.react).length,
      bad:au.filter(r=>r.res==='bad').length,tagFu:tagged(fu),tagAuth:Math.round(100*(au.length?au.filter(r=>r.seller&&r.city).length/au.length:0)),
      readySimilar:ready(fuP),pairsSimilar:Object.keys(fuP).length,readySellers:ready(auS),sellers:Object.keys(auS).length,readyCities:ready(cityM),cities:Object.keys(cityM).length,
      topSellers:Object.entries(auS).sort((a,b)=>b[1]-a[1]).slice(0,8),last:R.slice(-15).reverse()}}
  return {handle,summary}
}
