import {configured} from '../../../phone-auth';
export const runtime='edge';
export async function GET(){return Response.json({smsReady:configured()},{headers:{'Cache-Control':'no-store'}})}
