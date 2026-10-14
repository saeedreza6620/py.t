import {adminSession} from '../../../../site-sessions';
import {validOrigin} from '../../../../phone-auth';
import {database} from '../../../../../db/raw';
import {activeDataset,ensureDataset,auditDataset} from '../../../../../assistant/dataset-store';
import {validateDataset} from '../../../../../assistant/dataset-quality';
export const runtime='edge';
const json=(b:unknown,s=200)=>Response.json(b,{status:s,headers:{'Cache-Control':'no-store'}});
export async function GET(r:Request){if(!await adminSession(r))return json({error:'ورود مدیریت لازم است'},403);try{const dataset=await activeDataset();const versions=await database().prepare('SELECT id,status,reviewer,created_at FROM bw_product_dataset ORDER BY created_at DESC LIMIT 20').all();return json({dataset,audit:auditDataset(dataset),versions:versions.results});}catch{return json({error:'دریافت دیتاست انجام نشد'},503);}}
export async function POST(r:Request){if(!validOrigin(r)||!await adminSession(r))return json({error:'ورود مدیریت لازم است'},403);try{const raw=await r.text();if(raw.length>900000)return json({error:'بسته بیش از حد بزرگ است'},413);const b=JSON.parse(raw);await ensureDataset();if(b.action==='import'){const d=validateDataset(b.dataset),id=crypto.randomUUID();await database().prepare('INSERT INTO bw_product_dataset(id,payload,status,created_at) VALUES(?,?,?,?)').bind(id,JSON.stringify(d),'draft',new Date().toISOString()).run();return json({id,audit:auditDataset(d),status:'draft'});}
 if(b.action!=='publish'||typeof b.id!=='string'||typeof b.reviewer!=='string'||b.reviewer.trim().length<3||b.reviewer.length>120)return json({error:'نسخه و نام بازبین لازم است'},400);
 const row=await database().prepare('SELECT payload FROM bw_product_dataset WHERE id=?').bind(b.id).first<{payload:string}>();if(!row)return json({error:'نسخه پیدا نشد'},404);const d=validateDataset(JSON.parse(row.payload));const audit=auditDataset(d);
 if(d.products.some((p,i)=>p.status==='verified'&&!audit.products[i].ready)||d.rules.some(x=>x.status==='verified'&&(!x.source||!x.reviewed_by))||d.ingredients.some(x=>x.status==='verified'&&!x.source))return json({error:'رکورد تأییدشده بدون پیش‌نیاز قابل انتشار نیست',audit},422);
 await database().batch([database().prepare("UPDATE bw_product_dataset SET status='archived' WHERE status='active'"),database().prepare("UPDATE bw_product_dataset SET status='active',reviewer=?,created_at=? WHERE id=?").bind(b.reviewer.trim(),new Date().toISOString(),b.id)]);return json({ok:true,audit});
 }catch(e){return json({error:e instanceof Error?e.message:'قالب نامعتبر است'},400);}}
