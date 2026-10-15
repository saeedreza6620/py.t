// Personalisation guard: the purchase verdict must follow the user's skin type and routine.
// A product made for oily skin must never be "buy" for dry skin (and the reverse for moisturisers/sunscreens),
// and the same product must not get the same verdict for every skin when its formula is skin-specific.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import ts from 'typescript';import assert from 'node:assert/strict';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bw-fit-'));
const t=f=>ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
fs.writeFileSync(path.join(dir,'catalog-routine.mjs'),t('assistant/catalog-routine.ts'));
fs.copyFileSync('assistant/resources/catalog-formulas.json',path.join(dir,'catalog-formulas.json'));
fs.writeFileSync(path.join(dir,'catalog-review.mjs'),t('assistant/catalog-review.ts').replace("'./catalog-routine'","'./catalog-routine.mjs'").replace(/from '\.\/resources\/catalog-formulas\.json';/,"from './catalog-formulas.json' with {type:'json'};"));
const m=await import(path.join(dir,'catalog-review.mjs'));const C=m.CATALOG.products;
const ctx=(skin,extra={})=>({profile:{skinBase:skin,skinToday:'متعادل',barrier:'سالم',...extra},selection:[],ownedIds:[],owned:[]});
const forOily=f=>(f.claims.includes('oily')||f.claims.includes('acne'))&&!f.claims.includes('dry')&&!f.claims.includes('all')&&!f.claims.includes('normal');
const forDry=f=>f.claims.includes('dry')&&!f.claims.includes('oily')&&!f.claims.includes('all');
let n=0;
for(const f of C.filter(f=>f.basis==='inci_sourced')){
  const dry=m.catalogPurchaseCheck(ctx('خشک'),f.id),oily=m.catalogPurchaseCheck(ctx('چرب'),f.id);
  if(forOily(f)){assert.notEqual(dry.decision,'buy',`${f.name}: made for oily skin, must not be "buy" for dry skin`);n++}
  if(forDry(f)&&['moisturizer','sunscreen','cleanser','micellar'].includes(f.role)){assert.notEqual(oily.decision,'buy',`${f.name}: made for dry skin, must not be "buy" for oily skin`);n++}
  for(const r of [dry,oily])if(r.decision!=='buy'&&r.check.actions.find(a=>a.id===f.id)?.alternatives?.length)
    for(const a of r.check.actions.find(a=>a.id===f.id).alternatives){const af=C.find(x=>x.id===a.id);assert(af.role===f.role,`${f.name}: alternative ${af.name} must have the same role`);
      assert.notEqual(m.catalogPurchaseCheck(r===dry?ctx('خشک'):ctx('چرب'),af.id).decision,'avoid',`${f.name}: alternative ${af.name} must itself fit this skin`)}
}
// the user's exact complaint: Avène Cleanance (oil control) for dry skin
const av=m.catalogPurchaseCheck(ctx('خشک'),'avene-oil');assert.equal(av.decision,'avoid');assert(/چرب/.test(av.answer),'reason names the mismatch');
assert.equal(m.catalogPurchaseCheck(ctx('چرب'),'avene-oil').decision,'buy','same gel fits oily skin');
// routine-aware: a second cleanser when one is already in the routine → wait, not buy
const r2=m.catalogPurchaseCheck({...ctx('چرب'),selection:[{id:'avene-oil',name:'',time:'pm'}]},'cerave-sa-cleanser');
if(C.find(x=>x.id==='cerave-sa-cleanser'))assert.notEqual(r2.decision,'buy','duplicate role in routine');
// verdicts are decisive: only buy / wait / avoid
for(const f of C)for(const s of ['خشک','چرب','مختلط','نرمال']){const r=m.catalogPurchaseCheck(ctx(s),f.id);assert(['buy','wait','avoid'].includes(r.decision))}
console.log('PASS skin fit:',n,'skin-specific guards, alternatives fit the same skin, routine duplicates, decisive verdicts');
