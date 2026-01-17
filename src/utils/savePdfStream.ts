// src/utils/savePdfStream.ts
import { pdf } from "@react-pdf/renderer";
import StreamSaver from "streamsaver";
import type { ReactElement } from "react";

// Polyfill for å sikre at WritableStream er tilgjengelig i eldre nettlesere
async function ensurePolyfill() {
  // @ts-ignore - Vi sjekker for window.WritableStream før vi importerer
  if (!window.WritableStream) {
    await import("web-streams-polyfill/es6");
  }
}

interface Props {
  pdfDocument: ReactElement;
  fileName: string;
}

export async function savePdfStream({ pdfDocument, fileName }: Props) {
  // Sjekker for streamsaver-støtte
  // @ts-ignore - StreamSaver-typen er definert i vår .d.ts fil
  const supportsStreamSaver = typeof window !== "undefined" && "WritableStream" in window && !!StreamSaver.createWriteStream;

  // --- START PÅ ENDRING ---
  // Vi bruker "as ReactElement<any>" for å fortelle TypeScript at dette er en gyldig komponent for @react-pdf/renderer
  const blob = await pdf(pdfDocument as ReactElement<any>).toBlob();
  // --- SLUTT PÅ ENDRING ---

  if (supportsStreamSaver) {
    try {
      await ensurePolyfill();
      // @ts-ignore
      const fileStream = StreamSaver.createWriteStream(fileName, { size: blob.size });
      const readableStream = blob.stream();
      
      await readableStream.pipeTo(fileStream);
      return;
    } catch (error) {
      console.error("Feil ved streaming av PDF, faller tilbake til vanlig nedlasting:", error);
    }
  }
  
  // Fallback: vanlig nedlasting
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}