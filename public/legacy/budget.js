(function(){
'use strict';
const KEY='bw_budget_v1';
const $=s=>document.querySelector(s);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>{const n=Number(value);return Number.isFinite(n)&&n>=0?Math.round(n):0};
const money=value=>number(value).toLocaleString('fa-IR')+' تومان';
function monthKey(date=new Date()){
  try{const parts=new Intl.DateTimeFormat('en-u-ca-persian',{year:'numeric',month:'2-digit',timeZone:'Asia/Tehran'}).formatToParts(date);return parts.find(x=>x.type==='year').value+'-'+parts.find(x=>x.type==='month').value.padStart(2,'0')}catch{return date.toISOString().slice(0,7)}
}
function read(){
  let value={};try{value=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
  const entries=Array.isArray(value.entries)?value.entries.filter(x=>x&&typeof x==='object').slice(-120):[];
  return {version:1,entries,updatedAt:String(value.updatedAt||'')};
}
function profile(){let value={};try{value=JSON.parse(localStorage.getItem('bw_profile_v1_full')||'{}')}catch{}return value&&typeof value==='object'?value:{}}
function limits(){const p=profile();return {monthly:number(p.monthlyBudget),perProduct:number(p.productBudget),defaultShipping:number(p.defaultShipping)}}
function entryTotals(entry){
  const cashPrice=number(entry.cashPrice),shipping=number(entry.shipping),cashTotal=cashPrice+shipping;
  const installmentTotal=number(entry.downPayment)+(number(entry.installmentCount)*number(entry.installmentAmount))+shipping+number(entry.installmentFees);
  const financingCost=Math.max(0,installmentTotal-cashTotal);
  return {cashPrice,shipping,cashTotal,installmentTotal,financingCost,paidThisMonth:number(entry.paidThisMonth)};
}
function summary(){
  const data=read(),key=monthKey(),l=limits(),current=data.entries.filter(x=>x.month===key),spent=current.reduce((sum,x)=>sum+entryTotals(x).paidThisMonth,0);
  const commitments=current.filter(x=>x.method==='installment').reduce((sum,x)=>sum+entryTotals(x).installmentTotal,0);
  return {month:key,monthly:l.monthly,perProduct:l.perProduct,defaultShipping:l.defaultShipping,spent,remaining:Math.max(0,l.monthly-spent),over:Math.max(0,spent-l.monthly),commitments,entries:current};
}
function compareOffer(offer){
  const l=limits(),s=summary(),price=number(offer.price),shipping=offer.shipping==null?l.defaultShipping:number(offer.shipping),cashTotal=price+shipping;
  const installmentTotal=number(offer.downPayment)+(number(offer.installmentCount)*number(offer.installmentAmount))+shipping+number(offer.installmentFees);
  const hasInstallment=number(offer.installmentCount)>0&&number(offer.installmentAmount)>0;
  const effective=hasInstallment?installmentTotal:cashTotal;
  const fitsProduct=!l.perProduct||effective<=l.perProduct,fitsMonth=!s.monthly||number(offer.paidThisMonth||effective)<=s.remaining;
  return {cashTotal,installmentTotal:hasInstallment?installmentTotal:0,financingCost:hasInstallment?Math.max(0,installmentTotal-cashTotal):0,hasInstallment,fitsProduct,fitsMonth,remaining:s.remaining};
}
function saveEntry(entry){const data=read();data.entries.push({...entry,id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(36),month:entry.month||monthKey(),createdAt:new Date().toISOString()});data.entries=data.entries.slice(-120);data.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(data));window.dispatchEvent(new CustomEvent('bw:budget-change'));render();}
function removeEntry(id){const data=read();data.entries=data.entries.filter(x=>x.id!==id);data.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(data));window.dispatchEvent(new CustomEvent('bw:budget-change'));render()}
function dashboard(){
 const s=summary(),percent=s.monthly?Math.min(100,Math.round(s.spent/s.monthly*100)):0;
 return '<section class="soft-card budget-wallet" id="budgetWallet"><div class="budget-title"><div><span class="section-kicker">ولت مالی BeautyWallet</span><h3>بودجه زیبایی این ماه</h3></div><button type="button" class="source-link" data-budget-profile>تنظیم سقف‌ها</button></div>'+
 '<div class="budget-stats"><article><small>بودجه ماهانه</small><b>'+money(s.monthly)+'</b></article><article><small>خرج‌شده این ماه</small><b>'+money(s.spent)+'</b></article><article><small>باقی‌مانده</small><b class="'+(s.over?'budget-danger':'')+'">'+money(s.remaining)+'</b></article><article><small>تعهد اقساط ثبت‌شده</small><b>'+money(s.commitments)+'</b></article></div>'+
 '<div class="budget-progress"><i style="width:'+percent+'%"></i></div><p class="budget-note">'+(s.monthly?(s.over?'این ماه '+money(s.over)+' بیشتر از سقف ثبت‌شده پرداخت کرده‌ای.':percent.toLocaleString('fa-IR')+'٪ از بودجه این ماه مصرف شده است.'):'بودجه ماهانه را در پروفایل ثبت کن تا مانده واقعی محاسبه شود.')+'</p>'+
 '<details class="budget-entry"><summary>ثبت خرید یا قسط این ماه</summary><form class="budget-form budget-entry-form"><label>محصول<input name="product" maxlength="120" required></label><label>فروشگاه<input name="seller" maxlength="100"></label><label>قیمت نقدی محصول<input name="cashPrice" type="number" min="0" required></label><label>هزینه ارسال<input name="shipping" type="number" min="0" value="'+s.defaultShipping+'"></label><label>روش پرداخت<select name="method"><option value="cash">نقدی</option><option value="installment">اقساطی</option></select></label><label>پیش‌پرداخت<input name="downPayment" type="number" min="0"></label><label>تعداد اقساط<input name="installmentCount" type="number" min="0" max="60"></label><label>مبلغ هر قسط<input name="installmentAmount" type="number" min="0"></label><label>کارمزد و هزینه‌های اقساط<input name="installmentFees" type="number" min="0"></label><label>پرداخت واقعی این ماه<input name="paidThisMonth" type="number" min="0" required></label><button class="primary" type="submit">ثبت در بودجه ماه</button></form><p class="budget-help">خرج ماهانه بر اساس «پرداخت واقعی این ماه» محاسبه می‌شود. مجموع اقساط = پیش‌پرداخت + تعداد اقساط × مبلغ هر قسط + ارسال + کارمزد.</p></details>'+
 '<div class="budget-list">'+(s.entries.length?s.entries.slice().reverse().map(x=>{const t=entryTotals(x);return '<div class="budget-row"><div><b>'+esc(x.product||'خرید زیبایی')+'</b><small>'+esc(x.method==='installment'?'اقساطی':'نقدی')+' · پرداخت این ماه '+money(t.paidThisMonth)+(x.method==='installment'?' · هزینه واقعی اقساط '+money(t.installmentTotal)+' · هزینه تأمین مالی '+money(t.financingCost):' · هزینه واقعی نقدی '+money(t.cashTotal))+'</small></div><button type="button" data-budget-remove="'+esc(x.id)+'">حذف</button></div>'}).join(''):'<small>هنوز خرید یا قسطی برای این ماه ثبت نشده است.</small>')+'</div></section>';
}
function render(){
 const mounts=document.querySelectorAll('[data-budget-mount]');for(const mount of mounts)mount.innerHTML=dashboard();
 document.querySelectorAll('[data-budget-profile]').forEach(button=>button.onclick=()=>{if(typeof switchTab==='function')switchTab('profile');const field=document.querySelector('[name="monthlyBudget"]');field?.scrollIntoView({behavior:'smooth',block:'center'});field?.focus()});
 document.querySelectorAll('.budget-entry-form').forEach(form=>form.onsubmit=event=>{event.preventDefault();const f=new FormData(form),method=String(f.get('method')),cashPrice=number(f.get('cashPrice')),shipping=number(f.get('shipping')),downPayment=number(f.get('downPayment')),installmentCount=number(f.get('installmentCount')),installmentAmount=number(f.get('installmentAmount')),installmentFees=number(f.get('installmentFees')),paidThisMonth=number(f.get('paidThisMonth'));if(method==='installment'&&(!installmentCount||!installmentAmount)){if(typeof toast==='function')toast('تعداد و مبلغ هر قسط را کامل کن');return}saveEntry({product:String(f.get('product')||'').trim(),seller:String(f.get('seller')||'').trim(),cashPrice,shipping,method,downPayment,installmentCount,installmentAmount,installmentFees,paidThisMonth});if(typeof toast==='function')toast('در بودجه این ماه ثبت شد')});
 document.querySelectorAll('[data-budget-remove]').forEach(button=>button.onclick=()=>removeEntry(button.dataset.budgetRemove));
}
function enhanceOfferForm(){
 const form=$('#offerForm');if(!form||form.dataset.budgetReady)return;form.dataset.budgetReady='yes';
 const fields=document.createElement('div');fields.className='budget-form';fields.style.gridColumn='1/-1';fields.innerHTML='<label>پیش‌پرداخت<input name="downPayment" type="number" min="0"></label><label>تعداد اقساط<input name="installmentCount" type="number" min="0" max="60"></label><label>مبلغ هر قسط<input name="installmentAmount" type="number" min="0"></label><label>کارمزد اقساط<input name="installmentFees" type="number" min="0"></label><label>پرداخت این ماه<input name="paidThisMonth" type="number" min="0" placeholder="برای محاسبه مانده ماه"></label>';
 const submit=form.querySelector('button[type="submit"],button');submit?.before(fields);
 form.addEventListener('submit',()=>{const f=new FormData(form),root=form.closest('#sheetContent'),id=root?.querySelector('.add-wallet')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];if(!id)return;const extra={downPayment:number(f.get('downPayment')),installmentCount:number(f.get('installmentCount')),installmentAmount:number(f.get('installmentAmount')),installmentFees:number(f.get('installmentFees')),paidThisMonth:number(f.get('paidThisMonth'))};setTimeout(()=>{const key='bw_offers_'+id;let list=[];try{list=JSON.parse(localStorage.getItem(key)||'[]')}catch{}if(!Array.isArray(list)||!list.length)return;Object.assign(list[list.length-1],extra,{installments:extra.installmentCount&&extra.installmentAmount?'yes':'no'});localStorage.setItem(key,JSON.stringify(list));decorateOffers()},20)},true);
}
function decorateOffers(){
 const root=$('#sheetContent'),rows=root?.querySelectorAll('#offerList .offer-row');if(!rows?.length)return;const id=root.querySelector('.add-wallet')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];if(!id)return;let list=[];try{list=JSON.parse(localStorage.getItem('bw_offers_'+id)||'[]')}catch{}list=(Array.isArray(list)?list:[]).filter(x=>x&&Number.isFinite(+x.price)).sort((a,b)=>(+a.price+(+a.shipping||0))-(+b.price+(+b.shipping||0)));rows.forEach((row,index)=>{const existing=row.querySelector('.offer-budget'),offer=list[index];if(!offer){if(existing)existing.remove();return;}const c=compareOffer(offer),note=existing||document.createElement('small');const nextClass='offer-budget '+((!c.fitsMonth||!c.fitsProduct)?'warn':'');const nextText=c.hasInstallment?'نقدی با ارسال: '+money(c.cashTotal)+' · اقساط واقعی: '+money(c.installmentTotal)+' · کارمزد/اختلاف: '+money(c.financingCost)+(c.fitsMonth&&c.fitsProduct?' · در سقف‌های ثبت‌شده':' · خارج از یکی از سقف‌های بودجه'):'هزینه واقعی نقدی با ارسال: '+money(c.cashTotal)+(c.fitsMonth&&c.fitsProduct?' · در سقف‌های ثبت‌شده':' · خارج از یکی از سقف‌های بودجه');if(note.className!==nextClass)note.className=nextClass;if(note.textContent!==nextText)note.textContent=nextText;if(!existing)row.append(note)})
}
function mount(){
 const profileRoot=document.querySelector('#profile .section');if(profileRoot&&!profileRoot.querySelector('[data-budget-mount]')){const node=document.createElement('div');node.dataset.budgetMount='profile';node.className='budget-mount';const form=profileRoot.querySelector('#profile-form');profileRoot.insertBefore(node,form)}
 const checkRoot=document.querySelector('#check .section');if(checkRoot&&!checkRoot.querySelector('[data-budget-mount]')){const node=document.createElement('div');node.dataset.budgetMount='check';node.className='budget-mount';const market=checkRoot.querySelector('#marketFinder');market?market.before(node):checkRoot.append(node)}
 render();
}
window.BWBudget={read,summary,entryTotals,compareOffer,money,monthKey,render};
const observer=new MutationObserver(()=>{enhanceOfferForm();decorateOffers()});const sheet=$('#sheetContent');if(sheet)observer.observe(sheet,{childList:true,subtree:true});
window.addEventListener('bw:budget-change',render);document.addEventListener('DOMContentLoaded',mount);if(document.readyState!=='loading')mount();
})();
