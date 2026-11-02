// Formula bank + wallets: a researched product is stored once, found again for free,
// judged per skin by the catalog engine, and paid checks follow free → Negin → none.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import ts from 'typescript';import assert from 'node:assert/strict';
import {makeBank} from '../lite/bank.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bw-bank-'));const B=makeBank(dir);const cfg={freeChecks:2,freePerIpDay:6};
const research={found:true,name_en:'Hydrating Oil Control Gel',name_fa:'ژل کنترل چربی تست',brand:'TestBrand',role:'cleanser',rinse_off:true,texture:'gel',actives:[{cls:'BHA',name:'Salicylic Acid',pct:2},{cls:'NOPE',name:'x'}],made_for:['oily','acne','bogus'],flags:['fragrance','bogus'],inci:['Aqua','Glycerin','Salicylic Acid','Zinc PCA','Parfum','Sodium Laureth Sulfate'],variants:['For dry skin']};
const f=B.toFormula(research,'ژل کنترل چربی تست برند',[{url:'https://incidecoder.com/x'}],'openai/gpt-4.1:online');
assert.equal(f.role,'cleanser');assert.equal(f.basis,'inci_sourced');assert.deepEqual(f.claims,['oily','acne'],'unknown claims dropped');assert.deepEqual(f.actives.map(a=>a.cls),['BHA','ZINC'],'unknown classes dropped; actives on the INCI list added');assert.deepEqual(B.toFormula({...research,actives:[{cls:'RETINOID',name:'Retinol'},{cls:'BHA',name:'Salicylic Acid'}]},'x',[{url:'https://incidecoder.com/x'}],'m').actives.map(a=>a.cls).includes('RETINOID'),false,'an active the INCI list does not have is dropped');assert.equal(B.toFormula({...research,flags:[],fragrance:false},'x',[{url:'https://incidecoder.com/x'}],'m').flags.includes('fragrance'),true,'Parfum on the list = fragrance');assert.deepEqual(f.flags,['fragrance']);
assert.equal(B.toFormula({...research,inci:['Aqua']},'x',[],'m').basis,'declared_name');assert.equal(B.add(B.toFormula({...research,inci:['Aqua']},'weak',[],'m'),'weak'),null,'weak formulas never join the bank');
const row=B.add(f,'ژل کنترل چربی تست برند');assert(row&&row.id.startsWith('bank-'));
assert.equal(B.find('ژل کنترل چربی تست برند').id,f.id,'exact query');assert.equal(B.find('testbrand oil control gel').id,f.id,'English words');assert.equal(B.find('کرم مرطوب کننده'),null,'unrelated query');
B.hit(row,'تست برند ژل');assert.equal(B.find('تست برند ژل').id,f.id,'new spelling remembered');
assert(!JSON.stringify(B.publicBank()).includes('aliases'),'other shoppers\' queries are not published');
// wallet: two free checks, then Negin, then nothing; refunds when nothing new was bought
assert.equal(B.charge('dev1','1.1.1.1',cfg),'free');assert.equal(B.charge('dev1','1.1.1.1',cfg),'free');assert.equal(B.charge('dev1','1.1.1.1',cfg),null);
B.credit('dev1',2);assert.deepEqual(B.balance('dev1',cfg),{free:0,negin:2});assert.equal(B.charge('dev1','1.1.1.1',cfg),'negin');B.refund('dev1','negin');assert.equal(B.balance('dev1',cfg).negin,2);
for(let i=0;i<6;i++)B.charge('d'+i,'9.9.9.9',cfg);assert.equal(B.charge('fresh','9.9.9.9',cfg),null,'free checks capped per IP per day');
// brand-declared formulas wait for the owner; a full sourced list found later replaces them
{const dj={...research,name_en:'Declared Cream',brand:'DeclBrand',role:'moisturizer',inci:[],actives:[{cls:'CERAMIDE',name:'Ceramides'}],made_for:['dry']};
 const df=B.toFormula(dj,'declared cream',[],'m');assert.equal(df.basis,'declared_name');
 const dr=B.add(df,'declared cream',{pending:true,declared:true,source:'search-declared'});assert(dr&&dr.pending,'declared waits for approval');assert.equal(B.find('declared cream'),null,'not shown to others yet');
 assert.equal(B.add(B.toFormula({...dj,actives:[],made_for:[]},'empty',[],'m'),'empty',{pending:true,declared:true}),null,'a declared formula that says nothing real is not stored');
 const full=B.toFormula({...dj,inci:['Aqua','Glycerin','Ceramide NP','Cholesterol','Phytosphingosine','Dimethicone']},'declared cream',[{url:'https://incidecoder.com/y'}],'m');
 const up=B.add(full,'declared cream',{source:'search-verified'});assert.equal(up.id,dr.id);assert.equal(up.basis,'inci_sourced','upgraded to the full list');assert(!up.pending,'and live');assert.equal(B.find('declared cream').id,dr.id)}
// sign-in: free checks are per person, diamonds follow her (after SMS), the welcome gift is once per person
{const c2={freeChecks:2,freePerIpDay:99,registerGift:3};
 assert.equal(B.charge('pa','5.5.5.1',c2),'free');assert.equal(B.charge('pa','5.5.5.1',c2),'free');B.credit('pa',4);
 let L=B.link('pa','09120000001',{verified:true,cfg:c2,giftOk:true});assert.equal(L.returning,false);assert.equal(L.gift,3);assert.deepEqual(B.balance('pa',c2),{free:0,negin:7});
 L=B.link('pa','09120000001',{verified:true,cfg:c2,giftOk:true});assert.equal(L.gift,0,'signing in again never re-gifts');assert.equal(B.balance('pa',c2).negin,7,'or re-charges');
 L=B.link('pb','09120000001',{verified:true,cfg:c2,giftOk:true});assert.equal(L.returning,true,'a new device / the installed app is a returning person');assert.equal(L.gift,0);
 assert.deepEqual(B.balance('pb',c2),{free:0,negin:7},'free allowance not handed out again; her diamonds are here');
 assert.equal(B.charge('pb','5.5.5.2',c2),'negin');assert.equal(B.balance('pa',c2).negin,6,'one purse across her devices');
 B.link('pc','09120000001',{verified:false,cfg:c2,giftOk:true});assert.deepEqual(B.balance('pc',c2),{free:0,negin:0},'unverified sign-in: no free checks again, and no access to her diamonds');
 B.link('pd','09120000002',{verified:false,cfg:c2,giftOk:false});assert.equal(B.balance('pd',c2).negin,0,'no gift without the go-ahead');
 assert.equal(B.phoneOf('pb'),'09120000001');const st=B.walletStats();assert(st.accounts>=2&&st.neginLeft>=6)}
// engine: the bank formula is judged per skin like any catalog product
const t=x=>ts.transpile(fs.readFileSync(x,'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
fs.writeFileSync(path.join(dir,'catalog-routine.mjs'),t('assistant/catalog-routine.ts'));fs.writeFileSync(path.join(dir,'ingredient-guide.mjs'),t('assistant/ingredient-guide.ts'));fs.copyFileSync('assistant/resources/catalog-formulas.json',path.join(dir,'catalog-formulas.json'));
fs.writeFileSync(path.join(dir,'catalog-review.mjs'),t('assistant/catalog-review.ts').replace("'./catalog-routine'","'./catalog-routine.mjs'").replace("'./ingredient-guide'","'./ingredient-guide.mjs'").replace(/from '\.\/resources\/catalog-formulas\.json';/,"from './catalog-formulas.json' with {type:'json'};"));
const m=await import(path.join(dir,'catalog-review.mjs'));m.CATALOG.products.push(B.publicBank().products[0]);
const ctx=skin=>({profile:{skinBase:skin,skinToday:'متعادل',barrier:'سالم'},selection:[],ownedIds:[],owned:[]});
assert.equal(m.catalogPurchaseCheck(ctx('خشک'),f.id).decision,'avoid','oil-control BHA cleanser is not for dry skin');
assert.equal(m.catalogPurchaseCheck(ctx('چرب'),f.id).decision,'buy','and fits oily skin');
assert.notEqual(m.catalogPurchaseCheck({...ctx('چرب'),selection:[{id:'avene-oil',name:'',time:'pm'}]},f.id).decision,'buy','routine already has a cleanser');
console.log('PASS bank: sign-in links wallets per person (no re-gift, no second free allowance, diamonds follow her), declared formulas wait + upgrade to full lists, formula from research, vocab filter, weak formulas kept out, lookup + aliases, free→Negin→none, refunds, IP cap, per-skin verdict, routine-aware');
