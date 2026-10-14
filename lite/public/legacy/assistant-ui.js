(function(){
 const form=document.getElementById('assistantForm'),input=document.getElementById('assistantInput'),send=document.getElementById('assistantSend'),chat=document.getElementById('assistantChat'),welcome=document.getElementById('assistantWelcome'),error=document.getElementById('assistantError');
 if(!form||!input||!send||!chat)return;
 let busy=false;
 const marketFields={productName:'assistantProductName',seller:'assistantSeller',price:'assistantPrice',discount:'assistantDiscount',availability:'assistantAvailability',installment:'assistantInstallment',url:'assistantProductUrl'};
 function setError(message){error.textContent=message||'';error.classList.toggle('show',!!message)}
 const safeAssistant=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 function trustCard(meta,messageId){const trust=meta?.trust;if(!trust)return null;const card=document.createElement('section');card.className='assistant-trust';const confidence='مبنای این پاسخ';card.innerHTML='<div class="assistant-trust-head"><b>'+confidence+'</b><span>دانش '+String(trust.knowledgeVersion||'')+'</span></div><div class="assistant-trust-tags"><span>'+(trust.personalUsed?'اطلاعات ثبت‌شده تو لحاظ شد':'پاسخ بر اساس همین گفت‌وگو')+'</span><span>'+Number(trust.publishedRuleCount||0).toLocaleString('fa-IR')+' قاعده مرتبط</span>'+(trust.marketChecked?'<span>'+Number(trust.webSourceCount||0).toLocaleString('fa-IR')+' مرجع استنادشده</span>':'')+'</div>'+(Array.isArray(trust.missing)&&trust.missing.length?'<p>قدم بعدی بررسی: '+trust.missing.map(safeAssistant).join('؛ ')+'</p>':'');if(messageId){const actions=document.createElement('div');actions.className='assistant-outcome';actions.innerHTML='<span>بعدش چه شد؟</span><button type="button" data-outcome="considering">هنوز بررسی می‌کنم</button><button type="button" data-outcome="purchased">خریدم</button><button type="button" data-outcome="skipped">نخریدم</button>';actions.addEventListener('click',async event=>{const button=event.target.closest('[data-outcome]');if(!button||button.disabled)return;try{const response=await fetch('/api/assistant/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assistantMessageId:messageId,outcome:button.dataset.outcome})});if(!response.ok)throw Error();actions.querySelectorAll('button').forEach(item=>item.disabled=true);button.textContent='ثبت شد'}catch{setError('نتیجه ذخیره نشد؛ دوباره امتحان کن.')}});card.append(actions)}return card}
 function appendMessage(role,content,meta,messageId){
   if(welcome)welcome.remove();
   const box=document.createElement('div');box.className='assistant-message '+(role==='user'?'user':'bot');
   if(role==='user')box.textContent=String(content||'');else window.bwRenderAnswer(box,content,messageId,meta?.routinePlan);const trust=role==='assistant'?trustCard(meta,messageId):null;if(trust){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='سابقه و بازخورد';details.append(summary,trust);box.append(details)}
   chat.append(box);chat.scrollTop=chat.scrollHeight;
 }
 function marketPayload(){const result={};for(const [key,id] of Object.entries(marketFields)){const value=(document.getElementById(id)?.value||'').trim();if(value)result[key]=value}return Object.keys(result).length?{...result,capturedAt:new Date().toISOString()}:undefined}
 function clearMarket(){for(const id of Object.values(marketFields)){const field=document.getElementById(id);if(field)field.value=''}const details=document.getElementById('assistantMarketDetails');if(details)details.open=false}
 async function refreshStatus(){
   await window.bwVisitReady;
   try{const response=await fetch('/api/assistant',{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error();
     document.getElementById('assistantKnowledgeStatus').textContent=data.knowledge?.active?'فعال · قوانین، ترکیبات و روتین‌ها':'در حال بررسی دانش';
     document.getElementById('assistantPersonalStatus').textContent=data.personal?.available?'همگام با پروفایل و کیف تو':'پس از ثبت آنلاین پروفایل، این حافظه شخصی می‌شود';
     document.getElementById('assistantMarketStatus').textContent=data.market?.freshestAt?'بازار ثبت‌شده تا '+new Date(data.market.freshestAt).toLocaleDateString('fa-IR'):'جست‌وجوی زنده و ثبت اطلاعات فروشنده';
     if(Array.isArray(data.messages)&&!chat.querySelector('.assistant-message'))data.messages.forEach(message=>appendMessage(message.role,message.content,message.meta,message.id));
   }catch{document.getElementById('assistantKnowledgeStatus').textContent='اتصال موقتاً در دسترس نیست'}
 }
 form.addEventListener('submit',async event=>{
   event.preventDefault();const message=input.value.trim();if(!message||busy)return;
   const market=marketPayload();busy=true;send.disabled=true;input.disabled=true;setError('');appendMessage('user',message);input.value='';
   const loading=document.createElement('div');loading.className='assistant-loading';loading.textContent='دارم اطلاعاتت را کنار هم می‌گذارم…';chat.append(loading);chat.scrollTop=chat.scrollHeight;
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),85000);
   try{await window.bwVisitReady;const response=await fetch('/api/assistant',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({message,market,reviewContext:window.bwReviewContext?.()})});const data=await response.json();if(!response.ok)throw new Error(data.error||'دستیار فعلاً پاسخ نداد.');if(!data.answer)throw new Error('پاسخ قابل استفاده‌ای دریافت نشد.');appendMessage('assistant',data.answer,{trust:data.trust,routinePlan:data.review?.routinePlan},data.assistantMessageId);if(market)clearMarket();await refreshStatus()}
   catch(reason){input.value=message;setError(reason.name==='AbortError'?'بررسی طول کشید؛ دوباره تلاش کن':reason instanceof Error?reason.message:'دستیار فعلاً پاسخ نداد؛ دوباره تلاش کن.')}
   finally{clearTimeout(timeout);loading.remove();busy=false;send.disabled=false;input.disabled=false;input.focus()}
 });
 document.querySelectorAll('[data-assistant-prompt]').forEach(button=>button.addEventListener('click',()=>{if(document.getElementById('assistant'))switchTab('assistant');input.value=button.dataset.assistantPrompt||'';input.focus();document.getElementById('assistantHub').scrollIntoView({behavior:'smooth',block:'start'})}));
 refreshStatus();
})();
