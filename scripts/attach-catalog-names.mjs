// Copies the visible catalog name/category (app-core.js + new-products.js) into
// assistant/resources/catalog-formulas.json so server and browser use one identity list.
import fs from 'node:fs';
const core=fs.readFileSync(new URL('../public/legacy/app-core.js',import.meta.url),'utf8');
const start=core.indexOf('const PRODUCTS=');const products=JSON.parse(core.slice(start+15,core.indexOf('];',start)+1));
const added=[...fs.readFileSync(new URL('../public/legacy/new-products.js',import.meta.url),'utf8').matchAll(/^\s*\['([^']+)','([^']+)','([^']+)','([^']+)'/mg)].map(m=>({id:m[1],cat:m[2],name:m[3],en:m[4]}));
const index=new Map([...products,...added].map(p=>[p.id,p]));
const file=new URL('../assistant/resources/catalog-formulas.json',import.meta.url);
const data=JSON.parse(fs.readFileSync(file,'utf8'));
const missing=[];
for(const p of data.products){const c=index.get(p.id);if(!c){missing.push(p.id);continue;}p.name=c.name;p.en=c.en;p.cat=c.cat;}
const uncovered=[...index.keys()].filter(id=>!data.products.some(p=>p.id===id));
if(missing.length||uncovered.length){console.error('catalog mismatch',{missing,uncovered});process.exit(1);}
data.products=data.products.map(({id,name,en,cat,...rest})=>({id,name,en,cat,...rest}));
fs.writeFileSync(file,JSON.stringify(data,null,1)+'\n');
console.log('catalog formulas:',data.products.length,'named');
