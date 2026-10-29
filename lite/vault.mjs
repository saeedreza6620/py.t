// Encrypted photo vault for the skin-photo journal.
// The server only ever receives ciphertext: photos are encrypted on the shopper's phone with
// AES-GCM; the key is derived from a recovery code that never leaves the phone. The server sees a
// random vault id, a hash of an access token (derived separately from the same code, so it cannot
// be turned back into the key) and opaque blobs. Nobody here can open a photo.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
export function makeVault({DATA,send,ip,sameOrigin,E}){
  const ROOT=path.join(DATA,'vault');try{fs.mkdirSync(ROOT,{recursive:true})}catch{}
  const MAX_PHOTOS=Number(E.VAULT_MAX_PHOTOS||30),MAX_BLOB=450*1024,MAX_TOTAL_MB=Number(E.VAULT_MAX_TOTAL_MB||6000);
  const ID=/^[a-f0-9]{32}$/,PID=/^[a-z0-9-]{4,40}$/,TOKEN=/^[A-Za-z0-9_-]{40,60}$/;
  let total=0;try{for(const v of fs.readdirSync(ROOT))for(const f of fs.readdirSync(path.join(ROOT,v)))if(f.endsWith('.bin'))total+=fs.statSync(path.join(ROOT,v,f)).size}catch{}
  const hits=new Map();
  const limited=req=>{const a=ip(req),now=Date.now(),l=(hits.get(a)||[]).filter(t=>now-t<600e3);l.push(now);hits.set(a,l);if(hits.size>5000)hits.clear();return l.length>240};
  const hash=t=>crypto.createHash('sha256').update(t).digest();
  function authOk(dir,token,create){const f=path.join(dir,'auth');
    if(!fs.existsSync(f)){if(!create)return false;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(f,hash(token).toString('hex'));return true}
    const want=Buffer.from(fs.readFileSync(f,'utf8').trim(),'hex'),got=hash(token);return want.length===got.length&&crypto.timingSafeEqual(want,got)}
  const readRaw=(req,max)=>new Promise((ok,bad)=>{let n=0;const parts=[];req.on('data',c=>{n+=c.length;if(n>max){bad(Object.assign(new Error('too_large'),{status:413}));req.destroy();return}parts.push(c)});req.on('end',()=>ok(Buffer.concat(parts)));req.on('error',bad)});
  const list=dir=>{try{return fs.readdirSync(dir).filter(f=>f.endsWith('.bin')).map(f=>{const s=fs.statSync(path.join(dir,f));return {id:f.slice(0,-4),size:s.size,t:s.mtimeMs}}).sort((a,b)=>a.t-b.t)}catch{return []}};
  const stats=()=>{let vaults=0;try{vaults=fs.readdirSync(ROOT).length}catch{}return {vaults,mb:Math.round(total/1e5)/10,capMb:MAX_TOTAL_MB}};
  async function handle(req,res,url){
    const H={'Cache-Control':'no-store'};
    if(!sameOrigin(req))return send(res,403,{error:'forbidden'},'application/json',H);
    if(limited(req))return send(res,429,{error:'کمی بعد دوباره امتحان کن'},'application/json',H);
    const [,,,vid,pid]=url.pathname.split('/');const token=String(req.headers['x-vault-auth']||'');
    if(!ID.test(vid||'')||!TOKEN.test(token)||(pid!==undefined&&!PID.test(pid)))return send(res,400,{error:'bad'},'application/json',H);
    const dir=path.join(ROOT,vid),m=req.method;
    if(m==='PUT'&&pid){
      if(!authOk(dir,token,true))return send(res,403,{error:'auth'},'application/json',H);
      const body=await readRaw(req,MAX_BLOB);if(body.length<64)return send(res,400,{error:'empty'},'application/json',H);
      const file=path.join(dir,pid+'.bin'),had=fs.existsSync(file)?fs.statSync(file).size:0;
      if(!had&&list(dir).length>=MAX_PHOTOS)return send(res,409,{error:'full',max:MAX_PHOTOS},'application/json',H);
      if(total-had+body.length>MAX_TOTAL_MB*1e6)return send(res,507,{error:'storage'},'application/json',H);
      const tmp=file+'.tmp';fs.writeFileSync(tmp,body);fs.renameSync(tmp,file);total+=body.length-had;
      return send(res,200,{ok:true,size:body.length},'application/json',H)}
    if(!authOk(dir,token,false))return send(res,m==='GET'&&!pid?200:404,m==='GET'&&!pid?{photos:[]}:{error:'none'},'application/json',H);
    if(m==='GET'&&!pid)return send(res,200,{photos:list(dir),max:MAX_PHOTOS},'application/json',H);
    if(m==='GET'&&pid){const f=path.join(dir,pid+'.bin');if(!fs.existsSync(f))return send(res,404,{error:'none'},'application/json',H);return send(res,200,fs.readFileSync(f),'application/octet-stream',H)}
    if(m==='DELETE'&&pid){const f=path.join(dir,pid+'.bin');if(fs.existsSync(f)){total-=fs.statSync(f).size;fs.unlinkSync(f)}return send(res,200,{ok:true},'application/json',H)}
    if(m==='DELETE'&&!pid){for(const p of list(dir))total-=p.size;fs.rmSync(dir,{recursive:true,force:true});return send(res,200,{ok:true},'application/json',H)}
    return send(res,405,{error:'method'},'application/json',H)}
  return {handle,stats};
}
