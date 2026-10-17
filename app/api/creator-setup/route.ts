import {timingSafeEqual} from 'node:crypto';
import {database} from '@/lib/database';
import {createAuth} from '@/lib/auth';
export const runtime='nodejs';
export async function POST(req:Request){
 if(process.env.MOONLIT_BACKEND!=='native')return new Response('Not found',{status:404});
 if(req.headers.get('origin')!==new URL(req.url).origin)return new Response('Forbidden',{status:403});
 if(Number(req.headers.get('content-length'))>4096)return new Response('Request too large',{status:413});
 const raw=await req.text();if(raw.length>4096)return new Response('Request too large',{status:413});
 let b:any;try{b=JSON.parse(raw)}catch{return new Response('Invalid request',{status:400})}
 const configured=process.env.CREATOR_SETUP_TOKEN||'';const submitted=typeof b.code==='string'?b.code:'';
 if(!configured||Buffer.byteLength(submitted)!==Buffer.byteLength(configured)||!timingSafeEqual(Buffer.from(configured),Buffer.from(submitted)))return new Response('Invalid setup code',{status:403});
 if(typeof b.email!=='string'||!/^\S+@\S+\.\S+$/.test(b.email)||b.email.length>160||typeof b.password!=='string'||b.password.length<12||b.password.length>128)return new Response('Use an email and a password of 12–128 characters',{status:400});
 const client=await database().connect();
 try{
  const lock=await client.query('SELECT pg_try_advisory_lock(66171017) AS locked');if(!lock.rows[0].locked)return new Response('Setup is already running',{status:409});
  const owner=await client.query("SELECT value FROM settings WHERE key='owner'");if(owner.rows.length)return new Response('The creator account is already configured. Please sign in.',{status:409});
  const email=b.email.trim().toLowerCase();const auth=createAuth(true);const existing=await client.query('SELECT email FROM "user"');
  if(existing.rows.length){if(existing.rows.length!==1||existing.rows[0].email!==email)return new Response('Contact the site owner to finish setup',{status:409});await auth.api.signInEmail({body:{email,password:b.password}})}
  else await auth.api.signUpEmail({body:{email,password:b.password,name:'Moonlit Lofi Creator'}});
  await client.query("INSERT INTO settings (key,value) VALUES ('owner',$1)",[email]);
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return new Response('Creator setup could not complete. Check your details and try again.',{status:400})}
 finally{await client.query('SELECT pg_advisory_unlock(66171017)').catch(()=>{});client.release()}
}
