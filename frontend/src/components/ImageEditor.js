import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Arrow, Circle, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Circle as CircleIcon, Type, ArrowRight, Save, Trash2, X, MousePointer2, RotateCcw, Undo } from 'lucide-react';

// Componente de Imagem de Fundo (Ajuste automático)
const URLImage = ({ src, stageWidth, stageHeight }) => {
  // Detecta se é base64 para não usar crossOrigin desnecessário
  const isBase64 = src.startsWith('data:');
  const [image] = useImage(src, isBase64 ? undefined : 'anonymous');

  if (!image) return null;

  const scale = Math.min(stageWidth / image.width, stageHeight / image.height);
  const x = (stageWidth - image.width * scale) / 2;
  const y = (stageHeight - image.height * scale) / 2;

  return (
    <KonvaImage
      image={image}
      x={x}
      y={y}
      scaleX={scale}
      scaleY={scale}
      listening={false} // Fundo não clicável
    />
  );
};

export function ImageEditor({ imageUrl, isOpen, onClose, onSave }) {
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [color, setColor] = useState('#ff0000');
  const [tool, setTool] = useState('select'); // select, arrow, circle, text
  const [annotations, setAnnotations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  
  // Estado para desenho em andamento
  const isDrawing = useRef(false);
  const currentShapeId = useRef(null);

  // Limpa seleção ao trocar de ferramenta
  useEffect(() => {
    if (tool !== 'select') {
      setSelectedId(null);
    }
  }, [tool]);

  // Atualiza o Transformer (caixa de seleção) quando muda o objeto selecionado
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const node = stageRef.current.findOne('#' + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  // --- LÓGICA DE DESENHO (ARRASTAR) ---

  const handleMouseDown = (e) => {
    // Se clicou no vazio para deselecionar
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) setSelectedId(null);

    if (tool === 'select') return;

    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    const id = Date.now().toString();
    currentShapeId.current = id;

    let newShape;

    if (tool === 'arrow') {
      newShape = {
        id,
        type: 'arrow',
        points: [pos.x, pos.y, pos.x, pos.y], // Começa sem tamanho
        color: color,
        strokeWidth: 5
      };
    } else if (tool === 'circle') {
      newShape = {
        id,
        type: 'circle',
        x: pos.x,
        y: pos.y,
        radius: 0, // Começa zerado
        color: color,
        strokeWidth: 5
      };
    } else if (tool === 'text') {
      isDrawing.current = false; // Texto não arrasta
      const userText = prompt("Digite o texto:", "Cisto");
      if (!userText) return;
      
      setAnnotations(prev => [...prev, {
        id,
        type: 'text',
        x: pos.x,
        y: pos.y,
        text: userText,
        color: color,
        fontSize: 30
      }]);
      setTool('select'); // Volta pra seleção após criar
      return;
    }

    if (newShape) {
      setAnnotations(prev => [...prev, newShape]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || tool === 'select') return;
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    
    setAnnotations(prev => prev.map(shape => {
      if (shape.id === currentShapeId.current) {
        if (shape.type === 'arrow') {
          // Atualiza ponta da seta
          return { ...shape, points: [shape.points[0], shape.points[1], pos.x, pos.y] };
        }
        if (shape.type === 'circle') {
          // Calcula raio baseado na distância (Pitagoras)
          const dx = pos.x - shape.x;
          const dy = pos.y - shape.y;
          const radius = Math.sqrt(dx*dx + dy*dy);
          return { ...shape, radius };
        }
      }
      return shape;
    }));
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // --- AÇÕES ---

  const handleDelete = () => {
    if (selectedId) {
      setAnnotations(annotations.filter(a => a.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleUndo = () => {
    setAnnotations(annotations.slice(0, -1));
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja limpar todas as edições?')) {
        setAnnotations([]);
        setSelectedId(null);
    }
  };

  const handleSave = () => {
    if (!stageRef.current) return;
    setSelectedId(null); // Remove seleção para não sair no print
    
    // Pequeno delay para renderizar sem a caixa de seleção
    setTimeout(() => {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
        onSave(dataUrl);
    }, 50);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[850px] p-0 border-zinc-800 bg-zinc-900 text-white gap-0 outline-none [&>button]:hidden">
        
        <div className="p-3 px-4 border-b border-zinc-700 bg-zinc-800 flex justify-between items-center rounded-t-lg">
          <DialogTitle className="text-white font-medium">Editor de Imagem</DialogTitle>
          <Button variant="ghost" onClick={onClose} size="sm" className="text-zinc-400 hover:text-white"><X className="h-5 w-5"/></Button>
        </div>
        
        <div className="flex justify-center items-center bg-black overflow-hidden cursor-crosshair">
          <Stage
            width={800}
            height={600}
            ref={stageRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown} // Suporte a touch
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            <Layer>
              {imageUrl && <URLImage src={imageUrl} stageWidth={800} stageHeight={600} />}
              
              {annotations.map((shape) => {
                const isSelected = shape.id === selectedId;
                if (shape.type === 'arrow') {
                  return (
                    <Arrow
                      key={shape.id}
                      id={shape.id}
                      points={shape.points}
                      stroke={shape.color}
                      strokeWidth={shape.strokeWidth}
                      fill={shape.color}
                      draggable={tool === 'select'}
                      onClick={() => tool === 'select' && setSelectedId(shape.id)}
                      onTap={() => tool === 'select' && setSelectedId(shape.id)}
                    />
                  );
                }
                if (shape.type === 'circle') {
                  return (
                    <Circle
                      key={shape.id}
                      id={shape.id}
                      x={shape.x}
                      y={shape.y}
                      radius={shape.radius}
                      stroke={shape.color}
                      strokeWidth={shape.strokeWidth}
                      draggable={tool === 'select'}
                      onClick={() => tool === 'select' && setSelectedId(shape.id)}
                      onTap={() => tool === 'select' && setSelectedId(shape.id)}
                    />
                  );
                }
                if (shape.type === 'text') {
                  return (
                    <Text
                      key={shape.id}
                      id={shape.id}
                      x={shape.x}
                      y={shape.y}
                      text={shape.text}
                      fontSize={shape.fontSize}
                      fill={shape.color}
                      fontStyle="bold"
                      draggable={tool === 'select'}
                      onClick={() => tool === 'select' && setSelectedId(shape.id)}
                      onTap={() => tool === 'select' && setSelectedId(shape.id)}
                    />
                  );
                }
                return null;
              })}

              {/* Transformer (Caixa de redimensionar/rodar) */}
              {selectedId && (
                 <Transformer 
                    ref={transformerRef} 
                    boundBoxFunc={(oldBox, newBox) => {
                        // Limita tamanho mínimo
                        if (newBox.width < 5 || newBox.height < 5) return oldBox;
                        return newBox;
                    }}
                 />
              )}
            </Layer>
          </Stage>
        </div>

        <div className="p-3 bg-zinc-800 border-t border-zinc-700 flex justify-between items-center rounded-b-lg">
          <div className="flex gap-4 items-center">
            {/* Cores */}
            <div className="flex gap-2 border-r border-zinc-600 pr-4">
              {['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ffffff'].map(c => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    // Se tiver algo selecionado, muda a cor dele
                    if(selectedId) {
                        setAnnotations(prev => prev.map(a => a.id === selectedId ? {...a, color: c} : a));
                    }
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-125' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Ferramentas */}
            <div className="flex gap-2">
              <Button 
                variant={tool === 'select' ? "default" : "secondary"} size="sm" 
                onClick={() => setTool('select')}
                className={tool === 'select' ? "bg-blue-600 text-white" : "bg-zinc-700 text-white border-zinc-600"}
              >
                <MousePointer2 className="mr-2 h-4 w-4" /> Mover
              </Button>

              <Button 
                variant={tool === 'arrow' ? "default" : "secondary"} size="sm" 
                onClick={() => setTool('arrow')}
                className={tool === 'arrow' ? "bg-blue-600 text-white" : "bg-zinc-700 text-white border-zinc-600"}
              >
                <ArrowRight className="mr-2 h-4 w-4" /> Seta
              </Button>
              
              <Button 
                variant={tool === 'circle' ? "default" : "secondary"} size="sm" 
                onClick={() => setTool('circle')}
                className={tool === 'circle' ? "bg-blue-600 text-white" : "bg-zinc-700 text-white border-zinc-600"}
              >
                <CircleIcon className="mr-2 h-4 w-4" /> Círculo
              </Button>
              
              <Button variant="secondary" size="sm" onClick={() => setTool('text')} className={tool === 'text' ? "bg-blue-600 text-white" : "bg-zinc-700 text-white border-zinc-600"}>
                <Type className="mr-2 h-4 w-4" /> Texto
              </Button>

              <div className="w-[1px] h-8 bg-zinc-600 mx-1"></div>

              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={!selectedId} title="Apagar Selecionado" className="bg-red-900/50 hover:bg-red-900 text-red-200 border-red-900">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleUndo} title="Desfazer" className="text-zinc-400 hover:text-white">
                <Undo className="h-4 w-4" />
              </Button>
              
              {/* BOTÃO RESET */}
              <Button variant="ghost" size="sm" onClick={handleReset} title="Resetar Tudo" className="text-yellow-500 hover:text-yellow-300 hover:bg-yellow-900/20">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="text-zinc-300 hover:text-white">Cancelar</Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold">Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}