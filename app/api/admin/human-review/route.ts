import {adminSession} from '../../../site-sessions';
import {validOrigin} from '../../../phone-auth';
import {database} from '../../../../db/raw';
import {ensureHumanReviews} from '../../../../assistant/human-review';
export const runtime='edge';
const json=(b:unknown,s=200)=>Response.json(b,{status:s,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){if(!await adminSession(req))return json({error:'ورود مدیریت لازم است'},403);await ensureHumanReviews();const rows=await database().prepare('SELECT id,question,status,reply,reviewer,created_at FROM bw_human_reviews ORDER BY created_at DESC LIMIT 100').all();return json({requests:rows.results});}
export async function POST(req:Request){if(!validOrigin(req)||!await adminSession(req))return json({error:'ورود مدیریت لازم است'},403);try{const b=await req.json() as Record<string,unknown>;if(typeof b.id!=='string'||typeof b.reply!=='string'||!b.reply.trim()||b.reply.length>5000||typeof b.reviewer!=='string'||!b.reviewer.trim()||b.reviewer.length>120)return json({error:'پاسخ و نام پاسخ‌دهنده لازم است'},400);await ensureHumanReviews();const r=await database().prepare("UPDATE bw_human_reviews SET reply=?,reviewer=?,status='answered',updated_at=? WHERE id=?").bind(b.reply.trim(),b.reviewer.trim(),new Date().toISOString(),b.id).run();return json({ok:!!r.meta.changes});}catch{return json({error:'ثبت انجام نشد'},400)}}
