const names=['hero-dream','ocean-cathedral','celestial-bloom','dream-garden'];
export function artworkVariants(src:string){
 const name=names.find(name=>src==='/media/'+name+'.png');if(!name)return null;
 const widths=name==='hero-dream'?[800,1600]:[640,1280];
 return widths.map(width=>({src:'/media/'+name+'-'+width+'.webp',width}));
}
export function artworkSource(src:string){return artworkVariants(src)?.at(-1)?.src||src}
