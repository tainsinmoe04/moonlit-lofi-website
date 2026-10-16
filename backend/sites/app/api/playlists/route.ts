import { env } from 'cloudflare:workers';
import {admin,allTracks} from '../../data';
import {defaultPlaylists} from '../../catalog';
export async function GET(){const rows=await env.DB!.prepare('SELECT * FROM playlists ORDER BY created DESC').all();const items=rows.results.map((r:any)=>({id:r.id,title:r.title,description:r.description,trackIds:JSON.parse(r.track_ids)}));return Response.json([...items,...defaultPlaylists.filter(p=>!items.some(i=>i.id===p.id))]);}
export async function POST(req:Request){
 if(!await admin(req))return new Response('Creator access required',{status:403});const b=await req.json() as any;
 if(typeof b.title!=='string'||!b.title.trim()||b.title.length>80||typeof b.description!=='string'||b.description.length>200||!Array.isArray(b.trackIds)||!b.trackIds.length||b.trackIds.length>200)return new Response('Add a title and at least one track',{status:400});
 const allowed=new Set((await allTracks()).map((t:any)=>t.id));if(b.trackIds.some((id:any)=>typeof id!=='string'||!allowed.has(id)))return new Response('Unknown track',{status:400});
 const id=typeof b.id==='string'&&b.id.length<80?b.id:crypto.randomUUID();const ids=Array.from(new Set(b.trackIds));
 await env.DB!.prepare('INSERT INTO playlists (id,title,description,track_ids,created) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,track_ids=excluded.track_ids').bind(id,b.title.trim(),b.description,JSON.stringify(ids),Date.now()).run();return Response.json({id});
}
