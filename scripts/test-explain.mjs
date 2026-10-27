// Personal, source-backed explanations: every answer explains the actives in plain words,
// names real clashes with the person's own routine, and never says "no explanation needed".
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import ts from 'typescript';
const t=f=>ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bw-explain-'));
fs.writeFileSync(path.join(dir,'catalog-routine.mjs'),t('assistant/catalog-routine.ts'));fs.writeFileSync(path.join(dir,'ingredient-guide.mjs'),t('assistant/ingredient-guide.ts'));
fs.copyFileSync('assistant/resources/catalog-formulas.json',path.join(dir,'catalog-formulas.json'));
fs.writeFileSync(path.join(dir,'catalog-review.mjs'),t('assistant/catalog-review.ts').replace("'./catalog-routine'","'./catalog-routine.mjs'").replace("'./ingredient-guide'","'./ingredient-guide.mjs'").replace(/from '\.\/resources\/catalog-formulas\.json';/,"from './catalog-formulas.json' with {type:'json'};"));
const m=await import(path.join(dir,'catalog-review.mjs'));
let fail=0;const ok=(c,msg)=>{if(!c){fail++;console.error('FAIL',msg)}};
const run=(profile,sel,id)=>m.catalogPurchaseCheck({profile,selection:sel.map(([id,time])=>({id,name:id,time}))},id,'');
// 1. retinol bought by an oily, acne-prone person who already uses a salicylic serum at night
let r=run({skinBase:'چرب',skinToday:'جوش',goal1:'کاهش جوش'},[['ordinary-salicylic','pm'],['dr-althea-aqua','pm']],'somebymi-retinol');
const e=r.explain;console.log(JSON.stringify(e,null,1).slice(0,2500));
ok(e.actives.some(a=>/ویتامین A/.test(a.what)),'retinol explained in plain words');
ok(e.pairs.some(p=>/رتینوئید و اسید/.test(p.title)&&p.with.some(w=>/سالیسیلیک/.test(w))),'retinoid + acid clash names the user product');
ok(e.pairs.every(p=>p.why&&p.todo),'every clash has why + what to do');
ok(e.sources.length&&e.sources.every(s=>/^https:\/\//.test(s.u)),'sources are https links');
ok(e.you.some(x=>/جوش/.test(x)),'personal goal line');
ok(e.clean.includes('دکتر')||e.clean.includes('آلتیا')||e.clean.includes('Aqua'),'non-clashing routine product listed');
ok(!JSON.stringify(r).includes('توضیح اضافه لازم نیست'),'no "no extra explanation"');
// 2. dry, sensitive skin, scented product
r=run({skinBase:'خشک',sensitivity:'زیاد',goal1:'آبرسانی و حمایت از لایهٔ محافظ پوست'},[],'clarins-double');
ok(r.explain.notes.some(n=>/عطر/.test(n)&&/ساعد/.test(n)),'fragrance note personalised for sensitive skin');
ok(/خالیه/.test(r.explain.clean),'empty routine said plainly');
// 3. pregnancy + retinoid
r=run({skinBase:'نرمال',safetyFlags:['بارداری یا شیردهی']},[],'somebymi-retinol');
ok(r.explain.pairs.some(p=>/بارداری/.test(p.title))||r.explain.actives.some(a=>/بارداری/.test(a.forYou||'')),'pregnancy caution');
// 4. every product in the catalog yields an explanation without throwing
for(const p of m.CATALOG.products){const x=run({skinBase:'مختلط',goal1:'کاهش لک'},[['ordinary-azelaic','pm'],['numbuzin-sun','am']],p.id);ok(x&&x.explain&&Array.isArray(x.explain.you),'explain for '+p.id)}
if(fail){console.error(fail+' failed');process.exit(1)}console.log('explain ok');
