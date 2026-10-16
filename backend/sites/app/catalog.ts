export type Track={id:string;title:string;mood:string;audio:string;cover:string;youtube?:string;status?:"published"|"draft"|"unpublished"};
export type Playlist={id:string;title:string;description:string;trackIds:string[]};
export type PlatformLink={label:string;url:string};
export type ChannelSettings={links:PlatformLink[];about:string;contact:string};
export const seed:Track[]=[
 {id:'atlantis',title:'Atlantis Below',mood:'Dream',audio:'/media/atlantis.mp3',cover:'/media/ocean-cathedral.png',youtube:''},
 {id:'bloom',title:'Bloom in the Nave',mood:'Focus',audio:'/media/bloom.mp3',cover:'/media/celestial-bloom.png',youtube:''},
 {id:'garden',title:'Blooming Marble Garden',mood:'Unwind',audio:'/media/garden.mp3',cover:'/media/dream-garden.png',youtube:''}
];
export const defaultPlaylists:Playlist[]=[{id:'focus-hours',title:'Focus hours',description:'Gentle cello for getting into your flow.',trackIds:['bloom','garden']},{id:'quiet-dreams',title:'Quiet dreams',description:'A softer soundtrack for slowing down.',trackIds:['atlantis','garden']}];
export const defaultSettings:ChannelSettings={links:[],about:'Moonlit Lofi brings together gentle rhythms and cinematic soundscapes for focus, rest, and a little room to dream.',contact:''};

