import { env } from 'cloudflare:workers';
import { admin } from '../../data';
export async function GET(req:Request){if(!await admin(req))return new Response('Sign in required',{status:403});const start=Date.now()-7*86400000;const rows=await env.DB!.prepare('SELECT track,country,at,seconds FROM events WHERE at>=? ORDER BY at DESC LIMIT 10000').bind(start).all();return Response.json(rows.results);}
