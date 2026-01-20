// src/utils/savePdfStream.ts
import { pdf } from "@react-pdf/renderer";
import type { ReactElement } from "react";

interface Props {
  pdfDocument: ReactElement;
  fileName: string;
}

export async function savePdfStream({ pdfDocument, fileName }: Props) {
  // Genererer PDF som blob
  const blob = await pdf(pdfDocument as ReactElement<any>).toBlob();
  
  // Direkte nedlasting uten StreamSaver (unngår jimmywarting.github popup)
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}