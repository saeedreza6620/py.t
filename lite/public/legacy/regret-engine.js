/* A decision aid based only on names, user-reported outcomes and known catalog roles.
   A similar category or a reported reaction never establishes a shared ingredient or cause. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BeautyWalletRegrets=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 function norm(value){return String(value||'').toLowerCase().normalize('NFKC').replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').replace(/[\u200c\u200f\u200e]/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ')}
 function resolve(name,products){const q=norm(name);if(!q)return null;const exact=products.find(p=>norm(p.name)===q||norm(p.en)===q);if(exact)return exact;
  if(q.length<12)return null;const candidates=products.filter(p=>[p.name,p.en].some(v=>{const n=norm(v);return n.length>=12&&(n.includes(q)||q.includes(n))}));return candidates.length===1?candidates[0]:null}
 function analyze(input,products){const past=(input.past||[]).filter(x=>x&&x.name&&x.reason);const targetName=String(input.target?.name||'').trim();
  if(!past.length)return {kind:'missing',title:'اول یک خرید ناموفق را ثبت کن',points:['نام محصول قبلی و علت پشیمانی را وارد کن؛ خرید دوم اختیاری است.'],confidence:'نامشخص'};
  if(!targetName)return {kind:'missing',title:'نام خرید جدید هنوز مشخص نیست',points:['عکس یا لینک به‌تنهایی در این نسخه برای شناسایی قطعی محصول تحلیل نمی‌شود. نام و مدل روی بسته را وارد کن.'],confidence:'نامشخص'};
  const target=resolve(targetName,products),wallet=Array.isArray(input.wallet)?input.wallet:[],routine=Array.isArray(input.routine)?input.routine:[],notes=[],cautions=[],strong=[];
  const exactTarget=target?.id||norm(targetName);
  if(target&&wallet.includes(target.id)||routine.some(x=>norm(x.name)===norm(targetName))){strong.push('این محصول در کیف یا روتین ثبت‌شدهٔ تو دیده می‌شود؛ پیش از خرید دوباره، مقدار باقی‌مانده را بررسی کن.')}
  for(const p of past){const found=resolve(p.name,products),same=found&&target?found.id===target.id:norm(p.name)===norm(targetName),sameRole=!!(found&&target&&found.cat===target.cat&&!same);
   if(same){strong.push('نام خرید جدید با «'+p.name+'» یکسان است. شاید نسخه یا فرمول فرق کرده باشد؛ برچسب و دلیل پشیمانی قبلی را پیش از خرید بررسی کن.');if(p.reason==='irritation')strong.push('واکنش قبلی را جدی بگیر؛ از روی این فرم علت پزشکی آن مشخص نمی‌شود.');}
   else if(sameRole){if(p.reason==='duplicate'&&wallet.some(id=>products.some(q=>q.id===id&&q.cat===target.cat))){cautions.push('خرید قبلی از نقش «'+target.cat+'» برایت تکراری بود و اکنون هم محصولی در همین دسته در کیف داری؛ تفاوت واقعی دو محصول را بررسی کن.');}
    else if(p.reason==='irritation')notes.push('«'+p.name+'» و خرید جدید در یک دسته‌اند، ولی هم‌دسته بودن هیچ چیز دربارهٔ مادهٔ تحریک‌کننده یا واکنش مجدد ثابت نمی‌کند.');
    else if(p.reason==='texture')notes.push('خرید قبلی و جدید نقش مشابه دارند؛ از روی دستهٔ محصول نمی‌شود بافت یا حس استفادهٔ این نسخه را پیش‌بینی کرد.');
    else if(p.reason==='noresult')notes.push('خرید قبلی در همین دسته نتیجهٔ دلخواهت را نداد؛ هدف، مدت مصرف و نسخهٔ دقیق را پیش از خرید دوباره بررسی کن.');
    else if(p.reason==='price')notes.push('خرید قبلی در همین دسته از نظر هزینه به‌صرفه نبود؛ قیمت و مقدار مصرف گزینهٔ جدید را جدا بسنج.');}
  }
  const price=Number(input.target?.price),budget=Number(input.budget);if(price>0&&budget>0&&price>budget)cautions.push('قیمت ثبت‌شده ('+price.toLocaleString('fa-IR')+' تومان) از بودجهٔ هر محصول در پروفایل ('+budget.toLocaleString('fa-IR')+' تومان) بیشتر است.');
  let kind='neutral',title='تکرار آشکاری در داده‌های ثبت‌شده پیدا نشد',confidence='محدود';
  if(strong.length){kind='repeat';title='احتمال تکرار یک خرید ناموفق یا غیرضروری';confidence='بر اساس نام محصول یا روتین ثبت‌شده';}
  else if(cautions.length){kind='caution';title='قبل از خرید، این موارد را روشن کن';confidence='بر اساس دسته یا بودجهٔ ثبت‌شده';}
  else if(!target){kind='missing';title='نسخهٔ محصول جدید برای مقایسه کافی نیست';confidence='نامشخص';notes.unshift('این نام با مدل مشخصی در فهرست فعلی تطبیق نشد. این به معنی نامعتبر بودن محصول نیست؛ نام دقیق روی بسته و ترکیبات را بررسی کن.');}
  return {kind,title,points:[...strong,...cautions,...notes].slice(0,6),confidence,productId:target?.id||null,footer:'این بررسی بر اساس گفتهٔ تو و اطلاعات محدود محصولات است؛ علت حساسیت، سازگاری قطعی یا اصالت کالا را تشخیص نمی‌دهد. نبود هشدار هم مجوز قطعی خرید نیست.'};
 }
 return {analyze,norm,resolve};
});
