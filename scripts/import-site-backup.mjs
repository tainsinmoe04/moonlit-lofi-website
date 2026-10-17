import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Pool} from 'pg';
import {put,get} from '@vercel/blob';
import path from 'node:path';
try{process.loadEnvFile('.env.local')}catch{}
const directory=process.argv[2];if(!directory||!process.env.DATABASE_URL||!process.env.BLOB_READ_WRITE_TOKEN)throw Error('Provide a backup directory and configured database/private Blob credentials.');
const {tables}=JSON.parse(await readFile(path.join(directory,'database.json'),'utf8'));
const manifest=JSON.parse(await readFile(path.join(directory,'media-manifest.json'),'utf8'));
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:2});
try{
 for(const file of manifest){const bytes=await readFile(path.join(directory,'media',file.key));if(bytes.length!==file.bytes||createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error('Backup integrity check failed: '+file.key);
  const existing=await pool.query('SELECT sha256 FROM media WHERE id=$1',[file.key]);
  if(existing.rowCount&&existing.rows[0].sha256!==file.sha256)throw Error('Conflicting existing media record');
  const pathname='media/'+file.key;
  let check=await get(pathname,{access:'private',useCache:false});
  if(!check){await put(pathname,bytes,{access:'private',contentType:file.type,addRandomSuffix:false,allowOverwrite:false});check=await get(pathname,{access:'private',useCache:false});}
  if(!check||check.statusCode!==200)throw Error('Uploaded media cannot be verified');
  const uploaded=Buffer.from(await new Response(check.stream).arrayBuffer());if(createHash('sha256').update(uploaded).digest('hex')!==file.sha256)throw Error('Uploaded bytes differ');
  if(!existing.rowCount)await pool.query('INSERT INTO media (id,pathname,content_type,size,sha256,created) VALUES ($1,$2,$3,$4,$5,$6)',[file.key,pathname,file.type,file.bytes,file.sha256,Date.now()]);
 }
 const definitions={tracks:['id','title','mood','audio','cover','youtube','created','status','audience','release_at'],playlists:['id','title','description','track_ids','created'],settings:['key','value'],members:['id','name','token_hash','active','expires','created'],events:['id','track','country','at','seconds']};
 const client=await pool.connect();try{await client.query('BEGIN');for(const [table,columns] of Object.entries(definitions)){for(const row of tables[table]){const placeholders=columns.map((_,i)=>'$'+(i+1)).join(',');await client.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,columns.map(k=>row[k]??(k==='audience'?'public':k==='status'?'published':null)));}}await client.query('COMMIT')}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
 console.log(JSON.stringify({imported:Object.fromEntries(Object.entries(tables).map(([k,v])=>[k,v.length])),verifiedMedia:manifest.length}));
}finally{await pool.end()}
