import {env} from 'cloudflare:workers';
import {database} from '../db/raw';
const config=()=>env as unknown as {ADMIN_PASSWORD_HASH?:string;ADMIN_SESSION_KEY?:string};
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
export const sha=async(s:string)=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
const hmac=async(s:string)=>{const secret=config().ADMIN_SESSION_KEY;if(!secret)throw Error('Admin not configured');const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(s)))};
const getCookie=(request:Request,name:string)=>request.headers.get('cookie')?.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'))?.[1]||'';
export const adminReady=()=>!!(config().ADMIN_PASSWORD_HASH&&config().ADMIN_SESSION_KEY);
export async function checkPassword(password:string){const expected=config().ADMIN_PASSWORD_HASH||'0'.repeat(64),actual=await sha(password);let mismatch=0;for(let i=0;i<64;i++)mismatch|=actual.charCodeAt(i)^expected.charCodeAt(i);return adminReady()&&mismatch===0}
export async function adminSession(request:Request){const value=getCookie(request,'bw_admin'),match=value.match(/^(\d{13})\.([a-f0-9]{64})$/);if(!adminReady()||!match||Number(match[1])<Date.now())return false;const expected=await hmac(match[1]);let mismatch=0;for(let i=0;i<64;i++)mismatch|=expected.charCodeAt(i)^match[2].charCodeAt(i);return mismatch===0}
export async function issueAdminSession(){const expiry=String(Date.now()+12*3600000);return expiry+'.'+await hmac(expiry)}
export const cookieHeader=(name:string,value:string,age:number)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
export async function visitorId(request:Request){
 const token=getCookie(request,'bw_visitor');if(!/^[a-f0-9]{64}$/.test(token))return null;
 const legacy='guest_'+await sha('beautywallet-visitor:'+token), db=database();
 const session=await db.prepare('SELECT phone FROM visitor_sessions WHERE token_hash=? AND expires_at>?').bind(await sha('visitor-session:'+token),Date.now()).first<{phone:string}>();
 if(session)return session.phone;
 const old=await db.prepare('SELECT phone FROM phone_profiles WHERE phone=?').bind(legacy).first<{phone:string}>();
 return old?.phone||null;
}
export function newVisitor(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('')}
export function newRecoveryCode(){const bytes=crypto.getRandomValues(new Uint8Array(24));return 'BW-'+Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('')}
export async function adminRateLimit(request:Request){const ip=request.headers.get('cf-connecting-ip')||'unknown';const id=await sha('admin-ip:'+ip),now=Date.now();const r=await database().prepare('INSERT INTO admin_login_limits(ip_hash,attempts,window_start) VALUES(?,1,?) ON CONFLICT(ip_hash) DO UPDATE SET attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END WHERE window_start<? OR attempts<5').bind(id,now,now-900000,now-900000,now-900000).run();return !!r.meta.changes}
