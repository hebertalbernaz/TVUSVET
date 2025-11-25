import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '@/services/database';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, Maximize2 } from 'lucide-react';

export default function ImageGalleryPage() {
  const { examId } = useParams();
  const [images, setImages] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // Para zoom total

  const loadImages = async () => {
    if (!examId) return;
    const exam = await db.getExam(examId);
    if (exam) {
      setImages(exam.images || []);
      const patient = await db.getPatient(exam.patient_id);
      setPatientName(patient?.name || 'Paciente');
    }
  };

  useEffect(() => {
    loadImages();
    // Opcional: Auto-atualizar a cada 5 segundos para pegar novas fotos salvas na tela principal
    const interval = setInterval(loadImages, 5000);
    return () => clearInterval(interval);
  }, [examId]);

  return (
    <div className="min-h-screen bg-black text-zinc-300 flex flex-col">
      
      {/* Header Flutuante */}
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Maximize2 className="h-5 w-5 text-blue-400"/> Galeria de Imagens
          </h1>
          <p className="text-xs text-zinc-400">{patientName} • {images.length} imagens</p>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={loadImages} className="gap-2">
                <RefreshCw className="h-4 w-4"/> Atualizar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => window.close()}>
                <X className="h-4 w-4"/> Fechar
            </Button>
        </div>
      </div>

      {/* Grid de Imagens */}
      <div className="flex-1 p-4 overflow-y-auto">
        {images.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
                Aguardando imagens...
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                    <div 
                        key={img.id || idx} 
                        className="group relative aspect-[4/3] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-blue-500 transition-all cursor-zoom-in"
                        onClick={() => setSelectedImage(img)}
                    >
                        <img 
                            src={img.data} 
                            className="w-full h-full object-contain" 
                            alt={`Img ${idx}`}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[10px] text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {img.filename}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Modal de Zoom Total */}
      {selectedImage && (
        <div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
        >
            <img 
                src={selectedImage.data} 
                className="max-w-full max-h-full object-contain shadow-2xl shadow-black"
            />
            <div className="absolute top-4 right-4 text-white/50 text-sm">
                Pressione ESC ou clique para fechar
            </div>
        </div>
      )}
    </div>
  );
}