import {handleUpload,type HandleUploadBody} from '@vercel/blob/client';
import {head} from '@vercel/blob';
import {admin} from '../creator-access';
import {db} from '../database';
const allowed=['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/flac','audio/x-flac','image/jpeg','image/png','image/webp'];
export async function POST(req:Request){
 const body=await req.json() as HandleUploadBody;
 if(body.type!=='blob.upload-completed'&&!await admin(req))return new Response('Creator access required',{status:403});
 const result=await handleUpload({request:req,body,onBeforeGenerateToken:async(pathname)=>{
  if(!await admin(req))throw Error('Creator access required');
  if(!/^media\/[a-f0-9-]{36}$/.test(pathname))throw Error('Invalid media pathname');
  await db.prepare('INSERT INTO media (id,pathname,content_type,size,created) VALUES (?,?,?,0,?)').bind(pathname.slice(6),pathname,'application/octet-stream',Date.now()).run();
  return {allowedContentTypes:allowed,maximumSizeInBytes:50*1024*1024,addRandomSuffix:false,allowOverwrite:false,validUntil:Date.now()+15*60000};
 },onUploadCompleted:async({blob})=>{const info=await head(blob.pathname);await db.prepare('UPDATE media SET content_type=?,size=? WHERE pathname=?').bind(info.contentType,info.size,blob.pathname).run()}});
 return Response.json(result);
}
