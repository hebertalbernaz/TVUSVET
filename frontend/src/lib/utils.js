import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Função para combinar classes do Tailwind (já existia)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Nova função auxiliar para converter Base64 em Blob (Necessária para o DICOM)
export function dataURItoBlob(dataURI) {
  if (!dataURI) return null;
  
  // Verifica se o dataURI tem o formato esperado
  const splitData = dataURI.split(',');
  if (splitData.length < 2) return null;

  const byteString = atob(splitData[1]);
  const mimeString = splitData[0].split(':')[1].split(';')[0];
  
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], {type: mimeString});
}