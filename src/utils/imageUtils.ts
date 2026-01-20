// src/utils/imageUtils.ts
import * as exifr from 'exifr';

export const chooseFromLibrary = () => new Promise<File | null>(res => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = () => res(inp.files ? inp.files[0] : null); inp.click(); });
export const takePhoto = () => new Promise<File | null>(res => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment'; inp.onchange = () => res(inp.files ? inp.files[0] : null); inp.click(); });

/**
 * Fikser bilde-orientering basert på EXIF-data.
 * Moderne nettlesere (Chrome 81+, Safari 13.1+) respekterer EXIF automatisk i <img>,
 * men createImageBitmap/canvas ignorerer det. Vi må derfor alltid prosessere bildet.
 * 
 * Viktig: Vi leser EXIF fra original fil, ikke fra img-elementet.
 */
export async function fixImageOrientation(file: File): Promise<string> {
  let orientation: number = 1;
  
  // Les EXIF-orientering fra original fil
  try {
    const exifOrientation = await exifr.orientation(file);
    if (typeof exifOrientation === 'number') {
      orientation = exifOrientation;
    }
    console.log('[imageUtils] EXIF orientation:', orientation);
  } catch (error) { 
    console.warn('[imageUtils] Kunne ikke lese EXIF-orientering, antar default.', error); 
  }
  
  // Bruk createImageBitmap med imageOrientation: 'none' for å få RAW pixels
  // uten nettleserens auto-EXIF-korreksjon
  let imgBitmap: ImageBitmap;
  try {
    // Tving nettleseren til å IKKE auto-rotere basert på EXIF
    imgBitmap = await createImageBitmap(file, { imageOrientation: 'none' });
    console.log('[imageUtils] createImageBitmap med imageOrientation: none');
  } catch {
    // Fallback for nettlesere som ikke støtter options
    console.log('[imageUtils] Fallback til createImageBitmap uten options');
    try {
      imgBitmap = await createImageBitmap(file);
    } catch {
      // Siste fallback via Image element
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise(resolve => { img.onload = resolve; img.src = url; });
      URL.revokeObjectURL(url);
      imgBitmap = await createImageBitmap(img);
    }
  }
  
  const w = imgBitmap.width;
  const h = imgBitmap.height;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // EXIF orientation values:
  // 1 = Normal
  // 3 = 180° rotert
  // 6 = 90° CW (typisk portrett på mobil)
  // 8 = 90° CCW
  switch (orientation) {
    case 3:
      canvas.width = w;
      canvas.height = h;
      ctx.translate(w, h);
      ctx.rotate(Math.PI);
      break;
    case 6:
      // Portrett bilde - swap dimensjoner og roter 90° CW
      canvas.width = h;
      canvas.height = w;
      ctx.translate(h, 0);
      ctx.rotate(Math.PI / 2);
      break;
    case 8:
      canvas.width = h;
      canvas.height = w;
      ctx.translate(0, w);
      ctx.rotate(-Math.PI / 2);
      break;
    default:
      canvas.width = w;
      canvas.height = h;
  }
  
  ctx.drawImage(imgBitmap, 0, 0);
  imgBitmap.close();
  
  return canvas.toDataURL('image/jpeg', 0.92);
}

export const makeThumb = (dataUrl: string) => new Promise<string>(res => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const max = 160; const scale = max / Math.max(img.width, img.height); canvas.width = img.width * scale; canvas.height = img.height * scale; const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0, canvas.width, canvas.height); res(canvas.toDataURL('image/jpeg', 0.7)); }; img.src = dataUrl; });