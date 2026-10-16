import { env } from 'cloudflare:workers';
import { seed } from '../../data';
async function proxyCountry(req:Request,body:string):Promise<string|null>{
 const signature=req.headers.get('x-moonlit-signature');
 if(!signature)return null;
 const secret=(env as any).PROXY_SIGNING_SECRET;
 const stamp=req.headers.get('x-moonlit-timestamp')||'';
 const country=req.headers.get('x-moonlit-country')||'Unknown';
 if(typeof secret!=='string'||!/^\d{13}$/.test(stamp)||Math.abs(Date.now()-Number(stamp))>90000||!/^([A-Z]{2}|Unknown)$/.test(country)||!/^\w{64}$/.test(signature)||!/^[a-f0-9]+$/.test(signature))throw Error('Invalid proxy signature');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const bytes=Uint8Array.from(signature.match(/.{2}/g)!,x=>parseInt(x,16));
 const valid=await crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(stamp+'.'+country+'.'+body));
 if(!valid)throw Error('Invalid proxy signature');return country;
}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return new Response('Forbidden',{status:403});
 if(Number(req.headers.get('content-length'))>2048)return new Response('Event too large',{status:413});
 const raw=await req.text();if(raw.length>2048)return new Response('Event too large',{status:413});
 let signedCountry:string|null;try{signedCountry=await proxyCountry(req,raw)}catch{return new Response('Forbidden',{status:403})}
 let b:any;try{b=JSON.parse(raw)}catch{return new Response('Invalid event',{status:400})}
 if(typeof b.track!=='string'||!Number.isInteger(b.seconds)||b.seconds<1||b.seconds>30)return new Response('Invalid event',{status:400});
 if(!seed.some(t=>t.id===b.track)&&!await env.DB!.prepare('SELECT id FROM tracks WHERE id=?').bind(b.track).first())return new Response('Unknown track',{status:400});
 const country=signedCountry||String((req as any).cf?.country||'Unknown');
 await env.DB!.prepare('INSERT INTO events (id,track,country,at,seconds) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),b.track,country,Date.now(),b.seconds).run();return new Response(null,{status:204});
}
