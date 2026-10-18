(function(){
  'use strict';
  const buttons=[document.getElementById('installAppButton'),document.getElementById('installHomeButton')].filter(Boolean);
  const dialog=document.getElementById('installDialog');
  const intro=document.getElementById('installGuideIntro');
  const steps=document.getElementById('installGuideSteps');
  const copy=document.getElementById('copyInstallLink');
  if(!buttons.length||!dialog||!steps)return;
  const standalone=()=>['standalone','minimal-ui','fullscreen','window-controls-overlay'].some(mode=>window.matchMedia('(display-mode: '+mode+')').matches)||window.navigator.standalone===true;
  const platform=(/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))?'ios':/android/i.test(navigator.userAgent)?'android':'other';
  let deferredPrompt=null;
  function setInstalled(){buttons.forEach(button=>button.hidden=true)}
  function setButtonLabels(){
    const label=platform==='ios'?'افزودن به صفحهٔ اصلی آیفون':platform==='android'?'نصب BeautyWallet روی اندروید':'افزودن به صفحهٔ اصلی';
    buttons.forEach(button=>{if(button.id==='installHomeButton')button.lastChild.textContent=label;else button.textContent=label});
  }
  function openGuide(){
    const ios=platform==='ios';
    const safari=/safari/i.test(navigator.userAgent)&&!/crios|fxios|edgios/i.test(navigator.userAgent);
    intro.textContent=ios?'در آیفون، افزودن از منوی اشتراک‌گذاری Safari انجام می‌شود. اگر «Open in Safari» می‌بینی، اول آن را بزن.':'مرورگر فعلاً پنجرهٔ نصب مستقیم را نشان نداد؛ از منوی مرورگر ادامه بده.';
    steps.replaceChildren();
    const items=ios?['اگر داخل برنامه‌ای مثل پیام‌رسان هستی، اشتراک‌گذاری را باز کن و «Open in Safari» را بزن. اگر این گزینه نیست، لینک را کپی و در Safari باز کن.','وقتی صفحهٔ BeautyWallet در Safari باز شد، دکمهٔ اشتراک‌گذاری Safari را بزن.','«Add to Home Screen» را انتخاب کن؛ اگر نبود، پایین منو «Edit Actions» را بزن و آن را اضافه کن.','نام BeautyWallet را تأیید و «Add» را بزن.']:platform==='android'?['در Chrome، سه‌نقطهٔ بالای صفحه را بزن.','«Install app» یا «افزودن به صفحهٔ اصلی» را بزن.','افزودن را در پنجرهٔ گوشی تأیید کن.']:['از منوی مرورگر «Install app» یا «افزودن به صفحهٔ اصلی» را انتخاب کن.','در پنجرهٔ مرورگر تأیید کن.'];
    items.forEach(item=>{const li=document.createElement('li');li.textContent=item;steps.append(li)});
    if(copy)copy.hidden=!(ios&&!safari);
    if(dialog.open)return;
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  }
  async function reportInstall(){
    try{
      const key='bw_install_receipt_v1';
      let receipt=localStorage.getItem(key);
      if(!receipt){receipt=crypto.randomUUID();localStorage.setItem(key,receipt)}
      if(localStorage.getItem('bw_install_reported_v1')==='1')return;
      const response=await fetch('/api/install',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({receipt,platform})});
      if(response.ok)localStorage.setItem('bw_install_reported_v1','1');
    }catch{/* Installation still works if anonymous counting is unavailable. */}
  }
  if(standalone()){setInstalled();reportInstall()}
  else buttons.forEach(button=>button.hidden=false);
  setButtonLabels();
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;buttons.forEach(button=>button.hidden=false);setButtonLabels()});
  buttons.forEach(button=>button.addEventListener('click',async()=>{
    if(standalone()){setInstalled();return}
    if(!deferredPrompt){openGuide();return}
    const prompt=deferredPrompt;deferredPrompt=null;
    try{await prompt.prompt();const choice=await prompt.userChoice;if(choice?.outcome==='accepted')buttons.forEach(item=>item.disabled=true);else{buttons.forEach(item=>item.disabled=false);setButtonLabels()}}
    catch{buttons.forEach(item=>item.disabled=false);setButtonLabels();openGuide()}
  }));
  window.addEventListener('appinstalled',()=>{setInstalled();reportInstall();if(typeof toast==='function')toast('BeautyWallet به صفحهٔ اصلی اضافه شد')});
  copy?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.origin+'/legacy/?v=83');copy.textContent='لینک کپی شد؛ در Safari باز کن'}catch{copy.textContent='آدرس سایت را از بالای مرورگر کپی کن'}});
  document.getElementById('closeInstallDialog')?.addEventListener('click',()=>{if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open')});
  dialog.addEventListener('click',event=>{if(event.target===dialog){if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open')}});
})();
