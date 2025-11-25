import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/services/database';
import { Calendar, FileText, ImageIcon } from 'lucide-react';
import { getExamTypeName } from '@/lib/exam_types';

export default function PatientHistoryPage() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!patientId) return;
      
      const p = await db.getPatient(patientId);
      setPatient(p);

      const e = await db.getExams(patientId);
      // Ordena do mais recente para o mais antigo
      e.sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));
      setExams(e);
    };
    loadData();
  }, [patientId]);

  // --- FORMATADORES PARA PORTUGUÊS ---
  const formatSpecies = (s) => {
      if (!s) return '';
      const map = { 'dog': 'Canino', 'cat': 'Felino', 'other': 'Outro' };
      return map[s] || s; // Retorna mapeado ou o original se não achar
  };

  const formatSex = (s) => {
      if (!s) return '';
      const map = { 'male': 'Macho', 'female': 'Fêmea' };
      return map[s] || s;
  };

  const formatExamType = (type) => {
      // Usa a função do lib/exam_types ou fallback manual
      try {
          return getExamTypeName(type);
      } catch (e) {
          const map = { 
              'ultrasound_abd': 'Ultrassom Abdominal',
              'echocardiogram': 'Ecocardiograma',
              'ecg': 'Eletrocardiograma',
              'radiography': 'Radiografia',
              'tomography': 'Tomografia'
          };
          return map[type] || type;
      }
  };

  if (!patient) return <div className="p-8 text-center text-muted-foreground">Carregando histórico...</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Cabeçalho Fixo */}
      <div className="mb-6 border-b pb-4 sticky top-0 bg-background z-10 pt-2 shadow-sm -mx-6 px-6">
        <h1 className="text-2xl font-bold text-primary mb-2">Histórico Clínico</h1>
        <div className="text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 p-3 rounded-lg">
            <div>
                <span className="font-bold block text-foreground">Paciente</span>
                {patient.name}
            </div>
            <div>
                <span className="font-bold block text-foreground">Detalhes</span>
                {formatSpecies(patient.species)} • {formatSex(patient.sex)} • {patient.breed}
            </div>
            <div>
                <span className="font-bold block text-foreground">Tutor</span>
                {patient.owner_name}
            </div>
             {/* Espaço extra se precisar */}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)] pr-4">
        <div className="space-y-6 pb-10">
          {exams.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg bg-muted/10">
                <p className="text-muted-foreground">Nenhum exame anterior encontrado.</p>
            </div>
          ) : (
            exams.map((exam) => (
              <Card key={exam.id} className="border-l-4 border-l-primary/60 shadow-sm hover:shadow transition-all">
                <CardHeader className="pb-3 bg-muted/5 border-b">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2.5 rounded-full text-primary">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-foreground">
                                {new Date(exam.exam_date).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                                {new Date(exam.exam_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="text-xs font-semibold px-3 py-1 uppercase tracking-wide">
                        {formatExamType(exam.exam_type)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4 space-y-5">
                    {/* Laudo */}
                    <div className="space-y-4">
                        {exam.organs_data && exam.organs_data.map((organ, idx) => (
                            organ.report_text ? (
                                <div key={idx} className="text-sm group">
                                    <h4 className="font-bold text-primary mb-1 flex items-center gap-2 text-xs uppercase tracking-wider">
                                        <FileText className="h-3 w-3" /> {organ.organ_name}
                                    </h4>
                                    <div className="whitespace-pre-wrap text-foreground/80 pl-4 border-l-2 border-muted group-hover:border-primary/30 transition-colors ml-1.5 py-1 text-justify leading-relaxed">
                                        {organ.report_text}
                                    </div>
                                </div>
                            ) : null
                        ))}
                    </div>

                    {/* Galeria de Imagens */}
                    {exam.images && exam.images.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="text-xs font-bold uppercase mb-3 flex items-center gap-2 text-muted-foreground">
                                <ImageIcon className="h-3 w-3" /> Imagens Anexadas ({exam.images.length})
                            </h4>
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                {exam.images.map((img, index) => (
                                    <div 
                                        key={img.id || index} 
                                        className="aspect-video bg-black rounded-md overflow-hidden cursor-zoom-in hover:ring-2 ring-primary transition-all relative group"
                                        onClick={() => {
                                            const w = window.open("", "_blank");
                                            w.document.write(`
                                                <body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;height:100vh;">
                                                    <img src="${img.data}" style="max-width:100%;max-height:100%;object-fit:contain;box-shadow:0 0 20px rgba(0,0,0,0.5);">
                                                </body>
                                            `);
                                        }}
                                    >
                                        <img 
                                            src={img.data} 
                                            className="w-full h-full object-contain"
                                            alt={`Imagem ${index + 1}`}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-white/10 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}