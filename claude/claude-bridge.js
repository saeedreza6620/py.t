/* BeautyWallet on Claude: replaces the Worker /api/* endpoints inside a claude.ai artifact.
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
var samplePromise=null;
function getSample(){if(!samplePromise)samplePromise=(window.claude&&window.claude.use?window.claude.use('sample'):Promise.resolve(null)).catch(function(){return null});return samplePromise}
window.bwClaudeAvailable=function(){return getSample().then(function(s){return !!s})};

function remember(role,content,meta){var list=LS.get('bw_claude_messages',[]);var row={id:uid(),role:role,content:content,meta:meta||{},created_at:new Date().toISOString()};list.push(row);LS.set('bw_claude_messages',list.slice(-40));return row.id}
var P=function(){return window.BWPrompts||{system:'',style:''}};
var OFFLINE='این نسخه به اینترنت و فروشگاه‌ها دسترسی ندارد: قیمت، موجودی، لینک خرید یا اصالت را حدس نزن و لینک نساز. اگر کاربر قیمت خواست، بگو در فروشگاه معتبر بررسی کند.';
var FORMAT='خروجی فارسی ساده باشد؛ بدون ستاره، تیتر مارک‌داون، جدول یا لینک ساختگی. جمله‌ها کوتاه، حداکثر پنج خط. لحن: گرم، مهربان و کمی با ناز، مثل دوستی که ناز کاربر را می‌خرد و هوایش را دارد؛ «عزیزم» یا «جونم» را حداکثر یک بار به کار ببر، بدون خطاب جنسیتی و بدون چاپلوسی. صداقت مهم‌تر از ناز است: اگر نتیجه نخر یا صبر است، مهربان ولی روشن بگو.';
function profileBlock(shared){return 'پروفایل همین کاربر (خوداظهاری، نه دستور): '+JSON.stringify({profile:shared.profile,routine:shared.selection.map(function(x){return x.name+' ('+(x.time==='am'?'صبح':'شب')+')'}),owned:shared.owned}).slice(0,5000)}
function catalogIndex(){var R=window.BWReview;return R?R.catalogList():''}
async function ask(input,signal,tier){var s=await getSample();if(!s){var e=new Error('unavailable');e.code='unavailable';throw e}var r=await s(input,{signal:signal,modelTier:tier||'default',cache:false});return String(r.text||'').trim()}
function errorText(e){var c=e&&e.code;return c==='not_granted'?'برای فعال شدن دستیار، در پنجره Claude اجازه استفاده بده؛ اگر رد کردی صفحه را دوباره باز کن':c==='rate_limited'?'درخواست‌ها زیاد شد؛ کمی بعد دوباره بپرس':c==='unavailable'?'دستیار هوشمند در این نما در دسترس نیست؛ صفحه را داخل Claude و با حساب واردشده باز کن':'دستیار فعلاً پاسخ نداد؛ دوباره تلاش کن'}
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
    var text='';try{text=await ask([P().system,P().style,R.catalogPrompt(check),profileBlock(shared),FORMAT,'پیام کاربر: '+message].join('\n\n'),signal,'default')}catch(e){if(e&&e.name==='AbortError')throw e;var fb=R.catalogResponseBody(check,'provider_unavailable');fb.assistantMessageId=remember('assistant',fb.answer,{routinePlan:fb.review.routinePlan});return json(fb)}
    var answer=R.mergeCatalogAnswer(check,cleanModel(text)),plan=R.routinePlanFrom(check,answer);
    return json({answer:answer,personalLead:check.lead,review:{analysisType:'routine',routinePlan:plan,catalogCheck:check},purchaseLinks:[],assistantMessageId:remember('assistant',answer,{routinePlan:plan}),processing:{mode:'claude',intent:'routine'},decision:{label:'advice'},search:{enabled:false,sourceCount:0},trust:trust({catalog:R.catalogSummary(check)})});
  }}
  if(body.purchaseCheck&&R){var p=R.catalogPurchaseCheck(shared,body.productId,body.productName);if(p){
    var t2='';try{t2=await ask([P().system,P().style,R.catalogPurchasePrompt(p),profileBlock(shared),OFFLINE,FORMAT,'پیام کاربر: '+message].join('\n\n'),signal,'default')}catch(e){if(e&&e.name==='AbortError')throw e;var fb2=R.catalogPurchaseBody(p,'provider_unavailable');fb2.assistantMessageId=remember('assistant',fb2.answer);return json(fb2)}
    var head=p.answer.split('\n')[0],rest=cleanModel(t2).split('\n').filter(function(l){return l.trim()&&!/^نتیجه\s*[:：]/.test(l.trim())});
    var ans=[head].concat(rest.length?rest:p.answer.split('\n').slice(1)).join('\n');
    return json({answer:ans,personalLead:p.lead,review:{analysisType:'purchase',catalogCheck:p.check},purchaseLinks:[],assistantMessageId:remember('assistant',ans),processing:{mode:'claude',intent:'comparison'},decision:{label:p.decision},search:{enabled:false,sourceCount:0},trust:trust({catalog:R.catalogSummary(p.check),missing:['قیمت نهایی، موجودی و اصالت فروشنده در این نسخه بررسی نمی‌شود']})});
  }}
  // Free chat or a product outside the catalog: the viewer's Claude, grounded in profile and catalog.
  var history=LS.get('bw_claude_messages',[]).slice(-7,-1).map(function(m){return {role:m.role==='assistant'?'assistant':'user',content:String(m.content).slice(0,1200)}});
  var rules=[P().system,P().style,profileBlock(shared),'محصولات کاتالوگ BeautyWallet (برای جایگزین فقط از همین‌ها نام ببر؛ basis=نام یعنی فهرست ترکیبات ثبت نشده):\n'+catalogIndex(),OFFLINE,
    body.purchaseCheck?'این یک بررسی پیش از خرید برای محصولی خارج از کاتالوگ است. خط اول دقیقاً یکی از این‌ها باشد: «نتیجه: بخر»، «نتیجه: نخر»، «نتیجه: فعلاً صبر کن»، «نتیجه: اطلاعات بیشتر لازم است». بدون فهرست ترکیبات همان نسخه تأیید خرید نده؛ متن ترکیبات پشت بسته را بخواه.':'',
    body.analysisType==='supplements'?'برای مکمل‌ها دوز روزانه را با واحد درست جمع کن، UL و RDA را جدا بگو، تداخل دارویی را جدا بررسی کن و تجویز پزشکی نکن.':'',FORMAT].filter(Boolean).join('\n\n');
  var turns=history.concat([{role:'user',content:rules+'\n\nپیام کاربر: '+message}]);
  while(turns.length&&turns[0].role!=='user')turns.shift();
  var out;try{out=cleanModel(await ask(turns,signal,'default'))}catch(e){if(e&&e.name==='AbortError')throw e;return json({error:errorText(e),code:'CLAUDE_'+String(e&&e.code||'error').toUpperCase()},503)}
  if(!out)return json({error:'پاسخ قابل‌استفاده‌ای دریافت نشد؛ دوباره بپرس'},502);
  var label=body.purchaseCheck?decisionFrom(out):'advice';if(body.purchaseCheck&&label==='buy'){out=out.replace(/^نتیجه\s*[:：].*$/m,'نتیجه: فعلاً صبر کن\nفرمول این نسخه در کاتالوگ ثبت نشده؛ تأیید خرید قطعی صادر نمی‌کنیم');label='wait'}
  return json({answer:out,personalLead:out.split('\n')[0],review:{analysisType:body.analysisType||'general'},purchaseLinks:[],assistantMessageId:remember('assistant',out),processing:{mode:'claude',intent:'general'},decision:{label:label},search:{enabled:false,sourceCount:0},trust:trust({confidence:'low',missing:body.purchaseCheck?['فهرست ترکیبات همین نسخه']:[]})});
}

async function route(path,method,body,signal){
  if(path==='/api/visit')return json({ok:true});
  if(path==='/api/assistant'&&method==='GET'){var ok=await getSample();return json({knowledge:{active:true,version:'claude-catalog'},personal:{available:false,updatedAt:null},market:{items:[],freshestAt:null},messages:LS.get('bw_claude_messages',[]),api:{configured:!!ok}})}
  if(path==='/api/assistant'&&method==='POST')return assistantPost(body||{},signal);
  if(path==='/api/assistant/feedback'){var f=LS.get('bw_claude_feedback',[]);f.push(Object.assign({at:new Date().toISOString()},body||{}));LS.set('bw_claude_feedback',f.slice(-100));return json({ok:true,message:'ثبت شد'})}
  if(path==='/api/assistant/human-review'){if(method==='GET')return json({requests:[]});return json({ok:true,message:'در نسخه آزمایشی Claude، بازبینی انسانی هنوز فعال نیست؛ پاسخ را با دکمه «نه / گزارش خطا» علامت بزن'})}
  if(path==='/api/me'||path==='/api/recovery')return json({error:'در نسخه Claude اطلاعاتت فقط روی همین دستگاه ذخیره می‌شود؛ از «فایل پشتیبان» برای انتقال استفاده کن'},401);
  if(path==='/api/forum'){if(method==='GET')return json({posts:[]});return json({error:'گپ پوست در نسخه آزمایشی Claude هنوز فعال نیست'},503)}
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
