import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const code=ts.transpile(fs.readFileSync('assistant/decision-policy.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});const {decisionPolicy,efficientRoute,complexReview,applyComplexRoute,requiresChat}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const ctx={version:'test',profile:{skinBase:'چرب',productBudget:'500000'},selection:[{name:'کرم من'}],owned:['کرم من'],supplements:{},dataPolicy:''};
assert.equal(decisionPolicy(ctx,'این را بخرم؟',null,[],null,'کرم من').holdPurchase,true);assert.equal(decisionPolicy(ctx,'محصول تمام شده و میخواهم جایگزین بخرم',null,[],null,'کرم من').holdPurchase,false);
const product={product_id:'x',name_fa:'کرم دیگر'};assert.equal(decisionPolicy(ctx,'بخرم؟',product,[{product_id:'x',cash_price:480000,shipping_cost:50000}],null).budgetStatus,'over_cap');assert.equal(decisionPolicy(ctx,'بخرم؟',product,[{product_id:'x',cash_price:480000,shipping_cost:null}],null).budgetStatus,'shipping_needed');assert.equal(decisionPolicy(ctx,'بخرم؟',product,[{product_id:'different',cash_price:990000,shipping_cost:10000}],null).holdPurchase,false);
assert.equal(decisionPolicy(ctx,'دوز مکمل',null,[],{rows:[{status:'above_ul'}]}).holdPurchase,true);
const route={tier:'careful',model:'gpt-5.6-sol',maxTokens:1800,historyLimit:4};assert.equal(efficientRoute({...route},{AI_MODEL_COMPLEX:'gpt-5.6-sol'},true,'routine').model,'gpt-5.6-luna');assert.equal(efficientRoute({...route},{},true,'routine').maxTokens,1400);assert.equal(efficientRoute({...route,tier:'light'},{},false,'general').historyLimit,0);assert.equal(efficientRoute({...route,tier:'standard'},{},false,'general').model,'gpt-4o-mini');
console.log('PASS: duplicate/refill, exact-product budget and shipping, UL guard, efficient routing without hidden expensive escalation');

assert.equal(decisionPolicy(ctx,'بررسی محصول تازه',null,[],null,'کرم جدید').holdPurchase,false);

assert.equal(efficientRoute({...route},{AI_MODEL_REVIEW:'gpt-5.6-sol'},true,'routine').model,'gpt-5.6-luna');assert.equal(efficientRoute({...route,tier:'standard'},{AI_MODEL_ECONOMY:'gpt-5.6-sol'},false,'general').model,'gpt-4o-mini');

const damaged={...ctx,profile:{...ctx.profile,barrier:'آسیب دیده'},selection:[{name:'رتینول'},{name:'سالیسیلیک اسید'}]};
assert.equal(complexReview(damaged,'روتین من را بررسی کن','routine').needed,true);
assert.equal(complexReview(ctx,'روتین من را بررسی کن','routine').needed,false);
assert.equal(applyComplexRoute({...route},{},complexReview(damaged,'بررسی روتین','routine')).model,'gpt-5.6-sol');
assert.equal(requiresChat('deepseek-chat'),true);assert.equal(requiresChat('openrouter/anthropic/claude-sonnet-4.5'),true);assert.equal(requiresChat('gpt-5.6-sol'),false);
