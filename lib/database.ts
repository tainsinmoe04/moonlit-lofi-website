import {Pool} from 'pg';
let pool:Pool|undefined;
export function database(){if(!process.env.DATABASE_URL)throw Error('Database is not configured');return pool??=new Pool({connectionString:process.env.DATABASE_URL,max:5,idleTimeoutMillis:20000,connectionTimeoutMillis:10000})}
const numeric=new Set(['created','at','seconds','samples','expires','release_at','active']);
function normalize(row:Record<string,unknown>){return Object.fromEntries(Object.entries(row).map(([key,value])=>[key,numeric.has(key)&&typeof value==='string'?Number(value):value]))}
export const db={prepare(sql:string){let values:unknown[]=[];let index=0;const text=sql.replace(/\?/g,()=>'$'+(++index));const statement={bind(...args:unknown[]){values=args;return statement},async all(){const result=await database().query(text,values);return {results:result.rows.map(normalize)}},async first<T=Record<string,any>>():Promise<T|null>{const result=await database().query(text,values);return result.rows[0]?normalize(result.rows[0]) as T:null},async run(){const result=await database().query(text,values);return {changes:result.rowCount}}};return statement}};
