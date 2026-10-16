import { env } from 'cloudflare:workers';
import { admin } from '../../data';
export async function POST(req:Request){
 if(!await admin(req))return new Response('Sign in required',{status:403});
 const type=req.headers.get('content-type')?.split(';')[0]||'';
 const allowed=['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/flac','audio/x-flac','image/jpeg','image/png','image/webp'];
 if(!allowed.includes(type))return new Response('Use MP3, WAV, FLAC, JPG, PNG or WebP',{status:400});
 if(Number(req.headers.get('content-length'))>50*1024*1024)return new Response('Maximum file size is 50 MB',{status:413});
 const bytes=await req.arrayBuffer();if(!bytes.byteLength||bytes.byteLength>50*1024*1024)return new Response('Maximum file size is 50 MB',{status:413});
 const key=crypto.randomUUID();await env.BUCKET!.put(key,bytes,{httpMetadata:{contentType:type}});return Response.json({url:'/api/media/'+key});
}
