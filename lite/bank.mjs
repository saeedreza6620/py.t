// Formula bank + Negin wallets for the lite server.
// Every product a shopper researches is stored once as a structured formula (same shape as the
// built-in catalog), so the next shopper gets it instantly, free, and judged by the same
// deterministic engine against their own skin and routine.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';

export const ROLES=['cleanser','micellar','toner','serum','treatment','spot','moisturizer','sunscreen','mask','eye','lash'];
const CLAIMS=['oily','combination','dry','normal','sensitive','acne','all','damaged','pores','mature','aging','pigmentation','dull','redness','texture','rough_texture','eye','lash'];
const FLAGS=['fragrance','essential_oil','soap_base','enzyme_exfoliant','rich_oils','waxy_base','moisture_rich','white_cast_possible','tinted','high_strength','short_contact'];
const CLS=['BHA','AHA','PHA','RETINOID','AZELAIC','VITAMIN_B3','VITC','VITC_LAA','VITC_DERIV','TXA','ARBUTIN','CYSTEAMINE','ENZYME','ZINC','CERAMIDE','HUMECTANT','SOOTHING','PEPTIDE','BAKUCHIOL'];
const TEXTURES=['water','gel','foam','gel-foam','powder','watery-cream','gel-serum','light-cream','cream','stick','light-fluid','serum','serum-oil','cream-gel','gel-cream','fluid','rich-cream','peel-off'];
const ROLE_FA={cleanser:'شوینده',micellar:'میسلار واتر',toner:'تونر',serum:'سرم',treatment:'درمان موضعی',spot:'ژل موضعی',moisturizer:'مرطوب‌کننده',sunscreen:'ضد آفتاب',mask:'ماسک',eye:'دور چشم',lash:'مژه و ابرو'};
const CAT_ROLE={cleanser:'cleanser',toner:'toner',serum:'serum',moisturizer:'moisturizer',sunscreen:'sunscreen',mask:'mask',exfoliant:'treatment',eye:'eye'};
const RINSE=new Set(['cleanser','micellar','mask']);

export const RESEARCH_SCHEMA_HINT=`
Also classify the product for BeautyWallet's skin engine, using ONLY these values (anything else is dropped):
"role": one of ${ROLES.join('|')}
"rinse_off": true for cleansers, micellar waters and wash-off masks
"texture": one of ${TEXTURES.join('|')}
"finish": "matte"|"dewy"|"natural"|null
"actives": [{"cls": one of ${CLS.join('|')}, "name": INCI name, "pct": number or null}] — only ingredients that are in the INCI list; pct only if the brand states it
"made_for": skin types / concerns the brand itself targets, from ${CLAIMS.join('|')} ("all" only if the brand says all skin types)
"flags": from ${FLAGS.join('|')} — fragrance if Parfum/Fragrance is listed, essential_oil if essential oils are listed, soap_base for soap/sodium tallowate bases, rich_oils for heavy oils/butters high in the list, moisture_rich for rich occlusive creams, white_cast_possible for mineral sunscreens, high_strength for strong exfoliant/retinoid strengths
"image_url": the https URL of the official product photo (brand site or a big retailer), or null
Add these keys to the same JSON object.`;

// ---------- INCI cross-check: an active counts only if it is really on the ingredient list ----------
export const INCI_RULES=[
 ['RETINOID',/\b(retinol|retinal|retinaldehyde|retinyl (palmitate|propionate|acetate)|hydroxypinacolone retinoate|adapalene|tretinoin|tazarotene)\b/i],
 ['BHA',/\bsalicylic acid\b|\bbetaine salicylate\b|\bwillow bark extract\b/i],
 ['AHA',/\b(glycolic|lactic|mandelic|malic|tartaric) acid\b/i],
 ['PHA',/\b(gluconolactone|lactobionic acid)\b/i],
 ['AZELAIC',/\b(azelaic acid|potassium azeloyl diglycinate)\b/i],
 ['VITAMIN_B3',/\bniacinamide\b/i],
 ['VITC_LAA',/(^|,\s*)ascorbic acid\b/i],
 ['VITC_DERIV',/\b(ascorbyl glucoside|3-o-ethyl ascorbic acid|ethyl ascorbic acid|sodium ascorbyl phosphate|magnesium ascorbyl phosphate|ascorbyl tetraisopalmitate|tetrahexyldecyl ascorbate|ascorbyl palmitate)\b/i],
 ['TXA',/\btranexamic acid\b/i],
 ['ARBUTIN',/\b(alpha-arbutin|arbutin)\b/i],
 ['CYSTEAMINE',/\bcysteamine\b/i],
 ['CERAMIDE',/\bceramide\b/i],
 ['HUMECTANT',/\b(sodium hyaluronate|hyaluronic acid|hydrolyzed hyaluronic acid)\b/i],
 ['SOOTHING',/\b(centella asiatica|madecassoside|asiaticoside|panthenol|allantoin)\b/i],
 ['ZINC',/\bzinc (pca|gluconate|sulfate)\b/i],
 ['BAKUCHIOL',/\bbakuchiol\b/i],
 ['PEPTIDE',/peptide|\bmatrixyl\b/i],
 ['ENZYME',/\b(papain|bromelain|subtilisin|protease)\b/i]];
// exfoliating acids low in the list are often pH adjusters, not actives
const POS_LIMIT={AHA:0.66};
export function inciClasses(inci){const items=String(inci||'').split(/,\s*/).map(s=>s.trim()).filter(Boolean);const out=new Set();
 items.forEach((it,i)=>{for(const [cls,rx] of INCI_RULES){if(!rx.test(it))continue;if(POS_LIMIT[cls]&&items.length>8&&i/items.length>POS_LIMIT[cls])continue;out.add(cls)}});return out}
export const inciFragrance=inci=>/(^|,\s*)(parfum|fragrance|aroma)\b/i.test(String(inci||''));

export const normName=q=>String(q||'').toLowerCase().replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').replace(/[‌\s\-_.,،()\/+]+/g,' ').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).trim().slice(0,160);
const tokens=s=>normName(s).split(' ').filter(t=>t.length>=2);

export function makeBank(DATA){
  const FILE=path.join(DATA,'formula-bank.json'),WAL=path.join(DATA,'wallets.json');
  let bank={version:1,products:[]};try{bank=JSON.parse(fs.readFileSync(FILE,'utf8'))}catch{}
  let wallets={};try{wallets=JSON.parse(fs.readFileSync(WAL,'utf8'))}catch{}
  // one-time safety copy before wallets start linking to accounts (v122)
  try{const bk=path.join(DATA,'wallets.pre-accounts.json');if(fs.existsSync(WAL)&&!fs.existsSync(bk))fs.copyFileSync(WAL,bk)}catch{}
  const save=(f,v)=>{try{fs.writeFileSync(f+'.tmp',JSON.stringify(v));fs.renameSync(f+'.tmp',f)}catch(e){console.error('save',f,e.message)}};
  let pub=null;const bump=()=>{pub=null;save(FILE,bank)};

  // ---------- lookup ----------
  function find(query){const q=normName(query);if(q.length<2)return null;
    const live=bank.products.filter(p=>!p.pending);
    const exact=live.find(p=>(p.aliases||[]).includes(q));if(exact)return exact;
    const qt=tokens(q);if(qt.length<2)return null;
    // every word the shopper typed must be in the stored product (name, English name, brand, earlier queries)
    let best=null,bestScore=0;for(const p of live){const hay=new Set(tokens([p.name,p.en,p.brand,...(p.aliases||[])].join(' ')));
      const hit=qt.filter(t=>hay.has(t)).length;if(hit===qt.length&&hit>bestScore){best=p;bestScore=hit}}
    return best}

  // ---------- research JSON → engine formula ----------
  function toFormula(j,query,sources,model){
    const list=(v,ok)=>(Array.isArray(v)?v:[]).map(x=>String(x).trim()).filter(x=>ok.includes(x));
    let role=ROLES.includes(j.role)?j.role:CAT_ROLE[j.category]||'';if(!role)return null;
    if(role==='cleanser'&&/micellar|میسلار/i.test((j.name_en||'')+' '+(j.name_fa||'')))role='micellar';
    const actives=(Array.isArray(j.actives)?j.actives:[]).filter(a=>a&&CLS.includes(a.cls)).slice(0,12).map(a=>({cls:a.cls,name:String(a.name||a.cls).slice(0,60),...(Number.isFinite(Number(a.pct))&&a.pct!==null?{pct:Number(a.pct),declared:true}:{})}));
    const flags=list(j.flags,FLAGS);if(j.fragrance===true&&!flags.includes('fragrance'))flags.push('fragrance');if((j.essential_oils||[]).length&&!flags.includes('essential_oil'))flags.push('essential_oil');
    const inci=(j.inci||[]).map(v=>String(v).trim()).filter(Boolean);
    // with a real INCI list, the list decides: drop actives the model named but the list doesn't have, add the ones it missed
    if(inci.length>=5){const got=inciClasses(inci.join(', '));const kept=actives.filter(a=>got.has(a.cls)||(a.cls==='VITC'&&(got.has('VITC_LAA')||got.has('VITC_DERIV'))));
      for(const c of got)if(!kept.some(a=>a.cls===c||(a.cls==='VITC'&&c.startsWith('VITC'))))kept.push({cls:c,name:(inci.find(x=>INCI_RULES.find(r=>r[0]===c)[1].test(x))||c).slice(0,60)});
      actives.splice(0,actives.length,...kept.slice(0,12));
      if(inciFragrance(inci.join(', '))){if(!flags.includes('fragrance'))flags.push('fragrance')}else{const k=flags.indexOf('fragrance');if(k>=0)flags.splice(k,1)}}
    const urls=(sources||[]).map(s=>s&&s.url).filter(u=>/^https:\/\//.test(u||'')).slice(0,4);
    const name_en=String(j.name_en||'').slice(0,120),brand=String(j.brand||'').slice(0,60);
    const id='bank-'+crypto.createHash('sha1').update(normName(brand+' '+(name_en||j.name_fa||query))).digest('hex').slice(0,10);
    return {id,name:String(j.name_fa||name_en||query).slice(0,120),en:name_en,brand,cat:ROLE_FA[role],role,rinseOff:typeof j.rinse_off==='boolean'?j.rinse_off:RINSE.has(role),
      texture:TEXTURES.includes(j.texture)?j.texture:role==='cleanser'?'gel':role==='serum'?'serum':'cream',...(['matte','dewy','natural'].includes(j.finish)?{finish:j.finish}:{}),
      ...(Number(j.spf)>0?{spf:Number(j.spf)}:{}),actives,claims:list(j.made_for,CLAIMS),flags,
      basis:inci.length>=5&&urls.length?'inci_sourced':'declared_name',sources:urls,checked:new Date().toISOString().slice(0,10),inci:inci.join(', ').slice(0,2400),
      variants:(j.variants||[]).slice(0,4).map(v=>String(v).slice(0,80)),model}}

  // only well-sourced formulas join the bank: the next shopper must get an answer as good as the first
  // pending: found by the catalog prefill job, waits for the owner's approval in /admin before anyone sees it
  // brand-declared formulas (no full list published) may wait for the owner's approval when they say something real
  function add(f,query,opts={}){if(!f)return null;if(f.basis!=='inci_sourced'&&!(opts.pending&&opts.declared&&((f.actives||[]).length||(f.claims||[]).length||f.spf)))return null;
    const q=normName(query),aliases=[...new Set([q,normName(f.name),normName(f.en),normName(f.brand+' '+f.en)].filter(x=>x&&x.length>=2))];
    const old=bank.products.find(p=>p.id===f.id);if(old&&old.basis!=='inci_sourced'&&f.basis==='inci_sourced'){const keep={aliases:old.aliases,hits:old.hits,lastHit:old.lastHit,addedAt:old.addedAt,image:old.image,replaces:old.replaces||f.replaces};for(const k of Object.keys(old))delete old[k];Object.assign(old,f,keep,{query:String(query).slice(0,120),upgradedAt:new Date().toISOString()},opts.source?{source:opts.source}:{});if(opts.pending){old.pending=true}}
    if(old){if(!opts.pending&&old.pending)delete old.pending;if(f.replaces&&!old.replaces)old.replaces=f.replaces;old.aliases=[...new Set([...(old.aliases||[]),...aliases])].slice(0,20);bump();return old}
    const row={...f,aliases,query:String(query).slice(0,120),addedAt:new Date().toISOString(),hits:0,...(opts.pending?{pending:true,source:opts.source||'prefill'}:opts.source?{source:opts.source}:{})};bank.products.push(row);bump();return row}
  function hit(p,query){p.hits=(p.hits||0)+1;p.lastHit=new Date().toISOString();const q=normName(query);if(q&&!(p.aliases||[]).includes(q))p.aliases=[...(p.aliases||[]),q].slice(0,20);bump()}
  function setReplaces(p,id){if(p&&id&&!p.replaces){p.replaces=id;bump()}}
  function setImage(id,url){const p=bank.products.find(x=>x.id===id);if(!p)return;p.image=url;bump()}
  function approve(id){const p=bank.products.find(x=>x.id===id);if(!p||!p.pending)return false;delete p.pending;p.approvedAt=new Date().toISOString();bump();return true}
  function remove(id){const n=bank.products.length;bank.products=bank.products.filter(p=>p.id!==id);if(bank.products.length!==n)bump();return n!==bank.products.length}
  // what the browser needs: formula + names (no aliases/queries of other shoppers)
  function publicBank(){if(!pub)pub={version:bank.products.length,products:bank.products.filter(p=>!p.pending).map(({aliases,query,hits,lastHit,model,addedAt,pending,source,approvedAt,...f})=>f)};return pub}

  // ---------- wallets: free checks + Negin, kept on the server ----------
  // A wallet starts per device. Once she signs in with her mobile, the device is linked to her account
  // ('p:<phone>'): free checks and free routine checks are counted per PERSON (signing out/in, a new
  // phone or the installed app never hands out the free allowance again), and — after an SMS-verified
  // sign-in — her diamonds live on the account, so they follow her to every device and are never lost.
  const ipFree=new Map();
  const now=()=>new Date().toISOString();
  function dev(d){const w=wallets[d];if(w)return w;return wallets[d]={free:0,negin:0,at:now()}}
  function acct(p){const k='p:'+p;return wallets[k]||(wallets[k]={acct:true,free:0,routine:0,negin:0,at:now(),devices:[]})}
  function cnt(d){const w=dev(d);return w.phone?acct(w.phone):w}               // free / routine counters
  function bag(d){const w=dev(d);return w.phone&&w.merged?acct(w.phone):w}      // where her diamonds are
  function wallet(d){return bag(d)}
  function balance(d,cfg){if(!d)return {free:0,negin:0};const c=cnt(d),b=bag(d);const o={free:Math.max(0,(Number(cfg.freeChecks)||0)-(c.free||0)),negin:b.negin||0};if(b.subUntil&&Date.parse(b.subUntil)>Date.now()-30*864e5)o.subUntil=b.subUntil;return o}
  function charge(d,ip,cfg){if(!d)return null;const c=cnt(d),w=bag(d);const day=now().slice(0,10);const k=ip+'|'+day;
    if((c.free||0)<(Number(cfg.freeChecks)||0)&&(ipFree.get(k)||0)<(Number(cfg.freePerIpDay)||6)){c.free=(c.free||0)+1;ipFree.set(k,(ipFree.get(k)||0)+1);save(WAL,wallets);return 'free'}
    if(w.negin>0){w.negin--;w.spent=(w.spent||0)+1;save(WAL,wallets);return 'negin'}
    return null}
  function refund(d,via){if(!d||!via)return;if(via==='free'){const c=cnt(d);c.free=Math.max(0,(c.free||0)-1)}else{const w=bag(d);w.negin++;w.spent=Math.max(0,(w.spent||0)-1)}save(WAL,wallets)}
  // the shopper's own routine products are researched for free (they already own them); capped against abuse
  const ipRoutine=new Map();
  function routineFree(d,ip,cfg){if(!d)return false;const c=cnt(d);const day=now().slice(0,10);const k=ip+'|'+day;
    if((c.routine||0)>=(Number(cfg.freeRoutine??5))||(ipRoutine.get(k)||0)>=(Number(cfg.freeRoutinePerIpDay)||25))return false;
    c.routine=(c.routine||0)+1;ipRoutine.set(k,(ipRoutine.get(k)||0)+1);save(WAL,wallets);return true}
  function routineBack(d){if(!d)return;const c=cnt(d);c.routine=Math.max(0,(c.routine||0)-1);save(WAL,wallets)}
  function adjust(d,delta){if(!d)return;const w=bag(d);w.negin+=delta;save(WAL,wallets)}
  function credit(d,n){if(!d)return;const w=bag(d);w.negin+=n;w.bought=(w.bought||0)+n;save(WAL,wallets)}
  // sign-in: link this device to her mobile. verified = the SMS code was checked (only then do the
  // account's diamonds open on this device). giftOk = the welcome gift may be given (once per person).
  function link(d,phone,{verified=false,cfg={},giftOk=false}={}){if(!d||!phone)return null;const w=dev(d),k='p:'+phone,returning=!!wallets[k]&&((wallets[k].devices||[]).length>0);const a=acct(phone);
    if(w.phone!==phone){ // this device joins this person: what it already used counts toward her (no second free allowance)
      if(!w.phone){a.free=(a.free||0)+(w.free||0);a.routine=(a.routine||0)+(w.routine||0)}
      w.phone=phone;w.merged=false}
    if(verified&&!w.merged){a.negin=(a.negin||0)+(w.negin||0);a.bought=(a.bought||0)+(w.bought||0);a.spent=(a.spent||0)+(w.spent||0);w.negin=0;w.bought=0;w.spent=0;w.merged=true}
    if(!a.devices.includes(d))a.devices=[...a.devices,d].slice(-8);a.last=now();
    let gift=0;const g=Number(cfg.registerGift)||0;if(g>0&&giftOk&&!a.gift&&!w.gift){a.gift=g;w.gift=g;bag(d).negin+=g;gift=g}
    save(WAL,wallets);return {returning,gift,wallet:balance(d,cfg)}}
  // monthly subscription (prepaid, renewed by hand): an end date on her purse; renewing early adds to it
  function subExtend(d,days){if(!d)return null;const w=bag(d);const base=Math.max(Date.now(),Date.parse(w.subUntil||0)||0);w.subUntil=new Date(base+days*864e5).toISOString();save(WAL,wallets);return w.subUntil}
  function phoneOf(d){const w=d&&wallets[d];return w&&w.phone||''}
  function walletStats(){const keys=Object.keys(wallets),dv=keys.filter(k=>!k.startsWith('p:')),ac=keys.filter(k=>k.startsWith('p:')).map(k=>wallets[k]);
    const counters=[...ac,...dv.map(k=>wallets[k]).filter(w=>!w.phone)],bags=Object.values(wallets);
    return {devices:dv.length,accounts:ac.length,freeUsed:counters.reduce((s,w)=>s+(w.free||0),0),neginSpent:bags.reduce((s,w)=>s+(w.spent||0),0),neginBought:bags.reduce((s,w)=>s+(w.bought||0),0),neginLeft:bags.reduce((s,w)=>s+(w.negin||0),0)}}

  return {find,toFormula,add,hit,setImage,setReplaces,approve,remove,publicBank,list:()=>bank.products,balance,charge,refund,credit,adjust,walletStats,routineFree,routineBack,link,phoneOf,subExtend};
}
