// Diamond purchase through Bale wallet payments (پرداخت بله) — no enamad or bank gateway needed.
// Flow: app asks /bale/order → gets a ble.ir deep link with a one-time start code → the shopper taps «شروع» in our
// Bale bot → the bot sends an invoice → Bale asks pre-checkout (we re-check the order) → successful_payment →
// diamonds are credited to the shopper's device, and the app (polling /order-status) shows them.
// Secrets live only in env: BALE_BOT_TOKEN, BALE_PROVIDER_TOKEN (from @botfather; WALLET-TEST-… for a dry run),
// BALE_BOT_USERNAME (without @). The webhook path carries a hash of the bot token, so nobody can fake a payment update.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';

export function makeBale({DATA,BANK,getCfg,setReqStatus,env,publicUrl,log}){
  const TOKEN=String(env.BALE_BOT_TOKEN||'').trim(),PROVIDER=String(env.BALE_PROVIDER_TOKEN||'').trim(),BOT=String(env.BALE_BOT_USERNAME||'').trim().replace(/^@/,'');
  const on=!!(TOKEN&&PROVIDER&&BOT);
  const SECRET=TOKEN?crypto.createHash('sha256').update('bw-bale|'+TOKEN).digest('hex').slice(0,32):'';
  const hookPath='/bale/hook/'+SECRET;
  const FILE=path.join(DATA,'bale-orders.json');
  let orders={};try{orders=JSON.parse(fs.readFileSync(FILE,'utf8'))}catch{}
  const save=()=>{try{fs.writeFileSync(FILE+'.tmp',JSON.stringify(orders));fs.renameSync(FILE+'.tmp',FILE)}catch(e){log&&log('bale save',e.message)}};
  let status={webhook:'',checkedAt:'',error:''};
  const test=/^WALLET-TEST/i.test(PROVIDER);
  const API=String(env.BALE_API||'https://tapi.bale.ai').replace(/\/$/,''); // overridable only for local tests

  async function api(method,body){
    const r=await fetch(API+'/bot'+TOKEN+'/'+method,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{}),signal:AbortSignal.timeout(15000)});
    const j=await r.json().catch(()=>({ok:false,description:'bad json '+r.status}));if(!j.ok)throw Error(method+': '+(j.description||r.status));return j.result}

  async function ensureWebhook(){if(!on)return status;const want=publicUrl.replace(/\/$/,'')+hookPath;
    try{const info=await api('getWebhookInfo');if(!info||info.url!==want)await api('setWebhook',{url:want});status={webhook:'ok',checkedAt:new Date().toISOString(),error:''}}
    catch(e){status={webhook:'error',checkedAt:new Date().toISOString(),error:String(e.message).slice(0,200)}}
    return status}

  // the app's order: price and diamond count come from the server's own price list
  function createOrder({kind,pack,d,ref}){const cfg=getCfg();const sub=kind==='sub';const pk=sub?null:(cfg.packs||[])[Number(pack)||0];
    const n=sub?Number(cfg.subscription&&cfg.subscription.monthly)||0:Number(pk&&pk.n)||0,price=sub?Number(cfg.subscription&&cfg.subscription.price)||0:Number(pk&&pk.price)||0;
    if(!n||!price)return null;const code=crypto.randomBytes(9).toString('hex');
    orders[code]={ref,d,kind:sub?'sub':'negin',n,price,status:'new',at:new Date().toISOString()};
    const keys=Object.keys(orders);if(keys.length>4000)for(const k of keys.slice(0,keys.length-4000))if(orders[k].status!=='paid')delete orders[k];
    save();return {code,n,price,link:'https://ble.ir/'+BOT+'?start='+code}}
  const fresh=o=>o&&Date.now()-Date.parse(o.at)<24*3600e3;
  function byRef(ref){for(const k in orders)if(orders[k].ref===ref)return orders[k];return null}

  async function invoice(chat,code){const o=orders[code];
    await api('sendInvoice',{chat_id:chat,title:('BeautyWallet · '+o.n+' الماس').slice(0,32),description:(o.kind==='sub'?'اشتراک ماهانه بیوتی‌ولت؛ ':'')+o.n+' الماس برای بررسی محصول و سؤال از دستیار. بعد از پرداخت، الماس‌ها خودشون به ولتت اضافه می‌شن.',
      payload:code,provider_token:PROVIDER,prices:[{label:o.n+' الماس',amount:o.price*10}],photo_url:publicUrl.replace(/\/$/,'')+'/legacy/bw-gem-512.png'});
    o.status='invoiced';o.chat=chat;o.invAt=new Date().toISOString();save()}

  async function handle(u){
    try{
      if(u.pre_checkout_query){const q=u.pre_checkout_query,o=orders[q.invoice_payload];
        const ok=!!(o&&fresh(o)&&o.status!=='paid'&&Number(q.total_amount)===o.price*10);
        await api('answerPreCheckoutQuery',ok?{pre_checkout_query_id:q.id,ok:true}:{pre_checkout_query_id:q.id,ok:false,error_message:'این سفارش منقضی شده؛ از داخل اپ دوباره بزن'});return}
      const m=u.message;if(!m)return;const chat=m.chat&&m.chat.id;
      if(m.successful_payment){const p=m.successful_payment,code=p.invoice_payload,o=orders[code];if(!o)return;
        if(o.status!=='paid'){if(Number(p.total_amount)!==o.price*10){o.status='mismatch';save();log&&log('bale amount mismatch',code);return}
          o.status='paid';o.paidAt=new Date().toISOString();o.charge=String(p.telegram_payment_charge_id||p.provider_payment_charge_id||'').slice(0,80);o.test=test||undefined;save();
          BANK.credit(o.d,o.n);setReqStatus(o.ref,{status:'done',via:'bale',charge:o.charge})}
        await api('sendMessage',{chat_id:chat,text:'💎 پرداخت انجام شد و '+o.n+' الماس به ولتت اضافه شد.\nبرگرد به بیوتی‌ولت؛ الماس‌هات اونجان 💜',reply_markup:{inline_keyboard:[[{text:'برگشت به بیوتی‌ولت',url:publicUrl.replace(/\/$/,'')+'/legacy/'}]]}}).catch(()=>{});return}
      const t=String(m.text||'').trim();const s=t.match(/^\/start(?:\s+([a-f0-9]{18}))?/);if(!s)return;
      const code=s[1],o=code&&orders[code];
      if(!o){await api('sendMessage',{chat_id:chat,text:'سلام 💜 اینجا ربات پرداخت بیوتی‌ولته.\nبرای خرید الماس، از داخل اپ روی «پرداخت با بله» بزن تا صورتحسابت همین‌جا بیاد.',reply_markup:{inline_keyboard:[[{text:'باز کردن بیوتی‌ولت',url:publicUrl.replace(/\/$/,'')+'/legacy/'}]]}});return}
      if(o.status==='paid'){await api('sendMessage',{chat_id:chat,text:'این سفارش قبلاً پرداخت شده و الماس‌هاش تو ولتته 💎'});return}
      if(!fresh(o)){await api('sendMessage',{chat_id:chat,text:'این لینک پرداخت منقضی شده؛ از داخل اپ دوباره «پرداخت با بله» رو بزن 💜'});return}
      await invoice(chat,code);
    }catch(e){log&&log('bale',e.message)}}

  function stateFor(ref){const o=byRef(ref);return o?(o.status==='paid'?'done':o.status==='mismatch'?'rejected':'new'):null}
  function list(){return Object.entries(orders).map(([code,o])=>({...o,code:code.slice(0,6)})).sort((a,b)=>a.at<b.at?1:-1)}
  return {on,test,hookPath,botUsername:BOT,ensureWebhook,status:()=>status,createOrder,handle,stateFor,list};
}
