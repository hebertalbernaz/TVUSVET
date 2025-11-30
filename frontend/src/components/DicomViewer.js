import React, { useEffect, useRef, useState } from 'react';
import cornerstone from 'cornerstone-core';
import cornerstoneMath from 'cornerstone-math';
import cornerstoneTools from 'cornerstone-tools';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';
import Hammer from 'hammerjs';

// Configuração Global do Cornerstone
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

export function DicomViewer({ imageBlob }) {
  const elementRef = useRef(null);
  const [imageId, setImageId] = useState(null);

  useEffect(() => {
    // Registra o carregador de arquivos locais
    cornerstoneWADOImageLoader.configure({
        beforeSend: function(xhr) {}
    });
    
    if (imageBlob) {
      // Cria um ID temporário para o arquivo
      const id = cornerstoneWADOImageLoader.wadouri.fileManager.add(imageBlob);
      setImageId(id);
    }
  }, [imageBlob]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !imageId) return;

    cornerstone.enable(element);

    cornerstone.loadImage(imageId).then(image => {
      cornerstone.displayImage(element, image);

      // Adiciona ferramentas
      const WwwcTool = cornerstoneTools.WwwcTool; // Brilho/Contraste
      const PanTool = cornerstoneTools.PanTool;
      const ZoomTool = cornerstoneTools.ZoomTool;
      const LengthTool = cornerstoneTools.LengthTool; // Régua

      cornerstoneTools.addTool(WwwcTool);
      cornerstoneTools.addTool(PanTool);
      cornerstoneTools.addTool(ZoomTool);
      cornerstoneTools.addTool(LengthTool);

      // Ativa ferramentas (Botão Esquerdo: Nível/Janela, Direito: Pan, Meio: Zoom)
      cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
      cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 2 });
      cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 4 });
      cornerstoneTools.setToolActive('Length', { mouseButtonMask: 1 }); // Ativar via botão na UI depois

    }).catch(err => console.error("Erro ao carregar DICOM:", err));

    return () => {
      cornerstone.disable(element);
    };
  }, [imageId]);

  return (
    <div className="relative w-full h-full bg-black">
        <div 
            ref={elementRef} 
            className="w-full h-full"
            onContextMenu={e => e.preventDefault()}
        />
        <div className="absolute top-2 left-2 text-white text-xs bg-black/50 p-2 rounded pointer-events-none">
            Botão Esq: Brilho/Contraste | Dir: Mover | Scroll: Zoom
        </div>
    </div>
  );
}