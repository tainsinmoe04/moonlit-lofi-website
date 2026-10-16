import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default function Studio(){const origin=process.env.SITE_BACKEND_URL||'https://moonlit-lofi-sanctuary.peppycedar32.chatgpt.site';const url=new URL(origin);if(url.protocol!=='https:')throw Error('A secure creator backend is required');redirect(new URL('/studio',url).href)}
