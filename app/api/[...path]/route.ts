const memberCookie='__Host-moonlit-member';
function memberToken(req:Request){const value=(req.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(memberCookie+'='))?.slice(memberCookie.length+1)||'';return /^[a-f0-9]{64}$/.test(value)?value:''}
function membershipCookie(token:string,maxAge:number){return `${memberCookie}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${Math.max(0,Math.floor(maxAge))}`}

import {createHmac} from 'node:crypto';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const readRoutes=new Set(['tracks','playlists','settings']);
async function proxy(req:Request,{params}:{params:Promise<{path:string[]}>}){
 const parts=(await params).path;const path=parts.join('/');
 if(process.env.MOONLIT_BACKEND==='native')return (await import('@/lib/native-api')).handle(req,parts);
 const session=path==='members/session';
 if(session&&!['GET','POST','DELETE'].includes(req.method))return new Response('Not found',{status:404});
 if(session&&req.method!=='GET'&&req.headers.get('origin')!==new URL(req.url).origin)return new Response('Forbidden',{status:403});
 if(session&&req.method==='DELETE')return Response.json({member:false},{headers:{'Cache-Control':'private, no-store','Set-Cookie':membershipCookie('',0)}});
 const media=/^media\/[a-f0-9-]{36}$/.test(path);
 const read=req.method==='GET'&&(readRoutes.has(path)||media);
 const event=req.method==='POST'&&path==='events';
 if(!read&&!event&&!session)return new Response('Not found',{status:404});
 const base=process.env.SITE_BACKEND_URL,token=process.env.SITE_BACKEND_TOKEN;
 if(!base||!token)return new Response('The music service is not configured yet.',{status:503});
 const url=new URL('/api/'+path,base);
 if(url.protocol!=='https:')return new Response('Invalid music service configuration',{status:503});
 const headers=new Headers({'OAI-Sites-Authorization':'Bearer '+token});
 let body:string|undefined;
 let member=memberToken(req);
 if(session&&req.method==='POST'){if(Number(req.headers.get('content-length'))>256)return new Response('Invalid access code',{status:400});const raw=await req.text();if(raw.length>256)return new Response('Invalid access code',{status:400});try{member=JSON.parse(raw).code}catch{return new Response('Invalid access code',{status:400})}if(typeof member!=='string'||!/^[a-f0-9]{64}$/.test(member))return new Response('Invalid access code',{status:400})}
 if(member)headers.set('x-moonlit-member',member);
 if(event){
  if(req.headers.get('origin')!==new URL(req.url).origin)return new Response('Forbidden',{status:403});
  const secret=process.env.PROXY_SIGNING_SECRET;if(!secret)return new Response('Listening analytics are not configured.',{status:503});
  if(Number(req.headers.get('content-length'))>2048)return new Response('Event too large',{status:413});
  body=await req.text();if(body.length>2048)return new Response('Event too large',{status:413});
  const geo=req.headers.get('x-vercel-ip-country')||'';const country=/^[A-Z]{2}$/.test(geo)?geo:'Unknown';const stamp=String(Date.now());
  headers.set('Content-Type','application/json');headers.set('Origin',url.origin);
  headers.set('x-moonlit-country',country);headers.set('x-moonlit-timestamp',stamp);
  headers.set('x-moonlit-signature',createHmac('sha256',secret).update(stamp+'.'+country+'.'+body).digest('hex'));
 }
 if(media){for(const key of ['range','if-none-match']){const value=req.headers.get(key);if(value)headers.set(key,value)}}
 try{
  const upstream=await fetch(url,{method:session?'GET':req.method,headers,body,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(25000)});
  if(upstream.status>=300&&upstream.status<400&&upstream.status!==304)return new Response('The music service requires configuration.',{status:502});
  if(session){if(!upstream.ok)return new Response('Membership service unavailable',{status:502});const result=await upstream.json();if(req.method==='POST'&&!result.member)return new Response('This access code has expired or was revoked.',{status:401});return Response.json(result,{headers:{'Cache-Control':'private, no-store',...(req.method==='POST'?{'Set-Cookie':membershipCookie(member,Math.min(30*86400,(result.expires-Date.now())/1000))}:{})}})}
  const output=new Headers();for(const key of ['content-type','content-length','content-range','accept-ranges','etag']){const v=upstream.headers.get(key);if(v)output.set(key,v)}
  output.set('Cache-Control','private, no-store');output.set('X-Content-Type-Options','nosniff');
  return new Response(upstream.body,{status:upstream.status,headers:output});
 }catch{return new Response('The music service is temporarily unavailable.',{status:502})}
}
export const GET=proxy;
export const POST=proxy;

export const DELETE=proxy;
export const PATCH=proxy;
export const PUT=proxy;
