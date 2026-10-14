import {database} from '../../../db/raw';

export const runtime='edge';

export async function POST(request:Request){
  const origin=request.headers.get('origin');
  if(origin!==new URL(request.url).origin)return Response.json({error:'درخواست نامعتبر است.'},{status:403});
  if(Number(request.headers.get('content-length')||0)>300)return Response.json({error:'درخواست نامعتبر است.'},{status:413});
  try{
    const body=await request.json() as {receipt?:unknown;platform?:unknown};
    const receipt=typeof body.receipt==='string'?body.receipt:'';
    const platform=typeof body.platform==='string'?body.platform:'';
    if(!/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(receipt)||!['ios','android','other'].includes(platform))return Response.json({error:'درخواست نامعتبر است.'},{status:400});
    await database().prepare('INSERT OR IGNORE INTO install_reports(receipt_id,platform,created_at) VALUES(?,?,?)').bind(receipt,platform,new Date().toISOString()).run();
    return Response.json({saved:true},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'ثبت آمار موقتاً در دسترس نیست.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
