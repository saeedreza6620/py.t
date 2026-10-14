import type {reviewContext} from './review-context';
type Context=ReturnType<typeof reviewContext>;
const normalize=(s:string)=>s.toLowerCase().replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[^\p{L}\p{N}]/gu,'');
export function decisionPolicy(context:Context,message:string,product:Record<string,unknown>|null,offers:Array<Record<string,unknown>>,dose:{rows:Array<{status:string}>}|null,targetName=''){
 const p=context.profile,owned=context.owned as unknown[],reasons:string[]=[],questions:string[]=[];let hold=false;
 if(/تورم زبان|تورم گلو|تنگی نفس/.test(message)){hold=true;reasons.push('اولویت فوریت پزشکی؛ مسیر خرید متوقف شود');}
 if(dose?.rows.some(row=>row.status==='above_ul')){hold=true;reasons.push('مجموع ثبت‌شده بالاتر از UL مناسب سن است؛ برای مصرف یا خرید تازه بازبینی حرفه‌ای لازم است');}
 const name=String(product?.name_fa||targetName||''),duplicate=name&&owned.some(x=>typeof x==='string'&&normalize(x)===normalize(name));
 if(duplicate&&!/تمام شده|تمامشده|رو به اتمام|جایگزین|تمدید/.test(message)){hold=true;questions.push('از همین محصول هنوز داری یا تمام شده؟');reasons.push('همان محصول در داشته‌ها ثبت شده؛ خرید دوباره بدون بررسی نیاز تأیید نشود');}
 const cap=Number(p.productBudget),offer=product?offers.find(o=>o.product_id===product.product_id):undefined;
 let budgetStatus='not_checked';if(Number.isFinite(cap)&&cap>0&&offer){const price=Number(offer.discount_price??offer.cash_price),shipping=offer.shipping_cost===null||offer.shipping_cost===undefined?null:Number(offer.shipping_cost);if(Number.isFinite(price)&&price>=0){if(price>cap||shipping!==null&&Number.isFinite(shipping)&&price+shipping>cap){hold=true;budgetStatus='over_cap';reasons.push('هزینه نقدی ثبت‌شده از سقف همین خرید بیشتر است؛ گزینه خارج از بودجه تأیید نشود');}else budgetStatus=shipping===null?'shipping_needed':'within_per_product_cap_only';}}
 if(!p.skinBase&&/مناسب|سازگار|بخر|بررسی محصول/.test(message))questions.push('نوع پوستت چیست؟ اگر نمی‌دانی، علائم فعلی را بگو');
 return {version:'2026-10-12.2',holdPurchase:hold,reasons,questions,budgetStatus,order:['ایمنی و شرایط فرد','تناسب محصول و هدف','تداخل و تحمل روتین','تکراری بودن و نیاز واقعی','هزینه واقعی و بودجه','گزینه خرید مستند'],boundary:'نبود تداخل مساوی تناسب نیست؛ نبود داده مساوی خرید یا منع قطعی نیست؛ قیمت و کمیسیون وارد تصمیم ایمنی نشوند'};
}
export function efficientRoute(route:{tier:string;model:string;maxTokens:number;historyLimit:number},config:{AI_MODEL_LIGHT?:string;AI_MODEL_ECONOMY?:string;AI_MODEL_COMPLEX?:string;AI_MODEL_REVIEW?:string},sensitive:boolean,analysis:string){if(route.tier==='light'){route.model=economicalModel(config.AI_MODEL_LIGHT,'gpt-4o-mini');route.maxTokens=100;route.historyLimit=0;}else if(sensitive||analysis!=='general'||route.tier==='careful'){route.tier='careful';route.model=economicalModel(config.AI_MODEL_REVIEW,'gpt-5.6-luna');route.maxTokens=Math.min(route.maxTokens,1400);route.historyLimit=Math.min(route.historyLimit,2);}else{route.model=economicalModel(config.AI_MODEL_ECONOMY,'gpt-4o-mini');route.maxTokens=Math.min(route.maxTokens,500);}return route;}

export function economicalModel(requested:string|undefined,fallback:string){return requested&& !/5[.-]6[/-]sol|opus|o1-pro|o3-pro/i.test(requested)?requested:fallback;}

export function complexReview(context:Context,message:string,analysis:string){
 const signals=context.selection.map(p=>p.name).join(' '),activePatterns=[/رتین|retin|adapal|آداپالن/i,/سالیسی|salic|BHA/i,/گلیکول|لاکتیک|AHA|glycol|lactic/i,/آزلائیک|azelaic/i,/بنزوئیل|benzoyl/i,/ویتامین\s*[cث]|ascorb|vitamin.?c/i];
 const activeClasses=activePatterns.filter(rx=>rx.test(signals)).length;
 const profile=context.profile,irritated=/آسیب|سوزش|قرمز|تحریک/.test(String(profile.barrier||'')+' '+String(profile.skinToday||'')+' '+JSON.stringify(profile.symptoms||[]));
 const explicit=/بررسی عمیق|تحلیل عمیق|مقایسه علمی|شواهد متناقض/.test(message);
 return {needed:(analysis==='routine'&&(activeClasses>=3||irritated&&activeClasses>=2))||explicit,reason:explicit?'درخواست تحلیل عمیق':activeClasses>=3?'چند گروه اکتیو در روتین':irritated&&activeClasses>=2?'چند اکتیو همراه تحریک گزارش‌شده':'بررسی معمول',activeClasses};
}
export function applyComplexRoute(route:{tier:string;model:string;maxTokens:number;historyLimit:number},config:{AI_MODEL_COMPLEX?:string},review:{needed:boolean;reason:string}){if(review.needed&&route.tier!=='light'){route.tier='careful';route.model=config.AI_MODEL_COMPLEX||'gpt-5.6-sol';route.maxTokens=Math.max(route.maxTokens,1800);route.historyLimit=2;}return route;}
export function requiresChat(model:string){return /claude|anthropic|deepseek|gemini|qwen|mistral|llama|grok|openrouter/i.test(model);}
