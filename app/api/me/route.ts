import { validOrigin } from '../../phone-auth';
import { database } from '../../../db/raw';
import {cookieHeader,newRecoveryCode,newVisitor,sha,visitorId} from '../../site-sessions';
export const runtime = 'edge';
const json = (body: unknown, status = 200) => Response.json(body, {status, headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request) {
  const phone = await visitorId(request); if (!phone) return json({signedIn:false},401);
  try {
    const db=database();
    const row = await db.prepare('SELECT profile_json, wallet_json, routine_json, regret_json, tracking_json, supplements_json, budget_json, admin_consent, updated_at FROM phone_profiles WHERE phone = ?').bind(phone).first<Record<string,unknown>>();
    const recovery=await db.prepare('SELECT phone FROM recovery_keys WHERE phone=?').bind(phone).first();
    return json({signedIn:true,userId:phone,recoveryReady:!!recovery, saved: row ? {profile:JSON.parse(String(row.profile_json)),wallet:JSON.parse(String(row.wallet_json)),routine:JSON.parse(String(row.routine_json)),regret:JSON.parse(String(row.regret_json)),tracking:JSON.parse(String(row.tracking_json)),supplements:JSON.parse(String(row.supplements_json||'{}')),budget:JSON.parse(String(row.budget_json||'{}')),adminConsent:!!row.admin_consent,updatedAt:row.updated_at}:null});
  } catch { return json({error:'ذخیره‌سازی فعلاً در دسترس نیست.'},503); }
}
export async function PUT(request:Request) {
  if(!validOrigin(request))return json({error:'درخواست نامعتبر است.'},403);
  const existing=await visitorId(request),token=existing?null:newVisitor();
  const phone = existing||'guest_'+await sha('beautywallet-visitor:'+token);
  if (Number(request.headers.get('content-length')||0)>450000) return json({error:'حجم اطلاعات بیش از حد است.'},413);
  let data:Record<string,unknown>;
  try {const raw=await request.text();if(raw.length>450000)return json({error:'حجم اطلاعات بیش از حد است.'},413);data=JSON.parse(raw)} catch {return json({error:'داده نامعتبر است.'},400)}
  if (!data || typeof data!=='object' || Array.isArray(data) || data.adminConsent!==true || !data.profile || typeof data.profile!=='object' || Array.isArray(data.profile) || !('cloudConsent' in data.profile) || data.profile.cloudConsent!==true || !('serviceConsent' in data.profile) || data.profile.serviceConsent!==true || !Array.isArray(data.wallet) || !data.routine || typeof data.routine!=='object' || Array.isArray(data.routine) || !data.regret || typeof data.regret!=='object' || Array.isArray(data.regret) || !data.tracking || typeof data.tracking!=='object' || Array.isArray(data.tracking) || !data.supplements || typeof data.supplements!=='object' || Array.isArray(data.supplements) || !data.budget || typeof data.budget!=='object' || Array.isArray(data.budget)) return json({error:'برای ثبت آنلاین، رضایت ثبت روتین و دسترسی مالک را در پروفایل فعال کنید.'},400);
  const budgetData=data.budget as {entries?:unknown};
  if(!Array.isArray(budgetData.entries)||budgetData.entries.length>120||budgetData.entries.some(entry=>!entry||typeof entry!=='object'||Array.isArray(entry)||Object.values(entry as Record<string,unknown>).some(value=>typeof value==='string'&&value.length>240)))return json({error:'ساختار کیف بودجه معتبر نیست.'},400);
  const profile=JSON.stringify(data.profile), wallet=JSON.stringify(data.wallet), routine=JSON.stringify(data.routine), regret=JSON.stringify(data.regret), supplements=JSON.stringify(data.supplements), budget=JSON.stringify(data.budget);let tracking=JSON.stringify(data.tracking);
  const entries=Object.entries(data.tracking);
  const allowed=new Set(['am-care','am-cleanse','am-spf','pm-active','pm-cleanse','pm-moist']);
  if(budget.length>60000)return json({error:'حجم کیف بودجه بیش از حد است.'},413);
  if(profile.length>30000||wallet.length>3000||routine.length>16000||regret.length>60000||supplements.length>25000||tracking.length>350000||entries.length>1000 || !data.wallet.every(x=>typeof x==='string'&&x.length<100) || entries.some(([date,value])=>!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||!value||typeof value!=='object'||Array.isArray(value)||typeof (value as Record<string,unknown>).note!=='string'||String((value as Record<string,unknown>).note).length>500||!(value as Record<string,unknown>).checks||typeof (value as Record<string,unknown>).checks!=='object'||Object.entries((value as {checks:Record<string,unknown>}).checks).some(([key,checked])=>!allowed.has(key)||typeof checked!=='boolean')))return json({error:'اندازه یا نوع دادهٔ پیگیری نامعتبر است.'},400);
  try {
    const updatedAt=new Date().toISOString();
    const db=database();const previous=await db.prepare('SELECT profile_json,wallet_json,routine_json,regret_json,tracking_json,supplements_json,budget_json,updated_at FROM phone_profiles WHERE phone=?').bind(phone).first<Record<string,string>>();
    if(previous){const stored=JSON.parse(previous.tracking_json) as Record<string,unknown>;tracking=JSON.stringify({...stored,...data.tracking});if(tracking.length>350000)return json({error:'حجم تاریخچهٔ پیگیری از ظرفیت ثبت آنلاین بیشتر است؛ از داده‌ها فایل پشتیبان بگیر.'},413)}
    const recovery=await db.prepare('SELECT phone FROM recovery_keys WHERE phone=?').bind(phone).first();
    if(previous?.profile_json===profile&&previous.wallet_json===wallet&&previous.routine_json===routine&&previous.regret_json===regret&&previous.tracking_json===tracking&&previous.supplements_json===supplements&&previous.budget_json===budget&&recovery)return json({ok:true,updatedAt:previous.updated_at});
    const code=recovery?null:newRecoveryCode();
    const statements=[
      db.prepare('INSERT INTO phone_profiles (phone,profile_json,wallet_json,routine_json,regret_json,tracking_json,supplements_json,budget_json,admin_consent,updated_at) VALUES (?,?,?,?,?,?,?,?,1,?) ON CONFLICT(phone) DO UPDATE SET profile_json=excluded.profile_json,wallet_json=excluded.wallet_json,routine_json=excluded.routine_json,regret_json=excluded.regret_json,tracking_json=excluded.tracking_json,supplements_json=excluded.supplements_json,budget_json=excluded.budget_json,admin_consent=1,updated_at=excluded.updated_at').bind(phone,profile,wallet,routine,regret,tracking,supplements,budget,updatedAt),
      db.prepare('INSERT INTO profile_history(phone,profile_json,wallet_json,routine_json,regret_json,tracking_json,supplements_json,budget_json,recorded_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(phone,profile,wallet,routine,regret,tracking,supplements,budget,updatedAt)
    ];
    if(token)statements.push(db.prepare('INSERT INTO visitor_sessions(token_hash,phone,expires_at) VALUES(?,?,?)').bind(await sha('visitor-session:'+token),phone,Date.now()+365*86400000));
    if(code)statements.push(db.prepare('INSERT INTO recovery_keys(key_hash,phone,created_at) VALUES(?,?,?)').bind(await sha('recovery:'+code),phone,updatedAt));
    await db.batch(statements);
    const response=json({ok:true,updatedAt,recoveryCode:code});if(token)response.headers.set('Set-Cookie',cookieHeader('bw_visitor',token,365*86400));return response;
  } catch {return json({error:'ذخیره انجام نشد. دوباره تلاش کنید.'},503)}
}
export async function DELETE(request:Request) {
 if(!validOrigin(request))return json({error:'درخواست نامعتبر است.'},403);
 const phone=await visitorId(request); if(!phone)return json({error:'اطلاعات این مرورگر یافت نشد.'},401);
 try {const db=database();await db.batch([db.prepare('DELETE FROM phone_profiles WHERE phone=?').bind(phone),db.prepare('DELETE FROM profile_history WHERE phone=?').bind(phone),db.prepare('DELETE FROM recovery_keys WHERE phone=?').bind(phone),db.prepare('DELETE FROM visitor_sessions WHERE phone=?').bind(phone),db.prepare('DELETE FROM routine_reminders WHERE user_id=?').bind(phone),db.prepare('DELETE FROM routine_reviews WHERE user_id=?').bind(phone)]);const response=json({ok:true});response.headers.set('Set-Cookie',cookieHeader('bw_visitor','',0));return response}catch{return json({error:'حذف انجام نشد.'},503)}
}
