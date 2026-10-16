import { env } from 'cloudflare:workers';
import {admin} from '../../data';
import {defaultSettings} from '../../catalog';
export async function GET(){const row=await env.DB!.prepare('SELECT value FROM settings WHERE key=?').bind('channel').first<{value:string}>();return Response.json(row?{...defaultSettings,...JSON.parse(row.value)}:defaultSettings);}
export async function PUT(req:Request){
 if(!await admin(req))return new Response('Creator access required',{status:403});const b=await req.json() as any;
 if(!Array.isArray(b.links)||b.links.length>12||typeof b.about!=='string'||b.about.length>1200||typeof b.contact!=='string'||b.contact.length>160||b.contact&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.contact))return new Response('Check the channel details',{status:400});
 for(const l of b.links){try{const u=new URL(l.url);if(u.protocol!=='https:'||u.username||u.password||typeof l.label!=='string'||!l.label.trim()||l.label.length>40)throw Error()}catch{return new Response('Use a name and a valid HTTPS platform link',{status:400})}}
 const safe={links:b.links.map((l:any)=>({label:l.label.trim(),url:l.url})),about:b.about,contact:b.contact};await env.DB!.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('channel',JSON.stringify(safe)).run();return Response.json(safe);
}
