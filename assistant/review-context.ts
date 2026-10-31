export const REVIEW_CONTEXT_VERSION='2026-10-12.1';
const record=(x:unknown):Record<string,unknown>=>x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:{};
const text=(x:unknown,n=200)=>typeof x==='string'?x.slice(0,n):'';
export function reviewContext(input:unknown,saved:unknown){const x=record(input),s=record(saved),p=record(s.profile),local=record(x.profile),profile:Record<string,unknown>={};
 for(const key of ['skinBase','skinToday','barrier','sensitivity','goal1','primaryGoal','dealbreaker','productBudget','monthlyBudget','age','ageYears','medications','allergies','safetyNote','goal2','goal3','spotType','purchasePriority','brandPreference','economicAlternative']){const value=local[key]!==undefined&&local[key]!==''?local[key]:p[key];if(typeof value==='string'||typeof value==='number')profile[key]=text(String(value),500);}
 for(const key of ['symptoms','poreZones','poreWith','lineZones','acneType','safetyFlags','sensoryAvoid','concerns']){const value=local[key]??p[key];if(Array.isArray(value))profile[key]=value.filter(v=>typeof v==='string').slice(0,20).map(v=>text(v));}
 profile.routine=Array.isArray(local.routine)?local.routine.slice(0,20):Array.isArray(p.routine)?p.routine.slice(0,20):[];
 const selection=Array.isArray(x.selection)?x.selection.slice(0,20).map(v=>{const r=record(v);return {id:text(r.id,120),name:text(r.name,250),category:text(r.category,80),time:text(r.time,40)};}):[];
 const supplements=record(x.supplements||s.supplements);const supplementContext=record(supplements.context);if(!profile.ageYears&&!profile.age&&typeof supplementContext.ageYears==='number')profile.ageYears=String(supplementContext.ageYears);
 return {version:REVIEW_CONTEXT_VERSION,profile,selection,supplements,owned:Array.isArray(x.owned)?x.owned.slice(0,40).map(v=>text(v,250)):s.wallet||[],ownedIds:(Array.isArray(x.ownedIds)?x.ownedIds:Array.isArray(s.wallet)?s.wallet:[]).filter((v:unknown):v is string=>typeof v==='string').slice(0,60).map((v:string)=>text(v,120)),dataPolicy:'اطلاعات شخصی خوداظهاری است؛ نام محصول یا دسته‌بندی تأیید فرمول نیست'};
}
export function fitChecks(context:ReturnType<typeof reviewContext>){const p=context.profile,skin=String(p.skinBase||''),barrier=String(p.barrier||''),today=String(p.skinToday||''),symptoms=Array.isArray(p.symptoms)?p.symptoms.join(' '):'',flags:string[]=[];
 if(/آسیب|مشکوک/.test(barrier)||/تحریک|قرمز|سوزش/.test(today+' '+symptoms))flags.push('سد پوستی آسیب‌دیده یا تحریک گزارش شده؛ تحمل پوست باید جدا از تداخل شیمیایی بررسی شود و نبود تداخل تأیید مصرف نیست');
 if(/چرب|مختلط/.test(skin)){const dry=context.selection.filter(r=>/خشک|dry/i.test(r.name));if(dry.length)flags.push('پوست چرب/مختلط است اما این محصولات برای پوست خشک معرفی شده‌اند: '+dry.map(r=>r.name).join('، ')+'؛ بافت و فرمول و سابقه جوش را بررسی کن، از برچسب به‌تنهایی منع قطعی یا ایمنی نتیجه نگیر');}
 if(/جوش/.test(String(p.goal1||'')+' '+String(p.dealbreaker||'')+' '+symptoms))flags.push('اولویت جلوگیری از جوش را در انتخاب بافت و بررسی سابقه واکنش لحاظ کن؛ هیچ محصولی را تضمین ضدجوش نکن');
 return flags;
}

export function analysisIntent(explicit:unknown,message:string){if(explicit==='routine'||explicit==='supplements')return explicit;if(/مکمل|دوز روزانه|سقف مصرف|تداخل دارویی/.test(message)&&!/سرم|کرم|موضعی/.test(message))return 'supplements';if(/روتین|تداخل اکتیو/.test(message)&&/بررسی|بساز|سازگار|تداخل|مناسب/.test(message))return 'routine';return 'general';}
