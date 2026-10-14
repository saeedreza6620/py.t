import {adminSession} from '../../../site-sessions';
import {validOrigin} from '../../../phone-auth';
import {database} from '../../../../db/raw';
import {ensureKnowledgeRegistry,registryStatus} from '../../../../assistant/knowledge-registry';

export const runtime='edge';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

export async function GET(request:Request){
  if(!await adminSession(request))return json({error:'برای مشاهده پنل وارد شوید.'},403);
  try{
    await ensureKnowledgeRegistry();
    const [status,sources,rules]=await Promise.all([
      registryStatus(),
      database().prepare(`SELECT source_id,title,publisher,source_type,url,evidence_level,checked_at,expires_at,status,version
        FROM assistant_knowledge_sources ORDER BY status='published' DESC, checked_at DESC LIMIT 100`).all(),
      database().prepare(`SELECT rule_id,title,safety_level,evidence_level,status,reviewed_at,valid_from,expires_at,source_ids_json
        FROM assistant_knowledge_rules ORDER BY status='published' DESC,safety_level DESC,title LIMIT 100`).all(),
    ]);
    return json({status,sources:sources.results,rules:rules.results});
  }catch{return json({error:'وضعیت دانش در دسترس نیست.'},503)}
}

export async function POST(request:Request){
  if(!validOrigin(request))return json({error:'درخواست نامعتبر است.'},403);
  if(!await adminSession(request))return json({error:'برای مدیریت دانش وارد شوید.'},403);
  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>}catch{return json({error:'درخواست نامعتبر است.'},400)}
  if(body.action!=='sync_curated')return json({error:'عملیات پشتیبانی نمی‌شود.'},400);
  try{await ensureKnowledgeRegistry(true);return json({ok:true,status:await registryStatus()})}
  catch{return json({error:'همگام‌سازی انجام نشد.'},503)}
}
