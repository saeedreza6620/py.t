import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const code=ts.transpile(fs.readFileSync('assistant/catalog-routine.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const {evaluateRoutine,captionFor}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const catalog=JSON.parse(fs.readFileSync('assistant/resources/catalog-formulas.json','utf8'));
const by=id=>catalog.products.find(p=>p.id===id);
const actionOf=(r,id)=>r.actions.find(a=>a.id===id)?.action;

// Case from the 2026-10-13 screenshot: oily, active acne, likely damaged barrier.
const screenshot={profile:{skinBase:'چرب',skinToday:'جوش فعال',barrier:'احتمالاً آسیب‌دیده',symptoms:['جوش فعال','سوزش']},
  selection:[{id:'cerave-sa',time:'pm'},{id:'boj-relief',time:'am'},{id:'clarins-double',time:'pm'},{id:'somebymi-retinol',time:'pm'},{id:'brightmax-azelaic',time:'pm'}],owned:[]};
const r=evaluateRoutine(screenshot,catalog);
assert.equal(r.actions.length,5,'one action per selected product');
assert.equal(actionOf(r,'somebymi-retinol'),'pause');
assert.equal(actionOf(r,'brightmax-azelaic'),'pause');
assert.equal(actionOf(r,'clarins-double'),'pause');
assert.equal(actionOf(r,'cerave-sa'),'replace');
assert.equal(actionOf(r,'boj-relief'),'replace','creamy dry-skin sunscreen on oily acne skin');
const sunAlt=r.actions.find(a=>a.id==='boj-relief').alternatives.map(x=>x.id);
assert(sunAlt.length&&sunAlt.every(id=>by(id).role==='sunscreen'&&!by(id).flags.includes('fragrance')),'sunscreen alternatives are catalog sunscreens without fragrance: '+sunAlt);
assert(!sunAlt.includes('boj-relief')&&!sunAlt.includes('numbuzin-sun'));
assert(r.gaps.some(g=>g.role==='moisturizer'&&g.suggestions.length),'barrier repair moisturizer suggested from catalog');
assert(r.reintroduce[0].includes('آزلائیک')||r.reintroduce[0].includes('برایت'),'azelaic returns before retinol');
assert(!/خرید تازه لازم نیست؛ با توجه/.test(r.text));
assert(!/ساده کن/.test(r.text),'no generic simplify advice');
assert(r.text.includes('تناسب با پوست تو')&&r.text.includes('تداخل و زمان مصرف'));
console.log('— screenshot routine —\n'+r.text+'\n'+r.actions.map(a=>a.name+' → '+a.action+' | '+a.reason+(a.alternatives?.length?' | جایگزین: '+a.alternatives.map(x=>x.name).join('، '):'')).join('\n'));

// Healthy oily skin: retinol + leave-on BHA same night → alternate nights, both kept.
const healthy=evaluateRoutine({profile:{skinBase:'چرب',barrier:'سالم'},selection:[{id:'somebymi-retinol',time:'am'},{id:'ordinary-salicylic',time:'pm'},{id:'boj-rice-bright',time:'am'},{id:'dr-althea-aqua',time:'pm'}]},catalog);
assert.equal(actionOf(healthy,'somebymi-retinol'),'keep');
assert.equal(actionOf(healthy,'ordinary-salicylic'),'keep');
assert(healthy.actions.find(a=>a.id==='somebymi-retinol').schedule,'retinol gets a schedule');
assert(healthy.interactions.some(x=>x.text.includes('شب')),'AM retinol moved to night');
assert.equal(healthy.purchaseNeeded,false);
assert.equal(actionOf(healthy,'boj-rice-bright'),'keep');

// Pregnancy: retinoid goes to a professional, not a plain keep.
const preg=evaluateRoutine({profile:{skinBase:'نرمال',safetyFlags:['بارداری یا شیردهی']},selection:[{id:'somebymi-retinol',time:'pm'}]},catalog);
assert.equal(actionOf(preg,'somebymi-retinol'),'professional');
assert(preg.gaps.some(g=>g.role==='sunscreen'));

// Owned products are offered before buying.
const owned=evaluateRoutine({profile:{skinBase:'چرب'},selection:[{id:'ordinary-niacinamide',time:'pm'}],owned:['skin1004-hyalucica']},catalog);
const sunGap=owned.gaps.find(g=>g.role==='sunscreen');
assert.equal(sunGap.suggestions[0].id,'skin1004-hyalucica');assert.equal(sunGap.suggestions[0].owned,true);
assert.equal(owned.purchaseNeeded,false,'owned sunscreen means no purchase');

// Declared-only formula never becomes a plain keep; unknown id becomes verify.
const declared=evaluateRoutine({profile:{skinBase:'چرب'},selection:[{id:'brightmax-niacinamide',time:'pm'},{id:'not-in-catalog',name:'محصول ناشناس',time:'pm'}]},catalog);
assert.equal(actionOf(declared,'brightmax-niacinamide'),'verify');
assert.equal(actionOf(declared,'not-in-catalog'),'verify');

// Dry skin: dry-skin sunscreen is fine, soap-based foam is flagged.
const dry=evaluateRoutine({profile:{skinBase:'خشک'},selection:[{id:'boj-relief',time:'am'},{id:'skin1004-pore-foam',time:'pm'}]},catalog);
assert.equal(actionOf(dry,'boj-relief'),'keep');
assert(dry.fit.some(x=>x.ids.includes('skin1004-pore-foam')));

// Every catalog product has a caption and never says "not recorded".
for(const p of catalog.products)assert(captionFor(p)&&!/ثبت نشده$/.test(captionFor(p).split(' · ')[0]),p.id);
console.log('PASS catalog routine: screenshot case, alternate nights, pregnancy, owned-first, declared/unknown verify, dry skin, captions');
