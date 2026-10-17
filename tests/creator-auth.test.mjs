import {test} from 'node:test';
import assert from 'node:assert/strict';
import {betterAuth} from 'better-auth';
import {getMigrations} from 'better-auth/db/migration';
import {PGlite} from '@electric-sql/pglite';
test('creator auth disables public signup and verifies a real password-backed session',async t=>{
 const sql=new PGlite();t.after(()=>sql.close());
 const query=async(text,args)=>{const r=await sql.query(typeof text==='string'?text:text.text,args||text.values);return {...r,rowCount:r.affectedRows??r.rows.length}};
 const pool={query,connect:async()=>({query,release(){}}),end:async()=>{}};
 const options={database:pool,secret:'isolated-test-secret-with-at-least-thirty-two-characters',baseURL:'https://music.example',emailAndPassword:{enabled:true,disableSignUp:true,minPasswordLength:12},rateLimit:{enabled:true,storage:'database'}};
 const migrations=await getMigrations(options);await migrations.runMigrations();
 const auth=betterAuth(options);const request=(route,body,cookie)=>new Request('https://music.example/api/auth/'+route,{method:body?'POST':'GET',headers:{origin:'https://music.example','Content-Type':'application/json',...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const signup=await auth.handler(request('sign-up/email',{name:'Intruder',email:'intruder@example.test',password:'isolated-test-password-123'}));assert.equal(signup.status,400);
 const setup=betterAuth({...options,emailAndPassword:{...options.emailAndPassword,disableSignUp:false}});await setup.api.signUpEmail({body:{name:'Creator',email:'creator@example.test',password:'isolated-test-password-123'}});
 const wrong=await auth.handler(request('sign-in/email',{email:'creator@example.test',password:'wrong-password-123'}));assert.equal(wrong.status,401);
 const signed=await auth.handler(request('sign-in/email',{email:'creator@example.test',password:'isolated-test-password-123'}));assert.equal(signed.status,200);const cookies=signed.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');assert.ok(cookies);
 const session=await(await auth.handler(request('get-session',undefined,cookies))).json();assert.equal(session.user.email,'creator@example.test');
 const forged=await(await auth.handler(request('get-session',undefined,'better-auth.session_token=forged'))).json();assert.equal(forged,null);
});
