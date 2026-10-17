import {memberFor} from '../native-membership';
import { env } from '../native-runtime';
import { admin,allTracks,mediaPath,validYouTube,seed } from '../native-data';
const releaseValid=(b:any)=> (b.audience!=='members'||(typeof b.audio==='string'&&b.audio.startsWith('/api/media/')))&&(b.audience===undefined||['public','members'].includes(b.audience))&&(b.release_at===undefined||b.release_at===null||(Number.isSafeInteger(b.release_at)&&b.release_at>0));
const bad=()=>new Response('Please check the track fields',{status:400});
export async function GET(req:Request){const studio=new URL(req.url).searchParams.get('scope')==='studio';if(studio&&!await admin(req))return new Response('Creator access required',{status:403});return Response.json(await allTracks(studio,!!await memberFor(req)),{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){
 if(!await admin(req))return new Response('Creator access required',{status:403});
 const b=await req.json() as any;
 if(!releaseValid(b)||typeof b.title!=='string'||!b.title.trim()||b.title.length>120||!['Focus','Dream','Unwind','Sleep'].includes(b.mood)||!mediaPath(b.audio)||!mediaPath(b.cover)||!validYouTube(b.youtube||'')||!['published','draft','unpublished'].includes(b.status||'published'))return bad();
 const id=crypto.randomUUID();await env.DB!.prepare('INSERT INTO tracks (id,title,mood,audio,cover,youtube,created,status,audience,release_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,b.title.trim(),b.mood,b.audio,b.cover,b.youtube||'',Date.now(),b.status||'published',b.audience||'public',b.release_at??null).run();return Response.json({id});
}
export async function PATCH(req:Request){
 if(!await admin(req))return new Response('Creator access required',{status:403});
 const b=await req.json() as any;
 if(typeof b.id!=='string')return bad();
 const old=(await allTracks(true)).find((t:any)=>t.id===b.id) as any;
 if(!old)return new Response('Track not found',{status:404});
 const t={...old,...b};
 if(!releaseValid(t)||typeof t.title!=='string'||!t.title.trim()||t.title.length>120||!['Focus','Dream','Unwind','Sleep'].includes(t.mood)||!mediaPath(t.cover)||!validYouTube(t.youtube||'')||!['published','draft','unpublished'].includes(t.status||'published'))return bad();
 await env.DB!.prepare('INSERT INTO tracks (id,title,mood,audio,cover,youtube,created,status,audience,release_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,mood=excluded.mood,cover=excluded.cover,youtube=excluded.youtube,status=excluded.status,audience=excluded.audience,release_at=excluded.release_at').bind(b.id,t.title.trim(),t.mood,(old as any).audio,t.cover,t.youtube||'',old.created||Date.now(),t.status||'published',t.audience||'public',t.release_at??null).run();return Response.json({id:b.id});
}
