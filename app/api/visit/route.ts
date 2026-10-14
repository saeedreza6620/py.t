import {validOrigin} from '../../phone-auth';
import {cookieHeader,newVisitor,sha,visitorId} from '../../site-sessions';
import {database} from '../../../db/raw';
export const runtime='edge';
// A pseudonymous, server-owned browser session. No profile or IP is recorded here.
export async function POST(request:Request){
 if(!validOrigin(request))return Response.json({error:'درخواست نامعتبر است.'},{status:403});
 try{
  if(await visitorId(request))return Response.json({recorded:true},{headers:{'Cache-Control':'no-store'}});
  const token=newVisitor(),userId='guest_'+await sha('beautywallet-visitor:'+token);
  await database().prepare('INSERT INTO visitor_sessions(token_hash,phone,expires_at) VALUES(?,?,?)')
   .bind(await sha('visitor-session:'+token),userId,Date.now()+365*86400000).run();
  return Response.json({recorded:true},{headers:{'Cache-Control':'no-store','Set-Cookie':cookieHeader('bw_visitor',token,365*86400)}});
 }catch{return Response.json({error:'ثبت آمار موقتاً در دسترس نیست.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
