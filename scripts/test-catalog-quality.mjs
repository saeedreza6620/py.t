// Catalog quality gate: a product only counts as fully checked when its ingredient list is complete and
// traceable, and every product the app shows has a formula entry. Products added from batch files must
// also carry a local light photo.
import fs from 'node:fs';
const C=JSON.parse(fs.readFileSync('assistant/resources/catalog-formulas.json','utf8'));let fail=0;const bad=(m)=>{fail++;console.error('FAIL',m)};
const ids=new Set();
for(const p of C.products){
  if(ids.has(p.id))bad('duplicate id '+p.id);ids.add(p.id);
  if(!p.name||!p.role)bad('name/role missing '+p.id);
  if(p.basis==='inci_sourced'){
    const n=String(p.inci||'').split(/,\s*/).filter(Boolean).length;if(n<5)bad('incomplete INCI ('+n+') '+p.id);
    if(!(p.sources||[]).some(u=>/^https:\/\//.test(u)))bad('no https source '+p.id);
  }else if(p.basis!=='declared_name')bad('unknown basis '+p.id);
}
// every batch product shown in the app has a formula and a local photo
const np=fs.readFileSync('public/legacy/new-products.js','utf8');
for(const m of np.matchAll(/window\.BW_ADDED_PRODUCTS\.push\(\.\.\.(\[.*?\])\);/gs)){
  for(const x of JSON.parse(m[1])){
    if(!ids.has(x.id))bad('shown without formula '+x.id);
    const img=String(x.image||'');if(!img.startsWith('./t/'))bad('no local light photo '+x.id);
    else if(!fs.existsSync('public/legacy/'+img.slice(2)))bad('photo file missing '+img);
  }
}
// same product twice under different ids (brand + English name)
const key=p=>String(p.en||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const seen=new Map();
for(const p of C.products){const k=key(p);if(k.length<8)continue;if(seen.has(k))bad('same English name: '+seen.get(k)+' / '+p.id);seen.set(k,p.id)}
if(fail){console.error(fail+' catalog problems');process.exit(1)}console.log('catalog quality ok:',C.products.length,'products,',C.products.filter(p=>p.basis==='inci_sourced').length,'with full INCI');
