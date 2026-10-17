import {get} from '@vercel/blob';
import {db} from '../database';
import {allTracks,admin} from '../native-data';
import {memberFor} from '../native-membership';
export async function media(req:Request,key:string){
 if(!/^[a-f0-9-]{36}$/.test(key))return new Response('Not found',{status:404});
 const path='/api/media/'+key;if(!(await allTracks(false,!!await memberFor(req))).some(t=>t.audio===path||t.cover===path)&&!await admin(req))return new Response('Not found',{status:404});
 const stored=await db.prepare('SELECT pathname FROM media WHERE id=?').bind(key).first();if(!stored)return new Response('Not found',{status:404});
 const headers=new Headers(),range=req.headers.get('range');if(range){if(!/^bytes=\d*-\d*$/.test(range))return new Response('Invalid range',{status:416});headers.set('Range',range)}
 const result=await get(String(stored.pathname),{access:'private',headers});if(!result||result.statusCode!==200)return new Response('Not found',{status:404});
 const output=new Headers({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'});for(const name of ['content-type','content-length','content-range','etag']){const value=result.headers.get(name);if(value)output.set(name,value)}
 return new Response(result.stream,{status:output.has('content-range')?206:200,headers:output});
}
