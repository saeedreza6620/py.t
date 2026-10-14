import {cookie,hash,response,sessionCookie,validOrigin} from '../../../phone-auth';
import {database} from '../../../../db/raw';
export const runtime='edge';
export async function POST(request:Request){if(!validOrigin(request))return response({error:'درخواست نامعتبر است.'},403);const token=cookie(request);try{if(/^[a-f0-9]{64}$/.test(token))await database().prepare('DELETE FROM phone_sessions WHERE token_hash=?').bind(await hash('session:'+token)).run()}catch{}const answer=response({ok:true});answer.headers.set('Set-Cookie',sessionCookie('',0));return answer}
