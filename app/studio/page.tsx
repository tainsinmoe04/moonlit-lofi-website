import MoonlitApp from '../moonlit-app';
import {isCreator} from '@/lib/creator-access';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Studio(){if(process.env.MOONLIT_BACKEND==='native'){if(!await isCreator())redirect('/studio/login');return <MoonlitApp isAdmin initialStudio nativeBackend/>}const origin=process.env.SITE_BACKEND_URL||'https://moonlit-lofi-sanctuary.peppycedar32.chatgpt.site';const url=new URL(origin);if(url.protocol!=='https:')throw Error('A secure creator backend is required');redirect(new URL('/studio',url).href)}
