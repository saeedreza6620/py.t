import {database} from '../../../../db/raw';
import {adminSession} from '../../../site-sessions';
import {validOrigin} from '../../../phone-auth';

export const runtime='edge';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){
  if(!await adminSession(request))return json({error:'برای مدیریت وارد شوید.'},403);
  try{
    const rows=await database().prepare(`SELECT id,parent_id,product_name,product_id,kind,skin_type,duration,body,status,created_at
      FROM skin_forum_posts ORDER BY status='pending' DESC,created_at DESC LIMIT 100`).all();
    return json({posts:rows.results});
  }catch{return json({error:'گفت‌وگوها در دسترس نیستند.'},503)}
}
export async function POST(request:Request){
  if(!validOrigin(request)||!await adminSession(request))return json({error:'دسترسی مجاز نیست.'},403);
  try{
    const body=await request.json() as {id?:string;status?:string};
    if(!body.id||!['approved','rejected'].includes(body.status||''))return json({error:'درخواست نامعتبر است.'},400);
    await database().prepare(`UPDATE skin_forum_posts SET status=?,reviewed_at=? WHERE id=? AND status='pending'`).bind(body.status,new Date().toISOString(),body.id).run();
    return json({ok:true});
  }catch{return json({error:'بررسی گفت‌وگو انجام نشد.'},503)}
}
