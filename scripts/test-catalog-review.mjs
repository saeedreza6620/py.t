// Server glue: catalog fallback bodies, purchase verdicts, owned-first and no web dependency.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import ts from 'typescript';import assert from 'node:assert/strict';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bw-catalog-'));
const t=f=>ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
fs.writeFileSync(path.join(dir,'catalog-routine.mjs'),t('assistant/catalog-routine.ts'));
fs.copyFileSync('assistant/resources/catalog-formulas.json',path.join(dir,'catalog-formulas.json'));
fs.writeFileSync(path.join(dir,'catalog-review.mjs'),t('assistant/catalog-review.ts').replace("'./catalog-routine'","'./catalog-routine.mjs'").replace(/from '\.\/resources\/catalog-formulas\.json';/,"from './catalog-formulas.json' with {type:'json'};"));
const m=await import(path.join(dir,'catalog-review.mjs'));
const oily={profile:{skinBase:'چرب',skinToday:'جوش فعال',barrier:'احتمالاً آسیب‌دیده',symptoms:['سوزش']},selection:[{id:'boj-relief',name:'',time:'am'},{id:'somebymi-retinol',name:'',time:'pm'}],ownedIds:[],owned:[]};
const check=m.catalogRoutineCheck(oily);assert(m.catalogCovers(check));
const body=m.catalogResponseBody(check,'provider_unavailable');
assert.equal(body.catalogOnly,true);assert.equal(body.review.routinePlan.complete,true);assert.equal(body.review.routinePlan.actions.length,2);
assert(body.answer.includes('کاتالوگ'));assert(!/kyc|403|Netarz/i.test(body.answer),'no provider internals shown to user');
assert(m.catalogPrompt(check).includes('خارج از کاتالوگ'));
assert.equal(m.mergeCatalogAnswer(check,'نتیجه: بخر\nتوضیح کوتاه').split('\n')[0],check.lead,'server lead wins over model "نتیجه" line');
// Purchase: retinol on irritated skin -> wait; owned -> avoid; light sunscreen for oily without sunscreen -> buy.
assert.equal(m.catalogPurchaseCheck({...oily,selection:[]},'somebymi-retinol').decision,'wait');
assert.equal(m.catalogPurchaseCheck({...oily,ownedIds:['ordinary-niacinamide']},'ordinary-niacinamide').decision,'avoid');
const sun=m.catalogPurchaseCheck({profile:{skinBase:'چرب',barrier:'سالم'},selection:[{id:'ordinary-niacinamide',name:'',time:'pm'}],ownedIds:[]},'boj-rice-bright');
assert.equal(sun.decision,'buy');assert(sun.answer.startsWith('نتیجه: بخر'));
const dup=m.catalogPurchaseCheck({profile:{skinBase:'چرب',barrier:'سالم'},selection:[{id:'skin1004-hyalucica',name:'',time:'am'}],ownedIds:[]},'boj-rice-bright');
assert.equal(dup.decision,'wait','same role already in routine');
assert.equal(m.catalogPurchaseCheck({profile:{}},'not-a-product'),null);
assert.equal(m.catalogPurchaseCheck({profile:{skinBase:'چرب'},selection:[]},'brightmax-niacinamide').decision,'wait','name-only formula is not a buy');
assert.equal(m.catalogPurchaseBody(sun,'api_not_configured').decision.label,'buy');
fs.rmSync(dir,{recursive:true,force:true});
console.log('PASS catalog review: fallback body, server-owned lead, purchase verdicts (wait/avoid/buy/duplicate/name-only)');
