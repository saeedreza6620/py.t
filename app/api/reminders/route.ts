import {database} from '../../../db/raw';
import {validOrigin} from '../../phone-auth';
import {cookieHeader,newVisitor,sha,visitorId} from '../../site-sessions';
export const runtime='edge';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const time=(value:unknown)=>typeof value==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
async function identity(request:Request){
  const previous=await visitorId(request);
  if(previous)return {userId:previous,cookie:null};
  const token=newVisitor(),userId='guest_'+await sha('beautywallet-visitor:'+token);
  await database().prepare('INSERT INTO visitor_sessions(token_hash,phone,expires_at) VALUES(?,?,?)').bind(await sha('visitor-session:'+token),userId,Date.now()+365*86400000).run();
  return {userId,cookie:cookieHeader('bw_visitor',token,365*86400)};
}
export async function GET(request:Request){
  try{
    const userId=await visitorId(request);
    if(!userId)return json({settings:null,reviews:[]});
    const [settings,reviews]=await Promise.all([
      database().prepare('SELECT enabled,morning_time,evening_time,started_at FROM routine_reminders WHERE user_id=?').bind(userId).first(),
      database().prepare('SELECT day,status,note,recorded_at FROM routine_reviews WHERE user_id=? ORDER BY recorded_at DESC LIMIT 30').bind(userId).all(),
    ]);
    return json({settings,reviews:reviews.results});
  }catch{return json({error:'یادآورها فعلاً در دسترس نیستند.'},503)}
}
export async function PUT(request:Request){
  if(!validOrigin(request))return json({error:'درخواست نامعتبر است.'},403);
  let body:Record<string,unknown>;
  try{body=await request.json();}catch{return json({error:'داده نامعتبر است.'},400)}
  if(!body||typeof body.enabled!=='boolean'||!time(body.morningTime)||!time(body.eveningTime))return json({error:'زمان‌ها را بررسی کن.'},400);
  try{
    const {userId,cookie}=await identity(request),now=new Date().toISOString();
    await database().prepare('INSERT INTO routine_reminders(user_id,enabled,morning_time,evening_time,started_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET enabled=excluded.enabled,morning_time=excluded.morning_time,evening_time=excluded.evening_time,updated_at=excluded.updated_at')
      .bind(userId,body.enabled?1:0,body.morningTime,body.eveningTime,now,now).run();
    const response=json({ok:true});if(cookie)response.headers.set('Set-Cookie',cookie);return response;
  }catch{return json({error:'ذخیره یادآور انجام نشد.'},503)}
}
export async function POST(request:Request){
  if(!validOrigin(request))return json({error:'درخواست نامعتبر است.'},403);
  let body:Record<string,unknown>;
  try{body=await request.json();}catch{return json({error:'داده نامعتبر است.'},400)}
  if(!body||![7,14,21].includes(Number(body.day))||!['خوب','نیاز به تغییر','هنوز نامشخص'].includes(String(body.status))||typeof body.note!=='string'||body.note.length>300)return json({error:'اطلاعات پیگیری نامعتبر است.'},400);
  try{
    const {userId,cookie}=await identity(request);
    await database().prepare('INSERT INTO routine_reviews(id,user_id,day,status,note,recorded_at) VALUES(?,?,?,?,?,?)')
      .bind(crypto.randomUUID(),userId,body.day,body.status,body.note,new Date().toISOString()).run();
    const response=json({ok:true});if(cookie)response.headers.set('Set-Cookie',cookie);return response;
  }catch{return json({error:'ثبت پیگیری انجام نشد.'},503)}
}
