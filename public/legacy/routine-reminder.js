(()=>{
  const $=id=>document.getElementById(id),status=$('reminderStatus');
  if(!status)return;
  const zone='Asia/Tehran';let enabled=false;
  const clock=()=>new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
  const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const setStatus=text=>{status.textContent=text};
  function reminderText(which){
    const period=which==='am'?'صبح':'شب';
    try{
      const ids=JSON.parse(localStorage.getItem('bw_check_products')||'[]');
      const times=JSON.parse(localStorage.getItem('bw_check_times')||'{}');
      if(Array.isArray(ids)&&typeof PRODUCTS!=='undefined'){
        const names=ids.map(id=>PRODUCTS.find(product=>product.id===id)).filter(product=>product&&((times[product.id]|| (product.cat==='ضد آفتاب'?'am':'pm'))===which)).map(product=>product.name);
        if(names.length)return `روتین ${period}: ${names.slice(0,2).join('، ')}${names.length>2?` و ${names.length-2} محصول دیگر`:''}`;
      }
    }catch{/* Missing or invalid device cache leaves the generic reminder available. */}
    return `روتین ${period} خودت را انجام بده.`;
  }
  async function load(){
    try{const response=await fetch('/api/reminders',{credentials:'same-origin'});if(!response.ok)return;
      const data=await response.json();if(data.settings){enabled=!!data.settings.enabled;$('reminderEnabled').checked=enabled;$('reminderMorning').value=data.settings.morning_time;$('reminderEvening').value=data.settings.evening_time;}
      renderReviews(data.reviews||[]);
    }catch{setStatus('یادآورها در دسترس نیستند؛ سایر بخش‌ها قابل استفاده‌اند.');}
  }
  function renderReviews(rows){$('reviewHistory').replaceChildren(...rows.slice(0,10).map(row=>{
    const el=document.createElement('div');el.textContent=`روز ${row.day} · ${row.status} · ${row.note||'بدون یادداشت'}`;return el;
  }));}
  $('saveReminder').addEventListener('click',async()=>{
    const next=$('reminderEnabled').checked;
    try{const response=await fetch('/api/reminders',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:next,morningTime:$('reminderMorning').value,eveningTime:$('reminderEvening').value})});
      if(!response.ok)throw Error();enabled=next;
      if(enabled&&'Notification' in window&&Notification.permission==='default')await Notification.requestPermission();
      setStatus(enabled?'ذخیره شد. اعلان مرورگر فقط هنگام بازبودن سایت و با اجازه اعلان کار می‌کند؛ تقویم گوشی برای زمان بسته‌بودن مناسب است.':'یادآور خاموش شد.');
    }catch{setStatus('ذخیره نشد؛ دوباره تلاش کن.');}
  });
  $('saveReview').addEventListener('click',async()=>{
    try{const response=await fetch('/api/reminders',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({day:Number($('reviewDay').value),status:$('reviewStatus').value,note:$('reviewNote').value.trim()})});
      if(!response.ok)throw Error();$('reviewNote').value='';setStatus('بازخورد در حساب تو ذخیره شد.');await load();
    }catch{setStatus('بازخورد ذخیره نشد؛ دوباره تلاش کن.');}
  });
  $('calendarReminder').addEventListener('click',()=>{
    const date=day().replace(/-/g,''),stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const event=(label,time,suffix)=>`BEGIN:VEVENT\r\nUID:bw-${suffix}-${date}@beautywallet\r\nDTSTAMP:${stamp}\r\nDTSTART;TZID=Asia/Tehran:${date}T${time.replace(':','')}00\r\nRRULE:FREQ=DAILY\r\nSUMMARY:${label}\r\nDESCRIPTION:${reminderText(suffix).replace(/[,;\\]/g,'\\$&')}\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:${label}\r\nTRIGGER:-PT0M\r\nEND:VALARM\r\nEND:VEVENT\r\n`;
    const content=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//BeautyWallet//Routine//FA\r\nCALSCALE:GREGORIAN\r\n${event('روتین صبح BeautyWallet',$('reminderMorning').value,'am')}${event('روتین شب BeautyWallet',$('reminderEvening').value,'pm')}END:VCALENDAR\r\n`;
    const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='BeautyWallet-routine.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    setStatus('فایل تقویم آماده شد. آن را در تقویم گوشی وارد کن تا اعلانِ زمان بسته‌بودن سایت هم وابسته به تنظیمات تقویم خودت باشد.');
  });
  function notify(){if(!enabled||!('Notification' in window)||Notification.permission!=='granted')return;
    const current=clock(),which=current===$('reminderMorning').value?'am':current===$('reminderEvening').value?'pm':'';if(!which)return;
    const key=`bw-reminder-${day()}-${which}`;if(localStorage.getItem(key))return;localStorage.setItem(key,'1');
    const body=reminderText(which);
    if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(reg=>reg.showNotification('وقت روتین BeautyWallet',{body})).catch(()=>setStatus(body));
    else try{new Notification('وقت روتین BeautyWallet',{body})}catch{setStatus(body)}
  }
  load();setInterval(notify,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)notify()});
})();
