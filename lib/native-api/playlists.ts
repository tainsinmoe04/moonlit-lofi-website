import {memberFor} from '../native-membership';
import { env } from '../native-runtime';
import {admin,allTracks} from '../native-data';
import {defaultPlaylists} from '../../app/catalog';
export async function GET(req:Request){const studio=new URL(req.url).searchParams.get('scope')==='studio';if(studio&&!await admin(req))return new Response('Creator access required',{status:403});const rows=await env.DB!.prepare('SELECT * FROM playlists ORDER BY created DESC').all();const items=rows.results.map((r:any)=>({id:r.id,title:r.title,description:r.description,trackIds:JSON.parse(r.track_ids)}));const lists=[...items,...defaultPlaylists.filter(p=>!items.some(i=>i.id===p.id))];if(studio)return Response.json(lists);const ids=new Set((await allTracks(false,!!await memberFor(req))).map((t:any)=>t.id));return Response.json(lists.map(p=>({...p,trackIds:p.trackIds.filter((id:string)=>ids.has(id))})).filter(p=>p.trackIds.length),{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){
 if(!await admin(req))return new Response('Creator access required',{status:403});const b=await req.json() as any;
 if(typeof b.title!=='string'||!b.title.trim()||b.title.length>80||typeof b.description!=='string'||b.description.length>200||!Array.isArray(b.trackIds)||!b.trackIds.length||b.trackIds.length>200)return new Response('Add a title and at least one track',{status:400});
 const allowed=new Set((await allTracks(true)).map((t:any)=>t.id));if(b.trackIds.some((id:any)=>typeof id!=='string'||!allowed.has(id)))return new Response('Unknown track',{status:400});
 const id=typeof b.id==='string'&&b.id.length<80?b.id:crypto.randomUUID();const ids=Array.from(new Set(b.trackIds));
 await env.DB!.prepare('INSERT INTO playlists (id,title,description,track_ids,created) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,track_ids=excluded.track_ids').bind(id,b.title.trim(),b.description,JSON.stringify(ids),Date.now()).run();return Response.json({id});
}
