import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/services/database';
import { Calendar, FileText, ImageIcon } from 'lucide-react';
import { translate } from '@/services/translation';

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

  if (!patient) return <div className="p-8 text-center">Carregando histórico...</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-primary">Histórico Clínico</h1>
        <div className="text-muted-foreground mt-1 flex gap-4">
            <span className="font-semibold text-foreground">{patient.name}</span>
            <span>• {patient.species}</span>
            <span>• {patient.breed}</span>
            <span>• {patient.owner_name}</span>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="space-y-6">
          {exams.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Nenhum exame anterior encontrado.</p>
          ) : (
            exams.map((exam) => (
              <Card key={exam.id} className="border-l-4 border-l-primary/50">
                <CardHeader className="pb-2 bg-muted/10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-bold">
                            {new Date(exam.exam_date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {new Date(exam.exam_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                    <Badge variant="outline" className="uppercase">{translate(exam.exam_type, 'pt')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    {/* Filtra apenas órgãos com texto preenchido */}
                    {exam.organs_data && exam.organs_data.map((organ, idx) => (
                        organ.report_text ? (
                            <div key={idx} className="text-sm">
                                <h4 className="font-bold text-primary/80 mb-1 flex items-center gap-2">
                                    <FileText className="h-3 w-3" /> {organ.organ_name}
                                </h4>
                                <p className="whitespace-pre-wrap text-muted-foreground pl-5 border-l-2 border-gray-100 ml-1">
                                    {organ.report_text}
                                </p>
                            </div>
                        ) : null
                    ))}

                    {/* Galeria de Imagens */}
                    {exam.images && exam.images.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="text-xs font-bold uppercase mb-2 flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" /> Imagens ({exam.images.length})
                            </h4>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {exam.images.map(img => (
                                    <img 
                                        key={img.id} 
                                        src={img.data} 
                                        className="h-24 w-auto rounded border bg-black object-contain cursor-pointer hover:scale-105 transition-transform"
                                        title={img.filename}
                                        // Clique para abrir full (opcional)
                                        onClick={() => {
                                            const w = window.open("", "_blank");
                                            w.document.write(`<img src="${img.data}" style="width:100%"/>`);
                                        }}
                                    />
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