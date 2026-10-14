import {adminSession} from '../../../site-sessions';
import {database} from '../../../../db/raw';
export const runtime='edge';
const safeCell=(value:unknown)=>{let s=String(value??'');if(/^[\s]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
export async function GET(request:Request){
 if(!await adminSession(request))return Response.json({error:'برای مشاهدهٔ پنل وارد شوید.'},{status:403,headers:{'Cache-Control':'no-store'}});
 const url=new URL(request.url),q=(url.searchParams.get('q')||'').trim().slice(0,80);
 const like='%'+q.replace(/[\\%_]/g,'\\$&')+'%';
 const page=Math.min(10000,Math.max(0,Number.parseInt(url.searchParams.get('page')||'0',10)||0));
 const exportCsv=url.searchParams.get('format')==='csv';
 const params=[like,like,like,like,like,like,like,like];
 try{
  const db=database();
  const where="WHERE p.admin_consent=1 AND (p.phone LIKE ? ESCAPE '\\' OR p.profile_json LIKE ? ESCAPE '\\' OR p.wallet_json LIKE ? ESCAPE '\\' OR p.routine_json LIKE ? ESCAPE '\\' OR p.regret_json LIKE ? ESCAPE '\\' OR p.tracking_json LIKE ? ESCAPE '\\' OR p.supplements_json LIKE ? ESCAPE '\\' OR p.budget_json LIKE ? ESCAPE '\\')";
  if(exportCsv){
   const result=await db.prepare(`SELECT h.id,h.phone,h.recorded_at,h.profile_json,h.wallet_json,h.routine_json,h.regret_json,h.tracking_json,h.supplements_json,h.budget_json FROM profile_history h JOIN phone_profiles p ON p.phone=h.phone ${where} ORDER BY h.id DESC LIMIT 10000`).bind(...params).all();
   const columns=['id','phone','recorded_at','profile_json','wallet_json','routine_json','regret_json','tracking_json','supplements_json','budget_json'];
   const csv='\uFEFF'+columns.join(',')+'\r\n'+result.results.map(row=>columns.map(k=>safeCell(row[k])).join(',')).join('\r\n');
   return new Response(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="beautywallet-history.csv"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  const weekAgo=new Date(Date.now()-7*86400000).toISOString();
  const totals=await db.prepare(`SELECT COUNT(*) AS accounts,COALESCE(SUM((SELECT COUNT(*) FROM profile_history h WHERE h.phone=p.phone)),0) AS snapshots,COALESCE(SUM(CASE WHEN p.updated_at>=? THEN 1 ELSE 0 END),0) AS recent FROM phone_profiles p ${where}`).bind(weekAgo,...params).first<{accounts:number;snapshots:number;recent:number}>();
  const result=await db.prepare(`SELECT p.phone,p.profile_json,p.wallet_json,p.routine_json,p.regret_json,p.tracking_json,p.supplements_json,p.budget_json,p.updated_at,(SELECT COUNT(*) FROM profile_history h WHERE h.phone=p.phone) AS history_count FROM phone_profiles p ${where} ORDER BY p.updated_at DESC LIMIT 50 OFFSET ?`).bind(...params,page*50).all();
  const installTotals=await db.prepare('SELECT COUNT(*) AS reports FROM install_reports').first<{reports:number}>();
  const visitTotals=await db.prepare('SELECT COUNT(*) AS visitors FROM (SELECT phone FROM visitor_sessions UNION SELECT phone FROM phone_profiles)').first<{visitors:number}>();
  const summary={visitors:Number(visitTotals?.visitors||0),accounts:Number(totals?.accounts||0),snapshots:Number(totals?.snapshots||0),recent:Number(totals?.recent||0),installs:Number(installTotals?.reports||0)};
  return Response.json({users:result.results,total:summary.accounts,summary,page},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'داده در دسترس نیست.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
