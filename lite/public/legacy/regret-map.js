(function(){
 'use strict';
 const form=document.getElementById('regretForm'),result=document.getElementById('regretResult'),engine=window.BeautyWalletRegrets;
 if(!form||!result||!engine)return;
 const KEY='bw_regret_v1', $=s=>document.getElementById(s), fields=['past1Name','past1Reason','past2Name','past2Reason','targetName','targetUrl','targetPrice'];
 const index=new Map(PRODUCTS.map(p=>[p.id,p]));
 const list=$('regretProducts');PRODUCTS.forEach(p=>{const o=document.createElement('option');o.value=p.name;list.append(o)});
 function read(){try{const v=JSON.parse(storage.getItem(KEY));return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}}
 function collect(){const data={};for(const key of fields)data[key]=String(form.elements.namedItem(key)?.value||'').trim().slice(0,key==='targetUrl'?500:120);return data}
 function storeDraft(){const previous=read();storage.setItem(KEY,JSON.stringify({...collect(),decisions:Array.isArray(previous.decisions)?previous.decisions:[]}))}
 const draft=read();for(const key of fields){const input=form.elements.namedItem(key);if(input&&typeof draft[key]==='string')input.value=draft[key]}
 const photoUrls=[];
 for(const key of ['past1','past2','target']){
  const input=form.elements.namedItem(key+'Photo'),status=$(key+'PhotoStatus');
  input.addEventListener('change',()=>{const file=input.files?.[0];status.replaceChildren();if(!file)return;if(!file.type.startsWith('image/')||file.size>5*1024*1024){input.value='';status.textContent='فقط عکس تا ۵ مگابایت پذیرفته می‌شود.';return}const url=URL.createObjectURL(file);photoUrls.push(url);const img=document.createElement('img');img.className='regret-preview';img.src=url;img.alt='پیش‌نمایش عکس انتخاب‌شده';status.append(img,document.createTextNode('عکس فقط در همین صفحه دیده می‌شود. نام محصول را هم بنویس.'))});
 }
 window.addEventListener('pagehide',()=>photoUrls.forEach(url=>URL.revokeObjectURL(url)));
 let timer;form.addEventListener('input',e=>{if(e.target.type==='file')return;clearTimeout(timer);timer=setTimeout(storeDraft,350)});form.addEventListener('change',e=>{if(e.target.type!=='file')storeDraft()});
 function add(tag,text,parent,className){const el=document.createElement(tag);if(className)el.className=className;el.textContent=text;parent.append(el);return el}
 function render(report,data){result.replaceChildren();const box=document.createElement('div');box.className='regret-verdict '+report.kind;add('span','نتیجهٔ این بررسی',box,'regret-label');add('h4',report.title,box);add('small','سطح اتکا: '+report.confidence,box,'regret-confidence');if(report.points?.length){const ul=document.createElement('ul');report.points.forEach(p=>add('li',p,ul));box.append(ul)}
  if(report.kind==='neutral')add('p','فقط بر اساس اطلاعات واردشده، الگوی آشکاری از اشتباه قبلی پیدا نشد. نسخه، قیمت و شرایط خرید را جدا بررسی کن.',box);
  if(report.kind==='missing')add('p','برای نتیجهٔ دقیق‌تر، نام و مدل روی بسته‌بندی را کامل کن.',box);
  if(report.footer)add('p',report.footer,box,'regret-disclaimer');
  const actions=document.createElement('div');actions.className='regret-actions';
  if(report.productId&&index.has(report.productId)){const btn=add('button','دیدن این محصول در بیوتی والت',actions);btn.type='button';btn.className='source-link';btn.onclick=()=>openProduct(report.productId)}
  if(data.targetUrl){try{const url=new URL(data.targetUrl);if(url.protocol==='https:'||url.protocol==='http:'){const link=add('a','بازکردن صفحهٔ محصول ↗',actions);link.href=url.href;link.target='_blank';link.rel='noopener noreferrer nofollow';link.className='source-link'}}catch{}}
  box.append(actions);result.append(box);
 }
 function evaluate(){const data=collect(),past=[1,2].map(n=>({name:data['past'+n+'Name'],reason:data['past'+n+'Reason']})),profile=readJSON('bw_profile_v1_full',{});
  const budgetSummary=window.BWBudget?.summary(),registeredCap=Number(profile.productBudget)||0,available=budgetSummary?.monthly?budgetSummary.remaining:0,effectiveBudget=registeredCap&&available?Math.min(registeredCap,available):(registeredCap||available);
  const report=engine.analyze({past,target:{name:data.targetName,price:data.targetPrice},wallet:state.wallet,routine:profile.routine,budget:effectiveBudget},PRODUCTS);
  render(report,data);return report;
 }
 form.addEventListener('submit',e=>{e.preventDefault();storeDraft();evaluate();result.scrollIntoView({behavior:'smooth',block:'nearest'})});
 $('clearRegret').addEventListener('click',()=>{if(!confirm('اطلاعات همین بررسی پاک شود؟ دفتر تصمیم‌ها باقی می‌ماند.'))return;const decisions=read().decisions||[];storage.setItem(KEY,JSON.stringify({decisions}));form.reset();result.replaceChildren();for(const k of ['past1','past2','target'])$(k+'PhotoStatus').replaceChildren()});
 const decisionForm=$('decisionForm'),decisionList=$('decisionList');
 function decisionLabel(value){return ({bought:'خریدم',skipped:'نخریدم',waiting:'هنوز تصمیم نگرفتم',pending:'منتظر نتیجه',satisfied:'راضی بودم','not-satisfied':'راضی نبودم',reaction:'واکنش نامطلوب داشتم'})[value]||value}
 function renderDecisions(){const rows=Array.isArray(read().decisions)?read().decisions:[];decisionList.replaceChildren();if(!rows.length){decisionList.textContent='هنوز نقطه‌ای از مسیر خرید ثبت نشده است.';return}rows.slice().reverse().forEach(item=>{const row=document.createElement('div');row.className='decision-row';add('b',item.product,row);const date=item.decisionDate?(window.BWDate?BWDate.fromStored(item.decisionDate):item.decisionDate):'بدون تاریخ';add('small',date+' · '+decisionLabel(item.decision)+' · '+decisionLabel(item.outcome),row);if(item.exactVersion)add('small','نسخهٔ تحویلی: '+item.exactVersion,row);if(item.seller)add('small','فروشگاه/لینک: '+item.seller,row);if(item.note)add('small','یادداشت: '+item.note,row);const remove=add('button','حذف',row);remove.type='button';remove.className='source-link';remove.onclick=()=>{const data=read(),list=Array.isArray(data.decisions)?data.decisions:[];data.decisions=list.filter(x=>x.id!==item.id);storage.setItem(KEY,JSON.stringify(data));renderDecisions()};decisionList.append(row)})}
 if(decisionForm){decisionForm.elements.decisionDate.value=window.BWDate?BWDate.today():'';if(window.BWDate)BWDate.prepareAll(decisionForm);decisionForm.elements.product.value=draft.targetName||'';decisionForm.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(decisionForm),data=read(),rows=Array.isArray(data.decisions)?data.decisions:[];const rawDate=String(f.get('decisionDate')||'');const item={id:(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)),product:String(f.get('product')||'').trim().slice(0,120),decision:String(f.get('decision')||''),seller:String(f.get('seller')||'').trim().slice(0,240),exactVersion:String(f.get('exactVersion')||'').trim().slice(0,160),decisionDate:window.BWDate?(BWDate.canonical(rawDate)||rawDate):rawDate,outcome:String(f.get('outcome')||'pending'),note:String(f.get('note')||'').trim().slice(0,500),recordedAt:new Date().toISOString()};if(!item.product||!item.decision)return;data.decisions=[...rows,item].slice(-30);storage.setItem(KEY,JSON.stringify(data));decisionForm.reset();decisionForm.elements.decisionDate.value=window.BWDate?BWDate.today():'';renderDecisions()});renderDecisions()}
 if(draft.targetName&&draft.past1Name&&draft.past1Reason)evaluate();
})();
