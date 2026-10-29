// Photo vault for the skin-photo journal — "managed encryption with consent".
// 1) Photos are encrypted on the phone (AES-GCM 256) with a key derived from a recovery code made on
//    the phone; the server only stores ciphertext (HKDF gives independent vault id / access token /
//    key, the server keeps only a SHA-256 of the token).
// 2) With the shopper's consent the phone also leaves the recovery code here wrapped with the
//    BeautyWallet escrow public key (RSA-OAEP-256). The private key is generated on the server's own
//    disk the first time it starts (never in the repo, never in chat). This is what lets a shopper
//    who lost the code get her photos back by verifying her mobile number — and, only if she also
//    allowed it, lets a BeautyWallet expert open her photos to review progress. Every opening is logged.
// 3) Cost: no AI; storage capped per shopper and in total.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
export function makeVault({DATA,send,ip,sameOrigin,E,normPhone,sendOtp,SMS,readBody}){
  const ROOT=path.join(DATA,'vault');try{fs.mkdirSync(ROOT,{recursive:true})}catch{}
  const MAX_PHOTOS=Number(E.VAULT_MAX_PHOTOS||30),MAX_BLOB=450*1024,MAX_TOTAL_MB=Number(E.VAULT_MAX_TOTAL_MB||6000);
  const ID=/^[a-f0-9]{32}$/,PID=/^[a-z0-9-]{4,40}$/,TOKEN=/^[A-Za-z0-9_-]{40,60}$/;
  const ACCESS=path.join(DATA,'vault-access.jsonl'),RECOVER=path.join(DATA,'vault-recover.jsonl');
  // escrow key pair — created once on the persistent disk
  const PEM=path.join(DATA,'vault-escrow.pem');let priv=null,pubB64='';
  try{if(!fs.existsSync(PEM)){const {privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:3072});fs.writeFileSync(PEM,privateKey.export({type:'pkcs8',format:'pem'}),{mode:0o600})}
    priv=crypto.createPrivateKey(fs.readFileSync(PEM));pubB64=crypto.createPublicKey(priv).export({type:'spki',format:'der'}).toString('base64')}catch(e){console.error('vault escrow key',e.message)}
  let total=0;try{for(const v of fs.readdirSync(ROOT))for(const f of fs.readdirSync(path.join(ROOT,v)))if(f.endsWith('.bin'))total+=fs.statSync(path.join(ROOT,v,f)).size}catch{}
  const hits=new Map();
  const limited=(req,n=240)=>{const a=ip(req),now=Date.now(),l=(hits.get(a)||[]).filter(t=>now-t<600e3);l.push(now);hits.set(a,l);if(hits.size>5000)hits.clear();return l.length>n};
  const hash=t=>crypto.createHash('sha256').update(t).digest();
  const log=(file,row)=>fs.appendFile(file,JSON.stringify({at:new Date().toISOString(),...row})+'\n',()=>{});
  function authOk(dir,token,create){const f=path.join(dir,'auth');
    if(!fs.existsSync(f)){if(!create)return false;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(f,hash(token).toString('hex'));return true}
    const want=Buffer.from(fs.readFileSync(f,'utf8').trim(),'hex'),got=hash(token);return want.length===got.length&&crypto.timingSafeEqual(want,got)}
  const readRaw=(req,max)=>new Promise((ok,bad)=>{let n=0;const parts=[];req.on('data',c=>{n+=c.length;if(n>max){bad(Object.assign(new Error('too_large'),{status:413}));req.destroy();return}parts.push(c)});req.on('end',()=>ok(Buffer.concat(parts)));req.on('error',bad)});
  const list=dir=>{try{return fs.readdirSync(dir).filter(f=>f.endsWith('.bin')).map(f=>{const s=fs.statSync(path.join(dir,f));return {id:f.slice(0,-4),size:s.size,t:s.mtimeMs}}).sort((a,b)=>a.t-b.t)}catch{return []}};
  const escrowOf=vid=>{try{return JSON.parse(fs.readFileSync(path.join(ROOT,vid,'escrow.json'),'utf8'))}catch{return null}};
  const vaultIds=()=>{try{return fs.readdirSync(ROOT).filter(v=>ID.test(v))}catch{return []}};
  const unwrap=es=>{if(!priv||!es||!es.wrapped)return '';try{return crypto.privateDecrypt({key:priv,padding:crypto.constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(es.wrapped,'base64')).toString('utf8')}catch{return ''}};
  // same derivation as the phone (skin-journal.js): base32 code → HKDF-SHA256
  const A32='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function codeBytes(code){const s=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/^BW(?=.{32}$)/,'');if(s.length!==32)return null;const out=Buffer.alloc(20);let bits=0,val=0,j=0;for(const ch of s){const v=A32.indexOf(ch);if(v<0)return null;val=((val<<5)|v)&0xffff;bits+=5;if(bits>=8){out[j++]=(val>>>(bits-8))&255;bits-=8}}return out}
  function keysOf(code){const raw=codeBytes(code);if(!raw)return null;const salt=Buffer.from('beautywallet-vault-v1'),h=(info,n)=>Buffer.from(crypto.hkdfSync('sha256',raw,salt,Buffer.from(info),n));
    return {id:h('vault-id',16).toString('hex'),key:h('vault-enc',32)}}
  function openBlob(key,buf){if(buf[0]!==1)throw Error('format');const iv=buf.subarray(1,13),tag=buf.subarray(buf.length-16),ct=buf.subarray(13,buf.length-16);
    const d=crypto.createDecipheriv('aes-256-gcm',key,iv);d.setAuthTag(tag);const p=Buffer.concat([d.update(ct),d.final()]);const n=p.readUInt32BE(0);return {meta:JSON.parse(p.subarray(4,4+n).toString('utf8')),img:p.subarray(4+n)}}
  const stats=()=>{const ids=vaultIds();return {vaults:ids.length,escrow:ids.filter(v=>escrowOf(v)).length,share:ids.filter(v=>(escrowOf(v)||{}).share).length,mb:Math.round(total/1e5)/10,capMb:MAX_TOTAL_MB}};
  const OTP=new Map();setInterval(()=>{const t=Date.now();for(const [k,v] of OTP)if(t-v.sent>15*60e3)OTP.delete(k)},5*60e3).unref();
  const H={'Cache-Control':'no-store'};
  const j=(res,s,b)=>send(res,s,b,'application/json',H);

  async function handle(req,res,url){
    if(!sameOrigin(req))return j(res,403,{error:'forbidden'});
    if(url.pathname==='/api/vault-pub')return j(res,200,{spki:pubB64,alg:'RSA-OAEP-256'});
    if(url.pathname==='/api/vault-recover'&&req.method==='POST'){ // lost the code: verify the mobile number
      if(limited(req,20))return j(res,429,{error:'کمی بعد دوباره امتحان کن'});
      const b=await readBody(req,1000),phone=normPhone(b.phone);if(!phone)return j(res,400,{error:'شماره موبایل درست نیست'});
      const has=vaultIds().some(v=>{const es=escrowOf(v);return es&&es.phone===phone});
      if(SMS.on){const prev=OTP.get(phone);if(prev&&Date.now()-prev.sent<60e3)return j(res,429,{error:'یک دقیقه دیگر دوباره بزن'});
        if(!has)return j(res,200,{otp:true}); // same answer either way: does not reveal who has photos here
        const code=String(crypto.randomInt(10000,100000));if(!await sendOtp(phone,code))return j(res,502,{error:'پیامک نرفت؛ چند دقیقه بعد دوباره امتحان کن'});
        OTP.set(phone,{code,sent:Date.now(),tries:0});return j(res,200,{otp:true})}
      log(RECOVER,{phone,d:String(b.d||'').replace(/[^a-z0-9]/g,'').slice(0,40),has});return j(res,200,{support:true})}
    if(url.pathname==='/api/vault-recover/verify'&&req.method==='POST'){
      if(limited(req,30))return j(res,429,{error:'کمی بعد دوباره امتحان کن'});
      const b=await readBody(req,1000),phone=normPhone(b.phone),o=phone&&OTP.get(phone);
      if(!o||Date.now()-o.sent>10*60e3)return j(res,400,{error:'کد منقضی شده؛ دوباره بفرست'});
      const code=String(b.code||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\D/g,'');
      if(code!==o.code){o.tries++;if(o.tries>=5)OTP.delete(phone);return j(res,400,{error:'کد درست نیست'})}
      OTP.delete(phone);const codes=vaultIds().map(v=>({v,es:escrowOf(v)})).filter(x=>x.es&&x.es.phone===phone).sort((a,b)=>String(b.es.at).localeCompare(String(a.es.at))).map(x=>unwrap(x.es)).filter(Boolean);
      log(ACCESS,{who:'shopper',why:'recover-by-phone',phone,n:codes.length});return j(res,200,{codes:codes.slice(0,3)})}
    if(limited(req))return j(res,429,{error:'کمی بعد دوباره امتحان کن'});
    const [,,,vid,pid]=url.pathname.split('/');const token=String(req.headers['x-vault-auth']||'');
    if(!ID.test(vid||'')||!TOKEN.test(token)||(pid!==undefined&&pid!=='escrow'&&!PID.test(pid)))return j(res,400,{error:'bad'});
    const dir=path.join(ROOT,vid),m=req.method;
    if(pid==='escrow'){ // consent settings + the code wrapped for BeautyWallet
      if(!authOk(dir,token,m==='PUT'))return j(res,403,{error:'auth'});const f=path.join(dir,'escrow.json');
      if(m==='DELETE'){try{fs.unlinkSync(f)}catch{}return j(res,200,{ok:true})}
      if(m!=='PUT')return j(res,405,{error:'method'});
      const b=await readBody(req,3000),wrapped=String(b.wrapped||'');if(!/^[A-Za-z0-9+/=]{300,800}$/.test(wrapped))return j(res,400,{error:'bad'});
      const old=escrowOf(vid)||{};const row={wrapped,phone:normPhone(b.phone)||old.phone||'',d:String(b.d||'').replace(/[^a-z0-9]/g,'').slice(0,40),share:!!b.share,at:new Date().toISOString()};
      fs.writeFileSync(f+'.tmp',JSON.stringify(row));fs.renameSync(f+'.tmp',f);return j(res,200,{ok:true})}
    if(m==='PUT'&&pid){
      if(!authOk(dir,token,true))return j(res,403,{error:'auth'});
      const body=await readRaw(req,MAX_BLOB);if(body.length<64)return j(res,400,{error:'empty'});
      const file=path.join(dir,pid+'.bin'),had=fs.existsSync(file)?fs.statSync(file).size:0;
      if(!had&&list(dir).length>=MAX_PHOTOS)return j(res,409,{error:'full',max:MAX_PHOTOS});
      if(total-had+body.length>MAX_TOTAL_MB*1e6)return j(res,507,{error:'storage'});
      const tmp=file+'.tmp';fs.writeFileSync(tmp,body);fs.renameSync(tmp,file);total+=body.length-had;
      return j(res,200,{ok:true,size:body.length})}
    if(!authOk(dir,token,false))return m==='GET'&&!pid?j(res,200,{photos:[]}):j(res,404,{error:'none'});
    if(m==='GET'&&!pid){const es=escrowOf(vid);return j(res,200,{photos:list(dir),max:MAX_PHOTOS,escrow:!!es,share:!!(es&&es.share)})}
    if(m==='GET'&&pid){const f=path.join(dir,pid+'.bin');if(!fs.existsSync(f))return j(res,404,{error:'none'});return send(res,200,fs.readFileSync(f),'application/octet-stream',H)}
    if(m==='DELETE'&&pid){const f=path.join(dir,pid+'.bin');if(fs.existsSync(f)){total-=fs.statSync(f).size;fs.unlinkSync(f)}return j(res,200,{ok:true})}
    if(m==='DELETE'&&!pid){for(const p of list(dir))total-=p.size;fs.rmSync(dir,{recursive:true,force:true});return j(res,200,{ok:true})}
    return j(res,405,{error:'method'})}

  // ---------- admin (behind the admin login) ----------
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fa=n=>String(n??'').replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
  const mask=p=>p?p.slice(0,4)+'•••'+p.slice(-3):'—';
  async function adminHandle(req,res,url,{page,readForm}){
    const p=url.pathname,html=(t,b)=>send(res,200,page(t,b),'text/html; charset=utf-8',{'Cache-Control':'no-store'});
    if(p==='/admin/vault'){const ids=vaultIds().map(v=>({v,es:escrowOf(v),n:list(path.join(ROOT,v)).length})).filter(x=>x.n||x.es).sort((a,b)=>String((b.es||{}).at).localeCompare(String((a.es||{}).at)));
      let reqs=[];try{reqs=fs.readFileSync(RECOVER,'utf8').trim().split('\n').filter(Boolean).slice(-30).reverse().map(l=>JSON.parse(l))}catch{}
      return html('عکس‌های پوست',`<h1>فضای امن عکس‌های پوست</h1><p class="note">عکس‌ها رمزشده‌اند. «دیدن عکس‌ها» فقط وقتی فعال است که خود کاربر اجازه‌ی بررسی کارشناس را داده باشد. هر باز کردن و هر نمایش کد ثبت می‌شود.</p>
      ${reqs.length?`<h2>درخواست‌های بازیابی (بدون پیامک)</h2><div class="card scroll"><table><tr><th>زمان</th><th>موبایل</th><th>عکس دارد؟</th></tr>${reqs.map(r=>`<tr><td>${esc(r.at.slice(0,16).replace('T',' '))}</td><td dir="ltr">${esc(r.phone)}</td><td>${r.has?'بله':'خیر'}</td></tr>`).join('')}</table></div><p class="note">اول از راه پشتیبانی مطمئن شو صاحب همین شماره است، بعد «کد بازیابی» همان ردیف را برایش بفرست.</p>`:''}
      <h2>کاربران</h2><div class="card scroll"><table><tr><th>موبایل</th><th>عکس</th><th>بازیابی توسط ما</th><th>اجازه‌ی بررسی</th><th></th></tr>${ids.map(x=>`<tr><td dir="ltr">${esc(mask((x.es||{}).phone))}</td><td>${fa(x.n)}</td><td>${x.es?'✓':'—'}</td><td>${x.es&&x.es.share?'✓':'—'}</td><td>${x.es?`<form method="post" action="/admin/vault/code" style="display:inline"><input type="hidden" name="v" value="${x.v}"><button class="btn ghost" style="font-size:12px;padding:5px 10px">کد بازیابی</button></form>`:''} ${x.es&&x.es.share?`<a class="btn" style="font-size:12px;padding:5px 10px" href="/admin/vault/view?v=${x.v}">دیدن عکس‌ها</a>`:''}</td></tr>`).join('')||'<tr><td colspan="5">هنوز کسی عکس ثبت نکرده.</td></tr>'}</table></div><p><a href="/admin">بازگشت</a></p>`)}
    if(p==='/admin/vault/code'&&req.method==='POST'){if(!sameOrigin(req))return send(res,403,'forbidden','text/plain');const f=await readForm(req),v=String(f.v||'');if(!ID.test(v))return send(res,400,'bad','text/plain');
      const es=escrowOf(v),code=unwrap(es);log(ACCESS,{who:'admin',why:'show-code',v,phone:(es||{}).phone||''});
      return html('کد بازیابی',`<h1>کد بازیابی</h1><div class="card"><p dir="ltr" style="font-size:20px;font-weight:700;text-align:center;user-select:all">${esc(code||'—')}</p><p class="note">فقط برای صاحب همین شماره (${esc(mask((es||{}).phone))}) بفرست، بعد از اینکه هویتش را از راه پشتیبانی بررسی کردی. این نمایش ثبت شد.</p></div><p><a href="/admin/vault">بازگشت</a></p>`)}
    if(p==='/admin/vault/view'){const v=String(url.searchParams.get('v')||'');const es=ID.test(v)&&escrowOf(v);
      if(!es||!es.share)return html('اجازه نیست',`<h1>اجازه‌ی بررسی داده نشده</h1><p class="note">این کاربر اجازه‌ی دیدن عکس‌ها را به کارشناس نداده است.</p><p><a href="/admin/vault">بازگشت</a></p>`);
      const k=keysOf(unwrap(es));if(!k||k.id!==v)return html('خطا','<h1>کد این فضای امن باز نشد</h1><p><a href="/admin/vault">بازگشت</a></p>');
      const items=[];for(const ph of list(path.join(ROOT,v))){try{const o=openBlob(k.key,fs.readFileSync(path.join(ROOT,v,ph.id+'.bin')));items.push(o)}catch{}}
      items.sort((a,b)=>String(a.meta.date).localeCompare(String(b.meta.date)));log(ACCESS,{who:'admin',why:'view-photos',v,phone:es.phone||'',n:items.length});
      const d0=items[0]?Date.parse(items[0].meta.date):0;
      return html('روند پوست',`<h1>روند پوست ${esc(mask(es.phone))}</h1><p class="note">با اجازه‌ی کاربر برای بررسی روند. این بازدید ثبت شد. عکس را ذخیره یا جایی ارسال نکن.</p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">${items.map(o=>`<figure class="card" style="margin:0"><img style="width:100%;border-radius:10px" src="data:image/jpeg;base64,${o.img.toString('base64')}"><figcaption style="font-size:12px;line-height:1.8">روز ${fa(Math.round((Date.parse(o.meta.date)-d0)/864e5))} · ${esc(String(o.meta.date).slice(0,10))}<br>${esc((o.meta.tags||[]).join('، '))}${o.meta.note?'<br>'+esc(o.meta.note):''}${(o.meta.routine||[]).length?'<br><small>روتین: '+esc(o.meta.routine.join('، '))+'</small>':''}</figcaption></figure>`).join('')}</div><p><a href="/admin/vault">بازگشت</a></p>`)}
    return send(res,404,'پیدا نشد','text/plain; charset=utf-8')}
  return {handle,stats,adminHandle};
}
