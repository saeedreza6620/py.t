(function(){
 function init(){
  const dialog=document.createElement('dialog');dialog.id='bwPrivacyDialog';dialog.dir='rtl';dialog.innerHTML='<h2>حریم خصوصی</h2><p>پروفایل اولیه روی دستگاه نگهداری می‌شود. با رضایت ثبت آنلاین، اطلاعات پروفایل، ولت، روتین، مکمل‌ها و پیگیری‌ها روی سرور ذخیره می‌شوند و مدیریت BeautyWallet به آن‌ها دسترسی دارد</p><p>متن گفتگو و اطلاعات مرتبطی که برای بررسی شخصی می‌فرستی، برای پاسخ‌گویی به سرویس هوش مصنوعی ارسال و در سابقه خصوصی دستیار ذخیره می‌شوند. عکس در این مسیر ارسال نمی‌شود</p><form method="dialog"><button>بستن</button></form>';document.body.append(dialog);
  const link=document.createElement('button');link.type='button';link.className='bw-privacy-link';link.textContent='حریم خصوصی';link.onclick=()=>dialog.showModal();document.querySelector('main')?.append(link);
  document.addEventListener('click',e=>{if(e.target.closest('[data-bw-privacy]'))dialog.showModal()});
  function polish(){document.querySelectorAll('button').forEach(button=>{if(button.closest('#bwPrivacyDialog'))return;const value=button.textContent.trim();const kind=/بررسی|تحلیل/.test(value)?'review':/ثبت|ذخیره/.test(value)?'save':'';if(kind){button.classList.add('bw-action-icon');button.dataset.bwAction=kind}else button.classList.remove('bw-action-icon')})}
  polish();new MutationObserver(polish).observe(document.body,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
