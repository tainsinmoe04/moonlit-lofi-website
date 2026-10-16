import { env } from 'cloudflare:workers';
import {admin,allTracks} from '../../../data';
export async function GET(req:Request,{params}: {params:Promise<{key:string}>}){
 const {key}=await params;if(!/^[a-f0-9-]{36}$/.test(key))return new Response('Not found',{status:404});const path='/api/media/'+key;if(!(await allTracks()).some((t:any)=>t.audio===path||t.cover===path)&&!await admin(req))return new Response('Not found',{status:404});const range=req.headers.get('range');
 const obj=await env.BUCKET!.get(key,range?{range:req.headers}:undefined);if(!obj)return new Response('Not found',{status:404});
 const h=new Headers();obj.writeHttpMetadata(h);h.set('Accept-Ranges','bytes');h.set('Cache-Control','private, no-store');h.set('X-Content-Type-Options','nosniff');
 if(obj.range && 'offset' in obj.range){const r=obj.range;h.set('Content-Range',`bytes ${r.offset}-${r.offset!+r.length!-1}/${obj.size}`);h.set('Content-Length',String(r.length));return new Response(obj.body,{status:206,headers:h})}
 h.set('Content-Length',String(obj.size));return new Response(obj.body,{headers:h});
}
