(function(){
  'use strict';
  const faDigits='۰۱۲۳۴۵۶۷۸۹';
  const toLatin=value=>String(value??'').replace(/[۰-۹]/g,c=>String(faDigits.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
  const toFa=value=>String(value??'').replace(/\d/g,d=>faDigits[Number(d)]);
  const parts=(date,calendar='persian')=>{
    const formatter=new Intl.DateTimeFormat('en-US-u-ca-'+calendar+'-nu-latn',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'});
    const result={};for(const part of formatter.formatToParts(date))if(part.type!=='literal')result[part.type]=part.value;
    return result;
  };
  const canonical=value=>{
    const clean=toLatin(value).trim().replace(/[.\\-]/g,'/').replace(/\s+/g,'');
    const match=clean.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);if(!match)return '';
    const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
    if(year<1200||year>1600||month<1||month>12||day<1||day>(month<=6?31:month<=11?30:30))return '';
    return String(year).padStart(4,'0')+'/'+String(month).padStart(2,'0')+'/'+String(day).padStart(2,'0');
  };
  const today=()=>{const p=parts(new Date());return p.year+'/'+p.month+'/'+p.day};
  const gregorianToday=()=>{const p=parts(new Date(),'gregory');return p.year+'-'+p.month+'-'+p.day};
  const fromStored=value=>{
    if(!value)return '';
    const normalized=canonical(value);if(normalized)return toFa(normalized);
    const raw=toLatin(value);const date=/^\d{4}-\d{2}-\d{2}$/.test(raw)?new Date(raw+'T12:00:00Z'):new Date(raw);
    if(Number.isNaN(date.getTime()))return String(value);
    const p=parts(date);return toFa(p.year+'/'+p.month+'/'+p.day);
  };
  const format=(value,withTime=false)=>{
    if(!value)return 'بدون تاریخ';
    const normalized=canonical(value);if(normalized)return toFa(normalized);
    const date=new Date(value);if(Number.isNaN(date.getTime()))return toFa(value);
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn',{timeZone:'Asia/Tehran',year:'numeric',month:'long',day:'numeric',...(withTime?{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}:{})}).format(date).replace(/\d/g,d=>faDigits[Number(d)]);
  };
  const time=()=>new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date()).replace(/\d/g,d=>faDigits[Number(d)]);
  const prepare=input=>{
    if(!input||input.dataset.jalaliReady==='yes')return;
    input.dataset.jalaliReady='yes';input.type='text';input.inputMode='numeric';input.autocomplete='off';input.dir='ltr';input.placeholder=input.placeholder||'۱۴۰۵/۰۶/۲۹';input.classList.add('jalali-input');
    if(input.value)input.value=fromStored(input.value);
    input.addEventListener('focus',()=>input.setCustomValidity(''));
    input.addEventListener('blur',()=>{if(!input.value.trim()){input.setCustomValidity('');return}const value=canonical(input.value);if(!value){input.setCustomValidity('تاریخ را به شکل ۱۴۰۵/۰۶/۲۹ وارد کن.');input.reportValidity();return}input.setCustomValidity('');input.value=toFa(value)});
  };
  const prepareAll=root=>(root||document).querySelectorAll('[data-jalali-date]').forEach(prepare);
  window.BWDate={canonical,today:()=>toFa(today()),todayStored:today,gregorianToday,fromStored,format,time,prepare,prepareAll,toFa,toLatin};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>prepareAll(document));else prepareAll(document);
})();
