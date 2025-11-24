import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Circle as CircleIcon, Type, ArrowRight, Save, Trash2, X } from 'lucide-react';

// IMPORTAÇÃO BLINDADA (Garante que pega a biblioteca certa)
const fabric = require('fabric').fabric || require('fabric');

export function ImageEditor({ imageUrl, isOpen, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [color, setColor] = useState('#ff0000'); // Vermelho padrão
  const canvasInstance = useRef(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    // 1. Limpeza preventiva
    if (canvasInstance.current) {
      canvasInstance.current.dispose();
    }

    // 2. Inicializar Canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#000000', // Fundo preto
      selection: false, // Desativa seleção de arrastar (melhor para desenho)
    });

    canvasInstance.current = canvas;
    setFabricCanvas(canvas);

    // 3. Carregamento Robusto (Via HTML Image)
    if (imageUrl) {
        const imgObj = new Image();
        imgObj.crossOrigin = "anonymous";
        imgObj.src = imageUrl;
        
        imgObj.onload = () => {
            const fImg = new fabric.Image(imgObj);
            
            // Ajuste de escala para caber (Contain)
            const scale = Math.min(
                800 / imgObj.width,
                600 / imgObj.height
            );
            
            fImg.set({
                scaleX: scale,
                scaleY: scale,
                originX: 'center',
                originY: 'center',
                left: 400,
                top: 300,
                selectable: false, // Bloqueia movimento da foto
                evented: false     // Bloqueia cliques na foto
            });

            canvas.add(fImg);
            canvas.sendToBack(fImg);
            canvas.renderAll();
        };
        
        imgObj.onerror = (err) => {
            console.error("Erro ao carregar imagem:", err);
        };
    }

    return () => {
      if (canvasInstance.current) {
        canvasInstance.current.dispose();
        canvasInstance.current = null;
      }
      setFabricCanvas(null);
    };
  }, [isOpen, imageUrl]);

  // --- FERRAMENTAS ---

  const addArrow = () => {
    if (!fabricCanvas) return;
    const arrowPath = 'M 0 0 L 100 0 M 80 -10 L 100 0 L 80 10';
    const arrow = new fabric.Path(arrowPath, {
      stroke: color,
      strokeWidth: 5,
      fill: 'transparent',
      left: 400,
      top: 300,
      originX: 'center',
      originY: 'center',
      scaleX: 2,
      scaleY: 2,
      strokeLineCap: 'round',
      strokeLineJoin: 'round'
    });
    fabricCanvas.add(arrow);
    fabricCanvas.setActiveObject(arrow);
    fabricCanvas.requestRenderAll();
  };

  const addCircle = () => {
    if (!fabricCanvas) return;
    const circle = new fabric.Circle({
      radius: 60,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 5,
      left: 400,
      top: 300,
      originX: 'center',
      originY: 'center'
    });
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
    fabricCanvas.requestRenderAll();
  };

  const addText = () => {
    if (!fabricCanvas) return;
    const text = new fabric.IText('Texto', {
      fontFamily: 'Arial',
      fontSize: 40,
      fill: color,
      left: 400,
      top: 300,
      originX: 'center',
      originY: 'center',
      fontWeight: 'bold',
      stroke: '#000000', // Borda preta para contraste
      strokeWidth: 1
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    text.enterEditing();
    text.selectAll();
    fabricCanvas.requestRenderAll();
  };

  const deleteSelected = () => {
    if (!fabricCanvas) return;
    const activeObj = fabricCanvas.getActiveObject();
    if (activeObj) {
      fabricCanvas.remove(activeObj);
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
    }
  };

  const handleSave = () => {
    if (!fabricCanvas) return;
    fabricCanvas.discardActiveObject(); // Tira seleção antes de salvar
    fabricCanvas.requestRenderAll();
    
    setTimeout(() => {
        // Exporta com qualidade máxima
        const dataUrl = fabricCanvas.toDataURL({
            format: 'jpeg',
            quality: 0.9,
            multiplier: 1
        });
        onSave(dataUrl);
    }, 50);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* [&>button]:hidden remove o X nativo duplicado */}
      <DialogContent className="max-w-[850px] p-0 border-zinc-800 bg-zinc-900 text-white gap-0 outline-none [&>button]:hidden">
        
        {/* Header Personalizado */}
        <div className="p-3 px-4 border-b border-zinc-700 bg-zinc-800 flex justify-between items-center rounded-t-lg">
          <DialogTitle className="text-white font-medium">Editor de Imagem</DialogTitle>
          <Button variant="ghost" onClick={onClose} size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-700">
            <X className="h-5 w-5"/>
          </Button>
        </div>
        
        {/* Área do Canvas */}
        <div className="flex justify-center items-center bg-black overflow-hidden" style={{ height: '600px', width: '100%' }}>
          <canvas ref={canvasRef} />
        </div>

        {/* Barra de Ferramentas */}
        <div className="p-3 bg-zinc-800 border-t border-zinc-700 flex justify-between items-center rounded-b-lg">
          
          <div className="flex gap-4 items-center">
            {/* Cores */}
            <div className="flex gap-2 border-r border-zinc-600 pr-4">
              {['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ffffff'].map(c => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    const active = fabricCanvas?.getActiveObject();
                    if (active) {
                      if (active.type === 'i-text') active.set('fill', c);
                      else active.set('stroke', c);
                      fabricCanvas.requestRenderAll();
                    }
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-125' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            {/* Ferramentas */}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={addArrow} className="bg-zinc-700 hover:bg-zinc-600 text-white border-zinc-600 h-9">
                <ArrowRight className="mr-2 h-4 w-4" /> Seta
              </Button>
              <Button variant="secondary" size="sm" onClick={addCircle} className="bg-zinc-700 hover:bg-zinc-600 text-white border-zinc-600 h-9">
                <CircleIcon className="mr-2 h-4 w-4" /> Círculo
              </Button>
              <Button variant="secondary" size="sm" onClick={addText} className="bg-zinc-700 hover:bg-zinc-600 text-white border-zinc-600 h-9">
                <Type className="mr-2 h-4 w-4" /> Texto
              </Button>
              <Button variant="destructive" size="sm" onClick={deleteSelected} className="bg-red-900/50 hover:bg-red-900 text-red-200 border-red-900 h-9">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="text-zinc-300 hover:text-white hover:bg-zinc-700">Cancelar</Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-semibold">
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}