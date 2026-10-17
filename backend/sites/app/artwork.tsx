'use client';
import {artworkVariants} from '@/lib/artwork-sources';
type Props={privateArtwork?:boolean;src:string;alt:string;className?:string;hero?:boolean;loading?:'lazy'|'eager';fetchPriority?:'high'|'low'|'auto';sizes?:string};
export default function Artwork({privateArtwork=false,hero=false,sizes,loading='lazy',src,...props}:Props){const variants=artworkVariants(src);return <img {...props} src={variants?.at(-1)?.src||src} srcSet={variants?.map(v=>v.src+' '+v.width+'w').join(', ')} sizes={sizes||(hero?'100vw':'(max-width: 650px) 90vw, 32vw')} width={hero?1800:1280} height={hero?600:720} loading={hero?'eager':loading}/>}
