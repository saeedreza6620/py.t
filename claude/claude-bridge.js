/* BeautyWallet browser bridge: replaces the Worker /api/* endpoints.
   Two modes: inside a claude.ai artifact (window.claude → the viewer's Claude via `sample`), or
   on the lite server (window.BW_LITE → /api/ai proxy that holds the Liara key and can search live).
   - Routine and catalog purchase decisions: deterministic catalog engine (BWReview), always available.
   - Explanations and free chat: the viewer's own Claude through the `sample` capability.
   - Personal data stays in this browser (localStorage), exactly like the app's local-first mode.
   Loaded before every other app script. */
(function(){'use strict';
var root=document.documentElement;root.lang='fa';root.dir='rtl';root.classList.add('purchase-first');
var realFetch=window.fetch.bind(window);
var LS={get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var json=function(body,status){return new Response(JSON.stringify(body),{status:status||200,headers:{'Content-Type':'application/json'}})};
var uid=function(){try{return crypto.randomUUID()}catch(e){return String(Date.now())+Math.random().toString(16).slice(2)}};
var LITE=!window.claude&&!!window.BW_LITE;
var samplePromise=null;
function getSample(){if(LITE)return Promise.resolve(liteAsk);if(!samplePromise)samplePromise=(window.claude&&window.claude.use?window.claude.use('sample'):Promise.resolve(null)).catch(function(){return null});return samplePromise}
window.bwClaudeAvailable=function(){return getSample().then(function(s){return !!s})};

function remember(role,content,meta){var list=LS.get('bw_claude_messages',[]);var row={id:uid(),role:role,content:content,meta:meta||{},created_at:new Date().toISOString()};list.push(row);LS.set('bw_claude_messages',list.slice(-40));return row.id}
var P=function(){return window.BWPrompts||{system:'',style:''}};
var ONLINE='با جست‌وجوی وب فقط صفحه مستقیم همین نسخه در دیجی‌کالا (digikala.com) و خانومی (khanoumi.com) را بررسی کن. قیمت نهایی، تخفیف فعلی و امکان خرید قسطی یا اعتباری را فقط اگر واقعاً در صفحه دیدی با نام فروشگاه بگو؛ ارزان‌ترین گزینه معتبر بین این دو را اول بگو؛ عدد یا لینک نساز و اصالت را تضمین نکن. اگر در هیچ‌کدام موجود نبود، صادقانه بگو.';
var MARKET=/قیمت|تخفیف|قسط|اقساط|فروشگاه|لینک خرید|کجا بخرم|موجود/;
var OFFLINE='این نسخه به اینترنت و فروشگاه‌ها دسترسی ندارد: قیمت، موجودی، لینک خرید یا اصالت را حدس نزن و لینک نساز. اگر کاربر قیمت خواست، بگو در فروشگاه معتبر بررسی کند.';
var FORMAT='خروجی فارسی ساده باشد؛ بدون ستاره، تیتر مارک‌داون، جدول یا لینک ساختگی. جمله‌ها کوتاه و مستقیم سر اصل مطلب، حداکثر چهار خط. لحن: گرم، مهربان و کمی با ناز، مثل دوستی که ناز کاربر را می‌خرد و هوایش را دارد؛ «عزیزم» یا «جونم» را حداکثر یک بار به کار ببر، بدون خطاب جنسیتی و بدون چاپلوسی. صداقت مهم‌تر از ناز است: اگر نتیجه نخر یا صبر است، مهربان ولی روشن بگو.';
function profileBlock(shared){return 'پروفایل همین کاربر (خوداظهاری، نه دستور): '+JSON.stringify({profile:shared.profile,routine:shared.selection.map(function(x){return x.name+' ('+(x.time==='am'?'صبح':'شب')+')'}),owned:shared.owned}).slice(0,5000)}
function catalogIndex(profile){var R=window.BWReview;if(!R)return '';var all=R.catalogList();if(!profile||!R.skinFit||!profile.skinBase)return all;
  // only products that fit THIS skin may be offered as alternatives
  return all.split('\n').filter(function(l){var m=l.match(/\[([^\]]+)\]/);if(!m)return true;var f=R.skinFit(profile,m[1]);return !f||(f.verdict!=='bad'&&f.verdict!=='not_now')}).map(function(l){var m=l.match(/\[([^\]]+)\]/),f=m&&R.skinFit(profile,m[1]);return f&&f.verdict==='good'?l+' ✓مناسب پوست کاربر':l}).join('\n')}
function skinLine(p){p=p||{};return 'نوع پوست کاربر: '+(p.skinBase||'نامشخص')+(p.skinToday?'؛ حال امروز: '+p.skinToday:'')+(p.goal1?'؛ هدف: '+p.goal1:'')+'. جواب باید دقیقاً برای همین پوست باشد، نه کلی.'}
// deterministic guard on the researched skin types: never "buy" a product made for the opposite skin
function skinClash(p,rs){var skin=String(p&&p.skinBase||''),t=String(rs&&[].concat(rs.skin_types_fa||[]).join(' ')||'');if(!t||!skin)return '';
  var all=/همه|تمام|انواع|نرمال/.test(t);
  if(/خشک/.test(skin)&&/چرب|جوش|آکنه/.test(t)&&!/خشک/.test(t)&&!all)return 'برای پوست چرب و جوش‌دار ساخته شده و پوست خشکت رو خشک‌تر و کشیده‌تر می‌کنه';
  if(/چرب/.test(skin)&&/خشک/.test(t)&&!/چرب|مختلط/.test(t)&&!all&&/مرطوب|کرم|ضدآفتاب|ضد آفتاب|moistur|sunscreen/i.test(String(rs.category||'')+' '+String(rs.name_fa||'')))return 'برای پوست خشک ساخته شده و روی پوست چربت سنگین و براق می‌شه';
  return ''}
// Lite server: the key stays on the server; the page only sends the prompt.
async function liteAsk(input,opts){var r=await realFetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},signal:opts&&opts.signal,body:JSON.stringify({input:input,tier:opts&&opts.modelTier||'default',search:!!(opts&&opts.search),act:opts&&opts.act||undefined,cacheKey:opts&&opts.cacheKey||undefined,d:dev()})});var d=await r.json().catch(function(){return {}});if(!r.ok){var e=new Error(d.error||'upstream');e.code=d.code||(r.status===429?'rate_limited':'unavailable');if(d.wallet&&window.bwWallet)window.bwWallet(d.wallet);e.serverMessage=d.error;throw e}return {text:d.text||'',sources:Array.isArray(d.sources)?d.sources:[]}}
async function ask(input,signal,tier,search,act,cacheKey){var s=await getSample();if(!s){var e=new Error('unavailable');e.code='unavailable';throw e}var o={signal:signal,modelTier:tier||'default',cache:false};if(LITE){o.search=!!search;o.act=act;o.cacheKey=cacheKey}var r=await s(input,o);return {text:String(r.text||'').trim(),sources:Array.isArray(r.sources)?r.sources:[]}}
// purchase links only go to our affiliate partners (Digikala, Khanoumi); ranking between them is commission-blind
var SHOPS={'digikala.com':'دیجی‌کالا','khanoumi.com':'خانومی'};
function shopLinks(sources){var out=[],seen={};(sources||[]).forEach(function(x){try{var u=new URL(x.url);var host=u.hostname.replace(/^www\./,'');var key=Object.keys(SHOPS).find(function(k){return host===k||host.endsWith('.'+k)});if(!key||u.protocol!=='https:'||seen[u.href])return;seen[u.href]=1;out.push({seller:SHOPS[key],url:u.href})}catch(e){}});return out.slice(0,3)}
function errorText(e){var c=e&&e.code;if(LITE&&e&&e.serverMessage)return e.serverMessage;return c==='not_granted'?'برای فعال شدن دستیار، در پنجره Claude اجازه استفاده بده؛ اگر رد کردی صفحه را دوباره باز کن':c==='rate_limited'?'درخواست‌ها زیاد شد؛ کمی بعد دوباره بپرس':c==='unavailable'?'دستیار هوشمند در این نما در دسترس نیست؛ صفحه را داخل Claude و با حساب واردشده باز کن':'دستیار فعلاً پاسخ نداد؛ دوباره تلاش کن'}
// a product we couldn't find: suggest catalog products in the same role that fit THIS skin and routine
var ROLE_RE=[[/ضد ?آفتاب|sunscreen|spf|sun/i,'sunscreen'],[/میسلار|micellar/i,'micellar'],[/شوینده|شستشو|فوم|ژل شست|cleanser|wash|cleansing/i,'cleanser'],[/تونر|toner/i,'toner'],[/سرم|serum|آمپول|ampoule/i,'serum'],[/دور چشم|eye/i,'eye'],[/ماسک|mask/i,'mask'],[/کرم|مرطوب|آبرسان|لوسیون|moistur|cream|lotion|gel cream/i,'moisturizer']];
function similarFor(name,rs,shared){var R=window.BWReview,C=window.BWCatalog;if(!R||!C)return [];var role=(rs&&(rs.role||{cleanser:'cleanser',toner:'toner',serum:'serum',moisturizer:'moisturizer',sunscreen:'sunscreen',mask:'mask',eye:'eye'}[rs.category]))||'';
  if(!role)for(var i=0;i<ROLE_RE.length;i++)if(ROLE_RE[i][0].test(name)){role=ROLE_RE[i][1];break}if(!role)return [];
  var ids=(R.catalogList().match(/\[[^\]]+\]/g)||[]).map(function(x){return x.slice(1,-1)});
  var out=ids.map(function(id){var f=C.formula(id);if(!f||f.role!==role||f.basis!=='inci_sourced')return null;var p=R.catalogPurchaseCheck(shared,id);if(!p||p.decision!=='buy')return null;var fit=R.skinFit?R.skinFit(shared.profile,id):null;return {id:id,name:f.name,why:p.lead||'',score:fit?fit.score:0}}).filter(Boolean);
  return out.sort(function(a,b){return b.score-a.score}).slice(0,3).map(function(x){return {id:x.id,name:x.name,why:x.why}})}
function dev(){try{return localStorage.getItem('bw_device')||''}catch(e){return ''}}
// a paid action the shopper has no Negin for, or something the team should handle: never an AI/cost error
function errJson(e){if(e&&e.code==='need_negin')return json({error:e.serverMessage||'برای این کار الماس لازمه 💎',code:'need_negin'},402);if(e&&e.code==='support')return json({error:e.serverMessage||'این یکی رو تیم بیوتی‌ولت برات بررسی می‌کنه',code:'support'},503);return json({error:errorText(e),code:'CLAUDE_'+String(e&&e.code||'error').toUpperCase()},503)}
function cleanModel(t){return String(t||'').replace(/<routine_plan>[\s\S]*?(<\/routine_plan>|$)/g,'').replace(/\*\*|#{1,6}\s*/g,'').trim()}
function decisionFrom(answer){var lead=(answer.split('\n').find(function(l){return /^نتیجه\s*[:：]/.test(l.trim())})||'').trim();if(/اطلاعات بیشتر لازم/.test(lead))return 'need_info';if(/صبر/.test(lead))return 'wait';if(/نخر/.test(lead))return 'avoid';if(/بخر/.test(lead))return 'buy';return 'undetermined'}
function sharedFrom(body){var c=body.reviewContext||{};return {profile:c.profile||{},selection:(Array.isArray(c.selection)?c.selection:[]).slice(0,20).map(function(x){return {id:String(x.id||''),name:String(x.name||''),time:x.time==='am'?'am':'pm'}}),ownedIds:Array.isArray(c.ownedIds)?c.ownedIds:[],owned:Array.isArray(c.owned)?c.owned:[]}}
function trust(extra){return Object.assign({confidence:'medium',confidenceMethod:'catalog_rules_not_clinically_calibrated',checkedAt:new Date().toISOString(),missing:[],marketChecked:false},extra||{})}

async function assistantPost(body,signal){
  var R=window.BWReview,message=String(body.message||'').slice(0,3000),shared=sharedFrom(body);
  if(/تنگی نفس|تورم زبان|تورم گلو/.test(message))return json({answer:'این علائم ممکن است فوری باشند\nهمین حالا با اورژانس ۱۱۵ تماس بگیر یا به مرکز درمانی مراجعه کن',processing:{mode:'safety',intent:'medical'}});
  remember('user',message);
  var routine=body.analysisType==='routine'||(shared.selection.length&&/روتین|تداخل اکتیو/.test(message)&&/بررسی|سازگار|تداخل|مناسب/.test(message)&&body.analysisType!=='supplements');
  if(routine&&R){var check=R.catalogRoutineCheck(shared);if(check){
    if(LITE){var plan0=R.routinePlanFrom(check,check.text);return json({answer:check.text,personalLead:check.lead,review:{analysisType:'routine',routinePlan:plan0,catalogCheck:check},purchaseLinks:[],assistantMessageId:remember('assistant',check.text,{routinePlan:plan0}),processing:{mode:'catalog',intent:'routine'},decision:{label:'advice'},search:{enabled:false,sourceCount:0},trust:trust({catalog:R.catalogSummary(check)})})}
    var text='';try{text=(await ask([P().system,P().style,R.catalogPrompt(check),profileBlock(shared),FORMAT,'پیام کاربر: '+message].join('\n\n'),signal,'default')).text}catch(e){if(e&&e.name==='AbortError')throw e;var fb=R.catalogResponseBody(check,'provider_unavailable');fb.assistantMessageId=remember('assistant',fb.answer,{routinePlan:fb.review.routinePlan});return json(fb)}
    var answer=R.mergeCatalogAnswer(check,cleanModel(text)),plan=R.routinePlanFrom(check,answer);
    return json({answer:answer,personalLead:check.lead,review:{analysisType:'routine',routinePlan:plan,catalogCheck:check},purchaseLinks:[],assistantMessageId:remember('assistant',answer,{routinePlan:plan}),processing:{mode:LITE?'lite':'claude',intent:'routine'},decision:{label:'advice'},search:{enabled:false,sourceCount:0},trust:trust({catalog:R.catalogSummary(check)})});
  }}
  // live price: a short, dedicated prompt (no knowledge base, catalog or INCI) — same answer for everyone, cached on the server for 6 hours
  if(LITE&&body.livePrice){var pn=String(body.livePrice).slice(0,120);
    var pq='قیمت نهایی امروز، تخفیف فعلی و امکان خرید قسطی «'+pn+'» را فقط در digikala.com و khanoumi.com زنده جست‌وجو کن. حداکثر ۴ خط کوتاه فارسی: ارزان‌ترین گزینه‌ی معتبر اول (فروشنده، قیمت به تومان)، بعد تخفیف و قسط. اگر موجود نیست صادقانه بگو. لینک صفحه‌ی محصول را بیاور. بدون مقدمه.';
    var lr={text:'',sources:[]};try{lr=await ask(pq,signal,'default',true,'live','price:'+pn)}catch(e){if(e&&e.name==='AbortError')throw e;return errJson(e)}
    var lo=cleanModel(lr.text);if(!lo)return json({error:'پاسخ قابل‌استفاده‌ای دریافت نشد؛ دوباره بپرس'},502);
    return json({answer:lo,personalLead:lo.split('\n')[0],review:{analysisType:'price'},purchaseLinks:shopLinks(lr.sources),assistantMessageId:remember('assistant',lo),processing:{mode:'lite',intent:'price'},decision:{label:'advice'},search:{enabled:true,sourceCount:lr.sources.length},trust:trust({confidence:'medium',missing:[]})});
  }
  if(body.purchaseCheck&&R){var p=R.catalogPurchaseCheck(shared,body.productId,body.productName);if(p){
    var live=LITE&&MARKET.test(message),r2={text:'',sources:[]};try{r2=await ask([P().system,P().style,R.catalogPurchasePrompt(p),profileBlock(shared),live?ONLINE:OFFLINE,FORMAT,'پیام کاربر: '+message].join('\n\n'),signal,'default',live)}catch(e){if(e&&e.name==='AbortError')throw e;var fb2=R.catalogPurchaseBody(p,'provider_unavailable');fb2.assistantMessageId=remember('assistant',fb2.answer);return json(fb2)}
    var t2=r2.text,links=shopLinks(r2.sources),head=p.answer.split('\n')[0],rest=cleanModel(t2).split('\n').filter(function(l){return l.trim()&&!/^نتیجه\s*[:：]/.test(l.trim())});
    var ans=[head].concat(rest.length?rest:p.answer.split('\n').slice(1)).join('\n');
    return json({answer:ans,personalLead:p.lead,review:{analysisType:'purchase',catalogCheck:p.check},purchaseLinks:p.decision==='avoid'?[]:links,assistantMessageId:remember('assistant',ans),processing:{mode:LITE?'lite':'claude',intent:'comparison'},decision:{label:p.decision},search:{enabled:live,sourceCount:r2.sources.length},trust:trust({catalog:R.catalogSummary(p.check),marketChecked:live,missing:live?['قیمت را پیش از پرداخت در خود فروشگاه دوباره ببین']:['قیمت نهایی، موجودی و اصالت فروشنده در این نسخه بررسی نمی‌شود']})});
  }}
  // Product outside the catalog (lite server): find the exact product and its real INCI on the web ourselves,
  // then decide with the strong model. Never ask the shopper for a photo or the back label.
  if(LITE&&body.purchaseCheck){var pname=String(body.productName||message.replace(/^بررسی محصول پیش از خرید[:：]?\s*/,'')).slice(0,160);
    var rs=null;try{var rr=await realFetch('/api/research',{method:'POST',headers:{'Content-Type':'application/json'},signal:signal,body:JSON.stringify({name:pname,url:body.productUrl||undefined,d:dev()})});rs=await rr.json().catch(function(){return null});
      if(rs&&rs.wallet&&window.bwWallet)window.bwWallet(rs.wallet);
      if(rr.status===402||(rs&&rs.code==='need_negin'))return json({error:(rs&&rs.error)||'برای محصول تازه الماس لازمه 💎',code:'need_negin'},402);
      if(rs&&rs.code==='support')return json({error:rs.error,code:'support'},503);
      if(!rr.ok)rs=null}catch(e){if(e&&e.name==='AbortError')throw e;rs=null}
    // the product is now a structured formula (new or from the bank): judge it with the catalog engine against THIS skin and routine
    if(rs&&rs.formula&&R&&R.addFormulas){R.addFormulas([rs.formula]);if(window.BWCatalog&&window.BWCatalog.add)window.BWCatalog.add([rs.formula]);
      var bp=R.catalogPurchaseCheck(shared,rs.formula.id);if(bp){var srcs0=(rs.sources||[]).slice(0,3);
        return json({answer:bp.answer,personalLead:bp.lead,formula:rs.formula,fromBank:!!rs.fromBank,inBank:!!rs.inBank,review:{analysisType:'purchase',catalogCheck:bp.check},research:{name:rs.name_en||'',nameFa:rs.name_fa||'',brand:rs.brand||'',verified:true,found:true,variants:(rs.variants||[]).slice(0,4),sources:srcs0,cached:!!rs.cached},purchaseLinks:[],assistantMessageId:remember('assistant',bp.answer),processing:{mode:'catalog',intent:'purchase'},decision:{label:bp.decision},search:{enabled:!rs.fromBank,sourceCount:srcs0.length},trust:trust({confidence:'high',confidenceMethod:'web_inci_research+catalog_engine',missing:[]})})}}
    // not found with confidence: no guessing from memory (that costs money and can be wrong) — the team checks it by hand
    if(!rs||!rs.found){var alts=similarFor(pname,rs,shared);return json({code:'not_found',query:pname,linkTried:!!body.productUrl,alternatives:alts,error:'این یکی رو با اطمینان پیدا نکردم'},200)}
    var found=rs&&rs.found&&Array.isArray(rs.inci)&&rs.inci.length>=5,verified=!!(rs&&rs.verified);
    var facts=rs?JSON.stringify({name:rs.name_en||pname,name_fa:rs.name_fa,brand:rs.brand,category:rs.category,inci:rs.inci,key_actives:rs.key_actives,spf:rs.spf,texture:rs.texture,fragrance:rs.fragrance,alcohol_denat:rs.alcohol_denat,essential_oils:rs.essential_oils,pore_clogging:rs.pore_clogging,claims:rs.claims_fa,skin_types:rs.skin_types_fa,sources:(rs.sources||[]).map(function(x){try{return new URL(x.url).hostname}catch(e){return ''}}).filter(Boolean)}).slice(0,6000):'';
    var decide=[P().system,P().style,profileBlock(shared),skinLine(shared.profile),
      'محصولات کاتالوگ BeautyWallet که به پوست همین کاربر می‌خورند (جایگزین فقط از همین‌ها و فقط هم‌نقش با محصول پرسیده‌شده):\n'+catalogIndex(shared.profile),
      found?'فهرست ترکیبات واقعی همین محصول را خودمان از وب پیدا کرده‌ایم'+(verified?' و از منبع معتبر تأیید شده':' (اطمینان متوسط)')+'. فقط بر اساس همین داده و پروفایل و روتین کاربر قضاوت کن:\n'+facts
           :'فهرست ترکیبات کامل این محصول در منابع آنلاین با اطمینان پیدا نشد'+(facts?'؛ داده جزئی پیدا شده: '+facts:'')+'. از شناخت عمومی خودت از همین محصول و خط تولیدش استفاده کن و اگر محصول را نمی‌شناسی صادقانه بگو.',
      'این یک بررسی پیش از خرید است. خط اول دقیقاً یکی از این‌ها باشد: «نتیجه: بخر»، «نتیجه: نخر»، «نتیجه: فعلاً صبر کن». '+
      'قضاوت باید قطعی و شخصی باشد: اگر محصول برای نوع پوست دیگری ساخته شده (مثلاً کنترل چربی یا سالیسیلیک برای پوست خشک، یا کرم غنی برای پوست چرب) نتیجه «نخر» است؛ اگر هم‌نقش محصولی در روتین فعلی کاربر هست، بگو کدام را نگه دارد. '+
      'دلیل اصلی را با اشاره به ترکیبات مشخص (مثلاً اکتیو، عطر، الکل، روغن یا ماده منفذبند) و تناسب با نوع پوست، دغدغه و روتین فعلی کاربر بگو. تداخل با محصولات روتینش را بررسی کن. '+
      'هرگز از کاربر عکس، متن پشت بسته یا فهرست ترکیبات نخواه؛ پیدا کردن این‌ها کار ماست. اگر محصول نسخه‌های مختلف دارد، فرض کن همان نسخه‌ای است که شناسایی شده. فقط سه خط کوتاه: خط اول نتیجه، خط دوم دلیل اصلی با نام یک ترکیب مشخص و ربطش به پوست کاربر، خط سوم یک نکته‌ی مصرف یا جایگزین. بدون مقدمه و توضیح طولانی.',
      FORMAT].join('\n\n');
    var rb={text:'',sources:[]},outp;try{rb=await ask(decide,signal,'default',false,'decide');outp=cleanModel(rb.text)}catch(e){if(e&&e.name==='AbortError')throw e;return errJson(e)}
    if(!outp)return json({error:'پاسخ قابل‌استفاده‌ای دریافت نشد؛ دوباره بپرس'},502);
    var lab=decisionFrom(outp);if(lab==='need_info'||lab==='undetermined'){lab='wait'}
    var clash=skinClash(shared.profile,rs);if(clash&&lab!=='avoid'){outp='نتیجه: نخر\n'+clash+'\n'+outp.split('\n').slice(2).join('\n');lab='avoid'}
    // without a verified formula we never green-light a purchase
    if(lab==='buy'&&!found){outp=outp.replace(/^نتیجه\s*[:：].*$/m,'نتیجه: فعلاً صبر کن');lab='wait'}
    var srcs=(rs&&rs.sources||[]).slice(0,3);
    return json({answer:outp,personalLead:outp.split('\n')[0],review:{analysisType:'purchase'},research:rs?{name:rs.name_en||'',nameFa:rs.name_fa||'',brand:rs.brand||'',verified:verified,found:found,variants:(rs.variants||[]).slice(0,4),sources:srcs,cached:!!rs.cached}:null,purchaseLinks:[],assistantMessageId:remember('assistant',outp),processing:{mode:'lite',intent:'research'},decision:{label:lab},search:{enabled:true,sourceCount:srcs.length},trust:trust({confidence:verified?'high':found?'medium':'low',confidenceMethod:'web_inci_research',missing:[]})});
  }
  // Free chat or a product outside the catalog: the viewer's Claude, grounded in profile and catalog.
  var liveGeneral=LITE&&(MARKET.test(message)||!!body.purchaseCheck);
  var history=LS.get('bw_claude_messages',[]).slice(-7,-1).map(function(m){return {role:m.role==='assistant'?'assistant':'user',content:String(m.content).slice(0,1200)}});
  var rules=[P().system,P().style,profileBlock(shared),skinLine(shared.profile),'محصولات کاتالوگ BeautyWallet که به پوست همین کاربر می‌خورند (برای پیشنهاد فقط از همین‌ها نام ببر؛ basis=نام یعنی فهرست ترکیبات ثبت نشده):\n'+catalogIndex(shared.profile),liveGeneral?ONLINE+' برای محصول خارج از کاتالوگ، فهرست ترکیبات (INCI) همان نسخه را از صفحه رسمی سازنده پیدا کن.':OFFLINE,
    body.purchaseCheck?'این یک بررسی پیش از خرید برای محصولی خارج از کاتالوگ است. خط اول دقیقاً یکی از این‌ها باشد: «نتیجه: بخر»، «نتیجه: نخر»، «نتیجه: فعلاً صبر کن»، «نتیجه: اطلاعات بیشتر لازم است». بدون فهرست ترکیبات تأییدشده‌ی همان نسخه تأیید خرید نده؛ هرگز از کاربر ترکیبات، عکس یا متن بسته نخواه.':'',
    body.analysisType==='supplements'?'برای مکمل‌ها دوز روزانه را با واحد درست جمع کن، UL و RDA را جدا بگو، تداخل دارویی را جدا بررسی کن و تجویز پزشکی نکن.':'',FORMAT].filter(Boolean).join('\n\n');
  var turns=history.concat([{role:'user',content:rules+'\n\nپیام کاربر: '+message}]);
  while(turns.length&&turns[0].role!=='user')turns.shift();
  var res={text:'',sources:[]},out;try{res=await ask(turns,signal,'default',liveGeneral,liveGeneral?'live':'chat');out=cleanModel(res.text)}catch(e){if(e&&e.name==='AbortError')throw e;return errJson(e)}
  if(!out)return json({error:'پاسخ قابل‌استفاده‌ای دریافت نشد؛ دوباره بپرس'},502);
  var label=body.purchaseCheck?decisionFrom(out):'advice';if(body.purchaseCheck&&label==='buy'){out=out.replace(/^نتیجه\s*[:：].*$/m,'نتیجه: فعلاً صبر کن\nفرمول این نسخه در کاتالوگ ثبت نشده؛ تأیید خرید قطعی صادر نمی‌کنیم');label='wait'}
  return json({answer:out,personalLead:out.split('\n')[0],review:{analysisType:body.analysisType||'general'},purchaseLinks:label==='avoid'?[]:shopLinks(res.sources),assistantMessageId:remember('assistant',out),processing:{mode:LITE?'lite':'claude',intent:'general'},decision:{label:label},search:{enabled:liveGeneral,sourceCount:res.sources.length},trust:trust({confidence:'low',missing:body.purchaseCheck?['فهرست ترکیبات همین نسخه']:[]})});
}

// hand a request to the BeautyWallet team (the form opens in the app; name, phone and text go to the admin panel)
function support(topic,detail){try{window.dispatchEvent(new CustomEvent('bw:support',{detail:{topic:topic,detail:detail}}))}catch(e){}}
async function route(path,method,body,signal){
  if(path==='/api/visit')return json({ok:true});
  if(path==='/api/assistant'&&method==='GET'){var ok=await getSample();return json({knowledge:{active:true,version:'claude-catalog'},personal:{available:false,updatedAt:null},market:{items:[],freshestAt:null},messages:LS.get('bw_claude_messages',[]),api:{configured:!!ok}})}
  if(path==='/api/assistant'&&method==='POST')return assistantPost(body||{},signal);
  if(path==='/api/feedback'||(LITE&&path==='/api/assistant/feedback')){if(LITE)return realFetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({kind:path==='/api/feedback'?'app':'answer'},body||{}))});var ff=LS.get('bw_claude_feedback',[]);ff.push(Object.assign({at:new Date().toISOString()},body||{}));LS.set('bw_claude_feedback',ff.slice(-100));return json({ok:true,message:'ثبت شد، مرسی 💜'})}
  if(path==='/api/assistant/feedback'){var f=LS.get('bw_claude_feedback',[]);f.push(Object.assign({at:new Date().toISOString()},body||{}));LS.set('bw_claude_feedback',f.slice(-100));return json({ok:true,message:'ثبت شد'})}
  if(path==='/api/assistant/human-review'){if(method==='GET')return json({requests:[]});var hb=body||{};var ms=LS.get('bw_claude_messages',[]),ix=ms.findIndex(function(x){return x.id===hb.messageId}),q=ix>0?ms[ix-1]:ms.filter(function(x){return x.role==='user'}).pop();support('بازبینی پاسخ توسط تیم','سؤالم: '+String(q&&q.content||'').replace(/^بررسی محصول پیش از خرید[:：]?\s*/,'').slice(0,250));return json({ok:true,message:'فرمش باز شد؛ اسم و شماره‌ت رو بذار تا تیم بیوتی‌ولت بررسی کنه'})}
  if(LITE&&path==='/api/me'&&(method==='PUT'||method==='POST')){try{window.dispatchEvent(new CustomEvent('bw:need-register'))}catch(e){}return json({ok:true})}
  if(path==='/api/me'||path==='/api/recovery')return json({error:'در این نسخه آزمایشی اطلاعاتت فقط روی همین دستگاه ذخیره می‌شود؛ از «فایل پشتیبان» برای انتقال استفاده کن'},401);
  if(path==='/api/forum'){if(method==='GET')return json({posts:[]});var fb=body||{};support('گپ پوست',String(fb.text||fb.body||fb.message||'').slice(0,300));return json({ok:true,message:'برای تیم بیوتی‌ولت فرستاده می‌شه'})}
  if(path==='/api/reminders'){if(method==='GET')return json({enabled:false,reviews:[]});return json({error:'یادآور آنلاین در نسخه Claude فعال نیست؛ یادآور داخل برنامه کار می‌کند'},503)}
  if(path==='/api/install')return json({ok:true});
  return json({error:'این بخش در نسخه Claude فعال نیست'},404);
}
window.fetch=function(input,init){
  var url=typeof input==='string'?input:input&&input.url||'';
  var m=/^(?:https?:\/\/[^/]+)?(\/api\/[A-Za-z/_-]+)/.exec(url);
  if(!m||(/^https?:/.test(url)&&url.indexOf(location.origin)!==0))return realFetch(input,init);
  init=init||{};var method=String(init.method||'GET').toUpperCase(),body=null;
  try{body=init.body?JSON.parse(init.body):null}catch(e){body=null}
  return route(m[1],method,body,init.signal).catch(function(e){if(e&&e.name==='AbortError')throw e;return json({error:'دستیار فعلاً در دسترس نیست'},503)});
};
})();
