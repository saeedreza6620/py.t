import {database} from '../../../db/raw';
import {cookieHeader,sha,newVisitor} from '../../site-sessions';
import {validOrigin} from '../../phone-auth';

export const runtime='edge';
const json=(body:unknown,status=200,headers:Record<string,string>={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const token=(request:Request)=>request.headers.get('cookie')?.match(/(?:^|;\s*)bw_forum=([a-f0-9]{64})(?:;|$)/)?.[1]||'';
const clean=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';
const kinds=['experience','compare','question'] as const;

export async function GET(request:Request){
  try{
    const url=new URL(request.url),productId=clean(url.searchParams.get('product'),100);
    const author=token(request)?await sha('forum:'+token(request)):'';
    const db=database();
    const rows=await db.prepare(`SELECT id,parent_id,product_id,product_name,kind,skin_type,duration,body,status,created_at
      FROM skin_forum_posts WHERE (status='approved' OR (author_hash=? AND status='pending'))
      AND (?='' OR product_id=?) ORDER BY created_at DESC LIMIT 40`).bind(author,productId,productId).all();
    return json({posts:rows.results});
  }catch{return json({error:'گفت‌وگوها فعلاً در دسترس نیستند.'},503)}
}

export async function POST(request:Request){
  if(!validOrigin(request))return json({error:'درخواست نامعتبر است.'},403);
  if(Number(request.headers.get('content-length')||0)>3000)return json({error:'متن بیش از حد طولانی است.'},413);
  try{
    const body=await request.json() as Record<string,unknown>;
    const kind=clean(body.kind,20),parentId=clean(body.parentId,100);
    let productId=clean(body.productId,100),productName=clean(body.productName,120);
    const skinType=clean(body.skinType,40),duration=clean(body.duration,40),content=clean(body.body,800);
    if(!kinds.includes(kind as typeof kinds[number])||content.length<15||content.length>800||!productName)
      return json({error:'نام محصول و توضیح کوتاه را وارد کن.'},400);
    const existing=token(request),fresh=!existing,forumToken=existing||newVisitor(),author=await sha('forum:'+forumToken);
    const db=database(),since=new Date(Date.now()-24*3600000).toISOString();
    if(parentId){
      const parent=await db.prepare("SELECT product_id,product_name FROM skin_forum_posts WHERE id=? AND status='approved'").bind(parentId).first<{product_id:string;product_name:string}>();
      if(!parent)return json({error:'گفت‌وگوی اصلی پیدا نشد.'},404);
      productId=parent.product_id;productName=parent.product_name;
    }
    const count=await db.prepare('SELECT count(*) AS n FROM skin_forum_posts WHERE author_hash=? AND created_at>?').bind(author,since).first<{n:number}>();
    if(Number(count?.n||0)>=3)return json({error:'امروز سه گفت‌وگو ثبت کرده‌ای؛ فردا دوباره امتحان کن.'},429);
    await db.prepare(`INSERT INTO skin_forum_posts(id,parent_id,author_hash,product_id,product_name,kind,skin_type,duration,body,status,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),parentId||null,author,productId,productName,kind,skinType,duration,content,'pending',new Date().toISOString()).run();
    return json({saved:true,message:'گفت‌وگو ثبت شد و پس از بررسی نمایش داده می‌شود.'},201,fresh?{'Set-Cookie':cookieHeader('bw_forum',forumToken,365*24*3600)}:{});
  }catch{return json({error:'ثبت گفت‌وگو فعلاً ممکن نیست.'},503)}
}
