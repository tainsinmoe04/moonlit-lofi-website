import MoonlitApp from './moonlit-app';
import {isCreator} from './data';
export const dynamic='force-dynamic';
export default async function Page(){return <MoonlitApp isAdmin={await isCreator()}/>}
