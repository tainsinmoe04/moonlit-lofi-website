import type {NextConfig} from 'next';
const config:NextConfig={poweredByHeader:false,images:{localPatterns:[{pathname:'/media/**'},{pathname:'/api/media/**'}],qualities:[80],deviceSizes:[384,640,828,1080,1280,1600,1920],imageSizes:[64,96,160,256]}};
export default config;
