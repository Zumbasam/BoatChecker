// src/utils/pdfUtils.ts
/**
Konverterer en Blob til en base64-kodet streng (uten data URL-prefix).
@param blob - Blob-objektet som skal konverteres.
@returns Et Promise som resolver til den rene base64-strengen.
*/
export const blobToBase64 = (blob: Blob): Promise<string> => {
return new Promise((resolve, reject) => {
const reader = new FileReader();
reader.onloadend = () => {
// reader.result er en data URL (f.eks. "data:application/pdf;base64,JVBERi...")
// Vi trenger kun selve base64-delen etter kommaet.
const base64String = (reader.result as string).split(',')[1];
resolve(base64String);
};
reader.onerror = reject;
reader.readAsDataURL(blob);
});
};