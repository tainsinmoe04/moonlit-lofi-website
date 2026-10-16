export type ListeningState={version:1;trackId:string;position:number;playlistId:string|null;repeat:'off'|'all'|'one';shuffle:boolean;volume:number};
export const listeningKey='moonlit-listening-v1';
export function readListeningState(raw:string|null):ListeningState|null{
 try{const s=JSON.parse(raw||'null');if(!s||s.version!==1||typeof s.trackId!=='string'||!Number.isFinite(s.position)||s.position<0||!['off','all','one'].includes(s.repeat)||typeof s.shuffle!=='boolean'||!Number.isFinite(s.volume))return null;return {version:1,trackId:s.trackId,position:Math.min(s.position,86400),playlistId:typeof s.playlistId==='string'?s.playlistId:null,repeat:s.repeat,shuffle:s.shuffle,volume:Math.min(1,Math.max(0,s.volume))}}catch{return null}
}
