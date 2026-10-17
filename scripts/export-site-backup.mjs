import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdout.write('Ready for private backup input on stdin (hidden).\n');
const raw=await new Promise(resolve=>{let input='';process.stdin.on('data',chunk=>{input+=chunk.toString();if(/[\r\n]/.test(input)){process.stdin.pause();resolve(input.trim())}})});
const {directory,origin,token,tables}=JSON.parse(raw);
await mkdir(path.join(directory,'media'),{recursive:true});
await writeFile(path.join(directory,'database.json'),JSON.stringify({exportedAt:new Date().toISOString(),tables},null,2));
const refs=[...new Set(tables.tracks.flatMap(t=>[t.audio,t.cover]).filter(v=>typeof v==='string'&&/^\/api\/media\/[a-f0-9-]{36}$/.test(v)))];
const manifest=[];
for(const ref of refs){const response=await fetch(new URL(ref,origin),{headers:{'OAI-Sites-Authorization':'Bearer '+token},redirect:'error'});if(!response.ok)throw Error('Media backup failed: '+response.status+' '+ref);const bytes=Buffer.from(await response.arrayBuffer());const key=ref.split('/').at(-1);await writeFile(path.join(directory,'media',key),bytes);manifest.push({ref,key,bytes:bytes.length,type:response.headers.get('content-type'),sha256:createHash('sha256').update(bytes).digest('hex')});}
await writeFile(path.join(directory,'media-manifest.json'),JSON.stringify(manifest,null,2));
process.stdout.write(JSON.stringify({directory,tables:Object.fromEntries(Object.entries(tables).map(([k,v])=>[k,v.length])),media:manifest.length,bytes:manifest.reduce((n,f)=>n+f.bytes,0)})+'\n');
