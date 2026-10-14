export type Ingredient={ingredient_id:string;inci_name:string;aliases:string[];classes:string[];source:string;status:string};
export type Product={product_id:string;name:string;brand:string;variant:string;market_version:string;size_ml:number|null;inci_raw:string;sources:string[];verified_by:string;verified_date:string;status:string;source_match:boolean;formula_version?:string};
export type Dataset={products:Product[];ingredients:Ingredient[];rules:Array<{rule_id:string;classes:string[];message:string;source:string;reviewed_by:string;status:string;severity:string}>};
export const normalizeINCI=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
// Preserve slashes and botanical parentheses: they can belong to a single INCI name.
export function parseINCI(raw:string){return raw.split(/[,;\n]|\s+\(and\)\s+/i).map(s=>s.trim()).filter(Boolean);}
export function productQuality(p:Product,ingredients:Ingredient[],now=Date.now()){
 const reasons:string[]=[];const index=new Map<string,Ingredient[]>();
 for(const i of ingredients)for(const alias of [i.inci_name,...i.aliases]){const k=normalizeINCI(alias);index.set(k,[...(index.get(k)||[]),i]);}
 const tokens=parseINCI(p.inci_raw||'');const unknown=tokens.filter(t=>{const matches=index.get(normalizeINCI(t))||[];return matches.length!==1||matches[0].status!=='verified'||!matches[0].source;});
 if(!p.variant||!p.market_version||p.market_version==='نامشخص'||!p.formula_version)reasons.push('variant_unverified');
 if(!tokens.length)reasons.push('inci_missing');if(unknown.length)reasons.push('ingredient_mapping');
 const urls=p.sources.filter(u=>{try{return new URL(u).protocol==='https:'}catch{return false}});
 if(new Set(urls).size<2||!p.source_match)reasons.push('source_comparison');
 const date=Date.parse(p.verified_date);if(!Number.isFinite(date)||date>now||now-date>183*86400000)reasons.push('review_due');
 if(!p.verified_by||p.status!=='verified')reasons.push('review_required');
 if(p.status==='blocked')reasons.push('blocked');
 return {ready:reasons.length===0,reasons,unknown,tokens,classes:[...new Set(tokens.flatMap(t=>(index.get(normalizeINCI(t))||[]).filter(i=>i.status==='verified').flatMap(i=>i.classes)))]};
}
export function auditDataset(data:Dataset){const products=data.products.map(p=>({product_id:p.product_id,name:p.name,...productQuality(p,data.ingredients)}));return {total:products.length,ready:products.filter(p=>p.ready).length,unknown:products.flatMap(p=>p.unknown.map(token=>({product_id:p.product_id,token}))),products};}
export function validateDataset(x:any):Dataset{
 if(!x||!Array.isArray(x.products)||!Array.isArray(x.ingredients)||!Array.isArray(x.rules)||x.products.length>500||x.ingredients.length>2000||x.rules.length>300)throw Error('قالب یا اندازه بسته معتبر نیست');
 const seen=new Set<string>();for(const p of x.products){if(typeof p.product_id!=='string'||!p.product_id||seen.has(p.product_id)||typeof p.name!=='string'||typeof p.inci_raw!=='string'||!Array.isArray(p.sources)||p.sources.some((s:unknown)=>typeof s!=='string'))throw Error('شناسه تکراری یا محصول نامعتبر');seen.add(p.product_id);}
 for(const i of x.ingredients)if(typeof i.ingredient_id!=='string'||typeof i.inci_name!=='string'||!Array.isArray(i.aliases)||!Array.isArray(i.classes)||[...i.aliases,...i.classes].some((s:unknown)=>typeof s!=='string'))throw Error('نگاشت ترکیب نامعتبر');
 for(const r of x.rules)if(typeof r.rule_id!=='string'||!Array.isArray(r.classes)||typeof r.message!=='string')throw Error('قاعده نامعتبر');
 return x;
}
