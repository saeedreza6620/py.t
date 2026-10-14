import {database} from '../../../../db/raw';
import {visitorId} from '../../../site-sessions';
import {validOrigin} from '../../../phone-auth';

export const runtime='edge';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const safe=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';

export async function POST(request:Request){
  if(!validOrigin(request))return json({error:'درخواست نامعتبر است.'},403);
  const userId=await visitorId(request);
  if(!userId)return json({error:'حافظه کاربر پیدا نشد.'},401);
  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>}catch{return json({error:'درخواست نامعتبر است.'},400)}
  const assistantMessageId=safe(body.assistantMessageId,80),rating=safe(body.rating,20);
  const outcome=safe(body.outcome,80),note=safe(body.note,1000),adverseSignal=body.adverseSignal===true?1:0;
  const validRating=['helpful','not_helpful'].includes(rating),validOutcome=['considering','purchased','skipped','used_helpful','used_no_change','used_adverse'].includes(outcome);
  if(!assistantMessageId||(!validRating&&!validOutcome))return json({error:'بازخورد کامل نیست.'},400);
  try{
    const message=await database().prepare("SELECT id FROM assistant_messages WHERE id=? AND user_id=? AND role='assistant'").bind(assistantMessageId,userId).first();
    if(!message)return json({error:'پاسخ متعلق به این کاربر نیست.'},403);
    const now=new Date().toISOString();
    const statements=[database().prepare(`INSERT INTO assistant_feedback(id,user_id,assistant_message_id,rating,outcome,note,adverse_signal,created_at)
      VALUES(?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),userId,assistantMessageId,validRating?rating:'outcome',validOutcome?outcome:'',note,adverseSignal||outcome==='used_adverse'?1:0,now)];
    if(validOutcome)statements.push(database().prepare(`UPDATE assistant_decisions SET user_action=?,outcome_status=?,updated_at=? WHERE assistant_message_id=? AND user_id=?`).bind(['purchased','skipped','considering'].includes(outcome)?outcome:'used',outcome,now,assistantMessageId,userId));
    await database().batch(statements);
    return json({ok:true});
  }catch{return json({error:'بازخورد ذخیره نشد؛ دوباره امتحان کن.'},503)}
}
