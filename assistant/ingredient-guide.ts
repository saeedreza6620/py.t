// Plain-language, source-backed explanations for BeautyWallet answers.
// Every sentence here restates what the cited page says, in simple Persian; nothing is a diagnosis.
// The verdict itself still comes from catalog-routine.ts; this file only explains it for one person.
// Keep it dependency-free (it is concatenated into the browser bundle by scripts/lib-bw-review.mjs).

export type GuideSrc={t:string;u:string};
export const GUIDE_SRC:Record<string,GuideSrc>={
  RET:{t:'DermNet: رتینوئیدهای موضعی',u:'https://dermnetnz.org/topics/topical-retinoids'},
  OTC:{t:'British Skin Foundation: Cosmeceuticals',u:'https://www.britishskinfoundation.org.uk/blog/cosmeceuticals-do-they-work'},
  BHA:{t:'DermNet: سالیسیلیک اسید',u:'https://dermnetnz.org/topics/salicylic-acid'},
  AHA:{t:'DermNet: اسیدهای AHA',u:'https://dermnetnz.org/topics/alpha-hydroxy-acid-facial-treatments'},
  AZE:{t:'DermNet: آزلائیک اسید',u:'https://dermnetnz.org/topics/azelaic-acid'},
  VITC:{t:'Al-Niaimi & Chiang، JCAD ۲۰۱۷: ویتامین C موضعی',u:'https://jcadonline.com/topical-vitamin-c-and-the-skin-mechanisms-of-action-and-clinical-applications/'},
  FRAG:{t:'DermNet: حساسیت به عطر',u:'https://dermnetnz.org/topics/fragrance-allergy'},
  MOIST:{t:'DermNet: مرطوب‌کننده‌ها',u:'https://www.dermnetnz.org/topics/emollients-and-moisturisers/'},
  CER:{t:'Kahraman و همکاران، Cosmetics ۲۰۱۹: سرامیدها',u:'https://mdpi-res.com/d_attachment/cosmetics/cosmetics-06-00052/article_deploy/cosmetics-06-00052.pdf'}
};
const S=GUIDE_SRC;

// What each active is, in words anyone understands. Classes without a checked source get a name only.
export type ActiveInfo={name:string;what:string;care?:string;src:GuideSrc[]};
export const ACTIVE_INFO:Record<string,ActiveInfo>={
  RETINOID:{name:'رتینول / رتینوئید',what:'از خانواده‌ی ویتامین A؛ برای جوش و نشانه‌های پیری پوست استفاده می‌شه. کُند اثر می‌کنه: برای جوش معمولاً تا حدود ۱۲ هفته طول می‌کشه. رتینول‌های آرایشی از نوع دارویی ملایم‌تر و کُندترن.',care:'اولش ممکنه پوست قرمز، خشک یا پوسته‌پوسته بشه و پوست به آفتاب حساس‌تر می‌شه؛ برای همین شب زده می‌شه و روزش ضدآفتاب لازمه.',src:[S.RET,S.OTC]},
  BHA:{name:'سالیسیلیک اسید (BHA)',what:'یه لایه‌برداره که لایه‌ی سخت سطح پوست رو نرم می‌کنه و جلوی بسته شدن منافذ رو می‌گیره؛ برای جوش، سرسیاه و سرسفید کاربرد داره.',care:'ممکنه بسوزونه، مخصوصاً روی پوست زخم یا قرمز؛ روی پوست تحریک‌شده نباید زده بشه.',src:[S.BHA]},
  AHA:{name:'گلیکولیک / لاکتیک اسید (AHA)',what:'یه لایه‌برداره که سلول‌های کهنه‌ی سطح پوست رو جدا می‌کنه تا پوست صاف‌تر دیده بشه.',care:'ممکنه کمی بسوزونه و چند روز پوسته بده؛ محافظت از آفتاب لازمه.',src:[S.AHA]},
  AZELAIC:{name:'آزلائیک اسید',what:'برای جوش (هم جوش بسته هم جوش قرمز)، قرمزی‌های جوش‌مانند و لک‌های قهوه‌ای بعد از جوش استفاده می‌شه؛ اثرش روی جوش معمولاً حدود ۴ هفته طول می‌کشه.',care:'معمولاً خوب تحمل می‌شه ولی روی پوست خیلی حساس ممکنه کمی بسوزونه.',src:[S.AZE]},
  VITC:{name:'ویتامین C',what:'یه آنتی‌اکسیدانه؛ کمک می‌کنه آسیب آفتاب و آلودگی کمتر بشه و به مرور لک‌های آفتابی کم‌رنگ‌تر بشن.',care:'نوع خالصش (اسکوربیک اسید) برای اثر کردن خیلی اسیدی ساخته می‌شه؛ غلظت بالای ۲۰٪ اثر بیشتری نداره و فقط احتمال تحریک رو بالا می‌بره.',src:[S.VITC,S.OTC]},
  VITC_DERIV:{name:'مشتق ویتامین C',what:'شکل پایدارتر ویتامین C؛ نوع خالصش از همه بیشتر بررسی شده و درباره‌ی مشتق‌ها شواهد کمتری هست.',src:[S.VITC]},
  VITAMIN_B3:{name:'نیاسینامید (ویتامین B3)',what:'شواهد قابل‌قبولی داره که لک رو کم می‌کنه و اثر ضدالتهابی داره.',src:[S.OTC]},
  HUMECTANT:{name:'هیالورونیک اسید (آبرسان)',what:'آب رو توی لایه‌ی رویی پوست نگه می‌داره؛ برای آبرسانی خوبه ولی صاف شدن خطوط با اون موقتیه.',src:[S.OTC,S.MOIST]},
  CERAMIDE:{name:'سرامید',what:'چربی اصلی لایه‌ی محافظ پوسته؛ به مرطوب‌کننده‌ها اضافه می‌شه تا از این لایه حمایت کنه، هرچند هنوز درباره‌ی میزان اثرش بحث هست.',src:[S.CER]}
};
ACTIVE_INFO.VITC_LAA=ACTIVE_INFO.VITC;
const NAME_ONLY:Record<string,string>={PHA:'PHA (از خانواده‌ی لایه‌بردارها)',TXA:'ترانگزامیک اسید',ARBUTIN:'آربوتین',CYSTEAMINE:'سیستئامین',ENZYME:'آنزیم لایه‌بردار',ZINC:'زینک',SOOTHING:'عصاره‌ی آرام‌بخش (مثل سنتلا یا پانتنول)',PEPTIDE:'پپتید',BAKUCHIOL:'باکوچیول'};

// Why two things clash, and what to do about it.
export type PairInfo={title:string;why:string;todo:string;src:GuideSrc[]};
export const PAIR_INFO:Record<string,PairInfo>={
  ret_acid:{title:'رتینوئید و اسید لایه‌بردار در یک شب',why:'این دو همدیگه رو خنثی نمی‌کنن؛ مشکل اینه که هر دو پوست رو تحریک می‌کنن و اثرشون روی هم جمع می‌شه: قرمزی، سوزش و پوسته‌ریزی. منابع پوست‌شناسی هم می‌گن سالیسیلیک اسید رو بدون نظر پزشک هم‌زمان با رتینوئید یا لایه‌بردار دیگه نزنی.',todo:'شب‌ها رو جدا کن: یک شب این، شب بعد اون.',src:[S.BHA,S.RET]},
  ret_wash:{title:'شوینده‌ی سالیسیلیک و رتینوئید در یک شب',why:'شوینده آبکشی می‌شه و تماسش با پوست کوتاهه، ولی هر دو می‌تونن تحریک کنن و روی پوست حساس یا خشک ممکنه زیاد باشه.',todo:'اگه سوزش یا پوسته دیدی، شب‌هایی که رتینوئید می‌زنی با یه شوینده‌ی ملایم بشور.',src:[S.BHA]},
  acid_acid:{title:'دو لایه‌بردار ماندگار در یک نوبت',why:'دو اسید لایه‌بردار روی هم لایه‌برداری رو بیشتر می‌کنن نه نتیجه رو؛ احتمال سوزش و خشکی بالا می‌ره.',todo:'یکی کافیه؛ اون یکی رو کنار بذار یا در شب‌های جدا بزن.',src:[S.BHA]},
  ret_ret:{title:'دو محصول رتینوئیدی',why:'دو رتینوئید روی هم اثر رو دو برابر نمی‌کنه ولی احتمال قرمزی، خشکی و پوسته رو بالا می‌بره.',todo:'یکی کافیه.',src:[S.RET]},
  vitc_acid:{title:'ویتامین C خالص و اسید لایه‌بردار در یک نوبت',why:'ویتامین C خالص خودش خیلی اسیدی ساخته می‌شه؛ کنار یه اسید لایه‌بردار دیگه احتمال سوزش بیشتر می‌شه.',todo:'ویتامین C رو صبح بزن و اسید رو شب.',src:[S.VITC,S.BHA]},
  ret_aze:{title:'رتینوئید و آزلائیک اسید',why:'با هم تداخل شیمیایی ندارن، ولی هر کدوم روی پوست حساس ممکنه کمی تحریک کنن.',todo:'اگه پوستت حساسه یا سوزش دیدی، شب‌هاشون رو جدا کن.',src:[S.AZE,S.RET]},
  niac_vitc:{title:'نیاسینامید و ویتامین C',why:'در منابعی که بررسی کردیم تداخلی بین این دو گزارش نشده.',todo:'می‌تونن کنار هم باشن؛ فقط اگه قرمزی دیدی جداشون کن.',src:[]},
  bha_wash:{title:'شوینده‌ی سالیسیلیک و لایه‌بردار ماندگار',why:'شوینده آبکشی می‌شه و اثرش کوتاهه، ولی کنار یه لایه‌بردار ماندگار برای پوست حساس ممکنه زیاد باشه.',todo:'اگه سوزش دیدی، شبی که لایه‌بردار می‌زنی با شوینده‌ی ملایم بشور.',src:[S.BHA]},
  ret_am:{title:'رتینوئید در روتین صبح',why:'رتینوئید پوست رو به آفتاب حساس‌تر می‌کنه و منابع توصیه می‌کنن شب زده بشه.',todo:'ببرش به روتین شب و صبح ضدآفتاب بزن.',src:[S.RET]},
  sun_pm:{title:'ضدآفتاب در روتین شب',why:'ضدآفتاب برای ساعت‌هاییه که نور خورشید هست؛ شب کاری براش نمی‌مونه.',todo:'ببرش به روتین صبح.',src:[]},
  cyst:{title:'سیستئامین کنار بقیه',why:'سیستئامین برای تماس کوتاه ساخته شده و باید طبق زمان روی بسته شسته بشه.',todo:'همون شب اکتیو دیگه‌ای روش نزن.',src:[]},
  dup_role:{title:'دو محصول هم‌نقش در یک نوبت',why:'دو محصول با یک کار در یک نوبت چیزی اضافه نمی‌کنن و فقط پوست رو شلوغ می‌کنن.',todo:'در هر نوبت یکی کافیه.',src:[]},
  preg_ret:{title:'رتینوئید در بارداری یا شیردهی',why:'بعضی رتینوئیدها در بارداری منع مصرف دارن.',todo:'ادامه یا شروعش رو فقط با نظر پزشک تصمیم بگیر.',src:[S.RET]}
};
export function pairInfo(kind:string){return PAIR_INFO[kind]||null;}

// ---------- one person's explanation for one product ----------
type F={id:string;name:string;role:string;rinseOff:boolean;texture:string;finish?:string;actives:Array<{cls:string;pct?:number}>;claims:string[];flags:string[];basis:string;spf?:number};
type Item={id:string;name:string;time:'am'|'pm';f:F};
type St={oily:boolean;dry:boolean;compromised:boolean;sensitive:boolean;acne:boolean;pregnancy:boolean;fragranceAvoid:boolean;skinLabel:string;goal:string};
export type Explain={you:string[];actives:Array<{name:string;what:string;care?:string;forYou?:string;nameOnly?:boolean}>;pairs:Array<{title:string;why:string;todo:string;with:string[]}>;clean:string;notes:string[];sources:GuideSrc[]};

const hasC=(f:F,c:string)=>f.actives.some(a=>a.cls===c);
const anyC=(f:F,cs:string[])=>cs.some(c=>hasC(f,c));
const leave=(f:F)=>!f.rinseOff;
const acidLeave=(f:F)=>leave(f)&&anyC(f,['AHA','BHA'])&&f.role!=='spot';
const vitcPure=(f:F)=>leave(f)&&(hasC(f,'VITC_LAA')||hasC(f,'VITC')&&f.actives.some(a=>a.cls==='VITC'&&(a.pct||0)>=10));
const SKIN_FA:Record<string,string>={oily:'چرب',combination:'مختلط',dry:'خشک',normal:'نرمال',sensitive:'حساس',acne:'جوش‌دار',damaged:'آسیب‌دیده',mature:'بالغ'};
// same evidence-backed links as GOALS in catalog-routine.ts
const GOAL_MAP:Array<{re:RegExp;label:string;cls:string[];claims:string[]}>=[
  {re:/جوش/,label:'کم شدن جوش',cls:['BHA','AZELAIC','RETINOID'],claims:['acne']},
  {re:/لک/,label:'کم شدن لک',cls:['AZELAIC','VITC','VITC_LAA','VITC_DERIV','VITAMIN_B3'],claims:['pigmentation','dull']},
  {re:/آبرسانی|محافظ/,label:'آبرسانی',cls:['HUMECTANT','CERAMIDE'],claims:['dry','damaged']},
  {re:/قرمزی/,label:'کم شدن قرمزی',cls:['AZELAIC'],claims:['redness','sensitive']},
  {re:/منافذ/,label:'کمتر دیده شدن منافذ',cls:['BHA','RETINOID'],claims:['pores']},
  {re:/چربی/,label:'کنترل چربی',cls:[],claims:['oily','pores']},
  {re:/پیری|چروک/,label:'ضدپیری',cls:['RETINOID','VITC','VITC_LAA','VITC_DERIV'],claims:['aging','mature']}];
const ROLE_ONE:Record<string,string>={cleanser:'شوینده',sunscreen:'ضدآفتاب',moisturizer:'مرطوب‌کننده',toner:'تونر',micellar:'میسلار',mask:'ماسک',eye:'محصول دور چشم'};
const q=(n:string)=>'«'+n+'»';
const joinFa=(a:string[])=>a.length<2?a.join(''):a.slice(0,-1).join('، ')+' و '+a[a.length-1];

export function explainPurchase(f:F,s:St,items:Item[],extra:{decision?:string;inRoutine?:boolean}={}):Explain{
  const used=new Map<string,GuideSrc>();const cite=(l:GuideSrc[])=>l.forEach(x=>used.set(x.u,x));
  const you:string[]=[];const notes:string[]=[];
  const g=GOAL_MAP.find(x=>x.re.test(s.goal));
  const fTime:'am'|'pm'=f.role==='sunscreen'?'am':'pm';
  const others=items.filter(x=>x.id!==f.id&&x.f);

  // 1. the person's own skin
  const mine=[s.oily&&s.dry?'combination':s.oily?'oily':s.dry?'dry':/نرمال/.test(s.skinLabel)?'normal':''].filter(Boolean)[0]||'';
  const claimed=f.claims.filter(c=>SKIN_FA[c]).map(c=>SKIN_FA[c]);
  if(s.skinLabel){
    if(mine&&f.claims.includes(mine))you.push('پوستت '+s.skinLabel+'ه و برند هم این محصول رو برای پوست '+SKIN_FA[mine]+' معرفی کرده.');
    else if(f.claims.includes('all'))you.push('برند این محصول رو برای همه‌ی نوع پوست‌ها معرفی کرده؛ پوست '+s.skinLabel+' تو هم جزوشه.');
    else if(claimed.length)you.push('برند این محصول رو برای پوست '+joinFa(claimed)+' معرفی کرده، و پوست تو '+s.skinLabel+'ه.');
    else you.push('برند نوع پوست خاصی براش ننوشته؛ با پوست '+s.skinLabel+' تو و ترکیباتش سنجیدمش.');
  }
  if(s.oily&&leave(f)&&(f.texture==='rich-cream'||f.flags.includes('rich_oils')))you.push('بافتش غنی و روغنیه؛ روی پوست چرب معمولاً سنگین حس می‌شه.');
  if(s.dry&&!s.oily&&(f.finish==='matte'||f.flags.includes('soap_base')))you.push(f.flags.includes('soap_base')?'پایه‌ی صابونی داره و پوست خشک رو کشیده‌تر می‌کنه.':'پایان مات داره که برای جذب چربی ساخته شده؛ پوست خشک بهش نیاز نداره.');
  // 2. the person's goal
  if(g&&f.role!=='sunscreen'){
    const act=f.actives.filter(a=>g.cls.includes(a.cls)).map(a=>(ACTIVE_INFO[a.cls]?.name||NAME_ONLY[a.cls]||a.cls).replace(/ \(.*\)$/,''));
    if(act.length)you.push('هدفت '+g.label+'ه و این محصول '+joinFa([...new Set(act)])+' داره که برای همین کار استفاده می‌شه.');
    else if(f.claims.some(c=>g.claims.includes(c)))you.push('هدفت '+g.label+'ه و برند این محصول رو برای همین معرفی کرده، ولی ماده‌ی اصلی‌ای که مستقیم این کار رو بکنه توی فهرستش ندیدم.');
    else if(['serum','treatment','spot'].includes(f.role))you.push('هدفت '+g.label+'ه، ولی این محصول برای این هدف ساخته نشده.');
  }
  if(extra.inRoutine)you.unshift('این محصول همین الان تو روتینته؛ این بررسی به درد وقتی می‌خوره که می‌خوای دوباره بخریش.');
  if(s.compromised)you.push('امروز پوستت رو تحریک‌شده ثبت کردی؛ برای همین هر چیزی که لایه‌برداری یا تحریک کنه رو سخت‌گیرانه‌تر سنجیدم.');
  if(f.role==='sunscreen'&&f.spf)you.push('ضدآفتابه با SPF '+String(f.spf).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)])+'؛ جاش در روتین صبحه.');

  // 3. what is inside, and what it means for this person
  const seen=new Set<string>();const actives:Explain['actives']=[];
  const sunAm=others.some(x=>x.f.role==='sunscreen'&&x.time==='am');
  for(const a of f.actives){
    const key=a.cls==='VITC_LAA'?'VITC':a.cls;if(seen.has(key))continue;seen.add(key);
    const info=ACTIVE_INFO[key];
    if(!info){if(NAME_ONLY[key]&&!['SOOTHING','ZINC','PEPTIDE'].includes(key))actives.push({name:NAME_ONLY[key],what:'',nameOnly:true});continue;}
    if(['HUMECTANT','CERAMIDE'].includes(key)&&!(s.dry||/آبرسانی|محافظ/.test(s.goal)||s.compromised||f.role==='moisturizer'))continue;
    cite(info.src);const forYou:string[]=[];
    if(key==='RETINOID'){
      if(s.pregnancy)forYou.push('در پروفایلت بارداری یا شیردهی ثبت شده؛ بعضی رتینوئیدها در این دوره منع مصرف دارن، پس فقط با نظر پزشک.');
      if(s.compromised)forYou.push('پوستت الان تحریک‌شده‌ست؛ بهتره اول آروم بشه.');
      else if(s.dry||s.sensitive)forYou.push('پوستت '+(s.dry?'خشکه':'حساسه')+'؛ احتمال خشکی و پوسته بیشتره، همراه مرطوب‌کننده بزن.');
      if(!sunAm)forYou.push('تو روتین صبحت ضدآفتاب ندیدم؛ با رتینوئید لازمه.');
    }
    if(key==='BHA'){
      if(s.compromised&&leave(f))forYou.push('روی پوست تحریک‌شده‌ی الانت نباید زده بشه.');
      else if(s.oily||s.acne)forYou.push('برای پوست '+(s.acne?'جوش‌دار':'چرب')+' تو همین کاربرد رو داره.');
      else if(s.dry)forYou.push('پوست خشک بدون جوش معمولاً بهش نیاز نداره.');
      if(f.rinseOff)forYou.push('چون شوینده‌ست و آبکشی می‌شه، تماسش با پوست کوتاهه.');
    }
    if(key==='AHA'&&s.compromised&&leave(f))forYou.push('روی پوست تحریک‌شده‌ی الانت فعلاً نه.');
    if(key==='AZELAIC'&&(s.acne||/لک|قرمزی|جوش/.test(s.goal)))forYou.push('با وضعیت پوستت (جوش، لک یا قرمزی) جوره.');
    if(key==='AZELAIC'&&s.sensitive)forYou.push('پوستت حساسه؛ ممکنه اولش کمی بسوزونه.');
    if(key==='VITC'&&f.actives.some(x=>x.cls.startsWith('VITC')&&(x.pct||0)>20))forYou.push('غلظتش بالای ۲۰٪ ثبت شده؛ طبق منبع، این مقدار اثر بیشتری نداره و فقط احتمال تحریک رو بالا می‌بره.');
    if(key==='HUMECTANT'&&s.dry)forYou.push('برای پوست خشکت مفیده.');
    actives.push({name:info.name,what:info.what,care:info.care,forYou:forYou.join(' ')||undefined});
  }
  if(f.flags.includes('fragrance')||f.flags.includes('essential_oil')){
    cite([S.FRAG]);const word=f.flags.includes('fragrance')?'عطر':'اسانس گیاهی';
    if(s.sensitive||s.compromised||s.fragranceAvoid)notes.push(word+' داره. عطر بعد از نیکل شایع‌ترین علت حساسیت تماسی پوسته و تو '+(s.fragranceAvoid?'عطر رو خط قرمزت گذاشتی':'پوستت رو حساس یا تحریک‌شده ثبت کردی')+'. اگه باز هم خواستی امتحانش کنی، دو هفته روزی دو بار یه کم روی ساعدت بزن و اگه قرمزی یا خارش زد کنارش بذار.');
    else notes.push(word+' داره؛ تو حساسیت ثبت نکردی، پس دلیل رد کردنش نیست، ولی اگه قرمزی یا خارش دیدی اولین مشکوک همینه.');
  }
  if(f.basis==='declared_name')notes.push('فهرست کامل ترکیبات همین نسخه هنوز ثبت نشده؛ این جواب از روی اسم و ادعای برنده و برای همین قطعی نیست.');

  // 4. against the person's own routine
  const pairs:Explain['pairs']=[];
  const add=(kind:string,w:Item[],title?:string)=>{const p=PAIR_INFO[kind];if(!p||!w.length)return;cite(p.src);pairs.push({title:title||p.title,why:p.why,todo:p.todo,with:w.map(x=>x.name)})};
  const same=others.filter(x=>x.time===fTime);
  const retF=leave(f)&&hasC(f,'RETINOID');
  if(retF){
    add('ret_acid',same.filter(x=>acidLeave(x.f)));
    add('ret_ret',same.filter(x=>leave(x.f)&&hasC(x.f,'RETINOID')));
    add('ret_aze',same.filter(x=>leave(x.f)&&hasC(x.f,'AZELAIC')));
    add('ret_wash',same.filter(x=>x.f.rinseOff&&hasC(x.f,'BHA')));
  }
  if(acidLeave(f)){
    add('ret_acid',same.filter(x=>leave(x.f)&&hasC(x.f,'RETINOID')));
    add('acid_acid',same.filter(x=>acidLeave(x.f)));
    add('vitc_acid',same.filter(x=>vitcPure(x.f)));
    add('bha_wash',hasC(f,'BHA')?same.filter(x=>x.f.rinseOff&&hasC(x.f,'BHA')):[]);
  }
  if(f.rinseOff&&hasC(f,'BHA')){add('ret_wash',same.filter(x=>leave(x.f)&&hasC(x.f,'RETINOID')));add('bha_wash',same.filter(x=>acidLeave(x.f)&&hasC(x.f,'BHA')));}
  if(leave(f)&&hasC(f,'AZELAIC'))add('ret_aze',same.filter(x=>leave(x.f)&&hasC(x.f,'RETINOID')));
  if(vitcPure(f))add('vitc_acid',others.filter(x=>acidLeave(x.f)&&x.time==='am'));
  if(anyC(f,['VITAMIN_B3'])||anyC(f,['VITC','VITC_LAA','VITC_DERIV'])){
    const want=hasC(f,'VITAMIN_B3')?['VITC','VITC_LAA','VITC_DERIV']:['VITAMIN_B3'];
    if(!(hasC(f,'VITAMIN_B3')&&anyC(f,['VITC','VITC_LAA','VITC_DERIV'])))add('niac_vitc',same.filter(x=>anyC(x.f,want)));
  }
  if(retF&&s.pregnancy)add('preg_ret',[{id:f.id,name:f.name,time:fTime,f}]);
  if(!['treatment','serum','spot'].includes(f.role)){const dup=same.filter(x=>x.f.role===f.role&&!(f.role==='cleanser'&&x.f.claims.includes('eye')));add('dup_role',dup,'دو '+(ROLE_ONE[f.role]||'محصول هم‌نقش')+' در یک نوبت');}
  const flagged=new Set(pairs.flatMap(p=>p.with));
  const fine=others.filter(x=>!flagged.has(x.name)).map(x=>q(x.name));
  const clean=f.basis==='declared_name'&&others.length?'چون فهرست کامل ترکیباتش هنوز ثبت نشده، درباره‌ی تداخلش با روتینت نمی‌تونم قطعی چیزی بگم.':!others.length?(extra.inRoutine?'به‌جز خود همین محصول، چیز دیگه‌ای تو روتینت ثبت نشده.':'روتینت هنوز خالیه؛ فقط با پوست و هدفت سنجیدمش.'):fine.length?'کنار '+joinFa(fine.slice(0,4))+(fine.length>4?' و '+String(fine.length-4).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)])+' محصول دیگه‌ی روتینت':'')+' تداخل شناخته‌شده‌ای نداره.':'';
  return {you:you.slice(0,4),actives:actives.slice(0,6),pairs,clean,notes,sources:[...used.values()]};
}
