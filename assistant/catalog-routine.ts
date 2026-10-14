// Deterministic routine check built only on BeautyWallet's own catalog formulas.
// It needs no AI provider and no web search, so it cannot fail on provider KYC,
// quota or search-source limits. The same file is transpiled into
// public/legacy/catalog-routine.js (scripts/build-catalog-routine.mjs) for the browser.
// Keep it dependency-free: no imports.

export type Active={cls:string;name:string;pct?:number;declared?:boolean};
export type Formula={id:string;name:string;en?:string;cat?:string;role:string;rinseOff:boolean;texture:string;finish?:string;spf?:number;filters?:string;actives:Active[];claims:string[];flags:string[];basis:'inci_sourced'|'declared_name';sources:string[];checked?:string;inci?:string;note?:string};
export type CatalogFormulas={version:string;products:Formula[]};
export type Slot='am'|'pm';
export type SelectionItem={id:string;name?:string;time?:string};
export type Action='keep'|'pause'|'replace'|'verify'|'professional';
export type PlanAction={id:string;name:string;action:Action;reason:string;schedule?:string;alternatives?:Suggestion[]};
export type Suggestion={id:string;name:string;owned:boolean;why:string};
export type Finding={severity:'info'|'caution'|'avoid';text:string;ids:string[]};
export type RoutineCheck={
  engine:string;catalogVersion:string;state:SkinState;lead:string;reasons:string[];
  fit:Finding[];interactions:Finding[];actions:PlanAction[];gaps:Array<{role:string;text:string;suggestions:Suggestion[]}>;
  reintroduce:string[];purchaseNeeded:boolean;coverage:{sourced:string[];declared:string[];unknown:string[]};text:string;
};
type SkinState={oily:boolean;dry:boolean;compromised:boolean;suspectBarrier:boolean;sensitive:boolean;acne:boolean;pregnancy:boolean;medical:boolean;fragranceAvoid:boolean;whiteCastAvoid:boolean;skinLabel:string;goal:string};

export const CATALOG_ROUTINE_ENGINE='catalog-routine-2026-10-13.1';

const list=(v:unknown):string[]=>Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'):[];
const str=(v:unknown)=>typeof v==='string'?v:typeof v==='number'?String(v):'';
const has=(f:Formula,cls:string)=>f.actives.some(a=>a.cls===cls);
const flag=(f:Formula,name:string)=>f.flags.includes(name);
const pct=(f:Formula,cls:string)=>Math.max(0,...f.actives.filter(a=>a.cls===cls&&typeof a.pct==='number').map(a=>a.pct as number));
const leaveOn=(f:Formula)=>!f.rinseOff;
const CLASS_FA:Record<string,string>={RETINOID:'رتینوئید',AHA:'AHA',BHA:'سالیسیلیک اسید (BHA)',PHA:'PHA',AZELAIC:'آزلائیک اسید',VITAMIN_B3:'نیاسینامید',VITC:'ویتامین C',VITC_LAA:'ویتامین C خالص',VITC_DERIV:'مشتق ویتامین C',TXA:'ترانگزامیک اسید',ARBUTIN:'آربوتین',CYSTEAMINE:'سیستئامین',ENZYME:'آنزیم لایه‌بردار',ZINC:'زینک',HUMECTANT:'آبرسان',CERAMIDE:'سرامید',SOOTHING:'آرام‌بخش',PEPTIDE:'پپتید',BAKUCHIOL:'باکوچیول'};
const ROLE_FA:Record<string,string>={cleanser:'شوینده',micellar:'میسلار',toner:'تونر',serum:'سرم',treatment:'درمان موضعی',spot:'ژل موضعی',moisturizer:'مرطوب‌کننده',sunscreen:'ضدآفتاب',mask:'ماسک',eye:'دور چشم',lash:'مژه و ابرو'};

export function skinState(profile:Record<string,unknown>):SkinState{
  const skin=str(profile.skinBase),today=str(profile.skinToday),barrier=str(profile.barrier),symptoms=list(profile.symptoms),concerns=list(profile.concerns);
  const flags=list(profile.safetyFlags),avoid=list(profile.sensoryAvoid),dealbreaker=str(profile.dealbreaker),goal=str(profile.goal1)||str(profile.primaryGoal);
  const irritated=/تحریک|قرمز/.test(today)||symptoms.some(s=>/سوزش|قرمزی|پوسته|خارش/.test(s));
  return {
    oily:/چرب|مختلط/.test(skin)||/چرب/.test(today),
    dry:/خشک/.test(skin)||/خشک/.test(today),
    compromised:/آسیب/.test(barrier)||irritated,
    suspectBarrier:/مشکوک/.test(barrier),
    sensitive:str(profile.sensitivity)==='زیاد'||concerns.some(c=>/حساس|قرمز/.test(c)),
    acne:/جوش/.test(today)||symptoms.some(s=>/جوش/.test(s))||/جوش/.test(goal),
    pregnancy:flags.some(f=>/باردار|شیرده/.test(f)),
    medical:flags.some(f=>/درمان پزشکی|دارو|بیماری پوستی|زخم|واکنش شدید|کلینیکی/.test(f)),
    fragranceAvoid:/عطر/.test(dealbreaker)||avoid.some(a=>/بو/.test(a)),
    whiteCastAvoid:/سفیدک/.test(dealbreaker)||avoid.some(a=>/سفیدک/.test(a)),
    skinLabel:skin&&skin!=='مطمئن نیستم'?skin:'',goal
  };
}

// Leave-on irritation weight from declared/sourced actives. Rinse-off is lower.
function strength(f:Formula){
  if(f.rinseOff){let s=0;if(has(f,'BHA')||has(f,'AHA'))s+=1;if(flag(f,'soap_base'))s+=1;if(has(f,'ENZYME'))s+=0.5;return s;}
  let s=0;
  if(has(f,'RETINOID'))s=Math.max(s,3);
  if(has(f,'CYSTEAMINE'))s=Math.max(s,3);
  if(has(f,'AHA')||has(f,'BHA'))s=Math.max(s,f.role==='spot'?1:f.role==='treatment'||pct(f,'BHA')>=1||pct(f,'AHA')>=5?3:1.5);
  if(has(f,'AZELAIC'))s=Math.max(s,pct(f,'AZELAIC')>=10?2:1);
  if(has(f,'VITC')&&pct(f,'VITC')>=15||flag(f,'high_strength'))s=Math.max(s,2);
  if(has(f,'VITC_LAA')&&f.role==='serum')s=Math.max(s,2);
  if(flag(f,'actives_undeclared')||flag(f,'exfoliating_undeclared'))s=Math.max(s,1);
  return s;
}
const scented=(f:Formula)=>flag(f,'fragrance')||flag(f,'essential_oil');
export const faDigits=(v:string|number)=>String(v).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]).replace(/\./g,'٫');
const activeLabel=(f:Formula)=>{const seen=new Map<string,string>();for(const a of f.actives){if(['HUMECTANT','SOOTHING','CERAMIDE','ZINC','PEPTIDE'].includes(a.cls))continue;const label=(CLASS_FA[a.cls]||a.name)+(a.declared&&a.pct?' '+faDigits(a.pct)+'٪':'');const key=a.cls.startsWith('VITC')?'VITC':a.cls;if(!seen.has(key))seen.set(key,label);}return [...seen.values()].join(' + ');};
export function captionFor(f:Formula|undefined){
  if(!f)return 'در کاتالوگ فرمول ثبت نشده';
  const actives=activeLabel(f);
  const role=f.role==='sunscreen'?'ضدآفتاب'+(f.spf?' SPF'+faDigits(f.spf):''):'';
  const base=[role,actives].filter(Boolean).join(' · ')||(ROLE_FA[f.role]||f.role);
  const scent=flag(f,'fragrance')?' · عطر دارد':flag(f,'essential_oil')?' · اسانس دارد':'';
  return base+(f.rinseOff&&actives?' · آبکشی':'')+scent+(f.basis==='declared_name'?' · از روی نام؛ فهرست بسته ثبت نشده':'');
}

function suitsSkin(f:Formula,s:SkinState){
  // Returns a reason string when the product may not suit this skin, else ''.
  const claims=f.claims;const onlyDry=claims.includes('dry')&&!claims.includes('oily')&&!claims.includes('all');
  if(s.oily){
    if(f.role==='sunscreen'&&(onlyDry||flag(f,'moisture_rich')||f.finish==='dewy'))return f.finish==='dewy'?'پایان براق (dewy) دارد و برای پوست خشک/بالغ معرفی شده':'برای پوست خشک معرفی شده و بافت کرمی و مرطوب‌کننده دارد';
    if(leaveOn(f)&&f.role!=='sunscreen'&&(flag(f,'rich_oils')||f.texture==='rich-cream'))return 'بافت غنی و روغن‌دار دارد';
    if(leaveOn(f)&&onlyDry&&f.role==='moisturizer')return 'برای پوست خشک معرفی شده';
  }
  if(s.dry&&!s.oily){
    if(flag(f,'soap_base'))return 'پایه صابونی دارد و ممکن است پوست خشک را کشیده‌تر کند';
    if(f.role==='sunscreen'&&f.finish==='matte'&&claims.includes('oily')&&!claims.includes('all'))return 'برای کنترل چربی و پایان مات طراحی شده';
  }
  if(s.whiteCastAvoid&&f.filters==='mineral'&&!flag(f,'tinted'))return 'فیلتر فیزیکال بی‌رنگ ممکن است سفیدک بگذارد';
  return '';
}
function fitScore(f:Formula,s:SkinState){
  let score=0;const c=f.claims;
  if(s.oily&&(c.includes('oily')||c.includes('acne')))score+=3;
  if(s.oily&&c.includes('dry')&&!c.includes('oily'))score-=2;
  if(s.dry&&!s.oily&&c.includes('oily')&&!c.includes('dry'))score-=2;
  if(s.dry&&c.includes('dry'))score+=3;
  if((s.compromised||s.sensitive)&&(c.includes('sensitive')||c.includes('damaged')))score+=3;
  if(c.includes('all'))score+=1;
  if(f.basis==='inci_sourced')score+=2;
  if(scented(f))score-=(s.compromised||s.sensitive||s.fragranceAvoid)?6:1;
  if(suitsSkin(f,s))score-=6;
  if(strength(f)>=1.5)score-=s.compromised?6:1;
  if(flag(f,'soap_base'))score-=s.compromised||s.dry?4:1;
  return score;
}
function gentleCleanser(f:Formula){return (f.role==='cleanser'||f.role==='micellar')&&!has(f,'BHA')&&!has(f,'AHA')&&!has(f,'ENZYME')&&!flag(f,'soap_base')&&!f.claims.includes('eye');}

function suggest(formulas:Formula[],s:SkinState,role:string,exclude:Set<string>,owned:Set<string>,extra:(f:Formula)=>boolean=()=>true,max=2):Suggestion[]{
  const pool=formulas.filter(f=>{
    if(exclude.has(f.id))return false;
    if(role==='gentle-cleanser'){if(!gentleCleanser(f))return false;}else if(f.role!==role)return false;
    if(!extra(f))return false;
    if(suitsSkin(f,s))return false;
    if((s.compromised||s.fragranceAvoid||s.sensitive)&&scented(f))return false;
    if(s.compromised&&strength(f)>=1.5)return false;
    return true;
  }).sort((a,b)=>(Number(owned.has(b.id))-Number(owned.has(a.id)))||(fitScore(b,s)-fitScore(a,s)));
  return pool.slice(0,max).map(f=>({id:f.id,name:f.name,owned:owned.has(f.id),why:whyGood(f,s)}));
}
function whyGood(f:Formula,s:SkinState){
  const bits:string[]=[];
  if(f.role==='sunscreen'){if(f.spf)bits.push('SPF'+f.spf);if(f.texture==='light-fluid'||f.texture==='serum'||f.texture==='fluid')bits.push('بافت سبک');if(f.finish==='matte')bits.push('پایان مات');}
  if(f.role==='moisturizer'){if(/watery|gel|light|fluid/.test(f.texture))bits.push('بافت سبک');if(has(f,'CERAMIDE'))bits.push('سرامید برای لایه محافظ');if(has(f,'VITAMIN_B3'))bits.push('نیاسینامید');}
  if(gentleCleanser(f))bits.push('بدون اسید و پایه صابونی');
  if(!scented(f))bits.push('بدون عطر در فهرست');
  if(s.oily&&(f.claims.includes('oily')||f.claims.includes('acne')))bits.push('برای پوست چرب معرفی شده');
  if(f.basis==='declared_name')bits.push('فرمول بسته هنوز ثبت نشده');
  return bits.join('، ');
}

const normTime=(t:unknown):Slot=>t==='am'||t==='صبح'?'am':'pm';
const slotFa=(t:Slot)=>t==='am'?'صبح':'شب';

export function evaluateRoutine(input:{profile?:Record<string,unknown>;selection:SelectionItem[];owned?:string[]},catalog:CatalogFormulas):RoutineCheck{
  const formulas=catalog.products;const byId=new Map(formulas.map(f=>[f.id,f]));
  const s=skinState(input.profile||{});const owned=new Set(list(input.owned));
  const items=input.selection.filter((x,i,a)=>x&&typeof x.id==='string'&&a.findIndex(y=>y.id===x.id)===i).slice(0,20).map(x=>({id:x.id,name:x.name||byId.get(x.id)?.name||x.id,time:normTime(x.time),f:byId.get(x.id)}));
  const selected=new Set(items.map(x=>x.id));
  const plan=new Map<string,PlanAction>();const fit:Finding[]=[];const interactions:Finding[]=[];const gaps:RoutineCheck['gaps']=[];const reintroduce:string[]=[];
  const set=(id:string,action:Action,reason:string,extra:Partial<PlanAction>={})=>{const own=items.find(x=>x.id===id)!;const prev=plan.get(id);const rank={keep:0,verify:1,replace:2,pause:3,professional:4};if(prev&&rank[prev.action]>rank[action]){if(extra.schedule&&!prev.schedule)prev.schedule=extra.schedule;return;}plan.set(id,{id,name:own.name,action,reason,...(prev?.alternatives&&!extra.alternatives?{alternatives:prev.alternatives}:{}),...extra});};

  // 1. Unknown products: cannot be judged from the catalog.
  for(const x of items)if(!x.f)set(x.id,'verify','این محصول در کاتالوگ BeautyWallet فرمول ندارد؛ نام کامل و فهرست ترکیبات پشت بسته لازم است');
  const known=items.filter(x=>x.f) as Array<{id:string;name:string;time:Slot;f:Formula}>;

  // 2. Safety context first.
  for(const x of known){
    if(s.pregnancy&&(has(x.f,'RETINOID')||has(x.f,'CYSTEAMINE')))set(x.id,'professional',CLASS_FA[has(x.f,'RETINOID')?'RETINOID':'CYSTEAMINE']+' دارد؛ در بارداری یا شیردهی ادامه‌اش را فقط با نظر پزشک تصمیم بگیر');
    else if(s.medical&&strength(x.f)>=2)set(x.id,'professional',activeLabel(x.f)+' دارد و در پروفایلت درمان یا داروی مؤثر بر پوست ثبت شده؛ هم‌زمانی را با پزشک یا داروساز هماهنگ کن');
  }

  // 3. Irritated or damaged barrier: pause strong leave-on actives, swap harsh cleansers, drop scent.
  const strongPaused:Array<{x:typeof known[number];score:number}>=[];
  if(s.compromised){
    for(const x of known){
      const st=strength(x.f);
      if(leaveOn(x.f)&&st>=1.5){strongPaused.push({x,score:st});set(x.id,'pause',activeLabel(x.f)+' اکتیو قوی است و با سوزش/قرمزی یا لایه محافظ آسیب‌دیده‌ای که ثبت کردی، فعلاً فشار اضافه می‌آورد؛ این توقف موقت است');}
      else if(x.f.rinseOff&&(has(x.f,'BHA')||has(x.f,'AHA')||flag(x.f,'soap_base')||has(x.f,'ENZYME'))){
        const alt=suggest(formulas,s,'gentle-cleanser',selected,owned);
        set(x.id,'replace',(has(x.f,'BHA')?'شوینده سالیسیلیک':flag(x.f,'soap_base')?'شوینده با پایه صابونی':'شوینده لایه‌بردار')+' هر بار روی پوست تحریک‌شده اثر می‌گذارد؛ تا آرام شدن پوست یک شوینده ملایم بدون اسید بهتر است',{alternatives:alt});
      }else if(leaveOn(x.f)&&scented(x.f)&&x.f.role!=='sunscreen')set(x.id,'pause',(flag(x.f,'fragrance')?'عطر':'اسانس گیاهی')+' دارد و برای پوست تحریک‌شده ضروری نیست'+(flag(x.f,'rich_oils')&&s.oily?'؛ بافت روغنی‌اش هم برای پوست چرب سنگین است':''));
      else if(x.f.role==='sunscreen'&&scented(x.f)){const alt=suggest(formulas,s,'sunscreen',selected,owned);set(x.id,'replace','ضدآفتاب لازم است ولی این یکی '+(flag(x.f,'fragrance')?'عطر':'اسانس')+' دارد؛ تا جایگزین بدون عطر نگرفتی، استفاده از همین را قطع نکن',{alternatives:alt});}
    }
    if(strongPaused.length){
      // Order of return: gentlest acne/pigment active first, retinoid later, one at a time.
      const order=strongPaused.sort((a,b)=>a.score-b.score||(has(a.x.f,'AZELAIC')?-1:0));
      reintroduce.push('وقتی حدود دو هفته سوزش، قرمزی و پوسته‌ریزی نداشتی، فقط '+order[0].x.name+' را یک شب در میان برگردان');
      for(const next of order.slice(1))reintroduce.push('اگر دو هفته خوب ماند، '+next.x.name+' را در شب‌های جدا، دو شب در هفته اضافه کن');
    }
  }

  // 4. Skin-type fit (separate from chemistry). A label is a reason to check, not proof of breakouts.
  for(const x of known){
    const reason=suitsSkin(x.f,s);
    if(!reason)continue;
    const label=s.skinLabel?'پوست '+s.skinLabel:'پوست تو';
    const alt=suggest(formulas,s,x.f.role,selected,owned);
    fit.push({severity:s.acne?'caution':'info',text:x.name+': '+reason+'؛ برای '+label+(s.acne?' با جوش فعال':'')+' بهتر است گزینه سبک‌تر باشد',ids:[x.id]});
    if(s.acne||x.f.role==='sunscreen'&&s.oily)set(x.id,'replace',reason+'؛ برای '+label+(s.acne?' و جوش فعال':'')+' گزینه سبک‌تر مناسب‌تر است. این به معنی جوش‌زا بودن قطعی نیست'+(x.f.role==='sunscreen'?'؛ تا جایگزین نداری، ضدآفتاب را قطع نکن':''),{alternatives:alt});
    else set(x.id,'keep','می‌تواند بماند، اما '+reason+'؛ اگر براقی، سنگینی یا جوش تازه دیدی، سراغ گزینه سبک‌تر برو',{alternatives:alt});
  }
  if(s.fragranceAvoid)for(const x of known)if(scented(x.f)&&!plan.has(x.id))set(x.id,'replace',(flag(x.f,'fragrance')?'عطر':'اسانس')+' دارد و «عطر زیاد» در خط قرمز تو ثبت شده',{alternatives:suggest(formulas,s,x.f.role,selected,owned)});

  // 5. Chemistry and timing for actives that remain in use.
  const active=(x:typeof known[number])=>{const a=plan.get(x.id);return !a||a.action==='keep'||a.action==='verify';};
  for(const x of known)if(x.time==='am'&&has(x.f,'RETINOID')&&active(x)){interactions.push({severity:'caution',text:x.name+' رتینوئید دارد؛ آن را به روتین شب منتقل کن',ids:[x.id]});set(x.id,'keep','رتینوئید است؛ فقط شب استفاده شود',{schedule:'فقط شب'});x.time='pm';}
  for(const x of known)if(x.time==='pm'&&x.f.role==='sunscreen')interactions.push({severity:'info',text:x.name+' ضدآفتاب است و جایش در روتین صبح است',ids:[x.id]});
  for(const slot of ['am','pm'] as Slot[]){
    const inSlot=known.filter(x=>x.time===slot&&active(x));
    const retinoid=inSlot.filter(x=>leaveOn(x.f)&&has(x.f,'RETINOID'));
    const acids=inSlot.filter(x=>leaveOn(x.f)&&(has(x.f,'AHA')||has(x.f,'BHA'))&&x.f.role!=='spot'&&strength(x.f)>=1.5);
    const azelaic=inSlot.filter(x=>leaveOn(x.f)&&has(x.f,'AZELAIC')&&pct(x.f,'AZELAIC')>=10);
    const vitc=inSlot.filter(x=>leaveOn(x.f)&&strength(x.f)>=2&&(has(x.f,'VITC')||has(x.f,'VITC_LAA')));
    const cyst=inSlot.filter(x=>has(x.f,'CYSTEAMINE'));
    const careful=s.suspectBarrier||s.sensitive;
    if(retinoid.length&&acids.length){
      interactions.push({severity:'caution',text:retinoid.map(x=>x.name).join('، ')+' و '+acids.map(x=>x.name).join('، ')+' در یک '+slotFa(slot)+'؛ تداخل شیمیایی مطلق نیست ولی تحریک تجمعی بالا می‌رود',ids:[...retinoid,...acids].map(x=>x.id)});
      retinoid.forEach(x=>set(x.id,'keep','رتینوئید را نگه دار ولی با لایه‌بردار هم‌شب نکن',{schedule:'شب‌های زوج'}));
      acids.forEach(x=>set(x.id,'keep','لایه‌بردار را با رتینوئید در یک شب نزن',{schedule:'شب‌های فرد'}));
    }
    if(acids.length>1){
      interactions.push({severity:'caution',text:'چند لایه‌بردار ماندگار در یک '+slotFa(slot)+': '+acids.map(x=>x.name).join('، '),ids:acids.map(x=>x.id)});
      acids.slice(1).forEach(x=>set(x.id,'pause','با '+acids[0].name+' هم‌پوشانی دارد؛ یک لایه‌بردار ماندگار کافی است'));
    }
    if(retinoid.length&&azelaic.length){
      interactions.push({severity:careful?'caution':'info',text:retinoid.map(x=>x.name).join('، ')+' و '+azelaic.map(x=>x.name).join('، ')+' تداخل شیمیایی ندارند'+(careful?'؛ ولی با لایه محافظ مشکوک یا پوست حساس، شب‌ها را جدا کن':'؛ اگر سوزش دیدی شب‌ها را جدا کن'),ids:[...retinoid,...azelaic].map(x=>x.id)});
      if(careful){retinoid.forEach(x=>{if(!plan.get(x.id)?.schedule)set(x.id,'keep','با آزلائیک در یک شب نزن',{schedule:'شب‌های زوج'});});azelaic.forEach(x=>set(x.id,'keep','با رتینوئید در یک شب نزن',{schedule:'شب‌های فرد'}));}
    }
    if(vitc.length&&acids.length)interactions.push({severity:'caution',text:'ویتامین C قوی و لایه‌بردار در یک '+slotFa(slot)+'؛ برای کم کردن سوزش در دو نوبت جدا استفاده کن',ids:[...vitc,...acids].map(x=>x.id)});
    if(cyst.length&&inSlot.length>cyst.length)interactions.push({severity:'caution',text:cyst.map(x=>x.name).join('، ')+' تماس کوتاه دارد؛ طبق زمان روی بسته بشوی و هم‌زمان اکتیو دیگری نزن',ids:cyst.map(x=>x.id)});
    const bhaWash=inSlot.filter(x=>x.f.rinseOff&&has(x.f,'BHA')),bhaLeave=inSlot.filter(x=>leaveOn(x.f)&&has(x.f,'BHA')&&strength(x.f)>=1.5);
    if(bhaWash.length&&bhaLeave.length)interactions.push({severity:'info',text:bhaWash[0].name+' آبکشی می‌شود ولی کنار '+bhaLeave[0].name+' برای پوست حساس زیاد است',ids:[bhaWash[0].id,bhaLeave[0].id]});
    const vit=inSlot.filter(x=>has(x.f,'VITAMIN_B3')),c=inSlot.filter(x=>has(x.f,'VITC')||has(x.f,'VITC_LAA')||has(x.f,'VITC_DERIV'));
    if(vit.length&&c.length&&vit.some(v=>!c.includes(v)))interactions.push({severity:'info',text:'نیاسینامید و ویتامین C با هم مشکل ثابت‌شده‌ای ندارند؛ فقط اگر قرمزی دیدی جدا کن',ids:[...vit,...c].map(x=>x.id)});
    for(const role of ['sunscreen','cleanser']){const same=inSlot.filter(x=>x.f.role===role&&!(role==='cleanser'&&x.f.claims.includes('eye')));if(same.length>1)interactions.push({severity:'info',text:'دو '+ROLE_FA[role]+' در '+slotFa(slot)+': '+same.map(x=>x.name).join('، ')+'؛ در یک نوبت یکی کافی است',ids:same.map(x=>x.id)});}
  }

  // 6. Gaps: what the routine is missing. Prefer what the user already owns.
  const live=known.filter(x=>{const a=plan.get(x.id);return !a||a.action!=='pause';});
  const amSun=known.some(x=>x.f.role==='sunscreen'&&x.time==='am');
  const exfoliating=live.some(x=>leaveOn(x.f)&&(has(x.f,'RETINOID')||has(x.f,'AHA')||has(x.f,'BHA')||has(x.f,'AZELAIC')));
  if(!amSun&&known.length){const sug=suggest(formulas,s,'sunscreen',selected,owned);gaps.push({role:'sunscreen',text:exfoliating?'اکتیو داری ولی ضدآفتاب صبح در روتین نیست؛ اولویت اول ضدآفتاب است':'ضدآفتاب صبح در روتین دیده نمی‌شود',suggestions:sug});}
  const hasMoist=live.some(x=>x.f.role==='moisturizer'||x.f.actives.some(a=>a.cls==='CERAMIDE'&&leaveOn(x.f)));
  if(!hasMoist&&(s.compromised||s.dry||live.some(x=>has(x.f,'RETINOID'))||known.length>=3)){const sug=suggest(formulas,s,'moisturizer',selected,owned,f=>s.compromised?has(f,'CERAMIDE')||has(f,'HUMECTANT'):true);gaps.push({role:'moisturizer',text:s.compromised?'برای ترمیم لایه محافظ یک مرطوب‌کننده ساده و بدون عطر لازم است':'مرطوب‌کننده در روتین دیده نمی‌شود',suggestions:sug});}
  const needsCleanser=[...plan.values()].some(a=>a.action==='replace'&&byId.get(a.id)?.rinseOff);
  const cleanserAltShown=[...plan.values()].some(a=>a.action==='replace'&&byId.get(a.id)?.rinseOff&&(a.alternatives||[]).length);
  if(needsCleanser&&!cleanserAltShown&&!live.some(x=>gentleCleanser(x.f)))gaps.push({role:'cleanser',text:'به‌جای شوینده فعلی، شوینده ملایم بدون اسید',suggestions:suggest(formulas,s,'gentle-cleanser',selected,owned)});

  // 7. Everything else gets a concrete, personal keep or verify.
  for(const x of known){
    if(plan.has(x.id))continue;
    const why=keepReason(x.f,s);
    if(x.f.basis==='declared_name')set(x.id,'verify',why+'؛ فرمول این نسخه فقط از روی نام ثبت شده، فهرست ترکیبات پشت بسته را ثبت کن تا تأیید شود');
    else set(x.id,'keep',why);
  }
  for(const a of plan.values()){const f=byId.get(a.id);if(a.action==='keep'&&f?.basis==='declared_name'){a.action='verify';a.reason+='؛ فهرست ترکیبات این نسخه هنوز ثبت نشده';}}

  const actions=items.map(x=>plan.get(x.id)!).filter(Boolean);
  const coverage={sourced:known.filter(x=>x.f.basis==='inci_sourced').map(x=>x.id),declared:known.filter(x=>x.f.basis==='declared_name').map(x=>x.id),unknown:items.filter(x=>!x.f).map(x=>x.id)};
  // Essential = missing sunscreen, barrier moisturizer on irritated skin, or a gentle cleanser when the current one must go.
  const essential=gaps.filter(g=>!g.suggestions.some(x=>x.owned)&&(g.role==='sunscreen'||g.role==='cleanser'||g.role==='moisturizer'&&s.compromised));
  if(s.compromised&&!live.some(x=>gentleCleanser(x.f))&&[...plan.values()].some(a=>a.action==='replace'&&byId.get(a.id)?.rinseOff&&!(a.alternatives||[]).some(x=>x.owned)))essential.push({role:'cleanser',text:'',suggestions:[]});
  const optional=actions.filter(a=>a.action==='replace'&&!(a.alternatives||[]).some(x=>x.owned)&&!essential.some(g=>g.role===byId.get(a.id)?.role||g.role==='cleanser'&&byId.get(a.id)?.rinseOff));
  const purchaseNeeded=essential.length>0;
  const {lead,reasons}=summarize(s,actions,interactions,gaps,essential.map(g=>g.role==='cleanser'?'شوینده ملایم':ROLE_FA[g.role]),[...new Set(optional.map(a=>ROLE_FA[byId.get(a.id)?.role||'']||'محصول'))]);
  const result:RoutineCheck={engine:CATALOG_ROUTINE_ENGINE,catalogVersion:catalog.version,state:s,lead,reasons,fit,interactions,actions,gaps,reintroduce,purchaseNeeded,coverage,text:''};
  result.text=routineText(result);
  return result;
}

function keepReason(f:Formula,s:SkinState){
  const actives=activeLabel(f);
  if(f.role==='sunscreen')return 'ضدآفتاب صبح'+(f.spf?' با SPF'+f.spf:'')+(s.oily&&(f.claims.includes('oily')||/light|serum|fluid/.test(f.texture))?' و بافت سبک، برای پوست چرب مناسب است':'')+'؛ هر روز و کافی بزن';
  if(gentleCleanser(f))return 'شوینده ملایم'+(scented(f)?'':' بدون عطر')+'؛ پایه روتین است';
  if(f.role==='moisturizer')return 'مرطوب‌کننده'+(/watery|gel|light|fluid/.test(f.texture)?' سبک':'')+(has(f,'CERAMIDE')?' با سرامید':'')+'؛ از لایه محافظ حمایت می‌کند';
  if(actives)return actives+(s.acne&&(has(f,'AZELAIC')||has(f,'BHA')||has(f,'VITAMIN_B3'))?' با هدف کنترل جوش تو هم‌راستاست':'')+'؛ با تحمل پوست ادامه بده';
  return (ROLE_FA[f.role]||'محصول')+' بدون اکتیو قوی؛ تداخلی با بقیه ندارد';
}

function summarize(s:SkinState,actions:PlanAction[],interactions:Finding[],gaps:RoutineCheck['gaps'],needs:string[],optional:string[]){
  const who=[s.skinLabel?'پوست '+s.skinLabel:'',s.acne?'جوش فعال':'',s.compromised?'لایه محافظ تحریک‌شده':s.suspectBarrier?'لایه محافظ مشکوک':''].filter(Boolean).join('، ').replace(/، ([^،]+)$/,' و $1');
  const count=(a:Action)=>actions.filter(x=>x.action===a);
  const pause=count('pause'),replace=count('replace'),keep=count('keep'),verify=count('verify'),pro=count('professional');
  const parts:string[]=[];
  const n=(x:number)=>faDigits(x);
  if(pro.length)parts.push(n(pro.length)+' مورد را با پزشک هماهنگ کن');
  if(pause.length)parts.push(n(pause.length)+' محصول فعلاً کنار برود');
  if(replace.length)parts.push(n(replace.length)+' محصول گزینه مناسب‌تر بگیرد');
  if(keep.length)parts.push(n(keep.length)+' محصول بماند');
  if(verify.length)parts.push(n(verify.length)+' محصول فرمولش ثبت شود');
  const buy=needs.length?'؛ خرید فقط برای '+needs.join(' و ')+' لازم است':'؛ فعلاً خرید تازه لازم نیست';
  const later=optional.length?'؛ '+optional.join(' و ')+' سبک‌تر را هر وقت تمام شد بگیر':'';
  const lead=(who?'ببین، با '+who+'، ':'')+(parts.length?parts.join('، '):'محصولی برای بررسی انتخاب نشده')+buy+later;
  const reasons:string[]=[];
  if(pause.length)reasons.push('کنار: '+pause.map(x=>x.name).join('، '));
  if(replace.length)reasons.push('جایگزین: '+replace.map(x=>x.name).join('، '));
  const top=interactions.find(x=>x.severity!=='info');if(top)reasons.push(top.text);
  if(gaps[0])reasons.push(gaps[0].text);
  return {lead,reasons:reasons.slice(0,3)};
}

const ACTION_FA:Record<Action,string>={keep:'بماند',pause:'فعلاً کنار بگذار',replace:'گزینه مناسب‌تر',verify:'فرمول ثبت شود',professional:'با پزشک یا داروساز'};
export function routineText(r:RoutineCheck){
  const lines=[r.lead,...r.reasons];
  lines.push('تناسب با پوست تو');
  if(r.fit.length)r.fit.forEach(x=>lines.push(x.text));else lines.push('در محصولات انتخاب‌شده ناسازگاری بافت با نوع پوستت دیده نشد');
  lines.push('تداخل و زمان مصرف');
  const paused=r.actions.filter(a=>a.action==='pause'||a.action==='professional');
  if(r.interactions.length)r.interactions.forEach(x=>lines.push(x.text));
  else if(r.reintroduce.length)lines.push('چون اکتیوهای قوی فعلاً کنار رفته‌اند، تداخل فعالی باقی نمانده؛ بعد از برگرداندن هم آن‌ها را در یک شب روی هم نزن');
  else lines.push(paused.length?'بین محصولاتی که می‌مانند تداخل مهمی دیده نشد':'بین اکتیوهای انتخاب‌شده تداخل مهمی دیده نشد');
  r.reintroduce.forEach(x=>lines.push(x));
  r.gaps.forEach(g=>lines.push(g.text+(g.suggestions.length?': '+g.suggestions.map(x=>x.name+(x.owned?' (در کیفت داری)':'')).join(' یا '):'')));
  if(r.coverage.declared.length)lines.push('فرمول '+faDigits(r.coverage.declared.length)+' محصول فقط از روی نام ثبت شده؛ برای دقت بیشتر فهرست ترکیبات پشت بسته‌شان را ثبت کن');
  return lines.join('\n');
}
export function actionLabel(a:Action){return ACTION_FA[a];}
