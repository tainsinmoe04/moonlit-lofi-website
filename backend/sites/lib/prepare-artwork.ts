// Derive a web-sized upload; the creator's original file is never changed.
export async function prepareArtwork(file:File):Promise<File>{
 if(!file.type.startsWith('image/')||!file.size)return file;
 if(typeof createImageBitmap!=='function')return file;
 const bitmap=await createImageBitmap(file);
 try{
  const scale=Math.min(1,1280/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const context=canvas.getContext('2d');if(!context)return file;context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',.84));
  if(!blob||blob.size>=file.size)return file;
  return new File([blob],file.name.replace(/\.[^.]+$/,'')+(blob.type==='image/webp'?'.webp':'.png'),{type:blob.type});
 }finally{bitmap.close()}
}
