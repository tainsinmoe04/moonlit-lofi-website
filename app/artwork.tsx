'use client';
import Image from 'next/image';
import {useState} from 'react';
import {artworkSource} from '@/lib/artwork-sources';
type Props={src:string;alt:string;className?:string;hero?:boolean;loading?:'lazy'|'eager';fetchPriority?:'high'|'low'|'auto';sizes?:string};
export default function Artwork({hero=false,sizes,loading='lazy',src,...props}:Props){
 const [failedSource,setFailedSource]=useState('');
 return <Image key={src} {...props} src={artworkSource(src)} unoptimized={failedSource===src} onError={()=>setFailedSource(src)} width={hero?1800:1280} height={hero?600:720} sizes={sizes||(hero?'100vw':'(max-width: 650px) 90vw, 32vw')} loading={hero?'eager':loading} quality={80}/>;
}
