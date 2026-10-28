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
  // Settings and day-7/14/21 notes live on this device (the lite server has no account store; nothing about skin is sent).
  const SET='bw_reminder_v1',REV='bw_reviews_v1';
  const readJ=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??d}catch{return d}};
  const writeJ=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
  async function load(){
    const st=readJ(SET,{});if(st&&typeof st==='object'){enabled=!!st.enabled;$('reminderEnabled').checked=enabled;if(/^\d\d:\d\d$/.test(st.morning||''))$('reminderMorning').value=st.morning;if(/^\d\d:\d\d$/.test(st.evening||''))$('reminderEvening').value=st.evening;}
    const rows=readJ(REV,[]);renderReviews(Array.isArray(rows)?rows.slice().reverse():[]);
  }
  function renderReviews(rows){$('reviewHistory').replaceChildren(...rows.slice(0,10).map(row=>{
    const el=document.createElement('div');el.textContent=`روز ${String(row.day).replace(/\d/g,x=>"۰۱۲۳۴۵۶۷۸۹"[x])} · ${row.status} · ${row.note||'بدون یادداشت'}${row.date&&window.BWDate?' · '+BWDate.format(row.date):''}`;return el;
  }));}
  $('saveReminder').addEventListener('click',async()=>{
    const next=$('reminderEnabled').checked;
    if(!writeJ(SET,{enabled:next,morning:$('reminderMorning').value,evening:$('reminderEvening').value}))return setStatus('ذخیره نشد؛ فضای مرورگر در دسترس نیست.');
    enabled=next;
    try{if(enabled&&'Notification' in window&&Notification.permission==='default')await Notification.requestPermission();}catch{}
    setStatus(enabled?'ذخیره شد. اعلان مرورگر فقط وقتی اپ باز است و با اجازه‌ی تو کار می‌کند؛ برای یادآوری وقتی اپ بسته است «افزودن به تقویم گوشی» را بزن.':'یادآور خاموش شد.');
  });
  $('saveReview').addEventListener('click',()=>{
    const rows=readJ(REV,[]),list=Array.isArray(rows)?rows:[];
    list.push({day:Number($('reviewDay').value),status:$('reviewStatus').value,note:$('reviewNote').value.trim().slice(0,300),date:new Date().toISOString()});
    if(!writeJ(REV,list.slice(-60)))return setStatus('بازخورد ذخیره نشد؛ فضای مرورگر در دسترس نیست.');
    $('reviewNote').value='';setStatus('بازخورد روی همین گوشی ذخیره شد ✓');load();
  });
  $('calendarReminder').addEventListener('click',async()=>{
    let photos=[];try{photos=window.BWSkinJournal?await BWSkinJournal.upcoming():[]}catch{}
    const date=day().replace(/-/g,''),stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const event=(label,time,suffix)=>`BEGIN:VEVENT\r\nUID:bw-${suffix}-${date}@beautywallet\r\nDTSTAMP:${stamp}\r\nDTSTART;TZID=Asia/Tehran:${date}T${time.replace(':','')}00\r\nRRULE:FREQ=DAILY\r\nSUMMARY:${label}\r\nDESCRIPTION:${reminderText(suffix).replace(/[,;\\]/g,'\\$&')}\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:${label}\r\nTRIGGER:-PT0M\r\nEND:VALARM\r\nEND:VEVENT\r\n`;
    const content=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//BeautyWallet//Routine//FA\r\nCALSCALE:GREGORIAN\r\n${event('روتین صبح BeautyWallet',$('reminderMorning').value,'am')}${event('روتین شب BeautyWallet',$('reminderEvening').value,'pm')}${photos.map(p=>`BEGIN:VEVENT\r\nUID:bw-photo-${p.day}-${p.date}@beautywallet\r\nDTSTAMP:${stamp}\r\nDTSTART;TZID=Asia/Tehran:${p.date.replace(/-/g,'')}T${$('reminderEvening').value.replace(':','')}00\r\nSUMMARY:عکس ${p.label} پوست — BeautyWallet\r\nDESCRIPTION:همان نور و فاصله‌ی عکس شروع، بدون آرایش و فیلتر.\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:عکس ${p.label} پوست\r\nTRIGGER:-PT0M\r\nEND:VALARM\r\nEND:VEVENT\r\n`).join('')}END:VCALENDAR\r\n`;
    const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='BeautyWallet-routine.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    setStatus((photos.length?'یادآور روتین و '+photos.length+' نوبت عکس در فایل تقویم است. ':'')+'فایل تقویم آماده شد. آن را در تقویم گوشی وارد کن تا اعلانِ زمان بسته‌بودن سایت هم وابسته به تنظیمات تقویم خودت باشد.');
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
