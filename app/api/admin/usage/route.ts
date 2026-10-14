import {database} from '../../../../db/raw';
import {adminSession} from '../../../site-sessions';

export const runtime='edge';
export async function GET(request:Request){
  if(!await adminSession(request))return Response.json({error:'دسترسی مجاز نیست'},{status:403});
  const since=new Date(Date.now()-30*86400000).toISOString();
  const rows=await database().prepare('SELECT tier,model,COUNT(*) AS calls,SUM(input_tokens) AS input_tokens,SUM(output_tokens) AS output_tokens,SUM(estimated_model_toman) AS model_toman,SUM(web_search) AS web_search_calls FROM assistant_usage WHERE created_at>=? GROUP BY tier,model ORDER BY calls DESC').bind(since).all();
  const users=await database().prepare('SELECT COUNT(DISTINCT user_id) AS users,COUNT(*) AS calls,SUM(estimated_model_toman) AS model_toman FROM assistant_usage WHERE created_at>=?').bind(since).first();
  return Response.json({periodDays:30,summary:users,byModel:rows.results,note:'برآورد مدل است؛ کارمزد جست‌وجو، درگاه، زیرساخت و نرخ ارز در آن نیست'},{headers:{'Cache-Control':'no-store'}});
}
