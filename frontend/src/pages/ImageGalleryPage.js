import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '@/services/database';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, ZoomIn, Download, FileDigit } from 'lucide-react';
import { DicomViewer } from '@/components/DicomViewer';
import { dataURItoBlob } from '@/lib/utils';

export default function ImageGalleryPage() {
  const { examId } = useParams();
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    const loadImages = async () => {
      const exam = await db.getExam(examId);
      if (exam) {
        setImages(exam.images || []);
        const patient = await db.getPatient(exam.patient_id);
        if (patient) setPatientName(patient.name);
      }
    };
    loadImages();
  }, [examId]);

  const isDicom = (img) => img.mimeType === 'application/dicom' || img.filename.toLowerCase().endsWith('.dcm');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-foreground">Galeria de Imagens</h1>
            <p className="text-muted-foreground">Paciente: {patientName} • {images.length} arquivos</p>
        </div>
        <Button variant="outline" onClick={() => window.close()}>Fechar Galeria</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img) => (
          <Card 
            key={img.id} 
            className="group relative aspect-square overflow-hidden cursor-pointer border-muted hover:ring-2 hover:ring-primary/50 transition-all bg-muted/10"
            onClick={() => setSelectedImage(img)}
          >
            {isDicom(img) ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-card text-muted-foreground group-hover:text-primary transition-colors">
                    <FileDigit className="h-12 w-12 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-wider">DICOM</span>
                </div>
            ) : (
                <img src={img.data} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            )}
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="secondary" className="rounded-full h-10 w-10">
                    <ZoomIn className="h-5 w-5" />
                </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] h-[90vh] p-0 bg-black border-none flex flex-col">
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                <Button 
                    size="icon" 
                    variant="destructive" 
                    className="rounded-full opacity-80 hover:opacity-100"
                    onClick={() => setSelectedImage(null)}
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>
            
            <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
                {selectedImage && (
                    isDicom(selectedImage) ? (
                        <DicomViewer imageBlob={dataURItoBlob(selectedImage.data)} />
                    ) : (
                        <img 
                            src={selectedImage.data} 
                            alt="Zoom" 
                            className="max-w-full max-h-full object-contain" 
                        />
                    )
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}