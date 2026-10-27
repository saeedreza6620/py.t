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
 ['PEPTIDE',/\b(palmitoyl|acetyl hexapeptide|copper tripeptide|peptide)\b/i],
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
  function add(f,query,opts={}){if(!f||f.basis!=='inci_sourced')return null;
    const q=normName(query),aliases=[...new Set([q,normName(f.name),normName(f.en),normName(f.brand+' '+f.en)].filter(x=>x&&x.length>=2))];
    const old=bank.products.find(p=>p.id===f.id);if(old){if(!opts.pending&&old.pending)delete old.pending;if(f.replaces&&!old.replaces)old.replaces=f.replaces;old.aliases=[...new Set([...(old.aliases||[]),...aliases])].slice(0,20);bump();return old}
    const row={...f,aliases,query:String(query).slice(0,120),addedAt:new Date().toISOString(),hits:0,...(opts.pending?{pending:true,source:opts.source||'prefill'}:{})};bank.products.push(row);bump();return row}
  function hit(p,query){p.hits=(p.hits||0)+1;p.lastHit=new Date().toISOString();const q=normName(query);if(q&&!(p.aliases||[]).includes(q))p.aliases=[...(p.aliases||[]),q].slice(0,20);bump()}
  function setReplaces(p,id){if(p&&id&&!p.replaces){p.replaces=id;bump()}}
  function setImage(id,url){const p=bank.products.find(x=>x.id===id);if(!p)return;p.image=url;bump()}
  function approve(id){const p=bank.products.find(x=>x.id===id);if(!p||!p.pending)return false;delete p.pending;p.approvedAt=new Date().toISOString();bump();return true}
  function remove(id){const n=bank.products.length;bank.products=bank.products.filter(p=>p.id!==id);if(bank.products.length!==n)bump();return n!==bank.products.length}
  // what the browser needs: formula + names (no aliases/queries of other shoppers)
  function publicBank(){if(!pub)pub={version:bank.products.length,products:bank.products.filter(p=>!p.pending).map(({aliases,query,hits,lastHit,model,addedAt,pending,source,approvedAt,...f})=>f)};return pub}

  // ---------- wallets: free checks + Negin, kept on the server ----------
  const ipFree=new Map();
  function wallet(d){return wallets[d]||(wallets[d]={free:0,negin:0,at:new Date().toISOString()})}
  function balance(d,cfg){if(!d)return {free:0,negin:0};const w=wallet(d);return {free:Math.max(0,(Number(cfg.freeChecks)||0)-w.free),negin:w.negin}}
  function charge(d,ip,cfg){if(!d)return null;const w=wallet(d);const day=new Date().toISOString().slice(0,10);const k=ip+'|'+day;
    if(w.free<(Number(cfg.freeChecks)||0)&&(ipFree.get(k)||0)<(Number(cfg.freePerIpDay)||6)){w.free++;ipFree.set(k,(ipFree.get(k)||0)+1);save(WAL,wallets);return 'free'}
    if(w.negin>0){w.negin--;w.spent=(w.spent||0)+1;save(WAL,wallets);return 'negin'}
    return null}
  function refund(d,via){if(!d||!via)return;const w=wallet(d);if(via==='free')w.free=Math.max(0,w.free-1);else{w.negin++;w.spent=Math.max(0,(w.spent||0)-1)}save(WAL,wallets)}
  // the shopper's own routine products are researched for free (they already own them); capped against abuse
  const ipRoutine=new Map();
  function routineFree(d,ip,cfg){if(!d)return false;const w=wallet(d);const day=new Date().toISOString().slice(0,10);const k=ip+'|'+day;
    if((w.routine||0)>=(Number(cfg.freeRoutine)||40)||(ipRoutine.get(k)||0)>=(Number(cfg.freeRoutinePerIpDay)||25))return false;
    w.routine=(w.routine||0)+1;ipRoutine.set(k,(ipRoutine.get(k)||0)+1);save(WAL,wallets);return true}
  function routineBack(d){if(!d)return;const w=wallet(d);w.routine=Math.max(0,(w.routine||0)-1);save(WAL,wallets)}
  function adjust(d,delta){if(!d)return;const w=wallet(d);w.negin+=delta;save(WAL,wallets)}
  function credit(d,n){if(!d)return;const w=wallet(d);w.negin+=n;w.bought=(w.bought||0)+n;save(WAL,wallets)}
  function walletStats(){const v=Object.values(wallets);return {devices:v.length,freeUsed:v.reduce((a,w)=>a+(w.free||0),0),neginSpent:v.reduce((a,w)=>a+(w.spent||0),0),neginBought:v.reduce((a,w)=>a+(w.bought||0),0),neginLeft:v.reduce((a,w)=>a+(w.negin||0),0)}}

  return {find,toFormula,add,hit,setImage,setReplaces,approve,remove,publicBank,list:()=>bank.products,balance,charge,refund,credit,adjust,walletStats,routineFree,routineBack};
}
