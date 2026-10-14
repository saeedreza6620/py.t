import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const load=async p=>import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync(p,'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const {guardDecision,sourceEvidence}=await load('assistant/response-trust.ts'),{compactJson}=await load('assistant/knowledge.ts');
const input='نتیجه: بخر\nاین را بخر https://www.khanoumi.com/products/test-product';
const held=guardDecision(input,'buy',true,['بالاتر از سقف'],[],false);assert.equal(held.decision,'wait');assert.ok(!held.answer.includes('https://'));assert.ok(!held.answer.includes('نتیجه: بخر'));assert.ok(held.answer.includes('بالاتر از سقف'));
const wait=guardDecision(input,'buy',false,[],[],true);assert.equal(wait.decision,'wait');assert.ok(wait.answer.startsWith('نتیجه: فعلاً صبر'));
assert.equal(sourceEvidence('https://a.example/p',[{url:'https://a.example/p',title:'cited'},{url:'https://irrelevant.example/p',title:'not cited'}]).length,1);
const text=compactJson({profile:{skinBase:'چرب',barrier:'آسیب‌دیده'},rows:Array.from({length:100},()=>({long:'"'.repeat(500)}))},500);assert.doesNotThrow(()=>JSON.parse(text));assert.ok(text.length<=500);
assert.deepEqual(JSON.parse(compactJson({profile:{skinBase:'چرب',barrier:'آسیب‌دیده'}},500)),{profile:{skinBase:'چرب',barrier:'آسیب‌دیده'}});
console.log('PASS: no conflicting buy or link after hold, cited-source selection, valid bounded JSON');

assert.equal(guardDecision(input,'buy',false,[],[],false,true).decision,'wait');
