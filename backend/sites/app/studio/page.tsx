import MoonlitApp from '../moonlit-app';
import {isCreator} from '../data';
import {requireChatGPTUser} from '../chatgpt-auth';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function StudioPage(){await requireChatGPTUser('/studio');if(!await isCreator())notFound();return <MoonlitApp isAdmin initialStudio/>}
