import { env } from 'cloudflare:workers';
import { getChatGPTUser } from './chatgpt-auth';
import {seed} from './catalog';
export {seed};
export async function isCreator(){
 const email=(env as any).ADMIN_EMAIL;
 if(typeof email!=='string'||!email.trim())return false;
 const user=await getChatGPTUser();
 return !!user && user.email.toLowerCase()===email.trim().toLowerCase();
}
export async function admin(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return false;return isCreator();}
export function validYouTube(s:string){if(!s)return true;try{const u=new URL(s);return u.protocol==='https:'&&['youtube.com','www.youtube.com','youtu.be','m.youtube.com'].includes(u.hostname)}catch{return false}}
export function mediaPath(s:unknown){return typeof s==='string'&&(/^\/api\/media\/[a-f0-9-]{36}$/.test(s)||seed.some(t=>t.audio===s||t.cover===s));}
export async function allTracks(){const rows=await env.DB!.prepare('SELECT * FROM tracks ORDER BY created DESC').all();const overrides=new Map(rows.results.map((t:any)=>[t.id,t]));return [...rows.results.filter((t:any)=>!seed.some(s=>s.id===t.id)),...seed.map(t=>overrides.get(t.id)||t)]}
