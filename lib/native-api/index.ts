import * as tracks from './tracks';
import * as playlists from './playlists';
import * as settings from './settings';
import * as analytics from './analytics';
import * as members from './members';
import * as session from './session';
import * as events from './events';
import * as upload from './upload';
import {media} from './media';
type Handler=(request:Request)=>Promise<Response>;
const routes:Record<string,Record<string,Handler>>={tracks,playlists,settings,analytics,members,'members/session':session,events,upload};
export async function handle(req:Request,parts:string[]){
 try{
  if(parts.length===2&&parts[0]==='media'&&req.method==='GET')return await media(req,parts[1]);
  const handler=routes[parts.join('/')]?.[req.method];if(!handler)return new Response('Not found',{status:404});
  if(['POST','PATCH','PUT'].includes(req.method)&&Number(req.headers.get('content-length'))>32768)return new Response('Request too large',{status:413});
  const response=await handler(req) as Response;response.headers.set('Cache-Control','private, no-store');response.headers.set('X-Content-Type-Options','nosniff');return response;
 }catch(error){if(error instanceof SyntaxError)return new Response('Invalid request',{status:400});console.error('Native music API failed',{route:parts.join('/'),error:error instanceof Error?error.name:'Unknown'});return new Response('The music service is temporarily unavailable.',{status:503})}
}
