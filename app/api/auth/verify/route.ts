import {hash,normalizePhone,response,sessionCookie,validOrigin} from '../../../phone-auth';
import {database} from '../../../../db/raw';
export const runtime='edge';
export async function POST(request:Request){
 if(!validOrigin(request))return response({error:'درخواست نامعتبر است.'},403);
 let phone:string,code:string;try{const body=await request.json() as {phone?:unknown;code?:unknown};phone=normalizePhone(body.phone);code=String(body.code??'').replace(/[۰-۹]/g,(c:string)=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));if(!/^\d{6}$/.test(code))throw Error()}catch{return response({error:'شماره یا کد معتبر نیست.'},400)}
 try{const db=database(),now=Date.now(),codeHash=await hash('otp:'+phone+':'+code);const row=await db.prepare('UPDATE phone_otps SET attempts=attempts+1 WHERE phone=? AND expires_at>? AND attempts<5 RETURNING code_hash').bind(phone,now).first<{code_hash:string}>();
 if(!row||row.code_hash!==codeHash)return response({error:'کد اشتباه یا منقضی شده است.'},401);
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');const tokenHash=await hash('session:'+token);
 await db.batch([db.prepare('DELETE FROM phone_otps WHERE phone=?').bind(phone),db.prepare('INSERT INTO phone_sessions(token_hash,phone,expires_at) VALUES(?,?,?)').bind(tokenHash,phone,now+30*86400000)]);
 const answer=response({ok:true,phone});answer.headers.set('Set-Cookie',sessionCookie(token,30*86400));return answer;
 }catch{return response({error:'ورود انجام نشد؛ دوباره تلاش کنید.'},503)}
}
