import React, { useEffect, useRef, useState } from 'react';
import cornerstone from 'cornerstone-core';
import cornerstoneMath from 'cornerstone-math';
import cornerstoneTools from 'cornerstone-tools';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';
import Hammer from 'hammerjs';

// --- CONFIGURAÇÃO AVANÇADA DOS DECODIFICADORES (WEB WORKERS) ---
// Isso permite abrir arquivos comprimidos (JPEG Lossless) como os que você enviou
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

// Aponta para os workers hospedados na nuvem (CDN) para evitar erros de arquivo local
const config = {
  webWorkerPath: 'https://unpkg.com/cornerstone-wado-image-loader@4.1.5/dist/cornerstoneWADOImageLoaderWebWorker.min.js',
  taskConfiguration: {
    decodeTask: {
      codecsPath: 'https://unpkg.com/cornerstone-wado-image-loader@4.1.5/dist/cornerstoneWADOImageLoaderCodecs.min.js',
    },
  },
};
cornerstoneWADOImageLoader.webWorkerManager.initialize(config);

// Configuração das Ferramentas
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.init(); // Inicializa o gestor de ferramentas

export function DicomViewer({ imageBlob }) {
  const elementRef = useRef(null);
  const [imageId, setImageId] = useState(null);

  useEffect(() => {
    if (imageBlob) {
      // Força o tipo MIME para DICOM, caso o navegador tenha detectado errado (ex: octet-stream)
      const dicomBlob = new Blob([imageBlob], { type: 'application/dicom' });
      const id = cornerstoneWADOImageLoader.wadouri.fileManager.add(dicomBlob);
      setImageId(id);
    }
  }, [imageBlob]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !imageId) return;

    cornerstone.enable(element);

    cornerstone.loadImage(imageId).then(image => {
      cornerstone.displayImage(element, image);

      // Adiciona e Ativa Ferramentas
      const WwwcTool = cornerstoneTools.WwwcTool;
      const PanTool = cornerstoneTools.PanTool;
      const ZoomTool = cornerstoneTools.ZoomTool;
      const LengthTool = cornerstoneTools.LengthTool;

      cornerstoneTools.addTool(WwwcTool);
      cornerstoneTools.addTool(PanTool);
      cornerstoneTools.addTool(ZoomTool);
      cornerstoneTools.addTool(LengthTool);

      // Configuração dos Botões do Mouse
      cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 }); // Esquerdo: Brilho
      cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 2 });  // Direito: Mover
      cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 4 }); // Meio/Scroll: Zoom
      
      // A Régua (Length) fica disponível para ser ativada via UI depois
      cornerstoneTools.setToolPassive('Length', { mouseButtonMask: 1 });

    }).catch(err => {
      console.error("Erro crítico ao carregar DICOM:", err);
      alert("Erro ao renderizar imagem DICOM. Verifique se o arquivo está corrompido ou usa compressão não suportada.");
    });

    return () => {
      // Limpeza ao fechar
      try {
        cornerstone.disable(element);
      } catch (e) { console.error(e); }
    };
  }, [imageId]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
        <div 
            ref={elementRef} 
            className="w-full h-full"
            onContextMenu={e => e.preventDefault()}
        />
        
        {/* Legenda de Ajuda */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-xs bg-black/60 px-3 py-1 rounded-full pointer-events-none select-none backdrop-blur-sm border border-white/10">
            Esq: Brilho • Dir: Mover • Scroll: Zoom
        </div>
    </div>
  );
}