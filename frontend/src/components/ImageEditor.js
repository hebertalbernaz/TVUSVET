import React, { useEffect, useRef, useState } from 'react';
// CORREÇÃO 1: Importar classes específicas do 'fabric'
import { Canvas, FabricImage, Path, Circle, IText } from 'fabric';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// CORREÇÃO 2: Renomear ícone Circle para evitar conflito
import { Circle as CircleIcon, Type, ArrowRight, Save, Trash2 } from 'lucide-react';

export function ImageEditor({ imageUrl, isOpen, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [color, setColor] = useState('#ff0000'); // Vermelho padrão

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    // CORREÇÃO 3: Inicialização sem 'fabric.'
    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#000',
    });

    setFabricCanvas(canvas);

    // CORREÇÃO 4: FabricImage.fromURL agora retorna uma Promise (usar .then)
    FabricImage.fromURL(imageUrl).then((img) => {
      // Ajustar imagem para caber no canvas mantendo proporção
      const scale = Math.min(
        800 / img.width,
        600 / img.height
      );
      
      img.set({
        scaleX: scale,
        scaleY: scale,
        originX: 'center',
        originY: 'center',
        left: 400,
        top: 300,
        selectable: false, // Imagem de fundo não deve ser movida
        evented: false
      });
      
      canvas.add(img);
      canvas.sendObjectToBack(img); // Garante que fique atrás dos desenhos
      canvas.renderAll();
    }).catch(err => {
      console.error("Erro ao carregar imagem:", err);
    });

    return () => {
      canvas.dispose();
    };
  }, [isOpen, imageUrl]);

  // --- FERRAMENTAS ---

  const addArrow = () => {
    if (!fabricCanvas) return;
    const arrowPath = 'M 0 0 L 100 0 M 80 -10 L 100 0 L 80 10';
    // CORREÇÃO: new Path
    const arrow = new Path(arrowPath, {
      stroke: color,
      strokeWidth: 3,
      fill: 'transparent',
      left: 350,
      top: 250,
      originX: 'center',
      originY: 'center',
      scaleX: 2,
      scaleY: 2
    });
    fabricCanvas.add(arrow);
    fabricCanvas.setActiveObject(arrow);
  };

  const addCircle = () => {
    if (!fabricCanvas) return;
    // CORREÇÃO: new Circle
    const circle = new Circle({
      radius: 50,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 3,
      left: 350,
      top: 250
    });
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
  };

  const addText = () => {
    if (!fabricCanvas) return;
    // CORREÇÃO: new IText
    const text = new IText('Texto', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: color,
      left: 350,
      top: 250
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    text.enterEditing();
  };

  const deleteSelected = () => {
    const activeObjects = fabricCanvas?.getActiveObjects();
    if (activeObjects?.length) {
      fabricCanvas.discardActiveObject();
      activeObjects.forEach((obj) => {
        fabricCanvas.remove(obj);
      });
      fabricCanvas.requestRenderAll();
    }
  };

  const handleSave = () => {
    if (!fabricCanvas) return;
    // Exporta a imagem editada
    const dataUrl = fabricCanvas.toDataURL({
      format: 'jpeg',
      quality: 0.9,
      multiplier: 1
    });
    onSave(dataUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 border-none bg-transparent shadow-none">
        {/* Header Flutuante */}
        <div className="bg-white p-4 rounded-t-lg flex justify-between items-center">
          <DialogTitle>Editor de Imagem</DialogTitle>
          <Button variant="ghost" onClick={onClose} size="sm">✕</Button>
        </div>
        
        {/* Área do Canvas Centralizada */}
        <div className="flex-1 bg-black/90 flex items-center justify-center overflow-hidden relative">
          <canvas ref={canvasRef} />
        </div>

        {/* Barra de Ferramentas */}
        <div className="p-4 bg-white rounded-b-lg flex justify-between items-center">
          <div className="flex gap-4 items-center">
            {/* Seletor de Cor */}
            <div className="flex gap-1 border-r pr-4">
              {['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ffffff'].map(c => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    // Atualiza cor do objeto selecionado se houver
                    const active = fabricCanvas?.getActiveObject();
                    if (active) {
                      if (active.type === 'i-text') active.set('fill', c);
                      else active.set('stroke', c);
                      fabricCanvas.requestRenderAll();
                    }
                  }}
                  className={`w-6 h-6 rounded-full border ${color === c ? 'ring-2 ring-black' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <Button variant="outline" onClick={addArrow} title="Seta">
              <ArrowRight className="mr-2 h-4 w-4" /> Seta
            </Button>
            <Button variant="outline" onClick={addCircle} title="Círculo">
              <CircleIcon className="mr-2 h-4 w-4" /> Círculo
            </Button>
            <Button variant="outline" onClick={addText} title="Texto">
              <Type className="mr-2 h-4 w-4" /> Texto
            </Button>
            <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={deleteSelected} title="Apagar">
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Salvar Edição
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}