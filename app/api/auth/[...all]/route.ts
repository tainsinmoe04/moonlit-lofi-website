import {createAuth} from '@/lib/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function handler(req:Request){if(process.env.MOONLIT_BACKEND!=='native')return new Response('Not configured',{status:404});return createAuth().handler(req)}
export const GET=handler;
export const POST=handler;
