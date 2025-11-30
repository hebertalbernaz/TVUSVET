import React, { useEffect, useRef, useState } from 'react';
import cornerstone from 'cornerstone-core';
import cornerstoneMath from 'cornerstone-math';
import cornerstoneTools from 'cornerstone-tools';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';
import Hammer from 'hammerjs';

// --- INICIALIZAÇÃO ÚNICA ---
if (typeof window !== 'undefined' && !window.cornerstoneInitialized) {
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneTools.external.Hammer = Hammer;

    // Define os caminhos absolutos baseados na URL atual
    const baseUrl = window.location.origin; // ex: http://localhost:3000

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
    
    console.log("Tentando carregar Workers de:", config.webWorkerPath);
    cornerstoneWADOImageLoader.webWorkerManager.initialize(config);

    cornerstoneTools.init({ showSVGCursors: true, globalToolSyncEnabled: false });
    window.cornerstoneInitialized = true;
}

export function DicomViewer({ imageBlob }) {
  const elementRef = useRef(null);
  const [imageId, setImageId] = useState(null);
  const [status, setStatus] = useState('Inicializando...');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (imageBlob) {
      try {
        const blob = new Blob([imageBlob], { type: 'application/dicom' });
        const id = cornerstoneWADOImageLoader.wadouri.fileManager.add(blob);
        setImageId(id);
        setDetails(`Tamanho do arquivo: ${(blob.size / 1024).toFixed(2)} KB`);
      } catch (err) {
        setStatus("Erro crítico ao montar arquivo.");
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
            setStatus("Carregando decodificadores...");
            // Tenta carregar a imagem. Se o Worker falhar, vai cair no catch.
            const image = await cornerstone.loadImage(imageId);
            
            setStatus("Renderizando...");
            cornerstone.displayImage(element, image);
            setStatus(null); // Sucesso!

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
            console.error("Erro Cornerstone:", err);
            // Diagnóstico de erro
            if (err.message && err.message.includes('404')) {
                setStatus("Erro 404: O sistema não encontrou os arquivos .js na pasta public.");
            } else if (err.message && err.message.includes('syntax')) {
                setStatus("Erro de Sintaxe: O arquivo .js baixado pode estar corrompido (HTML em vez de JS).");
            } else {
                setStatus(`Erro: ${err.message || 'Falha desconhecida no Worker'}`);
            }
        }
    };

    loadAndRender();

    return () => { try { cornerstone.disable(element); } catch(e) {} };
  }, [imageId]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {status && (
            <div className="absolute z-10 flex flex-col items-center gap-2 max-w-md text-center">
                <div className="text-white bg-red-900/90 border border-red-500 px-6 py-4 rounded shadow-2xl">
                    <p className="font-bold text-lg mb-2">Estado: {status}</p>
                    <p className="text-xs text-gray-300 font-mono">{details}</p>
                    <p className="text-xs text-yellow-300 mt-2">Dica: Abra o Console (F12) para ver o link exato que falhou.</p>
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