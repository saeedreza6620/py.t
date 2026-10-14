import {database} from '../../../db/raw';
import {cookieHeader,newRecoveryCode,newVisitor,sha,visitorId} from '../../site-sessions';
import {validOrigin} from '../../phone-auth';
export const runtime='edge';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 if(!validOrigin(request))return json({error:'درخواست نامعتبر است.'},403);
 let body:{action?:string;code?:string};try{body=await request.json() as typeof body}catch{return json({error:'درخواست نامعتبر است.'},400)}
 const db=database(),now=Date.now();
 if(body.action==='rotate'){
  const owner=await visitorId(request);if(!owner)return json({error:'ابتدا اطلاعات همین مرورگر را ثبت کن.'},401);
  const code=newRecoveryCode(),digest=await sha('recovery:'+code);
  try{await db.batch([db.prepare('DELETE FROM recovery_keys WHERE phone=?').bind(owner),db.prepare('INSERT INTO recovery_keys(key_hash,phone,created_at) VALUES(?,?,?)').bind(digest,owner,new Date().toISOString())]);return json({recoveryCode:code})}catch{return json({error:'ساخت کد انجام نشد.'},503)}
 }
 if(body.action!=='restore'||typeof body.code!=='string'||!/^BW-[a-f0-9]{48}$/.test(body.code.trim()))return json({error:'کد بازیابی معتبر نیست.'},400);
 try{
  const ip=request.headers.get('cf-connecting-ip')||'unknown',ipHash=await sha('recovery-limit:'+ip);
  const limit=await db.prepare('INSERT INTO recovery_limits(ip_hash,attempts,window_start) VALUES(?,1,?) ON CONFLICT(ip_hash) DO UPDATE SET attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END WHERE window_start<? OR attempts<10').bind(ipHash,now,now-900000,now-900000,now-900000).run();
  if(!limit.meta.changes)return json({error:'تعداد تلاش‌ها زیاد است؛ ۱۵ دقیقه بعد دوباره تلاش کن.'},429);
  const digest=await sha('recovery:'+body.code.trim());
  const row=await db.prepare('SELECT r.phone FROM recovery_keys r JOIN phone_profiles p ON p.phone=r.phone WHERE r.key_hash=?').bind(digest).first<{phone:string}>();
  if(!row)return json({error:'کد بازیابی معتبر نیست.'},401);
  const token=newVisitor();await db.prepare('INSERT INTO visitor_sessions(token_hash,phone,expires_at) VALUES(?,?,?)').bind(await sha('visitor-session:'+token),row.phone,now+365*86400000).run();
  const response=json({ok:true});response.headers.set('Set-Cookie',cookieHeader('bw_visitor',token,365*86400));return response;
 }catch{return json({error:'بازیابی فعلاً در دسترس نیست.'},503)}
}
export async function DELETE(request:Request){
 if(!validOrigin(request))return json({error:'درخواست نامعتبر است.'},403);
 const current=await visitorId(request);if(!current)return json({error:'حساب این دستگاه یافت نشد.'},401);
 const token=request.headers.get('cookie')?.match(/(?:^|;\s*)bw_visitor=([a-f0-9]{64})/)?.[1];
 if(token)await database().prepare('DELETE FROM visitor_sessions WHERE token_hash=?').bind(await sha('visitor-session:'+token)).run();
 const response=json({ok:true});response.headers.set('Set-Cookie',cookieHeader('bw_visitor','',0));return response;
}
