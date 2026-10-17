import {env} from './native-runtime';
export async function hashToken(token:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')}
export async function memberFor(req:Request){const token=(req.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('__Host-moonlit-member='))?.slice('__Host-moonlit-member='.length)||'';if(!/^[a-f0-9]{64}$/.test(token))return null;return env.DB!.prepare('SELECT id,name,expires FROM members WHERE token_hash=? AND active=1 AND expires>?').bind(await hashToken(token),Date.now()).first()}
export function publicTrack(t:any,now=Date.now()){return t.status==='published'&&(t.audience!=='members'||(typeof t.release_at==='number'&&t.release_at<=now))}
export function visibleTrack(t:any,member:boolean,now=Date.now()){return t.status==='published'&&(publicTrack(t,now)||member)}
