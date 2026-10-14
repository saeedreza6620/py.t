import {adminRateLimit,adminReady,adminSession,checkPassword,cookieHeader,issueAdminSession} from '../../../site-sessions';
import {validOrigin} from '../../../phone-auth';
export const runtime='edge';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){return json({signedIn:await adminSession(request),ready:adminReady()})}
export async function POST(request:Request){
 if(!validOrigin(request))return json({error:'درخواست نامعتبر است.'},403);
 let password='';try{const body=await request.json() as {password?:string};password=String(body.password||'');if(password.length>200)throw Error()}catch{return json({error:'رمز معتبر نیست.'},400)}
 try{if(!await adminRateLimit(request))return json({error:'تلاش‌های ورود زیاد است؛ ۱۵ دقیقه بعد دوباره تلاش کنید.'},429);
  if(!await checkPassword(password))return json({error:'رمز نادرست است.'},401);
  const response=json({ok:true});response.headers.set('Set-Cookie',cookieHeader('bw_admin',await issueAdminSession(),12*3600));return response
 }catch{return json({error:'ورود فعلاً در دسترس نیست.'},503)}
}
export async function DELETE(request:Request){if(!validOrigin(request))return json({error:'درخواست نامعتبر است.'},403);const r=json({ok:true});r.headers.set('Set-Cookie',cookieHeader('bw_admin','',0));return r}
