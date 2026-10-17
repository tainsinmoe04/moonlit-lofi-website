import {env} from './native-runtime';
import {seed} from '../app/catalog';
import {visibleTrack} from './native-membership';
export {seed};
export {admin,isCreator} from './creator-access';
export function validYouTube(s:string){if(!s)return true;try{const u=new URL(s);return u.protocol==='https:'&&['youtube.com','www.youtube.com','youtu.be','m.youtube.com'].includes(u.hostname)}catch{return false}}
export function mediaPath(s:unknown){return typeof s==='string'&&(/^\/api\/media\/[a-f0-9-]{36}$/.test(s)||seed.some(t=>t.audio===s||t.cover===s));}
export async function allTracks(includeHidden=false,member=false){const rows=await env.DB!.prepare('SELECT * FROM tracks ORDER BY created DESC').all();const overrides=new Map(rows.results.map((t:any)=>[t.id,t]));const items=[...rows.results.filter((t:any)=>!seed.some(s=>s.id===t.id)),...seed.map(t=>overrides.get(t.id)||{...t,status:"published"})];return includeHidden?items:items.filter((t:any)=>visibleTrack(t,member))}
