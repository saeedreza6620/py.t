/* BeautyWallet — «پوستم به هم ریخته»: find the product that upset her skin and keep the routine calm meanwhile.
   Not a treatment and not a diagnosis. Timings follow the literature:
   - contact allergy usually shows 24–72 h after contact (DermNet) → suspects = products started 2–14 days before; face re-tries last 4 days;
   - a repeated open application test (ROAT) on the inner forearm, twice a day, at least a week; positives usually by about day 4
     (Adv Dermatol Allergol 2021) → 7-day forearm test, two suspects at once (left/right arm), stop the day one reacts;
   - after irritation, skin function stays off for ~2 weeks and is back by ~3 weeks (Lee et al., Contact Dermatitis 1997)
     → calm phase until two calm days in a row (from day 3), refer if no better by day 7, cap 21 days;
   - retinoid adjustment is usual in weeks 2–4 (Galderma) → retinoids/acids are «too much for now», not «never».
   - daily symptoms (scale 2): itch and burning as the worst moment of the last 24 h on 0–10 — the numeric rating format validated
     for itch (Yosipovitch et al., Br J Dermatol 2019: test–retest ICC 0.95; a 2–4 point change is meaningful → we use ≥3);
     redness 0–3 and new bumps since yesterday. POEM is not used: commercial use needs a licence.
   - red flags: swelling of face/lips/tongue/eyelids (breathing → emergency), blisters or open sores, discharge / yellow crusts /
     increasing pain, fever or feeling unwell (signs of infection, HSE Ireland), fast spreading, after a medicine, eyes → a doctor today.
   - diamonds only after value: triage, suspects, simple routine, daily follow-up and the trend are free; finding the culprit
     (cfg.calmPrice, 3) and safe alternatives without the suspect group (cfg.altPrice, 1) are the next steps she pays for.
   Programs started before scale 2 keep their old 0–3 scores and rules.
   Storage: NEW keys only — bw_calm_v1 (the program), bw_skin_passport (what upset her skin). Her routine (bw_check_products)
   is never changed: paused products are only shown as paused. Photos go through the existing encrypted journal. */
(function(){'use strict';
var DAY=864e5,K='bw_calm_v1',KP='bw_skin_passport';
function rj(k,d){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}}
function wj(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function fa(n){return String(n).replace(/[0-9]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d]})}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function tday(t){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t==null?Date.now():t))}
function dnum(s){var p=String(s).slice(0,10).split('-');return Math.round(Date.UTC(+p[0],p[1]-1,+p[2])/DAY)}
function faDate(d){try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',month:'long',day:'numeric'}).format(new Date(d+'T12:00:00Z'))}catch(e){return d}}
function dev(){try{return localStorage.getItem('bw_device')||''}catch(e){return ''}}
function track(n){try{window.bwTrack&&window.bwTrack(n)}catch(e){}}
function l2(r){try{window.bwL2&&window.bwL2(Object.assign({t:'calm'},r))}catch(e){}}
function toast(t){try{var d=document.createElement('div');d.className='sw-toast';d.textContent=t;document.body.append(d);setTimeout(function(){d.remove()},3200)}catch(e){}}
function plist(){return typeof PRODUCTS!=='undefined'?PRODUCTS:(window.PRODUCTS||[])}
function pname(id){var L=plist();for(var i=0;i<L.length;i++)if(L[i].id===id)return L[i].name;var f=formula(id);return (f&&f.name)||''}
function formula(id){try{return window.BWCatalog&&window.BWCatalog.formula(id)}catch(e){return null}}
function routine(){var r=rj('bw_check_products',[]);return Array.isArray(r)?r.map(String):[]}
function st(){var s=rj(K,null);return s&&s.v===1&&!s.closed?s:null}
function save(s){wj(K,s);paint()}
function dayN(s){return dnum(tday())-dnum(s.start)}
function tot(x){return x?(+x.b||0)+(+x.r||0)+(+x.p||0):0}

var RED=[['swell','تورم صورت، لب، زبان یا پلک'],['blister','تاول یا زخم باز'],['infect','ترشح، دلمه‌ی زرد یا دردی که هر روز بیشتر می‌شه'],['fever','تب، لرز یا حال عمومی بد'],['spread','پخش شدن سریع به گردن یا بدن'],['drug','بعد از شروع یک دارو (قرص، آمپول) شروع شد'],['eye','چشم درگیره یا دید تار شده']];
// scale 2: worst itch / burning in the last 24 h (0–10), redness (0–3), new bumps since yesterday (0–2)
var NRS=[['itch','خارش'],['burn','سوزش یا سوزن‌سوزن شدن']],RLV=['ندارم','کم','متوسط','زیاد'],BLV=['نه','۱ یا ۲ تا','بیشتر'];
var SYM=[['burn','سوزش یا خارش'],['red','قرمزی'],['bumps','جوش ریز تازه'],['deep','جوش دردناک و عمقی'],['dry','خشکی و پوسته'],['hives','کهیر یا برجستگی']];
var SINCE=[['1','امروز یا دیروز'],['3','۲ تا ۳ روزه'],['7','حدود یک هفته'],['14','بیشتر از دو هفته']];
var DIM=[['b','سوزش یا خارش'],['r','قرمزی'],['p','جوش یا دانه‌ی تازه']],LV=['ندارم','کم','متوسط','زیاد'];
var STRONG=/^(RETINOID|AHA|BHA|VITC_LAA)$/,BADV={mild:1,bad:1,peel:1,new:1,tight:1};
var CLS={RETINOID:'رتینوئید',AHA:'لایه‌بردار AHA',BHA:'سالیسیلیک اسید (BHA)',VITC_LAA:'ویتامین C خالص',PHA:'PHA',AZELAIC:'آزلائیک اسید',VITAMIN_B3:'نیاسینامید'},FL={fragrance:'عطر',essential_oil:'روغن معطر'};

function info(id){var f=formula(id)||{},cls=(f.actives||[]).map(function(a){return a.cls}),fl=f.flags||[];
  return {id:id,name:pname(id)||id,cls:cls,fl:fl,rinse:!!f.rinseOff,role:f.role||'',strong:cls.some(function(c){return STRONG.test(c)})||fl.indexOf('high_strength')>=0}}
function suspects(since){var start=rj('bw_fu_start',{}),ans=rj('bw_fu_answers',{}),onset=dnum(tday())-(+since||3);
  return routine().map(function(id){var i=info(id),sc=0,why=[];var s0=start&&start[id]?dnum(start[id]):null;
    if(s0!=null){var gap=onset-s0;if(gap>=-1&&gap<=14){sc+=3;i.recent=true;why.push(gap<=0?'همین روزها شروعش کردی':'حدود '+fa(gap)+' روز قبل از شروع مشکل اضافه شده')}else if(gap>14&&gap<=30){sc+=1;why.push('در یک ماه اخیر اضافه شده')}}
    var a=ans&&ans[id]||{};if(Object.keys(a).some(function(c){return a[c]&&BADV[a[c].v]})){sc+=2;i.bad=true;why.push('توی پیگیری گفتی اذیتت کرده')}
    if(i.strong){sc+=2;why.push('ماده‌ی فعال قوی داره')}
    if(i.fl.indexOf('essential_oil')>=0){sc+=1;why.push('روغن معطر داره')}else if(i.fl.indexOf('fragrance')>=0){sc+=1;why.push('عطر داره')}
    if(!i.rinse)sc+=1;i.score=sc;i.why=why;return i}).sort(function(a,b){return b.score-a.score})}
function simple(){var ids=routine().map(info),plain=function(i){return !i.strong&&i.fl.indexOf('fragrance')<0&&i.fl.indexOf('essential_oil')<0},pick=function(re){var x=ids.find(function(i){return re.test(i.role)&&plain(i)});return x?x.name:''};
  return [['شوینده‌ی ملایم',pick(/^(cleanser|micellar)$/)],['مرطوب‌کننده‌ی ساده (بدون عطر)',pick(/^moisturizer$/)],['ضدآفتاب صبح',(ids.find(function(i){return i.role==='sunscreen'})||{}).name||'']]}

/* ---------- styles ---------- */
var CSS='.cm-sheet{position:fixed;inset:0;z-index:9990;background:rgba(25,18,60,.5);display:flex;align-items:flex-end;justify-content:center}.cm-in{background:#fff;width:100%;max-width:560px;max-height:92vh;overflow:auto;border-radius:22px 22px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom,0px));direction:rtl;line-height:1.9;font-size:14px;color:#241a4f}'+
 '.cm-in h3{margin:0 0 6px;font-size:17px}.cm-note{font-size:12.5px;color:#6d6496}.cm-box{background:#f6f3ff;border-radius:14px;padding:9px 12px;margin:8px 0}.cm-warn{background:#fff1f1;color:#7a1f2b;border-radius:14px;padding:10px 12px;margin:8px 0}.cm-ok{background:#eef8f3;color:#24543f;border-radius:14px;padding:9px 12px;margin:8px 0}'+
 '.cm-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.cm-chips button,.cm-row button,.cm-chip,.cm-card button{font:inherit;border:0;border-radius:14px;padding:8px 12px;cursor:pointer;background:#f1edff;color:#241a4f;font-size:13.5px}.cm-chips button.on{background:#7c5cf0;color:#fff}'+
 '.cm-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.cm-go{background:linear-gradient(135deg,#7c5cf0,#c86dd7)!important;color:#fff!important;font-weight:800}.cm-sus{display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px dashed #ece6ff}.cm-sus small{display:block;color:#6d6496;font-size:12px}'+
 '.cm-dim{margin:6px 0}.cm-dim b{display:block;font-size:13px}.cm-card{background:#fff;border:1px solid #f0d9e6;border-radius:18px;padding:12px 14px;margin:0 0 12px;line-height:1.9;font-size:14px;color:#241a4f;direction:rtl}.cm-card h4{margin:0 0 4px;font-size:15px}'+
 '.cm-chip{display:block;width:100%;text-align:right;margin:8px 0 2px;background:linear-gradient(135deg,#fff0f4,#f4efff)!important;border:1px solid #f3d6e3!important;font-weight:700}.cm-chip small{display:block;font-weight:400;color:#6d6496;font-size:12px}.cm-trend{font-size:12.5px;color:#4d5670}'+
 '.cm-in .bw-action-icon::before,.cm-in .bw-action-icon::after,.cm-card .bw-action-icon::before,.cm-card .bw-action-icon::after{display:none!important;content:none!important}.cm-nrs{gap:4px!important}.cm-nrs button{padding:6px 0!important;min-width:27px;flex:1 0 27px;text-align:center}.cm-pp{background:#fff6e9;border-radius:12px;padding:6px 10px;margin-top:8px;font-size:13px;color:#6b4a14;line-height:1.8}';
function style(){if(document.getElementById('cmCss'))return;var s=document.createElement('style');s.id='cmCss';s.textContent=CSS;document.head.appendChild(s)}
var cur=null;
function sheet(html){style();if(cur)cur.remove();var o=document.createElement('div');o.className='cm-sheet';o.setAttribute('role','dialog');o.innerHTML='<div class="cm-in">'+html+'</div>';
  o.addEventListener('click',function(e){if(e.target===o||e.target.closest('[data-cx]')){o.remove();cur=null}});document.body.appendChild(o);cur=o;return o}
function chips(name,list,sel,multi){return '<div class="cm-chips" data-g="'+name+'"'+(multi?' data-m="1"':'')+'>'+list.map(function(x){return '<button type="button" data-v="'+x[0]+'"'+((multi?(sel||[]).indexOf(x[0])>=0:sel===x[0])?' class="on"':'')+'>'+x[1]+'</button>'}).join('')+'</div>'}
function picked(o,name){var g=o.querySelector('[data-g="'+name+'"]');if(!g)return null;var on=[].slice.call(g.querySelectorAll('.on')).map(function(b){return b.dataset.v});return g.dataset.m?on:(on[0]||null)}
function bindChips(o){o.addEventListener('click',function(e){var b=e.target.closest('.cm-chips button');if(!b)return;var g=b.parentNode;if(g.dataset.m)b.classList.toggle('on');else [].forEach.call(g.children,function(x){x.classList.toggle('on',x===b)})})}
function scoreForm(v){v=v||{};return DIM.map(function(d){return '<div class="cm-dim"><b>'+d[1]+'</b>'+chips('s_'+d[0],LV.map(function(l,i){return [String(i),l]}),v[d[0]]!=null?String(v[d[0]]):null)+'</div>'}).join('')}
function nrsRow(k,v){return '<div class="cm-chips cm-nrs" data-g="n_'+k+'">'+[0,1,2,3,4,5,6,7,8,9,10].map(function(i){return '<button type="button" data-v="'+i+'"'+(v===i?' class="on"':'')+'>'+fa(i)+'</button>'}).join('')+'</div>'}
function scoreForm2(v){v=v||{};return NRS.map(function(d){return '<div class="cm-dim"><b>'+d[1]+': شدیدترین لحظه در ۲۴ ساعت گذشته</b><small class="cm-note">۰ یعنی اصلاً، ۱۰ یعنی بدترین حالتی که می‌شه تصور کرد</small>'+nrsRow(d[0],v[d[0]])+'</div>'}).join('')+
  '<div class="cm-dim"><b>قرمزی</b>'+chips('n_red',RLV.map(function(l,i){return [String(i),l]}),v.red!=null?String(v.red):null)+'</div><div class="cm-dim"><b>جوش یا دانه‌ی تازه از دیروز</b>'+chips('n_bumps',BLV.map(function(l,i){return [String(i),l]}),v.bumps!=null?String(v.bumps):null)+'</div>'}
function readScores2(root){var x={},ok=true;['itch','burn','red','bumps'].forEach(function(k){var on=root.querySelector('[data-g="n_'+k+'"] .on');if(!on)ok=false;else x[k]=+on.dataset.v});return ok?x:null}
function calmDay(x){return !!x&&x.itch<=1&&x.burn<=1&&x.red<=1&&!x.bumps}
function better(b,x){return !!x&&calmDay(x)||(!!x&&(b.itch-x.itch>=3||x.itch<=1)&&(b.burn-x.burn>=3||x.burn<=1)&&x.red<=Math.max(1,b.red-1)&&!x.bumps)}
function verdict2(s){var n=dayN(s),ks=Object.keys(s.days).sort(),b=s.base,l=s.days[ks[ks.length-1]],y=ks.length>1?s.days[ks[ks.length-2]]:null,cons=ks.length>1&&dnum(ks[ks.length-1])-dnum(ks[ks.length-2])===1;
  if(n>=2&&(l.itch-b.itch>=3||l.burn-b.burn>=3||(l.red===3&&b.red<3)||(l.bumps===2&&b.bumps<2)))return 'worse';
  if(n>=3&&cons&&((calmDay(l)&&calmDay(y))||(better(b,l)&&better(b,y))))return 'ready';
  if(n>=7&&!better(b,l))return 'stuck';if(n>=21)return 'cap';return 'calm'}
function trend2(s){var ks=Object.keys(s.days).sort(),f=s.days[ks[0]],l=s.days[ks[ks.length-1]];
  return 'خارش: روز اول '+fa(f.itch)+' از ۱۰، امروز '+fa(l.itch)+'<br>سوزش: روز اول '+fa(f.burn)+' از ۱۰، امروز '+fa(l.burn)+'<br>قرمزی: روز اول '+RLV[f.red]+'، امروز '+RLV[l.red]}
function lvl(x){return x?(x.itch!=null?Math.round((x.itch+x.burn)/2):tot(x)):0}
function readScores(o){var x={},ok=true;DIM.forEach(function(d){var v=picked(o,'s_'+d[0]);if(v==null)ok=false;x[d[0]]=+v||0});return ok?x:null}

/* ---------- start: intro → red flags → what / since when → suspects → plan for today ---------- */
function open(){var s=st();track('calm_open');if(s)return status();style();
  var o=sheet('<h3>😣 پوستت به هم ریخته؟</h3><p>با هم پیدا می‌کنیم <b>کدوم محصول</b> بوده، و تا پوستت آروم بشه روتینت رو ساده و قدم‌به‌قدم نگه می‌داریم. آخرش اون محصول توی «پرونده‌ی پوست من» علامت می‌خوره که دیگه تکرار نشه.</p>'+
   '<div class="cm-box">⏱ تا ۲۱ روز، معمولاً ۷ تا ۱۴ روز. شروع و آروم کردن پوست رایگانه.</div><p class="cm-note">بیوتی‌ولت پزشک نیست و تشخیص نمی‌ده؛ اگه علامت جدی باشه، همون اول می‌گیم پیش پزشک بری.</p>'+
   '<div class="cm-row"><button type="button" class="cm-go" data-a="go">شروع کنیم</button><button type="button" data-cx="1">بعداً</button></div>');
  o.querySelector('[data-a="go"]').onclick=redFlags}
function redFlags(){var o=sheet('<h3>اول یه سؤال مهم</h3><p>هر کدوم از این‌ها رو داری؟</p>'+chips('red',RED,[],true)+'<div class="cm-row"><button type="button" class="cm-go" data-a="none">هیچ‌کدوم</button><button type="button" data-a="yes">بله، انتخاب کردم</button></div>');bindChips(o);
  o.querySelector('[data-a="none"]').onclick=what;
  o.querySelector('[data-a="yes"]').onclick=function(){var r=picked(o,'red');if(!r.length)return what();track('calm_redflag');l2({ev:'red',sym:r});
    sheet('<h3>⚠️ این رو با برنامه درست نکنیم</h3><div class="cm-warn">چیزی که گفتی ('+esc(r.map(function(k){return RED.find(function(x){return x[0]===k})[1]}).join('، '))+') باید <b>همین امروز</b> پزشک ببینه'+(r.indexOf('swell')>=0||r.indexOf('eye')>=0?'؛ اگه تورم یا تنگی نفس داری، اورژانس.':'.')+'</div><p>تا اون موقع هر محصولی که این روزها شروع کردی رو کنار بذار و فقط با آب ولرم صورتت رو بشور.</p><div class="cm-row"><button type="button" class="cm-go" data-cx="1">باشه</button></div>')}}
function what(){var o=sheet('<h3>چی شده؟</h3><p>هر چی داری انتخاب کن:</p>'+chips('sym',SYM,[],true)+'<p style="margin-top:8px">از کِی؟</p>'+chips('since',SINCE,null)+
   '<p style="margin-top:8px">الان چقدر؟</p>'+scoreForm2()+'<div class="cm-row"><button type="button" class="cm-go" data-a="next">ادامه</button><button type="button" data-cx="1">بستن</button></div><p class="cm-msg cm-note"></p>');bindChips(o);
  o.querySelector('[data-a="next"]').onclick=function(){var sym=picked(o,'sym'),since=picked(o,'since'),sc=readScores2(o),m=o.querySelector('.cm-msg');
    if(!sym.length||!since||!sc){m.textContent='همه‌ی بخش‌ها رو انتخاب کن 💜';return}    pickSuspects({sym:sym,since:since,base:sc})}}
function pickSuspects(d){var L=suspects(d.since),top=L.filter(function(i){return i.recent||i.bad}).slice(0,3).map(function(i){return i.id});if(!top.length&&L.length)top=[L[0].id];
  var hormonal=d.sym.indexOf('deep')>=0;
  var o=sheet('<h3>🔎 مظنون‌ها</h3><p>از روتینت و تاریخ شروع هر محصول، این‌ها احتمال بیشتری دارن. تیک بزن هر کدوم رو این روزها زدی:</p>'+
   (L.length?L.map(function(i){return '<label class="cm-sus"><input type="checkbox" name="sus" value="'+esc(i.id)+'"'+(top.indexOf(i.id)>=0?' checked':'')+'><span>'+esc(i.name)+(i.why.length?'<small>'+esc(i.why.join(' · '))+'</small>':'')+(i.strong?'<small>اگه تازه شروعش کردی، چند هفته‌ی اول کمی قرمزی و پوسته طبیعیه؛ ممکنه فقط دوزش زیاد بوده.</small>':'')+'</span></label>'}).join(''):'<p class="cm-note">هنوز محصولی توی روتینت ثبت نشده.</p>')+
   '<p style="margin-top:8px">محصول دیگه‌ای هم این دو هفته زدی که اینجا نیست؟ (فقط اسمش)</p><input type="text" id="cmExtra" placeholder="مثلاً ماسک جدید، کرم یه دوست…" style="width:100%;box-sizing:border-box;font:inherit;border:1px solid #ddd6ff;border-radius:12px;padding:8px">'+
   (hormonal?'<p class="cm-note">جوش دردناک و عمقی همیشه کار محصول نیست؛ هورمون و استرس هم نقش دارن. اگه تا یک هفته بهتر نشد، پزشک بهتر کمک می‌کنه.</p>':'')+
   '<div class="cm-row"><button type="button" class="cm-go" data-a="next">ادامه</button><button type="button" data-cx="1">بستن</button></div>');
  o.querySelector('[data-a="next"]').onclick=function(){var sus=[].slice.call(o.querySelectorAll('input[name=sus]:checked')).map(function(x){return x.value}),ex=(o.querySelector('#cmExtra').value||'').trim().slice(0,80);
    planToday(Object.assign(d,{sus:sus,extra:ex?[ex]:[]}))}}
function planToday(d){var names=d.sus.map(pname).concat(d.extra),simp=simple();
  var o=sheet('<h3>📋 از امروز</h3>'+(names.length?'<div class="cm-warn"><b>این‌ها رو فعلاً نزن:</b><br>'+names.map(esc).join('<br>')+'</div>':'<div class="cm-box">مظنون مشخصی انتخاب نکردی؛ هر محصول تازه‌ای رو فعلاً کنار بذار.</div>')+
   '<div class="cm-ok"><b>روتین ساده تا آروم شدن:</b><br>'+simp.map(function(x){return '• '+esc(x[0])+(x[1]?': '+esc(x[1]):'')}).join('<br>')+'</div>'+
   '<p class="cm-note">صورتت رو با آب ولرم بشور، نمال، و چیز تازه‌ای امتحان نکن. هر روز یک بار اینجا (مراقبت روزانه) فقط سه سؤال کوچیک جواب بده.</p>'+
   '<div class="cm-box">📷 یه عکس از امروز بگیر تا روز هفتم کنارش ببینی (روی گوشیت رمزگذاری می‌مونه).</div>'+
   '<div class="cm-row"><button type="button" class="cm-go" data-a="start">شروع برنامه + عکس امروز</button><button type="button" data-a="nophoto">شروع بدون عکس</button></div>');
  function go(photo){var s={v:1,scale:2,id:'c'+Date.now().toString(36),start:tday(),since:d.since,sym:d.sym,base:d.base,sus:d.sus,extra:d.extra,days:{},phase:'calm',unlocked:false};s.days[tday()]=d.base;wj(K,s);
    track('calm_start');l2({ev:'start',sus:d.sus,base:lvl(d.base),sym:d.sym,since:d.since});if(cur){cur.remove();cur=null}paint();
    if(photo){window.bwReactCtx={pid:d.sus[0]||'',name:'برنامه‌ی آرام‌سازی',at:Date.now()};goTrack(function(){window.BWSkinJournal&&window.BWSkinJournal.photo&&window.BWSkinJournal.photo()})}else goTrack();toast('برنامه شروع شد 💜 هر روز توی مراقبت روزانه منتظرتم')}
  o.querySelector('[data-a="start"]').onclick=function(){go(true)};o.querySelector('[data-a="nophoto"]').onclick=function(){go(false)}}
function goTrack(then){if(typeof window.switchTab==='function')window.switchTab('track');setTimeout(function(){var c=document.getElementById('bwCalm');c&&c.scrollIntoView({behavior:'smooth',block:'start'});then&&then()},350)}

/* ---------- daily: where she is, what to do today ---------- */
function verdict(s){var n=dayN(s),days=Object.keys(s.days).sort(),last=days.length?s.days[days[days.length-1]]:s.base,base=tot(s.base),now=tot(last),y=days.length>1?s.days[days[days.length-2]]:null;
  var twoCalm=days.length>=2&&dnum(days[days.length-1])-dnum(days[days.length-2])===1&&now<=1&&tot(y)<=1;
  if(n>=2&&now>=base+2)return 'worse';if(n>=3&&(twoCalm||(base>=3&&now<=Math.floor(base*0.3))))return 'ready';if(n>=7&&now>base*0.5)return 'stuck';if(n>=21)return 'cap';return 'calm'}
function trend(s){var ks=Object.keys(s.days).sort(),f=s.days[ks[0]],l=s.days[ks[ks.length-1]];return DIM.map(function(d){return d[1]+': روز اول '+LV[f[d[0]]]+'، امروز '+LV[l[d[0]]]}).join('<br>')}
function card(s){var n=dayN(s),done=!!s.days[tday()],h='<div class="cm-card" id="bwCalm"><h4>🌿 برنامه‌ی آرام‌سازی · روز '+fa(n)+'</h4>';
  var paused=s.sus.map(pname).concat(s.extra||[]);
  if(s.phase==='calm'){var v2=s.scale===2,v=v2?verdict2(s):verdict(s);
    h+=paused.length?'<div class="cm-pp">✋ فعلاً نزن: '+esc(paused.join('، '))+'</div>':'';
    if(!done)h+='<p style="margin:8px 0 0"><b>امروز چطوره؟</b></p>'+(v2?scoreForm2():scoreForm())+'<div class="cm-row"><button type="button" class="cm-go" data-c="save">ثبت امروز</button></div>';
    else h+='<p class="cm-trend">'+(v2?trend2(s):trend(s))+'</p>';
    if(done&&v==='worse')h+='<div class="cm-warn">از روز اول بدتر شده. لطفاً همین روزها پزشک ببینه؛ برنامه رو نگه می‌داریم، ولی جای پزشک نیست.</div>';
    if(done&&v==='stuck')h+='<div class="cm-warn">'+fa(n)+' روز گذشته و هنوز خیلی بهتر نشده؛ احتمالاً فقط واکنش به یه محصول نیست. بهتره پزشک ببینه. اگه خواستی، روتین ساده رو ادامه بده.</div>';
    if(done&&v==='ready')h+='<div class="cm-ok">پوستت آروم‌تر شده ✨ '+fa(n)+' روز کنارت بودیم'+(v2?' و خارشت از '+fa(s.base.itch)+' به '+fa(s.days[tday()].itch)+' رسید':'')+'.<br>قدم بعد: <b>پیدا کردن مقصر</b> با یه تست کوچیک روی ساعد (معمولاً تا روز چهارم جواب می‌ده)، و بعدش ثبتش توی «پرونده‌ی پوست من» تا هیچ‌وقت تکرار نشه.</div><div class="cm-row"><button type="button" class="cm-go" data-c="unlock">پیدا کردن مقصر با '+fa(PRICE.test)+' الماس 💎</button></div>';
    if(done&&v==='calm')h+='<p class="cm-note">وقتی دو روز پشت سر هم آروم بود (از روز سوم به بعد)، می‌ریم سراغ پیدا کردن مقصر.</p>';
    if(done&&v==='cap')h+='<div class="cm-box">۲۱ روز شد. اگه هنوز بهتر نشده، پزشک بهترین قدم بعدیه.</div><div class="cm-row"><button type="button" data-c="close">بستن برنامه</button></div>'}
  else if(s.phase==='test'){var t=s.test,tn=dnum(tday())-dnum(t.start)+1;
    h+='<p><b>تست ساعد · روز '+fa(Math.min(tn,7))+' از ۷</b></p><p class="cm-note">صبح و شب، به اندازه‌ی یه سکه (حدود ۲ در ۲ سانت)، روی داخل ساعد بزن و همون‌جا رو نشور. صورتت هنوز روتین ساده‌ست.</p>';
    t.items.forEach(function(it,i){h+='<div class="cm-box"><b>'+esc(pname(it.id))+'</b> · ساعد '+it.site+(it.res==='pos'?'<br>⚠️ واکنش داد؛ دیگه نزن.':it.res==='neg'?'<br>✓ واکنشی نداد.':(it.asked===tday()?'<br>امروز ثبت شد؛ فردا دوباره نگاه کن.':'<br>جای این محصول قرمز، خارش‌دار یا برجسته شده؟<div class="cm-row"><button type="button" data-c="pos" data-i="'+i+'">بله</button><button type="button" data-c="neg" data-i="'+i+'">نه</button></div>'))+'</div>'})}
  else if(s.phase==='face'){var f=s.face,fn=dnum(tday())-dnum(f.start)+1;
    h+='<p><b>برگرداندن روی صورت · «'+esc(pname(f.cur))+'» · روز '+fa(Math.min(fn,4))+' از ۴</b></p><p class="cm-note">فقط همین یکی رو مثل قبل بزن؛ بقیه‌ی مظنون‌ها هنوز کنار.</p>'+
      (f.asked===tday()?'<p class="cm-note">امروز ثبت شد.</p>':'<div class="cm-box">از وقتی دوباره زدیش، سوزش، قرمزی یا جوش تازه برگشته؟<div class="cm-row"><button type="button" data-c="fpos">بله</button><button type="button" data-c="fneg">نه</button></div></div>')}
  h+='<div class="cm-row"><button type="button" data-c="photo">📷 عکس امروز</button><button type="button" data-c="stop" style="background:none;color:#9a91c7;font-size:12px">پایان برنامه</button></div></div>';return h}
function paint(){var j=document.getElementById('skinJournal'),s=st();var old=document.getElementById('bwCalm');
  if(!s){if(old)old.remove();homeChip();return}if(!j)return;style();var w=document.createElement('div');w.innerHTML=card(s);var nw=w.firstChild;
  if(old)old.replaceWith(nw);else{var l1=document.getElementById('bwL1');(l1||j).parentNode.insertBefore(nw,l1||j)}homeChip()}
document.addEventListener('click',function(e){var b=e.target.closest('#bwCalm [data-c]');if(!b)return;var s=st();if(!s)return;var a=b.dataset.c,card=document.getElementById('bwCalm');
  if(a==='save'&&s.scale===2){var x2=readScores2(card);if(!x2)return toast('هر چهار مورد رو انتخاب کن 💜');s.days[tday()]=x2;save(s);if(verdict2(s)==='worse')track('calm_worse');return}
  if(a==='save'){var g=card.querySelectorAll('.cm-chips');var x={},ok=true;DIM.forEach(function(d){var on=card.querySelector('[data-g="s_'+d[0]+'"] .on');if(!on)ok=false;x[d[0]]=on?+on.dataset.v:0});if(!ok)return toast('هر سه مورد رو انتخاب کن 💜');s.days[tday()]=x;save(s);var v=verdict(s);if(v==='worse')track('calm_worse');return}
  if(a==='unlock')return unlock(s);
  if(a==='photo'){window.bwReactCtx={pid:s.sus[0]||'',name:'برنامه‌ی آرام‌سازی',at:Date.now()};var jj=document.getElementById('skinJournal');jj&&jj.scrollIntoView({behavior:'smooth',block:'start'});window.BWSkinJournal&&window.BWSkinJournal.photo&&window.BWSkinJournal.photo();return}
  if(a==='stop'&&!b.dataset.sure){b.dataset.sure='1';b.textContent='مطمئنی؟ دوباره بزن';return}
  if(a==='stop'||a==='close'){finish(s,true);return}
  if(a==='pos'||a==='neg'){var it=s.test.items[+b.dataset.i],tn=dnum(tday())-dnum(s.test.start)+1;it.asked=tday();
    if(a==='pos'){it.res='pos';it.at=tday()}else if(tn>=7){it.res='neg';it.at=tday()}
    if(s.test.items.every(function(x){return x.res})){return afterTest(s)}save(s);return}
  if(a==='fpos'||a==='fneg'){var f=s.face;f.asked=tday();var fn=dnum(tday())-dnum(f.start)+1;
    if(a==='fpos'){f.done.push({id:f.cur,res:'pos'});return nextFace(s)}if(fn>=4){f.done.push({id:f.cur,res:'neg'});return nextFace(s)}save(s);return}});
// chips inside the daily card
document.addEventListener('click',function(e){var b=e.target.closest('#bwCalm .cm-chips button');if(!b)return;[].forEach.call(b.parentNode.children,function(x){x.classList.toggle('on',x===b)})});

/* ---------- unlock (paid with diamonds) → forearm test, two at a time ---------- */
// diamonds for the next step, only after something useful was already given; short → the diamond sheet, then it retries
var PRICE={test:3,alt:1};try{fetch('/api/calm/price',{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){if(j&&j.price!=null)PRICE.test=j.price;if(j&&j.alt!=null)PRICE.alt=j.alt}).catch(function(){})}catch(e){}
function spend(what,ok,btn){if(btn)btn.disabled=true;
  fetch('/api/calm/unlock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({d:dev(),what:what})}).then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})}).then(function(x){if(btn)btn.disabled=false;
    if(!x.ok&&x.j&&x.j.code==='need_negin'){toast(x.j.error||'الماس لازمه 💎');track(what==='test'?'calm_pay_short':what==='refill_alt'?'refill_alt_short':'calm_alt_short');if(window.bwNeginSheet)window.bwNeginSheet(1,function(){spend(what,ok)});else if(window.bwNegin)window.bwNegin();return}
    if(!x.ok)return toast('الان نشد؛ دوباره امتحان کن');try{window.bwSyncWallet&&window.bwSyncWallet()}catch(e){}ok(x.j)}).catch(function(){if(btn)btn.disabled=false;toast('اینترنت وصل نیست؛ دوباره امتحان کن')})}
function unlock(s){spend('test',function(){var c=st();track('calm_unlock');l2({ev:'unlock',sus:c.sus,dayn:dayN(c),base:lvl(c.base),now:lvl(c.days[tday()])});startTest(c)},document.querySelector('#bwCalm [data-c="unlock"]'))}
function startTest(s){s.unlocked=true;var L=s.sus.map(info),leave=L.filter(function(i){return !i.rinse}),rinse=L.filter(function(i){return i.rinse});
  var now=leave.slice(0,2),later=leave.slice(2).concat(rinse);
  if(!now.length){s.phase='face';s.face={queue:later.map(function(i){return i.id}),done:[],cur:'',start:tday()};return nextFace(s)}
  s.phase='test';s.test={start:tday(),items:now.map(function(i,k){return {id:i.id,site:k?'راست':'چپ',res:null}}),later:later.map(function(i){return i.id})};track('calm_test');l2({ev:'test',sus:now.map(function(i){return i.id})});save(s);
  sheet('<h3>🧪 تست ساعد</h3><p>'+now.map(function(i,k){return '«'+esc(i.name)+'» روی ساعد '+(k?'راست':'چپ')}).join(' و ')+'، صبح و شب، به اندازه‌ی یه سکه. همون‌جا رو نشور و نپوشون.</p><div class="cm-box">واکنش معمولاً تا روز چهارم معلوم می‌شه؛ تا ۷ روز ادامه بده. هر روز یه بار توی مراقبت روزانه بگو چی دیدی.</div><p class="cm-note">اگه جایی خیلی قرمز، تاول‌دار یا پخش شد، همون روز بشور، دیگه نزن و پزشک ببینه.</p><div class="cm-row"><button type="button" class="cm-go" data-cx="1">باشه</button></div>')}
function afterTest(s){var pos=s.test.items.filter(function(x){return x.res==='pos'}).map(function(x){return x.id}),neg=s.test.items.filter(function(x){return x.res==='neg'}).map(function(x){return x.id});
  s.found=(s.found||[]).concat(pos);
  // a culprit found: the others did not react on the forearm → back one at a time (told in the result)
  if(pos.length){s.safe=neg;s.later=s.test.later||[];return finish(s)}
  // nothing on the forearm (tougher skin than the face): a short face re-try, one product at a time, 4 days each
  var queue=neg.concat(s.test.later||[]);
  s.phase='face';s.face={queue:queue,done:[],cur:'',start:tday()};nextFace(s)}
function nextFace(s){var f=s.face;if(f.done.some(function(x){return x.res==='pos'})){s.found=(s.found||[]).concat(f.done.filter(function(x){return x.res==='pos'}).map(function(x){return x.id}))}
  var safe=f.done.filter(function(x){return x.res==='neg'}).map(function(x){return x.id});s.safe=safe;
  if(!f.queue.length||f.done.some(function(x){return x.res==='pos'}))return finish(s);
  f.cur=f.queue.shift();f.start=tday();f.asked='';save(s);toast('حالا «'+pname(f.cur)+'» رو فقط خودش دوباره روی صورت بزن؛ ۴ روز.')}

/* ---------- end: result + «پرونده‌ی پوست من» ---------- */
function finish(s,stopped){var found=uniq(s.found||[]),safe=uniq(s.safe||[]).filter(function(x){return found.indexOf(x)<0}),untested=s.sus.filter(function(x){return found.indexOf(x)<0&&safe.indexOf(x)<0});s.phase='done';
  if(found.length){var p=rj(KP,{items:[]});if(!p||!Array.isArray(p.items))p={items:[]};found.forEach(function(id){var i=info(id);if(!p.items.some(function(x){return x.id===id}))p.items.push({id:id,name:i.name,cls:i.cls,fl:i.fl,kind:i.strong?'caution':'avoid',at:tday()})});wj(KP,p)}
  s.closed=true;s.end=tday();s.result={found:found,safe:safe,untested:untested,stopped:!!stopped};wj(K,s);
  var hist=rj('bw_calm_hist',[]);if(!Array.isArray(hist))hist=[];hist.push({id:s.id,start:s.start,end:s.end,found:found,safe:safe});wj('bw_calm_hist',hist.slice(-10));
  track(stopped?'calm_stop':'calm_done');l2({ev:stopped?'stop':'done',sus:s.sus,culprit:found,safe:safe,dayn:dayN(s),base:lvl(s.base),now:lvl(s.days[Object.keys(s.days).sort().pop()])});paint();
  if(stopped&&!found.length&&!safe.length)return toast('برنامه بسته شد 💜 هر وقت لازم شد دوباره از «پوستم به هم ریخته» شروع کن');
  sheet('<h3>🌿 نتیجه‌ی برنامه</h3>'+(found.length?'<div class="cm-warn"><b>احتمالاً مقصر:</b><br>'+found.map(function(id){var i=info(id);return esc(i.name)+(i.strong?' <small>(ممکنه فقط دوزش زیاد بوده؛ اگه خواستی دوباره، یک شب در میان شروع کن)</small>':'')}).join('<br>')+'</div>':'<div class="cm-box">مقصر قطعی پیدا نشد. این هم یه جوابه: احتمالاً یه محصول تنها مقصر نبوده (هوا، هورمون، استرس). اگه دوباره تکرار شد، پزشک بهتر کمک می‌کنه.</div>')+
   (safe.length?'<div class="cm-ok"><b>این‌ها توی تست واکنشی نشون ندادن؛ یکی‌یکی و با فاصله‌ی ۴ روز برگردون:</b><br>'+safe.map(function(id){return esc(pname(id))}).join('<br>')+'</div>':'')+
   (untested.length?'<p class="cm-note">تست نشد: '+esc(untested.map(pname).join('، '))+'. اگه برگردوندی، یکی‌یکی و با فاصله‌ی ۴ روز.</p>':'')+
   (found.length?'<p>📁 به «پرونده‌ی پوست من» اضافه شد؛ از این به بعد هر محصولی رو بسنجی، اگه همین محصول یا گروه مواد مشکوکش رو داشته باشه، بهت می‌گم.</p>':'')+
   '<p class="cm-note">اگه دوباره تکرار شد، دقیق‌ترین راه «تست پچ» پیش متخصص پوسته.</p>'+altTeaser(found)+
   '<div class="cm-row"><button type="button" class="cm-go" data-cx="1">ممنون 💜</button></div>');bindAlt()}
// next step after the result: safe alternatives for what she put aside (same kind, without the suspect group, fit for her skin)
function avoidOf(ids){var a={cls:[],fl:[]};ids.forEach(function(id){var i=info(id);i.cls.forEach(function(c){if(STRONG.test(c)&&a.cls.indexOf(c)<0)a.cls.push(c)});i.fl.forEach(function(f){if(FL[f]&&a.fl.indexOf(f)<0)a.fl.push(f)})});return a}
var altFound=[];
function altTeaser(found){altFound=[];if(!found.length||!window.bwAlternatives)return '';var av=avoidOf(found);found.forEach(function(id){(window.bwAlternatives(id,av)||[]).forEach(function(x){if(!altFound.some(function(y){return y.id===x.id}))altFound.push(x)})});altFound=altFound.slice(0,3);
  if(!altFound.length)return '';track('calm_alt_offer');
  return '<div class="cm-box" id="cmAlt">💡 برای «'+esc(pname(found[0]))+'» '+fa(altFound.length)+' جایگزین پیدا کردم که با پوست و روتینت جورن و '+(av.cls.concat(av.fl).length?'«'+av.cls.map(function(c){return CLS[c]||c}).concat(av.fl.map(function(f){return FL[f]})).join('، ')+'» رو ندارن':'همون محصول نیستن')+'.<div class="cm-row"><button type="button" class="cm-go" data-alt="1">دیدن جایگزین‌ها با '+fa(PRICE.alt)+' الماس 💎</button></div></div>'}
function bindAlt(){var b=cur&&cur.querySelector('[data-alt]');if(!b)return;b.onclick=function(){spend('alt',function(){track('calm_alt_unlock');l2({ev:'alt',sus:altFound.map(function(x){return x.id})});var box=cur&&cur.querySelector('#cmAlt');if(box)box.innerHTML=altList(altFound)},b)}}
function altList(L){return '<b>جایگزین‌های سازگار با پوستت:</b>'+L.map(function(x){return '<div class="cm-sus"><span>'+esc(x.name)+(x.why?'<small>'+esc(x.why)+'</small>':'')+'</span></div>'}).join('')+'<p class="cm-note">اگه یکی رو خریدی، اول ۴ روز روی ساعد تستش کن. بیوتی‌ولت از هیچ برندی پول نمی‌گیره.</p>'}
function uniq(a){return a.filter(function(x,i){return x&&a.indexOf(x)===i})}

/* ---------- status sheet when already running ---------- */
function status(){var s=st();goTrack();if(!s)return}

/* ---------- entry points: a chip above the product search, the welcome choice (sweet.js), follow-up, chat ---------- */
function homeChip(){var f=document.querySelector('#sw-home .sw-ask');if(!f)return;style();var c=document.getElementById('cmChip'),s=st();
  var html=s?'🌿 برنامه‌ی آرام‌سازی · روز '+fa(dayN(s))+'<small>'+(s.days[tday()]||s.phase!=='calm'?'برای قدم امروز بزن':'سه سؤال امروز رو جواب بده')+'</small>':'😣 پوستم به هم ریخته<small>پیدا کنیم کدوم محصول بوده و آرومش کنیم</small>';
  if(!c){c=document.createElement('button');c.type='button';c.id='cmChip';c.className='cm-chip';c.onclick=function(){st()?goTrack():open()};f.parentNode.insertBefore(c,f.nextSibling)}c.innerHTML=html}

/* ---------- «پرونده‌ی پوست من» inside every product check ---------- */
function watchChecks(){var box=document.getElementById('swResult');if(!box||box.__cm)return;box.__cm=1;
  new MutationObserver(function(){var card=box.querySelector('.sw-result');if(!card||card.querySelector('.cm-pass'))return;var p=rj(KP,{items:[]});if(!p||!p.items||!p.items.length)return;var pid=rj('bw_last_check','');if(!pid)return;
    var hit=p.items.find(function(x){return x.id===pid}),msg='';
    if(hit)msg='⚠️ این همون محصولیه که پوستت رو به هم ریخت (برنامه‌ی آرام‌سازی، '+faDate(hit.at)+').';
    else{var me=info(pid),sh=[];p.items.forEach(function(x){(x.cls||[]).forEach(function(c){if(STRONG.test(c)&&me.cls.indexOf(c)>=0&&sh.indexOf(CLS[c]||c)<0)sh.push(CLS[c]||c)});(x.fl||[]).forEach(function(f){if(FL[f]&&me.fl.indexOf(f)>=0&&sh.indexOf(FL[f])<0)sh.push(FL[f])})});
      if(sh.length)msg='📁 این محصول «'+sh.join('، ')+'» داره، مثل «'+p.items[0].name+'» که پوستت رو به هم ریخت. شاید ربطی نداشته باشه؛ اگه خریدی، اول ۴ روز روی ساعد تستش کن.'}
    if(msg){style();card.insertAdjacentHTML('beforeend','<div class="cm-pass cm-pp">'+esc(msg)+'</div>')}}).observe(box,{childList:true,subtree:true})}

window.addEventListener('bw-journal',function(){setTimeout(paint,80)});
document.addEventListener('visibilitychange',function(){if(!document.hidden)paint()});
function start(){watchChecks();paint()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(start,700)});else setTimeout(start,700);
window.BWCalm={open:open,paint:paint,state:st,spend:spend,price:function(){return PRICE},altList:altList};
})();
