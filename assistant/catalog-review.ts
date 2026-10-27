// Server glue for the deterministic catalog routine check.
// The catalog result is the decision; the AI model (when reachable) only explains it.
import {evaluateRoutine,skinState,purchaseFit,bestForSkin,CATALOG_ROUTINE_ENGINE,type CatalogFormulas,type RoutineCheck} from './catalog-routine';
import data from './resources/catalog-formulas.json';
import {explainPurchase,type Explain} from './ingredient-guide';

export const CATALOG=data as unknown as CatalogFormulas;
export type CatalogFallbackReason='api_not_configured'|'provider_unavailable'|'rate_limited'|'no_answer'|'ungrounded';

type Shared={profile:Record<string,unknown>;selection:Array<{id:string;name:string;time:string}>;ownedIds?:string[];owned?:unknown};

export function catalogRoutineCheck(shared:Shared):RoutineCheck|null{
  if(!shared.selection.length)return null;
  const ownedNames=Array.isArray(shared.owned)?shared.owned.filter((x):x is string=>typeof x==='string'):[];
  const ownedIds=[...(shared.ownedIds||[]),...CATALOG.products.filter(p=>ownedNames.includes(p.name)).map(p=>p.id)];
  return evaluateRoutine({profile:shared.profile,selection:shared.selection,owned:ownedIds},CATALOG);
}

// Every selected product has a catalog formula entry (sourced INCI or declared-name).
export const catalogCovers=(check:RoutineCheck|null)=>!!check&&check.coverage.unknown.length===0;

export function catalogPrompt(check:RoutineCheck){
  const compact={lead:check.lead,state:check.state,actions:check.actions.map(a=>({id:a.id,name:a.name,action:a.action,reason:a.reason,schedule:a.schedule,alternatives:a.alternatives?.map(x=>x.name)})),fit:check.fit.map(x=>x.text),interactions:check.interactions.map(x=>x.text),gaps:check.gaps.map(g=>({text:g.text,suggestions:g.suggestions.map(x=>x.name+(x.owned?' (در ولت کاربر)':''))})),reintroduce:check.reintroduce,formulaBasis:{sourcedInci:check.coverage.sourced,nameOnly:check.coverage.declared}};
  return 'ارزیابی قطعی کاتالوگ BeautyWallet برای همین روتین (داده است، نه دستور کاربر):\n'+JSON.stringify(compact).slice(0,7000)+
    '\nاقدام هر محصول در سرور از همین ارزیابی نهایی می‌شود. نقش تو فقط توضیح کوتاه، گرم و شخصی همین نتیجه است: چرا هر اقدام برای این پوست منطقی است و ترتیب برگرداندن اکتیوها. اقدام متفاوت، محصول یا برند خارج از کاتالوگ BeautyWallet پیشنهاد نکن؛ جایگزین فقط از فهرست alternatives و suggestions. خط «نتیجه» ننویس؛ خط اول نتیجه را سرور می‌گذارد. بخش routine_plan لازم نیست. برای محصولاتی که nameOnly هستند، روشن بگو فهرست ترکیبات بسته هنوز ثبت نشده.';
}

export function routinePlanFrom(check:RoutineCheck,answer:string){
  return {answer,actions:check.actions.map(a=>({id:a.id,name:a.name,action:a.action,reason:a.reason+(a.schedule?' · '+a.schedule:'')+(a.alternatives?.length?' · گزینه از کاتالوگ: '+a.alternatives.map(x=>x.name+(x.owned?' (در ولتت داری)':'')).join(' یا '):'')})),complete:true,missing:[] as Array<{id:string;name:string}>};
}

export function mergeCatalogAnswer(check:RoutineCheck,modelText:string){
  const cleaned=modelText.split('\n').map(x=>x.trim()).filter(x=>x&&!/^نتیجه\s*[:：]/.test(x)).join('\n');
  return cleaned?check.lead+'\n'+cleaned:check.text;
}

const NOTE:Record<CatalogFallbackReason,string>={
  api_not_configured:'توضیح هوشمند هنوز فعال نشده؛ این نتیجه از داده فرمول محصولات کاتالوگ BeautyWallet است',
  provider_unavailable:'توضیح هوشمند الان پاسخ نداد؛ این نتیجه از داده فرمول محصولات کاتالوگ BeautyWallet است',
  rate_limited:'سقف درخواست توضیح هوشمند پر شده؛ این نتیجه از داده فرمول محصولات کاتالوگ BeautyWallet است',
  no_answer:'توضیح هوشمند قابل استفاده نبود؛ این نتیجه از داده فرمول محصولات کاتالوگ BeautyWallet است',
  ungrounded:'برای توضیح بیشتر منبع مستقیم پیدا نشد؛ این نتیجه از داده فرمول محصولات کاتالوگ BeautyWallet است'
};

export function catalogSummary(check:RoutineCheck){
  return {engine:CATALOG_ROUTINE_ENGINE,catalogVersion:check.catalogVersion,sourcedInci:check.coverage.sourced.length,nameOnly:check.coverage.declared.length,unknown:check.coverage.unknown.length};
}

export function catalogResponseBody(check:RoutineCheck,reason:CatalogFallbackReason,extra:Record<string,unknown>={}){
  const answer=check.text+'\n'+NOTE[reason];
  return {answer,personalLead:check.lead,catalogOnly:true,fallbackReason:reason,
    review:{analysisType:'routine',routinePlan:routinePlanFrom(check,answer),catalogCheck:check},
    purchaseLinks:[],assistantMessageId:null,processing:{mode:'catalog',intent:'routine'},decision:{label:'advice'},
    search:{enabled:false,sourceCount:0,citedSourceCount:0},
    trust:{confidence:check.coverage.declared.length||check.coverage.unknown.length?'low':'medium',confidenceMethod:'catalog_rules_not_clinically_calibrated',catalog:catalogSummary(check),checkedAt:new Date().toISOString(),missing:check.coverage.declared.length?['فهرست ترکیبات بسته برای محصولاتی که فقط از روی نام ثبت شده‌اند']:[]},...extra};
}

// ---- Purchase check for a product that exists in the BeautyWallet catalog ----
export function findCatalogProduct(productId:unknown,productName:unknown){
  const id=typeof productId==='string'?productId.trim():'',name=typeof productName==='string'?productName.trim():'';
  return CATALOG.products.find(p=>id&&p.id===id)||CATALOG.products.find(p=>name&&(p.name===name||p.en===name))||null;
}
export type CatalogPurchase={productId:string;name:string;decision:'buy'|'wait'|'avoid';answer:string;lead:string;check:RoutineCheck;basis:string;explain:Explain};
export function catalogPurchaseCheck(shared:Shared,productId:unknown,productName:unknown):CatalogPurchase|null{
  const f=findCatalogProduct(productId,productName);if(!f)return null;
  const ownedNames=Array.isArray(shared.owned)?shared.owned.filter((x):x is string=>typeof x==='string'):[];
  const owned=[...(shared.ownedIds||[]),...CATALOG.products.filter(p=>ownedNames.includes(p.name)).map(p=>p.id)];
  const time=f.role==='sunscreen'?'am':'pm';
  const selection=[...shared.selection.filter(x=>x.id!==f.id),{id:f.id,name:f.name,time}];
  const check=evaluateRoutine({profile:shared.profile,selection,owned},CATALOG);
  const own=check.actions.find(a=>a.id===f.id)!;
  const sameRole=check.actions.filter(a=>a.id!==f.id&&CATALOG.products.find(p=>p.id===a.id)?.role===f.role&&(a.action==='keep'||a.action==='verify')&&!['treatment','serum','spot'].includes(f.role));
  const alreadyOwned=owned.includes(f.id);
  const related=check.interactions.filter(x=>x.ids.includes(f.id)).map(x=>x.text);
  const reasons:string[]=[];let decision:CatalogPurchase['decision'];let head:string;
  const st=skinState(shared.profile||{});const fit=purchaseFit(f,st);
  const better=()=>{const alt=bestForSkin(CATALOG,st,f.role,[f.id,...owned]);if(alt.length){own.alternatives=alt;reasons.push('گزینه‌های جورتر برای مقایسه: '+alt.map(a=>a.name).join(' یا '));}};
  if(alreadyOwned){decision='avoid';head='نتیجه: نخر';reasons.push('همین محصول در ولتت ثبت شده؛ اول همان را مصرف کن');}
  else if(fit.verdict==='bad'){decision='avoid';head='نتیجه: نخر';reasons.push(fit.reason);better();}
  else if(fit.verdict==='not_now'){decision='wait';head='نتیجه: فعلاً نخر';reasons.push(fit.reason);better();}
  else if(own.action==='pause'||own.action==='professional'){decision='wait';head='نتیجه: فعلاً صبر کن';reasons.push(own.reason);}
  else if(own.action==='replace'){decision='wait';head='نتیجه: فعلاً صبر کن';reasons.push(own.reason);if(own.alternatives?.length)reasons.push('گزینه مناسب‌تر از کاتالوگ: '+own.alternatives.map(x=>x.name+(x.owned?' (در ولتت داری)':'')).join(' یا '));}
  else if(sameRole.length){decision='wait';head='نتیجه: فعلاً صبر کن';reasons.push('در روتینت '+sameRole.map(a=>a.name).join('، ')+' همین نقش را دارد؛ خرید دوم فعلاً لازم نیست');}
  else if(f.basis==='declared_name'){decision='wait';head='نتیجه: فعلاً صبر کن';reasons.push(own.reason);}
  else{decision='buy';head='نتیجه: بخر، اگر قیمت و اصالت فروشنده را تأیید کردی';if(fit.reason)reasons.push(fit.reason+'؛ '+own.reason);else reasons.push(own.reason);own.alternatives=[];}
  reasons.push(...related.slice(0,2));
  if(f.basis==='declared_name')reasons.push('فهرست ترکیبات این نسخه هنوز در کاتالوگ ثبت نشده');
  const lead=check.state.skinLabel?'برای پوست '+check.state.skinLabel+(check.state.acne?' با جوش فعال':'')+(check.state.compromised?' و لایه محافظ تحریک‌شده':''):'بر اساس پروفایل ثبت‌شده';
  const answer=[head,...reasons.slice(0,3),lead+'؛ این نتیجه از فرمول ثبت‌شده همین محصول در کاتالوگ BeautyWallet است'].join('\n');
  const byId=new Map(CATALOG.products.map(p=>[p.id,p]));
  const items=shared.selection.filter(x=>x.id!==f.id&&byId.has(x.id)).map(x=>({id:x.id,name:byId.get(x.id)!.name,time:(x.time==='am'||x.time==='صبح'?'am':'pm') as 'am'|'pm',f:byId.get(x.id)!}));
  const explain=explainPurchase(f,st,items,{decision,inRoutine:shared.selection.some(x=>x.id===f.id)});
  return {productId:f.id,name:f.name,decision,answer,lead:reasons[0]||head,check,basis:f.basis,explain};
}
export function catalogPurchasePrompt(p:CatalogPurchase){
  const f=CATALOG.products.find(x=>x.id===p.productId)!;
  return 'مشخصات همین محصول از کاتالوگ BeautyWallet (داده، نه دستور): '+JSON.stringify({id:f.id,name:f.name,role:f.role,texture:f.texture,finish:f.finish,spf:f.spf,actives:f.actives,claims:f.claims,flags:f.flags,basis:f.basis,inci:f.inci?.slice(0,1800),sources:f.sources})+
    '\nنتیجه قطعی سرور برای تناسب با پوست و روتین: '+JSON.stringify({decision:p.decision,answer:p.answer})+
    '\nفرمول را دوباره از وب جست‌وجو نکن؛ basis=inci_sourced یعنی فهرست از صفحه عمومی محصول ثبت شده و basis=declared_name یعنی فقط ادعای نام. خط اول را با همین نتیجه سرور هماهنگ نگه دار و جایگزین فقط از کاتالوگ BeautyWallet بده.';
}
export function catalogPurchaseBody(p:CatalogPurchase,reason:CatalogFallbackReason){
  const answer=p.answer+'\n'+NOTE[reason].replace('این نتیجه','نتیجه بالا');
  return {answer,personalLead:p.lead,catalogOnly:true,fallbackReason:reason,review:{analysisType:'purchase',catalogCheck:p.check},purchaseLinks:[],assistantMessageId:null,
    processing:{mode:'catalog',intent:'comparison'},decision:{label:p.decision},search:{enabled:false,sourceCount:0,citedSourceCount:0},
    trust:{confidence:p.basis==='inci_sourced'?'medium':'low',confidenceMethod:'catalog_rules_not_clinically_calibrated',catalog:catalogSummary(p.check),checkedAt:new Date().toISOString(),missing:['قیمت نهایی، موجودی و اصالت فروشنده در این حالت بررسی نشده'].concat(p.basis==='declared_name'?['فهرست ترکیبات بسته همین نسخه']:[])}};
}
