(function(){
  'use strict';
  const KEY='bw_regret_v1';
  const byId=id=>document.getElementById(id);
  const read=()=>{try{const value=JSON.parse(storage.getItem(KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}};
  const productIndex=new Map((window.PRODUCTS||PRODUCTS||[]).map(product=>[product.id,product]));
  const safe=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function recentProducts(){
    const data=read(),result=[],seen=new Set();
    const add=(id,name)=>{const product=productIndex.get(id);const label=name||product?.name;if(!label||seen.has(label))return;seen.add(label);result.push({id:id||'',name:label})};
    (Array.isArray(data.decisions)?data.decisions:[]).slice().reverse().forEach(item=>add(item.productId,item.product));
    (Array.isArray(state.wallet)?state.wallet:[]).forEach(id=>add(id));
    (window.PRODUCTS||PRODUCTS||[]).forEach(product=>add(product.id,product.name));
    return result;
  }

  function setupQuickFeedback(){
    const select=byId('quickFeedbackProduct'),options=byId('quickFeedbackOptions'),followup=byId('quickFeedbackFollowup'),status=byId('quickFeedbackStatus'),advanced=byId('regretStart'),journal=document.querySelector('.decision-journal'),toggle=byId('showAdvancedRegret');
    if(!select||!options||!followup||!status)return;
    const destination=byId('productComfortLog'),sourcePanel=byId('regrets'),quickCard=byId('quickFeedback');
    if(destination&&quickCard){
      const kicker=quickCard.querySelector('.section-kicker'),heading=quickCard.querySelector('h3');
      if(kicker)kicker.textContent='ثبت سریع';
      if(heading)heading.textContent='تجربه این محصول چطور بود؟';
      destination.append(quickCard);
      if(advanced)destination.append(advanced);
      if(journal)destination.append(journal);
      sourcePanel?.remove();
    }
    const products=recentProducts();
    select.innerHTML='<option value="">محصول را انتخاب کن</option>'+products.map(item=>'<option value="'+safe(item.id)+'">'+safe(item.name)+'</option>').join('');
    let pending=null;
    const labels={good:'خوب بود','no-change':'تغییری ندیدم','not-compatible':'با پوستم سازگار نبود','poor-value':'ارزش پولش را نداشت',duplicate:'مشابهش را داشتم'};
    const followups={
      'not-compatible':['سوزش','قرمزی','خارش','جوش','خشکی یا پوسته‌ریزی'],
      'poor-value':['قیمت بالا','حجم کم','نتیجه کم','هزینه ارسال زیاد'],
      'no-change':['زمان کم برای نتیجه','مصرف نامنظم','انتظارم بیشتر بود','مطمئن نیستم'],
      duplicate:['کارکرد مشابه','ترکیبات مشابه','همان مرحله روتین']
    };
    function saveFeedback(detail){
      const selected=select.options[select.selectedIndex];
      if(!select.value||!selected?.textContent){status.textContent='اول محصول را انتخاب کن.';select.focus();return}
      const data=read(),rows=Array.isArray(data.quickFeedback)?data.quickFeedback:[];
      rows.push({id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(36),productId:select.value,product:selected.textContent,outcome:pending,detail:detail||'',recordedAt:new Date().toISOString()});
      data.quickFeedback=rows.slice(-100);storage.setItem(KEY,JSON.stringify(data));
      status.textContent='ثبت شد؛ همین پاسخ کوتاه در پیشنهادهای بعدی استفاده می‌شود.';
      options.querySelectorAll('button').forEach(button=>button.classList.remove('selected'));
      followup.hidden=true;followup.replaceChildren();pending=null;
    }
    options.addEventListener('click',event=>{
      const button=event.target.closest('[data-feedback]');if(!button)return;
      pending=button.dataset.feedback;options.querySelectorAll('button').forEach(item=>item.classList.toggle('selected',item===button));status.textContent='';
      const choices=followups[pending];
      if(!choices){saveFeedback('');return}
      followup.hidden=false;followup.innerHTML='<b>کدام مورد نزدیک‌تر است؟</b><div>'+choices.map(choice=>'<button type="button" data-detail="'+safe(choice)+'">'+safe(choice)+'</button>').join('')+'</div>';
    });
    followup.addEventListener('click',event=>{const button=event.target.closest('[data-detail]');if(button)saveFeedback(button.dataset.detail)});
    if(journal)journal.hidden=true;
    toggle?.addEventListener('click',()=>{advanced.hidden=!advanced.hidden;if(journal)journal.hidden=advanced.hidden;toggle.textContent=advanced.hidden?'ثبت جزئیات بیشتر':'بستن جزئیات';if(!advanced.hidden)advanced.scrollIntoView({behavior:'smooth',block:'start'})});
  }

  function setupSkinOnboarding(){
    const home=byId('quickSkinHome'),guide=document.querySelector('#profile .profile-guide'),quickStart=document.querySelector('#home .quick-start'),assistant=byId('assistantHub'),catalog=byId('catalogStart');
    if(!home||!guide)return;
    home.append(guide);guide.classList.add('quick-skin-guide');
    const title=guide.querySelector('h3'),intro=guide.querySelector('p');
    if(title)title.textContent='سه سؤال کوتاه برای شناخت پوست';
    if(intro)intro.textContent='هر سؤال را با توجه به حالت معمول پوستت جواب بده. نتیجه اولیه است، نه تشخیص پزشکی.';
    const note=guide.querySelector('.guide-note');
    if(note)note.textContent='اگر پوستت امروز تحریک شده یا داروی پوستی مصرف می‌کنی، نتیجه را قطعی ندان.';
    const actions=document.createElement('div');actions.className='skin-onboarding-actions';actions.hidden=true;
    actions.innerHTML='<button type="button" class="primary" data-skin-detail>پروفایلم را دقیق‌تر کنم</button><button type="button" class="secondary" data-skin-continue>فعلاً با همین نتیجه ادامه بدهم</button>';
    guide.append(actions);
    // A first purchase decision must never be gated by the optional skin intake.
    const setNextVisible=()=>[quickStart,assistant,catalog].forEach(element=>{if(element)element.hidden=false});
    const readProfile=()=>readJSON('bw_profile_v1_full',{});
    const storedQuick=readJSON('bw_skin_quick_v1',{}),profile=readProfile();
    const skinName=profile.skinBase||storedQuick.skinBase||storedQuick.result||'';
    function openGuide(card){if(card)card.remove();guide.hidden=false;guide.scrollIntoView({behavior:'smooth',block:'start'})}
    if(skinName){
      guide.hidden=true;setNextVisible(true);
      const card=document.createElement('div');card.className='returning-skin';
      card.innerHTML='<span class="returning-icon" aria-hidden="true">◌</span><span><b>قدم بعدی تو آماده است</b><small>پوست ثبت‌شده: '+safe(skinName)+'</small></span><button type="button">ویرایش شناخت پوست</button>';
      card.querySelector('button').addEventListener('click',()=>openGuide(card));home.append(card);
    }else setNextVisible(true);
    byId('guideResultButton')?.addEventListener('click',()=>{
      const result=byId('guideResult')?.textContent?.trim();if(!result)return;
      const skinField=document.querySelector('#profile-form [name="skinBase"]');
      const data={tZone:byId('guideT')?.value||'',cheeks:byId('guideC')?.value||'',sensitive:byId('guideS')?.value||'',skinBase:skinField?.value||'',result,updatedAt:new Date().toISOString()};
      storage.setItem('bw_skin_quick_v1',JSON.stringify(data));actions.hidden=false;
    });
    actions.querySelector('[data-skin-detail]').addEventListener('click',()=>{setNextVisible(true);switchTab('profile');setTimeout(()=>document.querySelector('.profile-wizard')?.scrollIntoView({behavior:'smooth',block:'start'}),60)});
    actions.querySelector('[data-skin-continue]').addEventListener('click',()=>{setNextVisible(true);quickStart?.scrollIntoView({behavior:'smooth',block:'start'})});
  }

  function setupProfileWizard(){
    const form=byId('profile-form');if(!form||form.querySelector('.profile-wizard'))return;
    const originalChildren=Array.from(form.children),panels=originalChildren.filter(node=>node.matches?.('details.panel'));
    if(!panels.length)return;
    const register=document.querySelector('.profile-register-card');
    const sync=originalChildren.find(node=>node.classList?.contains('sync-promise'));
    const sticky=originalChildren.find(node=>node.classList?.contains('sticky-save'));
    const demo=originalChildren.find(node=>node.classList?.contains('demo-profile-banner'));if(demo)demo.hidden=true;
    const firstPanelIndex=originalChildren.indexOf(panels[0]);
    const skinNodes=originalChildren.filter((node,index)=>index<firstPanelIndex&&![register,demo].includes(node));
    const groups=[skinNodes,[panels[0],panels[1]],[panels[2],panels[3]],[panels[4],panels[5]],[panels[6],register,sync,sticky].filter(Boolean)];
    const titles=['پوست من','هدف‌ها','محصولات فعلی','بودجه و سبک زندگی','ایمنی و ذخیره'];
    const wizard=document.createElement('div');wizard.className='profile-wizard';
    wizard.innerHTML='<div class="profile-wizard-head"><div class="profile-wizard-copy"><b></b><span></span></div><div class="profile-wizard-progress" aria-hidden="true">'+titles.map(()=>'<i></i>').join('')+'</div></div><div class="profile-wizard-stages"></div><div class="profile-wizard-actions"><button type="button" class="profile-wizard-back">مرحله قبل</button><button type="button" class="profile-wizard-next">مرحله بعد</button></div>';
    form.append(wizard);const stagesRoot=wizard.querySelector('.profile-wizard-stages');
    const stages=groups.map((nodes,index)=>{const stage=document.createElement('section');stage.className='profile-wizard-stage';stage.dataset.step=String(index);stage.setAttribute('aria-label',titles[index]);nodes.forEach(node=>{if(node)stage.append(node)});stage.querySelectorAll('details.panel').forEach(panel=>panel.open=true);stagesRoot.append(stage);return stage});
    let current=Math.max(0,Math.min(4,Number(storage.getItem('bw_profile_wizard_step'))||0));
    const back=wizard.querySelector('.profile-wizard-back'),next=wizard.querySelector('.profile-wizard-next'),label=wizard.querySelector('.profile-wizard-copy b'),count=wizard.querySelector('.profile-wizard-copy span'),dots=Array.from(wizard.querySelectorAll('.profile-wizard-progress i'));
    function render(){stages.forEach((stage,index)=>stage.hidden=index!==current);label.textContent=titles[current];count.textContent='مرحله '+(current+1)+' از ۵';dots.forEach((dot,index)=>dot.classList.toggle('done',index<=current));back.hidden=current===0;next.hidden=current===4;storage.setItem('bw_profile_wizard_step',String(current))}
    function validCurrent(){const invalid=Array.from(stages[current].querySelectorAll('[required]')).find(field=>!field.checkValidity());if(!invalid)return true;invalid.reportValidity();invalid.focus();return false}
    back.addEventListener('click',()=>{if(current>0){current--;render();wizard.scrollIntoView({behavior:'smooth',block:'start'})}});
    next.addEventListener('click',()=>{if(!validCurrent())return;if(current<4){current++;render();wizard.scrollIntoView({behavior:'smooth',block:'start'})}});
    form.addEventListener('submit',()=>storage.removeItem('bw_profile_wizard_step'));
    render();
  }

  // Catalog-first routine result: computed in the browser from BeautyWallet's own
  // product formulas (catalog-routine.js), so it appears even when the AI provider is down.
  const actionKind={keep:'keep',pause:'pause',replace:'space',verify:'space',professional:'pause'};
  function localCheck(detail){
    if(!window.BWCatalog||!window.bwReviewContext)return null;
    try{
      const ctx=window.bwReviewContext();
      const ids=Array.isArray(detail?.ids)?detail.ids:ctx.selection.map(item=>item.id);
      const selection=ids.map(id=>({id,name:productIndex.get(id)?.name||id,time:detail?.times?.[id]||ctx.selection.find(item=>item.id===id)?.time||'pm'}));
      return window.BWCatalog.evaluate({profile:ctx.profile||{},selection,owned:ctx.ownedIds||[]});
    }catch{return null}
  }
  function productButtons(list){return (list||[]).map(item=>'<button type="button" class="bw-catalog-pick" data-open-product="'+safe(item.id)+'">'+safe(item.name)+(item.owned?' <small>در کیفت داری</small>':'')+'</button>').join('')}
  function catalogHtml(check){
    const actions=check.actions.map(item=>{
      const extra=(item.schedule?' · '+item.schedule:'');
      const alts=item.alternatives&&item.alternatives.length?'<div class="bw-catalog-alts"><span>گزینه از کاتالوگ:</span>'+productButtons(item.alternatives)+'</div>':'';
      return '<article class="active-card '+(actionKind[item.action]||'')+'"><span class="active-dot" aria-hidden="true"></span><div><b>'+safe(item.name)+' — '+safe(window.BWCatalog.actionLabel(item.action))+'</b><p>'+safe(item.reason+extra)+'</p>'+alts+'</div></article>';
    }).join('');
    const gaps=check.gaps.map(gap=>'<div class="bw-catalog-gap"><b>'+safe(gap.text)+'</b>'+(gap.suggestions.length?'<div class="bw-catalog-alts">'+productButtons(gap.suggestions)+'</div>':'')+'</div>').join('');
    const notes=[...check.fit.map(x=>x.text),...check.interactions.map(x=>x.text),...check.reintroduce];
    const coverage=check.coverage.declared.length?'<p class="bw-catalog-note">فرمول '+safe(String(check.coverage.declared.length).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]))+' محصول فقط از روی نام ثبت شده؛ ثبت فهرست ترکیبات پشت بسته دقت را بالا می‌برد</p>':'';
    return '<p class="bw-catalog-lead">'+safe(check.lead)+'</p>'+actions+gaps+(notes.length?'<details class="bw-catalog-more"><summary>دلیل‌ها و زمان مصرف</summary>'+notes.map(x=>'<p>'+safe(x)+'</p>').join('')+'</details>':'')+coverage+'<p class="bw-catalog-note">این نتیجه از داده فرمول محصولات کاتالوگ BeautyWallet است، نه نسخه پزشکی</p>';
  }
  function renderActiveVerdict(detail){
    const root=byId('activeVerdict');if(!root)return;
    const ids=Array.isArray(detail?.ids)?detail.ids:readJSON('bw_check_products',[]);
    if(!ids.length){root.innerHTML='<p class="active-empty">محصول‌ها را انتخاب کن؛ نتیجه در سه جواب کوتاه نمایش داده می‌شود.</p>';updateQuick(null);return}
    root.replaceChildren();
    const check=localCheck(detail);updateQuick(check);
    const label=document.createElement('p');label.textContent=check?'نتیجه برای روتین تو':'روتینت با نیاز پوستت جور است؟';root.append(label);
    if(check){const local=document.createElement('div');local.className='bw-catalog-check';local.innerHTML=catalogHtml(check);root.append(local);}
    const button=document.createElement('button');button.type='button';button.className='source-link';button.textContent=check?'توضیح بیشتر با دستیار':'بررسی علمی روتین من';root.append(button);
    button.onclick=async()=>{button.disabled=true;const output=document.createElement('div');output.setAttribute('role','status');root.append(output);output.textContent='دارم توضیح این نتیجه را آماده می‌کنم…';const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),80000);try{const selection=ids.map(id=>({id,name:productIndex.get(id)?.name||id,category:productIndex.get(id)?.cat||'',time:detail?.times?.[id]||'pm'}));const data=await window.bwReviewRequest('routine','روتین انتخاب‌شده را از نظر تناسب با پوست، وضعیت سد پوستی، هدف جلوگیری از جوش و تداخل اکتیوها بررسی کن.',{selection},controller.signal);if(data.catalogOnly&&check){output.textContent='توضیح هوشمند الان در دسترس نیست؛ نتیجه بالا از داده کاتالوگ است و معتبر می‌ماند';}else{window.bwRenderAnswer(output,data.answer,data.assistantMessageId,check?null:data.review?.routinePlan);}}catch(e){output.textContent=check?'توضیح هوشمند الان در دسترس نیست؛ نتیجه بالا از داده کاتالوگ است و معتبر می‌ماند':e.name==='AbortError'?'بررسی طول کشید؛ نتیجه صادر نشد. دوباره تلاش کن':e.message||'بررسی آنلاین انجام نشد؛ هیچ تأیید ایمنی صادر نشده';}finally{clearTimeout(timer);button.disabled=false;}};
  }
  function updateQuick(check){
    const quick=byId('routineAdvice');if(!quick||!window.BWCatalog)return;
    if(!check){const skin=window.bwReviewContext?.().profile?.skinBase;quick.textContent=(skin?'پوست: '+skin+' · ':'')+'محصول‌های روتینت را انتخاب کن تا نتیجه کاتالوگ همین‌جا بیاید';return}
    quick.textContent=check.lead;
  }
  document.addEventListener('click',event=>{const pick=event.target.closest?.('[data-open-product]');if(!pick)return;event.preventDefault();if(typeof openProduct==='function')openProduct(pick.dataset.openProduct)});
  if(typeof window.renderAdvice==='function'){const original=window.renderAdvice;window.renderAdvice=function(){original();renderActiveVerdict()}}

  window.addEventListener('bw:comparison',event=>renderActiveVerdict(event.detail));
  setupSkinOnboarding();
  setupProfileWizard();
  setupQuickFeedback();
  renderActiveVerdict();
})();
