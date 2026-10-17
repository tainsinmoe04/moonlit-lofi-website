import {headers} from 'next/headers';
import {createAuth} from './auth';
import {db} from './database';
export async function isCreator(){const session=await createAuth().api.getSession({headers:await headers()});if(!session)return false;const owner=await db.prepare('SELECT value FROM settings WHERE key=?').bind('owner').first();return !!owner&&owner.value===session.user.email.toLowerCase()}
export async function admin(req:Request){const origin=req.headers.get('origin');if((req.method!=='GET'||origin)&&origin!==new URL(req.url).origin)return false;return isCreator()}
