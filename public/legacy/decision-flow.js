(function(){
  'use strict';
  const by=id=>document.getElementById(id);
  const catalogProducts=typeof PRODUCTS!=='undefined'?PRODUCTS:[];
  const entry=by('decisionEntry'),summary=by('decisionSummary'),forum=by('forumForm');
  const norm=s=>String(s||'').toLocaleLowerCase('fa').replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').replace(/\s+/g,' ').trim();
  function selected(){try{return JSON.parse(localStorage.getItem('bw_check_products')||'[]')}catch{return []}}
  function refreshDecision(){
    if(!summary||summary.dataset.serverResult==='true')return;
    const ids=selected(),cards=by('activeVerdict')?.querySelectorAll('.active-card')||[];
    if(!ids.length||!cards.length){summary.textContent='نام محصول را وارد کن یا از فهرست انتخاب کن؛ نتیجه با دلیل همین‌جا می‌آید.';return}
    const safety=cards[0].classList.contains('pause'),unknown=cards[0].classList.contains('unknown')||cards[1].classList.contains('unknown');
    const duplicate=cards[2].classList.contains('save'),risk=cards[1].classList.contains('space')||cards[2].classList.contains('pause');
    const label=safety?'نخر':unknown?'اطلاعات بیشتری لازم است':duplicate?'فعلاً صبر کن':risk?'فعلاً صبر کن':'برای خرید بررسی نهایی کن';
    const reason=safety?'هشدار ایمنی ثبت‌شده را بررسی کن.':unknown?'عکس فهرست ترکیبات یا لینک رسمی محصول را در دستیار بفرست؛ سازگاری هنوز تأیید نشده.':duplicate?'محصولی با نقش مشابه داری.':risk?'فاصله مصرف اکتیوها یا شرایط پوستت را روشن کن.':'برای تصمیم خرید، بررسی شخصی را در دستیار ادامه بده؛ این بررسی اولیه نیاز به خرید را تأیید نمی‌کند.';
    summary.replaceChildren();const b=document.createElement('b'),p=document.createElement('p'),small=document.createElement('small');
    b.textContent=label;p.textContent=reason;small.textContent='این نتیجه بر پایه اطلاعات ثبت‌شده است و تشخیص پزشکی نیست.';summary.append(b,p,small);
  }
  by('decisionPhoto')?.addEventListener('change',e=>{by('decisionEntryNote').textContent=e.target.files?.[0]?'عکس انتخاب شد؛ نوشته آن خودکار خوانده نمی‌شود. نام یا لینک را هم وارد کن.':'عکس فقط مرجع توست.'});
  window.addEventListener('bw:comparison',refreshDecision);setTimeout(refreshDecision,0);

  async function loadForum(){
    const list=by('forumPosts');if(!list)return;list.textContent='در حال دریافت گفت‌وگوها…';
    const current=catalogProducts.find(p=>p.id===selected()[0]);if(current&&!forum.elements.productName.value)forum.elements.productName.value=current.name;
    try{const r=await fetch('/api/forum',{cache:'no-store'}),data=await r.json();if(!r.ok)throw Error();
      list.replaceChildren();if(!data.posts.length){list.textContent='هنوز تجربه‌ای منتشر نشده؛ نخستین سؤال را ثبت کن.';return}
      const items=new Map();
      data.posts.filter(post=>!window.BWExperienceProduct||norm(post.product_name)===norm(window.BWExperienceProduct.name)).forEach(post=>{const article=document.createElement('article'),title=document.createElement('b'),meta=document.createElement('small'),body=document.createElement('p');
        article.className='forum-post';title.textContent=post.parent_id?'پاسخ درباره '+post.product_name:post.product_name;meta.textContent=[post.kind==='experience'?'تجربه':'پرسش',post.skin_type&&'پوست: '+post.skin_type,post.duration&&'مدت: '+post.duration,post.status==='pending'&&'در انتظار بررسی'].filter(Boolean).join(' · ');body.textContent=post.body;article.append(title,meta,body);
        if(post.status==='approved'){const reply=document.createElement('button');reply.type='button';reply.className='forum-reply';reply.textContent='پاسخ بده';reply.addEventListener('click',()=>{forum.elements.parentId.value=post.id;forum.elements.productName.value=post.product_name;by('forumReplyContext').textContent='پاسخ به گفت‌وگو درباره '+post.product_name;forum.scrollIntoView({behavior:'smooth',block:'start'});forum.elements.body.focus()});article.append(reply)}
        items.set(post.id,{post,article})});
      for(const {post,article} of items.values()){const parent=items.get(post.parent_id);if(parent)parent.article.append(article);else list.append(article)}
    }catch{list.textContent='گفت‌وگوها فعلاً در دسترس نیستند.'}
  }
  window.loadSkinForum=loadForum;
  forum?.addEventListener('submit',async e=>{
    e.preventDefault();const status=by('forumStatus');status.textContent='در حال ثبت…';const data=Object.fromEntries(new FormData(forum));
    const current=window.BWExperienceProduct||catalogProducts.find(p=>p.id===selected()[0]);data.productId=current&&norm(current.name)===norm(data.productName)?current.id:'';
    try{const r=await fetch('/api/forum',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),result=await r.json();if(!r.ok)throw Error(result.error||'ثبت انجام نشد.');status.textContent=result.message;forum.elements.body.value='';forum.elements.parentId.value='';by('forumReplyContext').textContent='';await loadForum()}
    catch(error){status.textContent=error.message||'ثبت انجام نشد.'}
  });
})();
