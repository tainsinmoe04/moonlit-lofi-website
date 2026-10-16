import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {SourceTextModule,SyntheticModule} from 'node:vm';
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root=path.resolve('backend/sites');
async function fixture(){
 const sqlite=new DatabaseSync(':memory:');
 for(const f of readdirSync(path.join(root,'drizzle')).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync(path.join(root,'drizzle',f),'utf8'));
 const db={prepare(sql){let args=[];const query={bind(...a){args=a;return query},async all(){return {results:sqlite.prepare(sql).all(...args)}},async first(){return sqlite.prepare(sql).get(...args)||null},async run(){return sqlite.prepare(sql).run(...args)}};return query}};
 let identity=null;const env={DB:db,ADMIN_EMAIL:'creator@example.test',BUCKET:{async get(){return {body:'audio',size:5,writeHttpMetadata(h){h.set('Content-Type','audio/mpeg')}}}}};
 const cache=new Map();
 const workers=new SyntheticModule(['env'],function(){this.setExport('env',env)});
 const auth=new SyntheticModule(['getChatGPTUser'],function(){this.setExport('getChatGPTUser',async()=>identity)});
 async function load(file){if(cache.has(file))return cache.get(file);const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;const mod=new SourceTextModule(source,{identifier:file});cache.set(file,mod);await mod.link(async(spec,ref)=>spec==='cloudflare:workers'?workers:spec.endsWith('chatgpt-auth')?auth:load(path.resolve(path.dirname(ref.identifier),spec+'.ts')));return mod}
 async function route(name){const m=await load(path.join(root,'app/api',name,'route.ts'));if(m.status!=='evaluated')await m.evaluate();return m.namespace}
 const request=(route,method='GET',body)=>new Request('https://backend.example/api/'+route,{method,headers:{Origin:'https://backend.example','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 return {sqlite,route,request,signIn(){identity={email:env.ADMIN_EMAIL}},signOut(){identity=null}};
}
test('drafts, unpublishing and restoration preserve audio while staying private',async()=>{
 const f=await fixture(),r=await f.route('tracks');
 const body={title:'Unreleased track',mood:'Dream',audio:'/api/media/11111111-1111-4111-8111-111111111111',cover:'/media/dream-garden.png',status:'draft'};
 assert.equal((await r.POST(f.request('tracks','POST',body))).status,403);
 f.signIn();const {id}=await (await r.POST(f.request('tracks','POST',body))).json();
 assert.ok((await(await r.GET(f.request('tracks?scope=studio'))).json()).some(t=>t.id===id));
 f.signOut();assert.equal((await r.GET(f.request('tracks?scope=studio'))).status,403);
 assert.ok(!(await(await r.GET(f.request('tracks'))).json()).some(t=>t.id===id));
 const media=await f.route('media/[key]');assert.equal((await media.GET(f.request('media/key'),{params:Promise.resolve({key:'11111111-1111-4111-8111-111111111111'})})).status,404);
 f.signIn();await r.PATCH(f.request('tracks','PATCH',{id,status:'published'}));f.signOut();
 assert.ok((await(await r.GET(f.request('tracks'))).json()).some(t=>t.id===id));
 f.signIn();await r.PATCH(f.request('tracks','PATCH',{id,status:'unpublished'}));f.signOut();assert.ok(!(await(await r.GET(f.request('tracks'))).json()).some(t=>t.id===id));
 f.signIn();await r.PATCH(f.request('tracks','PATCH',{id,status:'published'}));assert.equal(f.sqlite.prepare('SELECT audio FROM tracks WHERE id=?').get(id).audio,body.audio);
 await r.PATCH(f.request('tracks','PATCH',{id:'atlantis',status:'unpublished'}));f.signOut();assert.ok(!(await(await r.GET(f.request('tracks'))).json()).some(t=>t.id==='atlantis'));
});
test('playlist ordering survives save; hidden tracks disappear publicly and return in place',async()=>{
 const f=await fixture(),tracks=await f.route('tracks'),lists=await f.route('playlists');f.signIn();
 await lists.POST(f.request('playlists','POST',{id:'ordered',title:'Ordered',description:'A collection',trackIds:['garden','atlantis','bloom']}));
 await tracks.PATCH(f.request('tracks','PATCH',{id:'atlantis',status:'unpublished'}));f.signOut();
 const publicList=(await(await lists.GET(f.request('playlists'))).json()).find(p=>p.id==='ordered');assert.deepEqual(publicList.trackIds,['garden','bloom']);
 f.signIn();const studio=(await(await lists.GET(f.request('playlists?scope=studio'))).json()).find(p=>p.id==='ordered');assert.deepEqual(studio.trackIds,['garden','atlantis','bloom']);
 await tracks.PATCH(f.request('tracks','PATCH',{id:'atlantis',status:'published'}));f.signOut();assert.deepEqual((await(await lists.GET(f.request('playlists'))).json()).find(p=>p.id==='ordered').trackIds,['garden','atlantis','bloom']);
});
test('analytics uses inclusive date bounds and track filter without truncating events',async()=>{
 const f=await fixture(),r=await f.route('analytics');assert.equal((await r.GET(f.request('analytics'))).status,403);f.signIn();
 const insert=f.sqlite.prepare('INSERT INTO events VALUES (?,?,?,?,?)');for(const [id,track,at] of [['a','atlantis','2026-10-15T23:59:00Z'],['b','atlantis','2026-10-16T12:45:00Z'],['c','garden','2026-10-16T12:50:00Z'],['d','atlantis','2026-10-17T00:00:00Z']])insert.run(id,track,'MM',Date.parse(at),15);
 const response=await r.GET(f.request('analytics?from=2026-10-16&to=2026-10-16&track=atlantis'));assert.equal(response.status,200);const {rows}=await response.json();assert.equal(rows.length,1);assert.equal(rows[0].seconds,15);assert.equal(new Date(rows[0].at).toISOString(),'2026-10-16T12:30:00.000Z');
 assert.equal((await r.GET(f.request('analytics?from=2026-02-30&to=2026-03-01'))).status,400);
 assert.equal((await r.GET(f.request('analytics?from=2020-01-01&to=2026-10-16'))).status,400);
});
