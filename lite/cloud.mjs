// Her name, skin profile, routine (products + morning/night), reminder times and follow-up answers, kept on
// this server under her mobile number — so an update, a reinstall, a new phone or a cleared browser never
// loses them. Only a device that is signed in to that number may read or write it; when SMS sign-in is on,
// only a device that proved the number with the SMS code. Skin photos are NOT here (they stay in the
// encrypted vault). The last few versions are kept, so one bad save can be undone by hand.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';

export const CLOUD_KEYS=['bw_reg','bw_profile_v1_full','bw_profile','bw_skin_quick_v1','bw_check_products','bw_check_times','bw_routine_set','bw_routine_map','bw_routine_synced',
  'bw_own_products','bw_wallet','bw_reminder_v1','bw_fu_notif','bw_fu_start','bw_fu_answers','bw_life','bw_refill','bw_supplements_v1','bw_regret_v1','bw_quick_routine_v1',
  'bw_budget_v1','bw_reviews_v1','bw_last_check'];
export const CLOUD_PREFIX=/^bw_(track|note|mood)_\d{4}-\d{2}-\d{2}$/;
const MAX=300*1024,KEEP=6;

export function makeCloud({DATA,BANK,send,readBody,sameOrigin,smsOn}){
  const DIR=path.join(DATA,'cloud');try{fs.mkdirSync(DIR,{recursive:true})}catch{}
  const file=ph=>path.join(DIR,crypto.createHash('sha256').update('bw-cloud|'+ph).digest('hex').slice(0,40)+'.json');
  const read=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch{return null}};
  const who=d=>{const t=BANK.trust(d);if(!t.phone)return {err:[401,'need_login']};if(smsOn()&&!t.verified)return {err:[403,'need_verify']};return t};
  const clean=data=>{const out={};if(!data||typeof data!=='object')return out;
    for(const [k,v] of Object.entries(data)){if(typeof v!=='string'||v.length>120000)continue;if(CLOUD_KEYS.includes(k)||CLOUD_PREFIX.test(k))out[k]=v}return out};
  async function handle(req,res,url){
    const d=String(url.searchParams.get('d')||'').replace(/[^a-z0-9]/g,'').slice(0,40);
    if(url.pathname==='/api/cloud/load'&&req.method==='GET'){const w=who(d);if(w.err)return send(res,w.err[0],{error:w.err[1]});
      const o=read(file(w.phone));return send(res,200,o?{at:o.at,data:o.data}:{at:0,data:null},'application/json',{'Cache-Control':'no-store'})}
    if(url.pathname==='/api/cloud/save'&&req.method==='POST'){if(!sameOrigin(req))return send(res,403,{error:'forbidden'});
      const b=await readBody(req,MAX);const dd=String(b.d||'').replace(/[^a-z0-9]/g,'').slice(0,40);const w=who(dd);if(w.err)return send(res,w.err[0],{error:w.err[1]});
      const data=clean(b.data);if(!Object.keys(data).length)return send(res,400,{error:'empty'});
      const f=file(w.phone),prev=read(f);
      // someone else (another of her devices) saved after this device last synced: tell it to load first
      if(prev&&Number(b.base||0)<prev.at&&!b.force)return send(res,409,{error:'newer',at:prev.at});
      if(prev){const hist=f.replace(/\.json$/,'.hist.jsonl');fs.appendFileSync(hist,JSON.stringify(prev)+'\n');
        try{const lines=fs.readFileSync(hist,'utf8').trim().split('\n');if(lines.length>KEEP)fs.writeFileSync(hist,lines.slice(-KEEP).join('\n')+'\n')}catch{}}
      const at=Date.now();fs.writeFileSync(f+'.tmp',JSON.stringify({at,dev:dd,data}));fs.renameSync(f+'.tmp',f);return send(res,200,{ok:true,at})}
    return send(res,404,{error:'not found'})}
  // read-only, for the message studio's {محصول…} fields
  const dataOf=ph=>{const o=read(file(ph));return o&&o.data||{}};
  return {handle,dataOf}}
