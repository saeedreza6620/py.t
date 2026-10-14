/* Progressive purchase UX. Keeps existing data keys, APIs, catalog and recovery. No billing. */
(function () {
  'use strict';
  const by = id => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  const read = (key, fallback) => readJSON(key, fallback);
  let busy = false, lastRequest = '', product = null;
  function init() {
    if(by('pfMiniProfile'))return;
    document.documentElement.classList.add('purchase-first');
    const check = by('check').querySelector('.section');
    const routine = el('section', 'panel'); routine.id = 'routine';
    const routineBody = el('div', 'section'); routine.append(routineBody);
    routineBody.innerHTML = '<div class="section-head"><div><h2>روتین من</h2></div></div>';
    const products = el('section', 'panel'); products.id = 'products';
    by('check').after(routine, products);
    const catalog = by('catalogStart'); catalog.open = true; products.append(catalog); catalog.querySelector('summary').hidden = true;
    const compare = by('selectedProducts').closest('.soft-card');
    routineBody.append(by('checkCatalogDetails'), compare);
    Array.from(check.children).filter(n => n.classList.contains('soft-card') && n.querySelector('#routineAdvice')).forEach(n => routineBody.append(n));
    by('decisionSummary').dataset.serverResult = 'true';
    by('decisionSummary').hidden = true;
    const assistant = by('assistantHub');const assistantPanel=el('section','panel');assistantPanel.id='assistant';const assistantBody=el('div','section');assistantPanel.append(assistantBody);products.after(assistantPanel);assistantBody.append(assistant);assistant.open=true;
    by('assistantTitle').textContent = 'دستیار BeautyWallet';
    document.querySelectorAll('.forum-link').forEach(n => n.hidden = true);
    document.querySelectorAll('#decisionHelp button[onclick*="supplements"]').forEach(n => n.hidden = true);
    document.querySelectorAll('.hub-link[onclick*="supplements"]').forEach(n => n.hidden = true);
    by('forum').querySelector('h2').textContent = 'تجربه‌های این محصول';
    by('forum').querySelector('.section-head small').textContent = 'نظر مثبت و منفی، همراه با مدت استفاده';
    const budgetMount = check.querySelector('[data-budget-mount]');
    if (budgetMount) by('wallet').querySelector('.section').append(budgetMount);
    const profileGuide = el('button', 'source-link', 'اطلاعاتم را در ۳۰ ثانیه وارد کنم'); profileGuide.type = 'button';
    profileGuide.onclick = () => { switchTab('profile'); by('pfMiniProfile').scrollIntoView({block:'start'}); };
    routineBody.prepend(profileGuide);
    setupProfile(); setupWallet(); setupResult(); setupProductExperience();
    by('pfStartProfile').onclick=()=>{switchTab('profile');by('pfMiniProfile').scrollIntoView({block:'start',behavior:'smooth'});by('pfProfileForm').elements.skin.focus({preventScroll:true});};
    const supplements=el('section','soft-card pf-supplements');supplements.id='pfSupplements';
    supplements.innerHTML='<div class="section-head"><div><h2>مکمل‌ها و آموزش مصرف</h2></div></div><button type="button" class="source-link" id="pfOpenSupplements">بررسی مکمل‌ها و برنامه مصرف من</button><details id="pfSupplementGuide"><summary>آموزش زمان مصرف و تداخل‌ها</summary></details>';
    supplements.querySelector('details').append(by('supplementLearning'));by('supplements').querySelector('.section').prepend(supplements);
    by('pfOpenSupplements').onclick=()=>switchTab('supplements');
    window.bwOpenSupplementGuide=()=>{switchTab('supplements');by('pfSupplementGuide').open=true;supplements.scrollIntoView({block:'start',behavior:'smooth'});};
    const walletProfile = by('wallet').querySelector('.hub-link'); if(walletProfile) walletProfile.querySelector('small').textContent = 'اطلاعات کوتاه، ذخیره آنلاین و بازیابی';
    const homeInstall = by('installHomeButton'); if (homeInstall) by('wallet').querySelector('.section').append(homeInstall);
    // Secondary paths remain accessible, and their records are not removed.
    const more = el('details', 'pf-secondary'); more.innerHTML = '<summary>امکانات قبلی و پیگیری‌ها</summary><p>اطلاعات قبلی‌ات حفظ شده‌اند</p><button type="button" class="source-link" data-open="track">پیگیری و یادآور</button> <button type="button" class="source-link" data-open="supplements">مکمل‌های ثبت‌شده</button>';
    more.querySelectorAll('button').forEach(b => b.onclick = () => switchTab(b.dataset.open)); by('wallet').querySelector('.section').append(more);
    window.addEventListener('bw:tab', e => { if (e.detail === 'wallet') loadDecisions(); });
    switchTab(location.hash==='#assistant'?'assistant':'check');
    window.bwReady=true; if(by('appLoading'))by('appLoading').hidden=true;
  }
  function setupProfile() {
    const p = read('bw_profile_v1_full', {});
    const section = by('profile').querySelector('.section');
    const wrap = el('div', 'soft-card pf-mini'); wrap.id = 'pfMiniProfile';
    wrap.innerHTML = '<h2>اطلاعات من</h2><form id="pfProfileForm"><label>نوع پوست<select name="skin"><option value="">نمی‌دانم</option><option>چرب</option><option>خشک</option><option>مختلط</option><option>نرمال</option></select></label><label>هدف اصلی<select name="goal"><option value="">فعلاً مشخص نیست</option><option>مراقبت ساده روزانه</option><option>کمک به خشکی</option><option>بررسی محصول برای پوست مستعد جوش</option><option>یکدست‌تر شدن ظاهر پوست</option><option>محافظت در برابر آفتاب</option></select></label><label>سقف هر خرید، تومان (اختیاری)<input name="budget" type="number" inputmode="numeric" min="0" max="1000000000" placeholder="مثلاً ۵۰۰۰۰۰"></label><label class="pf-cloud-consent"><input type="checkbox" name="cloud"> با ثبت پروفایل برای بررسی شخصی‌سازی‌شده موافقم</label><button class="pf-profile-cta" type="submit">ذخیره اطلاعات و ادامه بررسی</button><button type="button" class="source-link" id="pfContinueCheck" hidden>ادامه بررسی محصول</button><p id="pfProfileStatus" role="status"></p></form><button type="button" class="bw-privacy-link" data-bw-privacy>حریم خصوصی</button>';
    const form = wrap.querySelector('form'); form.elements.skin.value = p.skinBase || ''; form.elements.goal.value = p.primaryGoal || ''; form.elements.budget.value = p.productBudget || ''; form.elements.cloud.checked=p.cloudConsent===true;
    byContinue();
    function byContinue(){wrap.querySelector('#pfContinueCheck').onclick=()=>{switchTab('check');by('decisionProduct').focus({preventScroll:true});};}
    form.onsubmit=async e=>{
      e.preventDefault();const button=form.querySelector('[type="submit"]');button.disabled=true;
      const prev=read('bw_profile_v1_full',{}),cloud=form.elements.cloud.checked;
      const next={...prev,skinBase:form.elements.skin.value,primaryGoal:form.elements.goal.value,goal1:form.elements.goal.value||prev.goal1||'',productBudget:form.elements.budget.value,serviceConsent:true,cloudConsent:cloud,updatedAt:new Date().toISOString()};
      storage.setItem('bw_profile_v1_full',JSON.stringify(next));state.profile.skin=next.skinBase;storage.setItem('bw_profile',JSON.stringify(state.profile));
      const full=by('profile-form');for(const key of ['skinBase','productBudget','goal1'])if(full.elements[key])full.elements[key].value=next[key];
      full.elements.cloudConsent.checked=cloud;if(full.elements.serviceConsent)full.elements.serviceConsent.checked=true;
      window.dispatchEvent(new Event('bw:budget-change'));by('pfContinueCheck').hidden=false;
      if(!cloud){by('pfProfileStatus').textContent='روی این دستگاه ذخیره شد؛ ثبت آنلاین فعال نیست';button.disabled=false;return;}
      by('pfProfileStatus').textContent='در حال ثبت آنلاین اطلاعات…';
      try{const saved=await window.bwCloudSave();by('pfProfileStatus').textContent=saved?'آنلاین ثبت شد؛ اگر کد بازیابی نمایش داده شد، آن را نگه دار و بررسی را ادامه بده':'روی دستگاه ذخیره شد؛ ثبت آنلاین انجام نشد، دوباره تلاش کن';}
      catch{by('pfProfileStatus').textContent='ثبت آنلاین انجام نشد؛ اطلاعات روی این دستگاه باقی است';}
      finally{button.disabled=false;}
    };
    section.prepend(wrap);
    const detailedSection = by('profile-form').closest('.section');
    const details = el('details', 'pf-deep-profile'); details.innerHTML = '<summary>پروفایل کامل و ثبت آنلاین (اختیاری)</summary>'; detailedSection.before(details); details.append(detailedSection);
    const privacy=by('accountPrivacy'); const clarify=()=>{if(!privacy.querySelector('[data-pf-privacy]')){const note=el('span','',' گفتگوهای دستیار جداگانه روی سرور نگهداری می‌شوند؛ ارسال متن برای پاسخ‌گویی با ذخیره روی دستگاه متفاوت است.');note.dataset.pfPrivacy='yes';privacy.append(note)}};new MutationObserver(clarify).observe(privacy,{childList:true});clarify();
  }
  function setupWallet() {
    const section = by('wallet').querySelector('.section');
    const account = el('details', 'soft-card pf-account'); account.innerHTML = '<summary>حساب و مصرف</summary><p>بررسی‌ها در این نسخه رایگان‌اند؛ هزینه یا بدهی ثبت نمی‌شود</p><button type="button" class="source-link">ذخیره و بازیابی اطلاعات من</button>';account.querySelector('button').onclick=()=>switchTab('profile');section.append(account);
    const decisions=el('details','soft-card pf-history');decisions.innerHTML='<summary>بررسی‌های قبلی من</summary><div id="pfHistory"><p>برای دیدن سابقه، این بخش را باز کن</p></div>';decisions.addEventListener('toggle',()=>{if(decisions.open)loadDecisions()});section.append(decisions);
  }
  async function loadDecisions(){
    const box=by('pfHistory');if(!box)return;
    try{const r=await fetch('/api/assistant',{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();box.replaceChildren();const messages=(data.messages||[]).filter(m=>m.role==='assistant');if(!messages.length){box.append(el('p','','هنوز بررسی ذخیره‌شده‌ای در این مرورگر پیدا نشد؛ برای دستگاه دیگر از کد بازیابی استفاده کن'));return}messages.slice(-6).reverse().forEach(m=>{const d=el('details','pf-past');d.append(el('summary','',String(m.content||'').split('\n')[0].slice(0,150)),el('p','pf-answer',(window.bwCleanAnswer?.(m.content)||'').split('\n').filter(Boolean).slice(0,2).join('\n')));box.append(d)})}catch{box.textContent='سابقه فعلاً در دسترس نیست؛ دوباره این بخش را باز کن'}
  }
  function setupResult(){
    const result=by('decisionSummary');
    const personal=el('details','soft-card pf-personal'); personal.id='pfPersonal';personal.hidden=true;
    personal.innerHTML='<summary>با دو سؤال دقیق‌ترش کنم؟</summary><form id="pfPersonalForm"><label>نوع پوست<select name="skin"><option value="">نمی‌دانم</option><option>چرب</option><option>خشک</option><option>مختلط</option><option>نرمال</option></select></label><label>حساسیت شناخته‌شده یا واکنش به محصول (اختیاری)<input name="sensitivity" maxlength="180" placeholder="اگر نمی‌دانی، خالی بگذار"></label><label class="pf-consent"><input type="checkbox" name="consent" required> موافقم این پاسخ‌ها برای شخصی‌سازی به سرور و سرویس هوش مصنوعی ارسال و در سابقه خصوصی بررسی ذخیره شوند</label><button class="primary" type="submit">پاسخم را دقیق‌تر کن</button></form>';
    result.after(personal);
    const input=by('decisionProduct'); input.required=true;
    by('decisionEntry').addEventListener('submit',e=>{e.preventDefault();const raw=input.value.trim();if(!raw||busy)return;lastRequest=raw;product=PRODUCTS.find(p=>norm(p.name)===norm(raw)||norm(p.en)===norm(raw))||null;run(raw,false)});
    by('pfPersonalForm').onsubmit=e=>{e.preventDefault();if(!busy&&lastRequest)run(lastRequest,true)};
    by('assistantHub').querySelector('.assistant-layers').hidden=true;
  }
  function renderText(text, container){
    // Model output remains text; only HTTPS links are clickable.
    const rx=/\[([^\]]+)\]\((https:\/\/[^\s<>]+)\)|(https:\/\/[^\s<>()[\]{}]+)/g;let at=0,m;while((m=rx.exec(text))){container.append(document.createTextNode(text.slice(at,m.index)));const href=(m[2]||m[3]).replace(/[.،؛]+$/,'');let label=m[1]||'منبع';try{const host=new URL(href).hostname;if(host.includes('khanoumi.com'))label='خانومی';else if(host.includes('digikala.com'))label='دیجی‌کالا';}catch{}const a=el('a','',label);a.href=href;a.rel='noopener noreferrer nofollow';a.target='_blank';container.append(a);at=m.index+m[0].length}container.append(document.createTextNode(text.slice(at)));
  }
  async function run(raw,personalize){
    const result=by('decisionSummary');busy=true;result.hidden=false;result.setAttribute('aria-busy','true');result.replaceChildren(el('b','','دارم محصول را بررسی می‌کنم…'),el('p','','مشخصات محصول و اطلاعات ثبت‌شده‌ات را کنار هم بررسی می‌کنم'));
    const buttons=[by('decisionEntry').querySelector('[type=submit]'),by('pfPersonalForm').querySelector('[type=submit]')];buttons.forEach(b=>b.disabled=true);
    if(personalize){const f=by('pfPersonalForm'),p=read('bw_profile_v1_full',{});if(f.elements.skin.value)p.skinBase=f.elements.skin.value;if(f.elements.sensitivity.value)p.sensitivity=f.elements.sensitivity.value;p.updatedAt=new Date().toISOString();storage.setItem('bw_profile_v1_full',JSON.stringify(p));}
    let context='';
    {const f=by('pfPersonalForm');const p=read('bw_profile_v1_full',{});context='\nاطلاعات اعلام‌شده کاربر برای همین بررسی: '+JSON.stringify({skin:(personalize?f.elements.skin.value:'')||p.skinBase||state.profile.skin||'نامعلوم',sensitivity:(personalize?f.elements.sensitivity.value:'')||p.sensitivity||'نامعلوم',goal:p.goal1||p.primaryGoal||'',budget:p.productBudget??'',owned:state.wallet.map(id=>PRODUCTS.find(p=>p.id===id)?.name).filter(Boolean),routine:p.routine||[],routineCompleteness:'ثبت‌نشدن محصول به معنی نداشتن آن نیست'});}
    const message='بررسی محصول پیش از خرید، سازگاری و تداخل اکتیوها با روتین: '+raw+context+'\nپاسخ کوتاه با حداکثر سه دلیل بده. اگر هویت، ترکیبات یا اطلاعات شخصی کافی نیست، تأیید شخصی نده و فقط سؤال لازم را بپرس. قیمت و اصالت را حدس نزن. نام و نسخه دقیق را از لینک پیدا کن و مشخصات را در منابع معتبر دیگر هم بررسی کن؛ سپس لینک مستقیم همان نسخه در خانومی و دیجی‌کالا را پیدا کن. خرید را فقط در صورت تناسب تأیید کن.';
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),80000);
    try{const r=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({message,productId:product?.id,productName:product?.name||(!/^https?:/i.test(raw)?raw:''),purchaseCheck:true,reviewContext:window.bwReviewContext?.()})});const data=await r.json();if(!r.ok||!data.answer)throw Error(data.error||'بررسی آنلاین انجام نشد');result.replaceChildren();const label=el('b','pf-result-label',({buy:'✓ مناسب بر اساس اطلاعات موجود',avoid:'! پیشنهاد نمی‌شود',wait:'◷ فعلاً صبر کن',need_info:'؟ ادامه بررسی شخصی',caution:'! با احتیاط'})[data.decision?.label]||'بررسی اولیه');result.append(label);if(data.personalLead)result.append(el('p','pf-personal-reason',data.personalLead));const text=el('div','pf-answer');window.bwRenderAnswer(text,data.answer,data.assistantMessageId);result.append(text);
      const why=el('details','pf-why');why.append(el('summary','','چرا این نتیجه را گرفتم؟'));const missing=Array.isArray(data.trust?.missing)?data.trust.missing:[];why.append(el('p','',missing.length?'قدم بعدی بررسی: '+missing.join('؛ '):'دلایل بالا بر اساس اطلاعات موجود در زمان این بررسی‌اند؛ نبود هشدار به معنی تضمین ایمنی نیست'));result.append(why);
      const foundLinks=Array.isArray(data.purchaseLinks)?data.purchaseLinks:[];if(foundLinks.length){const shopBox=el('div','pf-feedback');shopBox.append(el('b','','صفحه‌های محصول برای مقایسه'));foundLinks.forEach(link=>{try{const u=new URL(link.url);if(u.protocol!=='https:')return;const a=el('a','source-link',link.seller);a.href=u.href;a.target='_blank';a.rel='noopener noreferrer nofollow';shopBox.append(a);}catch{}});if(data.decision?.label!=='buy')shopBox.append(el('small','','این لینک‌ها تأیید خرید نیستند'));result.append(shopBox);}
      const costNote=el('details','pf-why');costNote.append(el('summary','','قیمت و هزینه ارسال'),el('p','pf-cost','قیمت نهایی و هزینه ارسال هنوز در این بررسی تأیید نشده؛ در فروشگاه بررسی کن'));result.append(costNote);
      if(data.assistantMessageId){const feedback=el('div','pf-feedback');feedback.append(el('span','','این پاسخ به کارت آمد؟'));[['helpful','بله'],['not_helpful','نه / گزارش خطا']].forEach(([rating,title])=>{const b=el('button','source-link',title);b.type='button';b.onclick=async()=>{b.disabled=true;try{const r=await fetch('/api/assistant/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assistantMessageId:data.assistantMessageId,rating})});if(!r.ok)throw Error();b.textContent='ثبت شد'}catch{b.disabled=false;b.textContent='دوباره ثبت کن'}};feedback.append(b)});result.append(feedback)}
      const continueReview=el('button','source-link','ادامه بررسی با دستیار');continueReview.type='button';continueReview.onclick=()=>{switchTab('assistant');by('assistantHub').open=true;by('assistantInput').value='بررسی را ادامه بده: '+raw+context+'\nاطلاعات موجود را دوباره نپرس؛ فقط مورد ضروریِ کم‌شده را مشخص کن. مقایسه با توست، نه من.';by('assistantHub').scrollIntoView({block:'start',behavior:'smooth'});by('assistantInput').focus();};result.append(continueReview);
      by('pfPersonal').hidden=data.processing?.intent==='medical';
      if(data.processing?.intent==='medical'||!['buy','caution'].includes(data.decision?.label))return;
      const market=el('button','source-link','اگر خرید لازم است، قیمت و محل خرید را بررسی کن');market.type='button';market.onclick=()=>{switchTab('assistant');by('assistantHub').open=true;by('assistantInput').value='با توجه به بررسی قبلی محصول '+raw+'، فقط اگر خرید لازم و اطلاعات کافی است، قیمت نهایی و محل خرید همان نسخه را با منبع و تاریخ بررسی پیدا کن. تأیید اصالت را بدون مدرک نده.';by('assistantHub').scrollIntoView({block:'start',behavior:'smooth'});by('assistantInput').focus()};result.append(market);
    }catch(error){result.replaceChildren(el('b','','بررسی کامل نشد'),el('p','',error.name==='AbortError'?'بررسی طول کشید؛ نتیجه صادر نشد':error.message||'بررسی آنلاین انجام نشد؛ نتیجه صادر نشده'));}
    finally{clearTimeout(timeout);busy=false;buttons.forEach(b=>b.disabled=false);result.removeAttribute('aria-busy')}
  }
  function setupProductExperience(){
    const sheet=by('sheetContent');
    new MutationObserver(()=>{if(!sheet.children.length||sheet.querySelector('[data-pf-product]'))return;const add=sheet.querySelector('.add-wallet');const id=add?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];const p=PRODUCTS.find(x=>x.id===id);if(!p)return;const group=el('div','pf-product-actions');group.dataset.pfProduct='yes';const review=el('button','primary','این محصول را بررسی کن');review.type='button';review.onclick=()=>{by('sheetBack').classList.remove('open');if(typeof closeSheet==='function')closeSheet();switchTab('check');by('decisionProduct').value=p.name;by('decisionEntry').requestSubmit()};const experience=el('button','source-link','تجربه کاربران این محصول');experience.type='button';experience.onclick=()=>{window.BWExperienceProduct=p;by('forumForm').elements.productName.value=p.name;if(typeof closeSheet==='function')closeSheet();switchTab('forum')};group.append(review,experience);sheet.append(group)}).observe(sheet,{childList:true,subtree:true});
  }
  function boot(){try{init()}catch(error){window.bwReady=false;const node=by('appLoading');if(node){node.hidden=false;node.firstElementChild.textContent='آماده‌سازی کامل نشد؛ دوباره تلاش کن';node.querySelector('button').hidden=false;}console.error('BeautyWallet UI initialization failed',error instanceof Error?error.name:'Error')}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
