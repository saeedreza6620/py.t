import {configured,hash,normalizePhone,response,sendSms,validOrigin} from '../../../phone-auth';
import {database} from '../../../../db/raw';
export const runtime='edge';
export async function POST(request:Request){
 if(!validOrigin(request))return response({error:'درخواست نامعتبر است.'},403);
 if(!configured())return response({error:'ورود پیامکی هنوز فعال نشده است. لطفاً بعداً تلاش کنید.'},503);
 let phone:string;try{phone=normalizePhone(((await request.json()) as {phone?:unknown}).phone)}catch{return response({error:'شماره موبایل معتبر نیست.'},400)}
 const now=Date.now(), db=database();
 try{
  const ip=request.headers.get('cf-connecting-ip');if(ip){const ipHash=await hash('ip:'+ip);const result=await db.prepare('INSERT INTO otp_ip_limits(ip_hash,send_count,window_start) VALUES(?,1,?) ON CONFLICT(ip_hash) DO UPDATE SET send_count=CASE WHEN window_start<? THEN 1 ELSE send_count+1 END,window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END WHERE window_start<? OR send_count<8').bind(ipHash,now,now-900000,now-900000,now-900000).run();if(!result.meta.changes)return response({error:'تعداد درخواست‌ها زیاد است؛ کمی بعد تلاش کنید.'},429)}
  const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0');
  const codeHash=await hash('otp:'+phone+':'+code);
  const result=await db.prepare('INSERT INTO phone_otps(phone,code_hash,expires_at,attempts,next_send_at,send_count,window_start) VALUES(?,?,?,0,?,1,?) ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0,next_send_at=excluded.next_send_at,send_count=CASE WHEN window_start<? THEN 1 ELSE send_count+1 END,window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END WHERE next_send_at<=? AND (window_start<? OR send_count<3)').bind(phone,codeHash,now+300000,now+90000,now,now-900000,now-900000,now,now-900000).run();
  if(!result.meta.changes)return response({error:'برای دریافت کد جدید کمی صبر کنید.'},429);
  try{await sendSms(phone,code)}catch{await db.prepare('DELETE FROM phone_otps WHERE phone=? AND code_hash=?').bind(phone,codeHash).run();return response({error:'ارسال پیامک انجام نشد؛ دوباره تلاش کنید.'},503)}
  return response({ok:true,message:'کد تأیید ارسال شد. اعتبار: ۵ دقیقه.'});
 }catch{return response({error:'سرویس ورود فعلاً در دسترس نیست.'},503)}
}
