// src/utils/imageUtils.ts
// Merk: Vi bruker ikke lenger exifr - nettleseren håndterer EXIF automatisk

export const chooseFromLibrary = () => new Promise<File | null>(res => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = () => res(inp.files ? inp.files[0] : null); inp.click(); });
export const takePhoto = () => new Promise<File | null>(res => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment'; inp.onchange = () => res(inp.files ? inp.files[0] : null); inp.click(); });

/**
 * Fikser bilde-orientering.
 * 
 * Moderne nettlesere (Chrome 81+, Safari 13.1+, mobile browsers) håndterer
 * EXIF-orientering automatisk. Vi lar nettleseren gjøre jobben ved å bruke
 * createImageBitmap med imageOrientation: 'from-image'.
 * 
 * Dette unngår dobbel-rotasjon som oppstår når vi manuelt roterer
 * et bilde som nettleseren allerede har rotert.
 */
export async function fixImageOrientation(file: File): Promise<string> {
  let imgBitmap: ImageBitmap;
  
  try {
    // La nettleseren håndtere EXIF-rotasjon automatisk
    imgBitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    console.log('[imageUtils] createImageBitmap med imageOrientation: from-image');
  } catch {
    // Fallback for eldre nettlesere - de håndterer vanligvis EXIF selv
    console.log('[imageUtils] Fallback til createImageBitmap uten options');
    imgBitmap = await createImageBitmap(file);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = imgBitmap.width;
  canvas.height = imgBitmap.height;
  
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imgBitmap, 0, 0);
  imgBitmap.close();
  
  console.log('[imageUtils] Bilde prosessert:', canvas.width, 'x', canvas.height);
  
  return canvas.toDataURL('image/jpeg', 0.92);
}

export const makeThumb = (dataUrl: string) => new Promise<string>(res => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const max = 160; const scale = max / Math.max(img.width, img.height); canvas.width = img.width * scale; canvas.height = img.height * scale; const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0, canvas.width, canvas.height); res(canvas.toDataURL('image/jpeg', 0.7)); }; img.src = dataUrl; });