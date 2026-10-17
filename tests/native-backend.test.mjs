import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SourceTextModule,SyntheticModule} from 'node:vm';
import path from 'node:path';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
const root=process.cwd();
async function fixture(t){
 const sql=new PGlite();await sql.exec(readFileSync('db/native-schema.sql','utf8'));t.after(()=>sql.close());
 let owner=false;let blobReads=0;
 class Pool{async query(text,args){return sql.query(text,args)}async connect(){return {query:(text,args)=>sql.query(text,args),release(){}}}}
 const pg=new SyntheticModule(['Pool'],function(){this.setExport('Pool',Pool)});
 const creator=new SyntheticModule(['admin','isCreator'],function(){this.setExport('isCreator',async()=>owner);this.setExport('admin',async(req)=>owner&&(req.method==='GET'||req.headers.get('origin')===new URL(req.url).origin))});
 const blob=new SyntheticModule(['get'],function(){this.setExport('get',async(pathname,options)=>{blobReads++;assert.ok(pathname.startsWith('media/'));assert.equal(options.access,'private');const range=options.headers?.get('Range');return {statusCode:200,stream:new Response('audio').body,headers:new Headers({'content-type':'audio/mpeg','content-length':'5',...(range?{'content-range':'bytes 0-4/50'}:{})})}})});
 const cache=new Map();async function load(file){if(cache.has(file))return cache.get(file);const mod=new SourceTextModule(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,{identifier:file});const linked=mod.link(async(spec,ref)=>spec==='pg'?pg:spec==='@vercel/blob'?blob:spec.endsWith('creator-access')?creator:load(path.resolve(path.dirname(ref.identifier),spec+'.ts'))).then(()=>mod);cache.set(file,linked);return linked}
 async function route(name){const mod=await load(path.resolve(root,'lib/native-api',name+'.ts'));if(mod.status!=='evaluated')await mod.evaluate();return mod.namespace}
 process.env.DATABASE_URL='postgresql://test.invalid/local';
 const req=(route,method='GET',body,code)=>new Request('https://music.example/api/'+route,{method,headers:{origin:'https://music.example','Content-Type':'application/json',...(code?{cookie:'__Host-moonlit-member='+code}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return {sql,route,req,signIn(){owner=true},signOut(){owner=false},blobReads:()=>blobReads};
}
test('native PostgreSQL routes preserve tracks, member visibility, range playback and revocation',async t=>{
 const f=await fixture(t),tracks=await f.route('tracks'),members=await f.route('members'),session=await f.route('session'),media=await f.route('media'),lists=await f.route('playlists');
 assert.equal((await members.POST(f.req('members','POST',{name:'Listener',days:30}))).status,403);f.signIn();
 const grant=await(await members.POST(f.req('members','POST',{name:'Listener',days:30}))).json();const key='11111111-1111-4111-8111-111111111111';
 await f.sql.query('INSERT INTO media VALUES ($1,$2,$3,$4,$5,$6)',[key,'media/'+key,'audio/mpeg',50,null,Date.now()]);
 const {id}=await(await tracks.POST(f.req('tracks','POST',{title:'Private preview',mood:'Dream',audio:'/api/media/'+key,cover:'/media/dream-garden.png',status:'published',audience:'members',release_at:Date.now()+86400000}))).json();
 await lists.POST(f.req('playlists','POST',{id:'member-list',title:'Preview',description:'A new chapter',trackIds:[id,'atlantis']}));f.signOut();
 assert.equal((await(await tracks.GET(f.req('tracks'))).json()).some(t=>t.id===id),false);
 const memberTracks=await(await tracks.GET(f.req('tracks','GET',undefined,grant.token))).json();assert.equal(memberTracks.some(t=>t.id===id),true);assert.equal(typeof memberTracks.find(t=>t.id===id).release_at,'number');
 const spoof=f.req('tracks');spoof.headers.set('x-moonlit-member',grant.token);assert.equal((await(await tracks.GET(spoof)).json()).some(t=>t.id===id),false);
 assert.equal((await media.media(f.req('media/'+key),key)).status,404);assert.equal(f.blobReads(),0);
 const range=f.req('media/'+key,'GET',undefined,grant.token);range.headers.set('range','bytes=0-4');const audio=await media.media(range,key);assert.equal(audio.status,206);assert.equal(audio.headers.get('content-range'),'bytes 0-4/50');assert.equal(audio.headers.get('cache-control'),'private, no-store');
 const login=await session.POST(f.req('members/session','POST',{code:grant.token}));assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
 f.signIn();await members.PATCH(f.req('members','PATCH',{id:grant.id,active:false}));f.signOut();assert.equal((await session.POST(f.req('members/session','POST',{code:grant.token}))).status,401);assert.equal((await media.media(range,key)).status,404);
 f.signIn();await tracks.PATCH(f.req('tracks','PATCH',{id,release_at:Date.now()-1000}));f.signOut();assert.equal((await media.media(f.req('media/'+key),key)).status,200);
});
test('native analytics uses PostgreSQL date buckets and inclusive UTC ranges',async t=>{
 const f=await fixture(t),analytics=await f.route('analytics');assert.equal((await analytics.GET(f.req('analytics'))).status,403);f.signIn();const at=Date.parse('2026-10-17T07:40:00Z');await f.sql.query('INSERT INTO events VALUES ($1,$2,$3,$4,$5)',['event','atlantis','MM',at,30]);const response=await analytics.GET(f.req('analytics?from=2026-10-17&to=2026-10-17'));assert.equal(response.status,200);const result=await response.json();assert.equal(result.rows[0].at,Date.parse('2026-10-17T07:30:00Z'));assert.equal(result.rows[0].seconds,30);
});
