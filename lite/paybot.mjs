// Card-to-card receipts to the owner's own Bale and Telegram bots.
// The shopper types the last 4 digits of the card she paid from and taps «ثبت پرداخت»; the owner's bot gets
// "سفارش #<last4>" with two buttons. A button opens a small signed page on this server, and one more tap there
// (a POST, so a link preview can never approve anything) completes the order: the rest of her diamonds and,
// for the subscription, 30 more days — the same fulfilment the admin panel and the bank-SMS match use.
// Env (set in Liara, never in the repo): BALE_BOT_TOKEN, BALE_CHAT_ID, TG_BOT_TOKEN, TG_CHAT_ID,
// optional TG_API_BASE / BALE_API_BASE (a relay when api.telegram.org is not reachable), PUBLIC_URL.
import crypto from 'node:crypto';

const tidy=v=>String(v||'').trim().replace(/^["']|["']$/g,'');
const faN=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const money=n=>faN(Number(n||0).toLocaleString('en'))+' تومان';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const maskPhone=p=>{p=String(p||'');return p.length>=10?p.slice(0,4)+'***'+p.slice(-4):p};

export function makePayBot({E,getRow,getReqStatus,setReqStatus,fulfil,unadvance,send,readForm,sameOrigin,adminSecret}){
  const BOTS=[
    {k:'bale',name:'بله',token:tidy(E.BALE_BOT_TOKEN),chat:tidy(E.BALE_CHAT_ID),base:(tidy(E.BALE_API_BASE)||'https://tapi.bale.ai').replace(/\/$/,'')},
    {k:'tg',name:'تلگرام',token:tidy(E.TG_BOT_TOKEN||E.TELEGRAM_BOT_TOKEN),chat:tidy(E.TG_CHAT_ID||E.TELEGRAM_CHAT_ID),base:(tidy(E.TG_API_BASE)||'https://api.telegram.org').replace(/\/$/,'')}];
  const last={}; // per bot: {ok, at, err} of the latest send — shown in the admin box, never the token
  const ready=()=>BOTS.filter(b=>b.token&&b.chat);
  // links are signed with a key derived from server secrets; without any secret the buttons are not offered
  const seed=[tidy(E.PAY_LINK_SECRET),adminSecret||'',...BOTS.map(b=>b.token)].join('|');
  const KEY=seed.replace(/\|/g,'')?crypto.createHash('sha256').update('bw-paylink|'+seed).digest():null;
  const sign=(ref,a,t)=>crypto.createHmac('sha256',KEY).update(ref+'|'+a+'|'+t).digest('hex').slice(0,32);
  const okSig=(ref,a,t,s)=>{if(!KEY||!/^[0-9a-f]{32}$/.test(String(s||'')))return false;const w=Buffer.from(sign(ref,a,t)),g=Buffer.from(String(s));return w.length===g.length&&crypto.timingSafeEqual(w,g)};
  const origin=req=>tidy(E.PUBLIC_URL).replace(/\/$/,'')||('https://'+String(req?.headers?.host||'beautywallet.liara.run'));
  const link=(org,ref,a)=>{const t=(Date.now()+14*864e5).toString(36);return `${org}/pay/ok?r=${encodeURIComponent(ref)}&a=${a}&t=${t}&s=${sign(ref,a,t)}`};

  async function call(b,method,body){
    const r=await fetch(`${b.base}/bot${b.token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
    const j=await r.json().catch(()=>({}));if(!r.ok||j.ok===false)throw Error((j.description||('HTTP '+r.status)).slice(0,120));return j}
  async function say(text,buttons){const out={};
    await Promise.all(ready().map(async b=>{
      try{await call(b,'sendMessage',{chat_id:b.chat,text,...(buttons?{reply_markup:{inline_keyboard:[buttons.map(x=>({text:x.text,url:x.url}))]}}:{})});last[b.k]={ok:true,at:new Date().toISOString()};out[b.k]=true}
      catch(e){ // a bot that refuses link buttons still gets the links as plain text
        if(buttons)try{await call(b,'sendMessage',{chat_id:b.chat,text:text+'\n\n'+buttons.map(x=>x.text+':\n'+x.url).join('\n\n')});last[b.k]={ok:true,at:new Date().toISOString()};out[b.k]=true;return}catch{}
        last[b.k]={ok:false,at:new Date().toISOString(),err:e.message};out[b.k]=false;console.error('paybot',b.k,e.message)}}));
    return out}
  const title=row=>row.kind==='sub'?'⭐ اشتراک ماهانه ('+faN(row.n||0)+' الماس)':'💎 '+faN(row.n||0)+' الماس';

  // «ثبت پرداخت» → receipt to the owner's bots, once per order and card digits
  function receipt(row,ss,req){if(!ready().length)return;const key=(ss.last4||'')+'|'+(ss.track||'');if(ss.botKey===key)return;
    setReqStatus(row.ref,{botKey:key});const org=origin(req);
    const text=['🧾 ثبت پرداخت کارت‌به‌کارت',`سفارش #${ss.last4||'----'}   (${row.ref})`,title(row),'مبلغ: '+money(row.amount||row.price),
      '۴ رقم آخر کارت پرداخت‌کننده: '+(ss.last4||'—'),ss.track?'شماره پیگیری: '+ss.track:'',(row.name?'نام: '+row.name+' · ':'')+(row.phone?'موبایل: '+maskPhone(row.phone):''),
      ss.paidAt?'زمان اعلام‌شده: '+ss.paidAt:'',ss.advance?'('+faN(ss.advance)+' الماس پیش‌پرداخت همین الان داده شد)':'','','اگر این واریز به حسابت رسیده «تأیید پرداخت» را بزن.'].filter(x=>x!=='').join('\n');
    say(text,KEY?[{text:'✅ تأیید پرداخت',url:link(org,row.ref,'ok')},{text:'❌ واریزی نیامد',url:link(org,row.ref,'no')}]:null).catch(()=>{})}
  // an order that the bank SMS confirmed on its own: just let the owner know
  function autoDone(row){if(!ready().length)return;const ss=getReqStatus()[row.ref]||{};say(`✅ سفارش #${ss.last4||'----'} (${row.ref}) با پیامک بانک خودکار تأیید شد · ${money(row.amount||row.price)}`).catch(()=>{})}

  const pg=(t,body)=>`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(t)}</title><style>body{font-family:Vazirmatn,Tahoma,sans-serif;background:#f6f4ff;margin:0;padding:24px 16px;color:#22253a}.c{max-width:420px;margin:auto;background:#fff;border-radius:18px;padding:20px;box-shadow:0 6px 24px rgba(80,60,180,.12)}h1{font-size:20px;margin:0 0 10px}p{line-height:1.8;margin:6px 0}b.n{font-size:22px;color:#5b46c9}button{width:100%;border:0;border-radius:14px;padding:14px;font:inherit;font-weight:800;font-size:16px;margin-top:14px;color:#fff;cursor:pointer}.ok{background:#1f9d6f}.no{background:#c0392b}.m{color:#6b6f86;font-size:13px}</style></head><body><div class="c">${body}</div></body></html>`;
  // GET shows the order and one button; POST does it. Only a valid, unexpired signature works, and only once.
  async function handle(req,res,url){
    const isPost=req.method==='POST';const f=isPost?await readForm(req):Object.fromEntries(url.searchParams);
    const ref=String(f.r||'').slice(0,20),a=f.a==='no'?'no':'ok',t=String(f.t||'').slice(0,12),s=String(f.s||'');
    const html=(code,body)=>send(res,code,pg('تأیید پرداخت',body),'text/html; charset=utf-8',{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex'});
    if(!okSig(ref,a,t,s))return html(403,'<h1>این لینک معتبر نیست</h1><p class="m">لینک را از پیام ربات باز کن یا از پنل مدیریت تأیید کن.</p>');
    if(Date.now()>parseInt(t,36))return html(410,'<h1>این لینک منقضی شده</h1><p class="m">از پنل مدیریت تأیید کن.</p>');
    const row=getRow(ref);if(!row||row.method!=='card')return html(404,'<h1>سفارش پیدا نشد</h1>');
    const ss=getReqStatus()[ref]||{};const head=`<p>سفارش <b class="n">#${esc(ss.last4||'----')}</b> <span class="m" dir="ltr">${esc(ref)}</span></p><p>${esc(title(row))} · <b>${esc(money(row.amount||row.price))}</b></p>`;
    if(ss.status==='done')return html(200,'<h1>✅ قبلاً تأیید شده</h1>'+head);
    if(ss.status==='rejected')return html(200,'<h1>⛔ قبلاً رد شده</h1>'+head);
    if(!isPost)return html(200,`<h1>${a==='ok'?'تأیید پرداخت':'واریزی نیامد؟'}</h1>${head}<p class="m">${a==='ok'?'اگر این مبلغ به حسابت رسیده، بزن تا سفارش خودکار تکمیل شود و الماس‌ها به ولت مشتری برود.':'اگر واریزی پیدا نکردی بزن؛ الماس پیش‌پرداخت پس گرفته می‌شود و در اپ به او گفته می‌شود.'}</p>
<form method="post" action="/pay/ok"><input type="hidden" name="r" value="${esc(ref)}"><input type="hidden" name="a" value="${a}"><input type="hidden" name="t" value="${esc(t)}"><input type="hidden" name="s" value="${esc(s)}"><button class="${a}">${a==='ok'?'✅ بله، پرداخت رسید — تکمیل سفارش':'❌ واریزی نیامد — رد سفارش'}</button></form>`);
    if(!sameOrigin(req))return html(403,'<h1>از همین صفحه بزن</h1>');
    if(a==='ok'){fulfil(row,'bot');say(`✅ سفارش #${ss.last4||'----'} (${ref}) تأیید شد و الماس‌ها به ولت مشتری رفت.`).catch(()=>{});return html(200,'<h1>✅ انجام شد</h1>'+head+'<p class="m">سفارش تکمیل شد؛ الماس‌ها همین الان در اپ مشتری دیده می‌شود.</p>')}
    unadvance(row,ss);setReqStatus(ref,{status:'rejected',paidVia:'bot'});say(`⛔ سفارش #${ss.last4||'----'} (${ref}) رد شد.`).catch(()=>{});
    return html(200,'<h1>⛔ رد شد</h1>'+head)}

  // admin: status, find the chat id after the owner sends /start to the bot, send a test message
  function box(){const st=BOTS.map(b=>{const l=last[b.k];return `<li><b>${b.name}</b>: ${b.token?'توکن ✓':'توکن ندارد'} · ${b.chat?'chat id ✓':'chat id ندارد'}${l?` · آخرین ارسال: ${l.ok?'✅ موفق':'❌ '+esc(l.err||'')}`:''}</li>`}).join('');
    return `<div class="card" style="margin-bottom:12px"><b>🤖 رسید کارت‌به‌کارت در بله و تلگرام</b><ul style="margin:6px 0;padding-right:18px">${st}</ul>
<p class="note">راه‌اندازی: ۱) در بله از @botfather و در تلگرام از @BotFather یک ربات بساز. ۲) توکن را در لیارا با نام <code>BALE_BOT_TOKEN</code> و <code>TG_BOT_TOKEN</code> بگذار (هرگز در چت یا گیت‌هاب). ۳) به ربات خودت /start بفرست و این‌جا «پیدا کردن chat id» را بزن. ۴) عدد را در لیارا با نام <code>BALE_CHAT_ID</code> و <code>TG_CHAT_ID</code> بگذار. ${KEY?'':'<b>برای دکمه‌ی تأیید یکی از توکن‌ها یا ADMIN_TOKEN لازم است.</b>'}</p>
<button class="btn ghost" data-pb="chats">پیدا کردن chat id</button> <button class="btn ghost" data-pb="test">پیام آزمایشی</button><pre id="pbOut" class="note" style="white-space:pre-wrap;direction:ltr;text-align:left"></pre>
<script>document.addEventListener('click',async e=>{const b=e.target.closest('[data-pb]');if(!b)return;b.disabled=true;const o=document.getElementById('pbOut');o.textContent='...';try{const r=await fetch('/admin/paybot',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({a:b.dataset.pb})});o.textContent=JSON.stringify(await r.json(),null,1)}catch(x){o.textContent='نشد'}b.disabled=false})</script></div>`}
  async function admin(req,res){if(req.method!=='POST'||!sameOrigin(req))return send(res,403,{error:'forbidden'});const f=await readForm(req);
    if(f.a==='test'){if(!ready().length)return send(res,400,{error:'هیچ رباتی کامل تنظیم نشده (توکن + chat id)'});return send(res,200,await say('🧪 پیام آزمایشی بیوتی‌ولت — اگر این را می‌بینی، رسیدها به همین‌جا می‌آیند.'))}
    if(f.a==='chats'){const out={};await Promise.all(BOTS.filter(b=>b.token).map(async b=>{try{const j=await call(b,'getUpdates',{limit:20});
      out[b.name]=[...new Map((j.result||[]).map(u=>(u.message||u.channel_post||u.my_chat_member||{}).chat).filter(Boolean).map(c=>[c.id,{chat_id:c.id,name:[c.title,c.first_name,c.username&&'@'+c.username].filter(Boolean).join(' ')}])).values()];
      if(!out[b.name].length)out[b.name]='اول به ربات /start بفرست و دوباره بزن'}catch(e){out[b.name]='خطا: '+e.message}}));
      if(!Object.keys(out).length)return send(res,400,{error:'هیچ توکنی تنظیم نشده'});return send(res,200,out)}
    return send(res,400,{error:'bad action'})}
  return {receipt,autoDone,handle,box,admin,ready:()=>ready().length>0}}
