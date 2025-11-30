import React, { useEffect, useRef, useState } from 'react';
import cornerstone from 'cornerstone-core';
import cornerstoneMath from 'cornerstone-math';
import cornerstoneTools from 'cornerstone-tools';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';
import Hammer from 'hammerjs';

// --- INICIALIZAÇÃO GLOBAL ---
if (typeof window !== 'undefined' && !window.cornerstoneInitialized) {
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneTools.external.Hammer = Hammer;

    const baseUrl = window.location.origin;

    const config = {
        maxWebWorkers: navigator.hardwareConcurrency || 1,
        startWebWorkersOnDemand: true,
        webWorkerPath: `${baseUrl}/cornerstoneWADOImageLoaderWebWorker.min.js`,
        taskConfiguration: {
            decodeTask: {
                initializeCodecsOnStartup: false,
                usePDFJS: false,
                strict: false,
                codecsPath: `${baseUrl}/cornerstoneWADOImageLoaderCodecs.min.js`,
            },
        },
    };
    
    cornerstoneWADOImageLoader.webWorkerManager.initialize(config);

    cornerstoneTools.init({
        showSVGCursors: true,
        globalToolSyncEnabled: false,
    });

    window.cornerstoneInitialized = true;
}

export function DicomViewer({ imageBlob }) {
  const elementRef = useRef(null);
  const [imageId, setImageId] = useState(null);
  const [status, setStatus] = useState('Inicializando...');

  useEffect(() => {
    if (imageBlob) {
      try {
        // 🔴 CORREÇÃO: Não recriar o Blob se ele já existe, apenas adicionar ao gerenciador
        // Isso evita corromper os dados binários do DICOM
        const id = cornerstoneWADOImageLoader.wadouri.fileManager.add(imageBlob);
        setImageId(id);
      } catch (err) {
        setStatus("Erro ao montar arquivo.");
        console.error(err);
      }
    }
  }, [imageBlob]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !imageId) return;

    cornerstone.enable(element);

    const loadAndRender = async () => {
        try {
            setStatus("Carregando...");
            const image = await cornerstone.loadImage(imageId);
            
            setStatus(null); 
            cornerstone.displayImage(element, image);

            // Ferramentas
            const WwwcTool = cornerstoneTools.WwwcTool;
            const PanTool = cornerstoneTools.PanTool;
            const ZoomTool = cornerstoneTools.ZoomTool;
            const LengthTool = cornerstoneTools.LengthTool;

            if (!cornerstoneTools.getToolForElement(element, 'Wwwc')) cornerstoneTools.addToolForElement(element, WwwcTool);
            if (!cornerstoneTools.getToolForElement(element, 'Pan')) cornerstoneTools.addToolForElement(element, PanTool);
            if (!cornerstoneTools.getToolForElement(element, 'Zoom')) cornerstoneTools.addToolForElement(element, ZoomTool);
            if (!cornerstoneTools.getToolForElement(element, 'Length')) cornerstoneTools.addToolForElement(element, LengthTool);

            cornerstoneTools.setToolActiveForElement(element, 'Wwwc', { mouseButtonMask: 1 });
            cornerstoneTools.setToolActiveForElement(element, 'Pan', { mouseButtonMask: 2 });
            cornerstoneTools.setToolActiveForElement(element, 'Zoom', { mouseButtonMask: 4 });
            
        } catch (err) {
            console.error("Erro no Cornerstone:", err);
            setStatus("Erro: Falha na renderização. Verifique o Console.");
        }
    };

    loadAndRender();

    return () => {
        try { cornerstone.disable(element); } catch(e) {}
    };
  }, [imageId]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {status && (
            <div className="absolute z-10 flex flex-col items-center gap-2">
                <div className="text-white bg-gray-800 px-4 py-2 rounded shadow-lg border border-gray-700 animate-pulse text-center">
                    {status}
                </div>
            </div>
        )}
        <div ref={elementRef} className="w-full h-full absolute top-0 left-0 outline-none" onContextMenu={e => e.preventDefault()} />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-[10px] bg-black/60 px-4 py-1 rounded-full pointer-events-none border border-white/10 select-none">
            Esq: Janelamento • Dir: Mover • Scroll: Zoom
        </div>
    </div>
  );
}