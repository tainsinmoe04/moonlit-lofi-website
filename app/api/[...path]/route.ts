import {createHmac} from 'node:crypto';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const readRoutes=new Set(['tracks','playlists','settings']);
async function proxy(req:Request,{params}:{params:Promise<{path:string[]}>}){
 const parts=(await params).path;const path=parts.join('/');
 const media=/^media\/[a-f0-9-]{36}$/.test(path);
 const read=req.method==='GET'&&(readRoutes.has(path)||media);
 const event=req.method==='POST'&&path==='events';
 if(!read&&!event)return new Response('Not found',{status:404});
 const base=process.env.SITE_BACKEND_URL,token=process.env.SITE_BACKEND_TOKEN;
 if(!base||!token)return new Response('The music service is not configured yet.',{status:503});
 const url=new URL('/api/'+path,base);
 if(url.protocol!=='https:')return new Response('Invalid music service configuration',{status:503});
 const headers=new Headers({'OAI-Sites-Authorization':'Bearer '+token});
 let body:string|undefined;
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
  const upstream=await fetch(url,{method:req.method,headers,body,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(25000)});
  if(upstream.status>=300&&upstream.status<400&&upstream.status!==304)return new Response('The music service requires configuration.',{status:502});
  const output=new Headers();for(const key of ['content-type','content-length','content-range','accept-ranges','etag']){const v=upstream.headers.get(key);if(v)output.set(key,v)}
  output.set('Cache-Control',media?(upstream.headers.get('cache-control')||'public, max-age=86400'):'no-store');output.set('X-Content-Type-Options','nosniff');
  return new Response(upstream.body,{status:upstream.status,headers:output});
 }catch{return new Response('The music service is temporarily unavailable.',{status:502})}
}
export const GET=proxy;
export const POST=proxy;
