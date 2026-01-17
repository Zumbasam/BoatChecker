// src/utils/imageUtils.ts
import * as exifr from 'exifr';

export const chooseFromLibrary = () => new Promise<File | null>(res => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = () => res(inp.files ? inp.files[0] : null); inp.click(); });
export const takePhoto = () => new Promise<File | null>(res => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment'; inp.onchange = () => res(inp.files ? inp.files[0] : null); inp.click(); });

export async function fixImageOrientation(file: File): Promise<string> {
  let orientation: number = 1;
  try {
    const exifOrientation = await exifr.orientation(file);
    if (typeof exifOrientation === 'number') {
      orientation = exifOrientation;
    }
  } catch (error) { console.warn('Kunne ikke lese EXIF-orientering, antar default.', error); }
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise(resolve => { img.onload = resolve; img.src = url; });
  const w = img.width, h = img.height;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  switch (orientation) {
    case 3: canvas.width = w; canvas.height = h; ctx.translate(w, h); ctx.rotate(Math.PI); break;
    case 6: canvas.width = h; canvas.height = w; ctx.translate(h, 0); ctx.rotate(Math.PI / 2); break;
    case 8: canvas.width = h; canvas.height = w; ctx.translate(0, w); ctx.rotate(-Math.PI / 2); break;
    default: canvas.width = w; canvas.height = h;
  }
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  return canvas.toDataURL('image/jpeg', 0.95);
}

export const makeThumb = (dataUrl: string) => new Promise<string>(res => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const max = 160; const scale = max / Math.max(img.width, img.height); canvas.width = img.width * scale; canvas.height = img.height * scale; const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0, canvas.width, canvas.height); res(canvas.toDataURL('image/jpeg', 0.7)); }; img.src = dataUrl; });