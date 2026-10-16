import { env } from 'cloudflare:workers';
import { admin,allTracks,mediaPath,validYouTube,seed } from '../../data';
const bad=()=>new Response('Please check the track fields',{status:400});
export async function GET(req:Request){const studio=new URL(req.url).searchParams.get('scope')==='studio';if(studio&&!await admin(req))return new Response('Creator access required',{status:403});return Response.json(await allTracks(studio),{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){
 if(!await admin(req))return new Response('Creator access required',{status:403});
 const b=await req.json() as any;
 if(typeof b.title!=='string'||!b.title.trim()||b.title.length>120||!['Focus','Dream','Unwind','Sleep'].includes(b.mood)||!mediaPath(b.audio)||!mediaPath(b.cover)||!validYouTube(b.youtube||'')||!['published','draft','unpublished'].includes(b.status||'published'))return bad();
 const id=crypto.randomUUID();await env.DB!.prepare('INSERT INTO tracks (id,title,mood,audio,cover,youtube,created,status) VALUES (?,?,?,?,?,?,?,?)').bind(id,b.title.trim(),b.mood,b.audio,b.cover,b.youtube||'',Date.now(),b.status||'published').run();return Response.json({id});
}
export async function PATCH(req:Request){
 if(!await admin(req))return new Response('Creator access required',{status:403});
 const b=await req.json() as any;
 if(typeof b.id!=='string')return bad();
 const old=(await allTracks(true)).find((t:any)=>t.id===b.id) as any;
 if(!old)return new Response('Track not found',{status:404});
 const t={...old,...b};
 if(typeof t.title!=='string'||!t.title.trim()||t.title.length>120||!['Focus','Dream','Unwind','Sleep'].includes(t.mood)||!mediaPath(t.cover)||!validYouTube(t.youtube||'')||!['published','draft','unpublished'].includes(t.status||'published'))return bad();
 await env.DB!.prepare('INSERT INTO tracks (id,title,mood,audio,cover,youtube,created,status) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,mood=excluded.mood,cover=excluded.cover,youtube=excluded.youtube,status=excluded.status').bind(b.id,t.title.trim(),t.mood,(old as any).audio,t.cover,t.youtube||'',old.created||Date.now(),t.status||'published').run();return Response.json({id:b.id});
}
