(function(){
  'use strict';
  const verdict=document.getElementById('activeVerdict');
  const help=document.getElementById('decisionHelp');
  const copy=document.getElementById('decisionHelpText');
  const nudge=document.getElementById('decisionHelpNudge');
  if(!verdict||!help||!copy||!nudge)return;
  function refreshHelp(){
    const result=verdict.textContent||'';
    const uncertain=/نامطمئن|ترکیبات دقیق|نسخه|اطلاعات کافی|مطمئن نیست/.test(result);
    const safety=/باردار|شیرده|حساس|سوزش|اکتیو|عقب بینداز|استفاده نکن/.test(result);
    const duplicate=/مشابه|در کیف تو هست/.test(result);
    if(uncertain)copy.textContent='ترکیبات یا نسخهٔ دقیق محصول را از روی بسته بررسی کن. تا آن زمان، نبودِ هشدار یعنی بی‌خطر بودن محصول نیست.';
    else if(safety)copy.textContent='وقتی پوست تحریک است یا اکتیوهای قوی کنار هم قرار می‌گیرند، محصول تازه را فعلاً وارد روتین نکن. برای واکنش شدید از متخصص کمک بگیر.';
    else if(duplicate)copy.textContent='اگر محصولی با کارکرد مشابه داری، پیش از خرید تازه نتیجهٔ همان را ببین و هزینهٔ نهایی را با بودجه‌ات بسنج.';
    else if(result.trim())copy.textContent='نتیجه بر اساس محصولاتی است که اینجا انتخاب کرده‌ای. برای تصمیم دقیق‌تر، پوست و محصولات موجودت را در کیف ثبت کن؛ قیمت و موجودی را در فروشگاه دوباره ببین.';
    else copy.textContent='ابتدا محصول را انتخاب کن؛ بعد دلیل نتیجه را همین‌جا به زبان ساده می‌بینی.';
    nudge.hidden=!(uncertain||safety);
    nudge.textContent=uncertain?'برای نسخه یا ترکیبات نامشخص، راهنمای صورتی را باز کن.':'برای این هشدار ایمنی، راهنمای صورتی را باز کن.';
  }
  new MutationObserver(refreshHelp).observe(verdict,{childList:true,subtree:true,characterData:true});
  refreshHelp();
})();
