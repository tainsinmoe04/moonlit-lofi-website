import {readFile} from 'node:fs/promises';
import {Pool} from 'pg';
import {getMigrations} from 'better-auth/db/migration';
try{process.loadEnvFile('.env.local')}catch{}
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required; link the intended project and configure its environment first.');
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:2});
try{
 await pool.query(await readFile(new URL('../db/native-schema.sql',import.meta.url),'utf8'));
 const migrations=await getMigrations({database:pool,emailAndPassword:{enabled:true},rateLimit:{enabled:true,storage:'database'}});await migrations.runMigrations();
 console.log('Application and authentication schema ready.');
}finally{await pool.end()}
