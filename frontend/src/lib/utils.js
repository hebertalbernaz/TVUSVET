import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 👇 Função necessária para o visualizador DICOM
export function dataURItoBlob(dataURI) {
  if (!dataURI) return null;
  const splitData = dataURI.split(',');
  if (splitData.length < 2) return null;
  
  const byteString = atob(splitData[1]);
  const mimeString = splitData[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  
  return new Blob([ab], {type: mimeString});
}