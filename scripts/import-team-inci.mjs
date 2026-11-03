// Import ingredient lists the BeautyWallet team entered by hand (Excel → scripts/data/team-inci-*.json) into
// the built-in catalog: full INCI (translated to standard names; the team's Persian text kept as inci_fa),
// actives recomputed from the list itself (same rules as the bank), declared percentages kept, fragrance /
// essential-oil / tint / mineral flags from the list, and duplicates folded into one product.
// Usage: node scripts/import-team-inci.mjs scripts/data/team-inci-1405-08.json
import fs from 'node:fs';
import {inciClasses,inciFragrance,INCI_RULES} from '../lite/bank.mjs';
const FILE='assistant/resources/catalog-formulas.json';
const C=JSON.parse(fs.readFileSync(FILE,'utf8'));const D=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const today=new Date().toISOString().slice(0,10);let n=0;const report=[];
const EO=/\b(melaleuca alternifolia leaf oil|lavandula angustifolia oil|tea tree oil|citrus [a-z]+ (peel )?oil|eucalyptus|peppermint oil|mentha piperita oil|rosmarinus officinalis leaf oil)\b/i;
for(const [id,v] of Object.entries(D.items)){const p=C.products.find(x=>x.id===id);if(!p){report.push('missing '+id);continue}
  const list=v.inci.split(/,\s*/).map(s=>s.trim()).filter(Boolean);const inci=[...new Set(list)].join(', ');
  const cls=inciClasses(inci);const actives=[];
  for(const c of cls){const rule=INCI_RULES.find(r=>r[0]===c);const name=(list.find(x=>rule[1].test(x))||c).slice(0,60);const a={cls:c,name};
    const pct=(v.pct||{})[c];if(pct!=null){a.pct=pct;a.declared=true}actives.push(a)}
  const flags=new Set((p.flags||[]).filter(f=>!['fragrance','essential_oil','tinted','white_cast_possible','rich_oils'].includes(f)));
  if(inciFragrance(inci))flags.add('fragrance');if(v.eo||EO.test(inci))flags.add('essential_oil');
  if(v.tinted||/\bCI 7749[129]\b/.test(inci))flags.add('tinted');if(v.filters==='mineral'||/(^|,\s*)(titanium dioxide|zinc oxide)\b/i.test(inci)&&p.role==='sunscreen')flags.add('white_cast_possible');if(v.rich)flags.add('rich_oils');
  Object.assign(p,{actives,flags:[...flags],basis:'inci_sourced',sources:v.src?[v.src]:[],team:true,checked:today,inci,inci_fa:v.inci_fa||undefined});
  if(v.spf)p.spf=v.spf;if(v.filters)p.filters=v.filters;if(v.size)p.size=v.size;delete p.note;if(v.check)p.teamCheck=v.check;else delete p.teamCheck;
  n++;report.push(id+': '+actives.map(a=>a.cls+(a.pct!=null?' '+a.pct+'%':'')).join(', ')+(flags.size?' | '+[...flags].join(','):''))}
for(const [dup,keep] of Object.entries(D.duplicates||{})){const i=C.products.findIndex(x=>x.id===dup);if(i>=0){C.products.splice(i,1);report.push('duplicate removed: '+dup+' → '+keep)}}
fs.writeFileSync(FILE,JSON.stringify(C,null,1)+'\n');console.log(report.join('\n'));console.log('imported',n);
