'use client';
import {browserReviewContext} from '../../assistant/browser-context';

import {FormEvent,useEffect,useRef,useState} from 'react';
import styles from './assistant.module.css';
import water from './assistant-water.module.css';
import trustStyles from './assistant-trust.module.css';

type Trust={confidence:'low'|'medium'|'high';knowledgeVersion:string;personalUsed:boolean;publishedRuleCount:number;verifiedOfferCount:number;webSourceCount:number;marketChecked:boolean;checkedAt:string;missing:string[]};
type ChatMessage={id?:string;role:'user'|'assistant';content:string;created_at?:string;meta?:{trust?:Trust}};
type Status={knowledge:{active:boolean;version:string;published_sources?:number;published_rules?:number;review_due?:number};personal:{available:boolean;updatedAt:string|null};market:{items:unknown[];freshestAt:string|null};api:{configured:boolean};messages:ChatMessage[]};
const faDate=(v:string|null)=>v?new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeZone:'Asia/Tehran'}).format(new Date(v)):'هنوز ثبت نشده';

export default function AssistantPage(){
  const [status,setStatus]=useState<Status|null>(null),[messages,setMessages]=useState<ChatMessage[]>([]),[text,setText]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState('');
  const [marketOpen,setMarketOpen]=useState(false),[market,setMarket]=useState({productName:'',seller:'',price:'',discount:'',availability:'',installment:'',url:''});
  const [feedback,setFeedback]=useState<Record<string,'helpful'|'not_helpful'>>({});
  const [outcomes,setOutcomes]=useState<Record<string,string>>({});
  const endRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{fetch('/api/assistant',{cache:'no-store'}).then(async r=>(await r.json()) as Status).then(x=>{setStatus(x);setMessages(x.messages||[])}).catch(()=>setError('حافظه دستیار بارگذاری نشد.'))},[]);
  useEffect(()=>{
    endRef.current?.scrollIntoView({behavior:'smooth'});
  },[messages,loading]);
  async function send(e:FormEvent){
    e.preventDefault();const value=text.trim();if(!value||loading)return;
    setError('');setLoading(true);setText('');setMessages(x=>[...x,{role:'user',content:value}]);
    try{
      const hasMarket=Object.values(market).some(Boolean);
      const response=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:value,reviewContext:browserReviewContext(),market:hasMarket?{...market,capturedAt:new Date().toISOString()}:undefined})});
      const data=await response.json() as {answer?:string;assistantMessageId?:string;trust?:Trust;error?:string};if(!response.ok)throw new Error(data.error||'ارسال انجام نشد.');
      if(!data.answer)throw new Error('پاسخ قابل‌استفاده‌ای دریافت نشد.');
      const answer=data.answer;setMessages(x=>[...x,{id:data.assistantMessageId,role:'assistant',content:answer,meta:{trust:data.trust}}]);
      if(hasMarket){setMarket({productName:'',seller:'',price:'',discount:'',availability:'',installment:'',url:''});setMarketOpen(false)}
      const refreshed=await fetch('/api/assistant',{cache:'no-store'}).then(async r=>(await r.json()) as Status);setStatus(refreshed);
    }catch(x){setError(x instanceof Error?x.message:'ارسال انجام نشد.')}finally{setLoading(false)}
  }
  async function rate(messageId:string,rating:'helpful'|'not_helpful'){
    if(feedback[messageId])return;
    try{
      const response=await fetch('/api/assistant/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assistantMessageId:messageId,rating})});
      if(!response.ok)throw new Error();
      setFeedback(x=>({...x,[messageId]:rating}));
    }catch{setError('بازخورد ذخیره نشد؛ دوباره امتحان کن.')}
  }
  async function recordOutcome(messageId:string,outcome:string){
    if(outcomes[messageId])return;
    try{const response=await fetch('/api/assistant/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assistantMessageId:messageId,outcome})});if(!response.ok)throw new Error();setOutcomes(x=>({...x,[messageId]:outcome}))}catch{setError('نتیجه ذخیره نشد؛ دوباره امتحان کن.')}
  }
  const confidenceLabel=(value:Trust['confidence'])=>value==='high'?'اطمینان بیشتر':value==='medium'?'اطمینان متوسط':'اطلاعات ناکافی';
  return <main className={`${styles.shell} ${water.shell}`} dir="rtl">
    <header className={styles.header}><a href="/legacy/index.html" className={styles.back}>بازگشت</a><div><b>دستیار BeautyWallet</b><span>پوست، روتین و خرید</span></div><span className={`${styles.spark} ${water.drop}`} aria-label="نشان قطره آب"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8C10.8 6 6.1 10.6 6.1 15a5.9 5.9 0 0 0 11.8 0C17.9 10.6 13.2 6 12 2.8Z"/></svg></span></header>
    <section className={styles.memoryGrid} aria-label="حافظه‌های دستیار">
      <article><i className={styles.knowledge}>۱</i><div><b>دانش BeautyWallet</b><span>{status?.knowledge.active?`نسخه ${status.knowledge.version} · ${status.knowledge.published_rules||0} قاعده منتشرشده`:'در حال بررسی'}</span></div></article>
      <article><i className={`${styles.personal} ${water.personal}`}>۲</i><div><b>حافظه شخصی تو</b><span>{status?.personal.available?'همگام · '+faDate(status.personal.updatedAt):'پروفایل هنوز همگام نشده'}</span></div></article>
      <article><i className={styles.market}>۳</i><div><b>حافظه بازار</b><span>{status?.market.freshestAt?'آخرین ثبت '+faDate(status.market.freshestAt):'هنوز رکورد تاریخ‌دار ندارد'}</span></div></article>
    </section>
    <p className={styles.truth}>قیمت و موجودی فقط وقتی نمایش داده می‌شود که فروشنده و زمان ثبت مشخص باشد؛ دستیار عدد زنده جعل نمی‌کند.</p>
    <section className={styles.quick} aria-label="پیشنهاد سؤال">{['روتینم را کوتاه کن','این محصول را بخرم؟','با بودجه‌ام چه چیزی لازم است؟'].map(x=><button key={x} onClick={()=>setText(x)}>{x}</button>)}</section>
    <section className={styles.chat} aria-live="polite">
      {!messages.length&&<div className={styles.welcome}><b>سلام، از کجا شروع کنیم؟</b><p>اسم یا لینک محصول را بفرست یا درباره روتینت بپرس.</p></div>}
      {messages.map((m,i)=>{const trust=m.meta?.trust;return <div key={m.id||i} className={m.role==='user'?styles.user:styles.assistant}>{m.content}{m.role==='assistant'&&trust&&<section className={trustStyles.trust} aria-label="شفافیت پاسخ"><div className={trustStyles.trustHead}><b>{confidenceLabel(trust.confidence)}</b><span>دانش {trust.knowledgeVersion}</span></div><div className={trustStyles.basis}><span>{trust.personalUsed?'پروفایل تو بررسی شد':'پروفایل کامل نیست'}</span><span>{trust.publishedRuleCount.toLocaleString('fa-IR')} قاعده مرتبط</span>{trust.marketChecked&&<span>{trust.webSourceCount.toLocaleString('fa-IR')} منبع زنده</span>}</div>{trust.missing.length>0&&<p>هنوز نمی‌دانیم: {trust.missing.join('؛ ')}</p>}</section>}{m.role==='assistant'&&m.id&&<><div className={styles.feedback}><span>این تصمیم مفید بود؟</span><button type="button" disabled={!!feedback[m.id]} onClick={()=>rate(m.id!,'helpful')}>{feedback[m.id]==='helpful'?'ثبت شد':'بله'}</button><button type="button" disabled={!!feedback[m.id]} onClick={()=>rate(m.id!,'not_helpful')}>{feedback[m.id]==='not_helpful'?'ثبت شد':'نه'}</button></div><div className={trustStyles.outcomes}><span>بعدش چه شد؟</span>{[['considering','هنوز بررسی می‌کنم'],['purchased','خریدم'],['skipped','نخریدم']].map(([value,label])=><button key={value} type="button" disabled={!!outcomes[m.id!]} onClick={()=>recordOutcome(m.id!,value)}>{outcomes[m.id!]===value?'ثبت شد':label}</button>)}</div></>}</div>})}
      {loading&&<div className={styles.assistant}>دارم اطلاعاتت را کنار هم می‌گذارم…</div>}<div ref={endRef}/>
    </section>
    <button className={styles.marketToggle} onClick={()=>setMarketOpen(x=>!x)}>{marketOpen?'بستن اطلاعات بازار':'＋ ثبت قیمت یا فروشنده کنار سؤال'}</button>
    {marketOpen&&<section className={`${styles.marketForm} ${water.marketForm}`}>
      <p>اختیاری است؛ فقط چیزی را وارد کن که همین حالا در فروشگاه دیده‌ای.</p>
      <input placeholder="نام دقیق محصول" value={market.productName} onChange={e=>setMarket({...market,productName:e.target.value})}/>
      <input placeholder="نام فروشگاه" value={market.seller} onChange={e=>setMarket({...market,seller:e.target.value})}/>
      <div><input placeholder="قیمت" value={market.price} onChange={e=>setMarket({...market,price:e.target.value})}/><input placeholder="تخفیف" value={market.discount} onChange={e=>setMarket({...market,discount:e.target.value})}/></div>
      <div><input placeholder="موجودی" value={market.availability} onChange={e=>setMarket({...market,availability:e.target.value})}/><input placeholder="شرایط اقساط" value={market.installment} onChange={e=>setMarket({...market,installment:e.target.value})}/></div>
      <input inputMode="url" placeholder="https:// لینک محصول" value={market.url} onChange={e=>setMarket({...market,url:e.target.value})}/>
    </section>}
    {error&&<p className={styles.error}>{error}</p>}
    <form className={styles.composer} onSubmit={send}><textarea maxLength={3000} rows={2} value={text} onChange={e=>setText(e.target.value)} placeholder="مثلاً این سرم با روتین فعلی من تداخل دارد؟"/><button className={water.send} disabled={loading||!text.trim()}>ارسال</button></form>
    <footer>این دستیار جایگزین تشخیص یا درمان پزشکی نیست.</footer>
  </main>
}
