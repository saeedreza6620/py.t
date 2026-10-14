import {database} from '../db/raw';
import {auditDataset,productQuality,validateDataset,type Dataset} from './dataset-quality';
import seed from './resources/product-dataset.json';
let ready:Promise<void>|null=null;
export async function ensureDataset(){if(!ready)ready=(async()=>{await database().prepare(`CREATE TABLE IF NOT EXISTS bw_product_dataset(id TEXT PRIMARY KEY,payload TEXT NOT NULL,status TEXT NOT NULL,reviewer TEXT,created_at TEXT NOT NULL)`).run();await database().prepare(`INSERT OR IGNORE INTO bw_product_dataset(id,payload,status,created_at) VALUES(?,?,?,?)`).bind('catalog-audit-2026-10-13',JSON.stringify(seed),'active',new Date().toISOString()).run();})().catch(e=>{ready=null;throw e});await ready;}
export async function activeDataset():Promise<Dataset>{await ensureDataset();const row=await database().prepare(`SELECT payload FROM bw_product_dataset WHERE status='active' ORDER BY created_at DESC LIMIT 1`).first<{payload:string}>();return validateDataset(JSON.parse(row?.payload||JSON.stringify(seed)));}
export async function datasetContext(selection:Array<{id:string;name:string}>,productId?:unknown){const d=await activeDataset();const ids=new Set(selection.map(p=>p.id));if(typeof productId==='string')ids.add(productId);const selected=d.products.filter(p=>ids.has(p.product_id));const entries=selected.map(p=>{const q=productQuality(p,d.ingredients);return {id:p.product_id,name:p.name,ready:q.ready,reasons:q.reasons,...(q.ready?{inci_raw:p.inci_raw,classes:q.classes,sources:p.sources}:{} )};});
 const rules=d.rules.filter(r=>r.status==='verified'&&r.source&&r.reviewed_by&&r.classes.length&&r.classes.every(c=>entries.some(p=>p.ready&&p.classes?.includes(c))));
 return {entries,missing:selection.filter(p=>!selected.some(x=>x.product_id===p.id)).map(p=>p.id),rules,auditVersion:'2026-10-13'};
}
export {auditDataset};
