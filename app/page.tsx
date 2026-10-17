import MoonlitApp from './moonlit-app';
export default function Page(){return <MoonlitApp nativeBackend={process.env.MOONLIT_BACKEND==='native'} isAdmin={false}/>}
