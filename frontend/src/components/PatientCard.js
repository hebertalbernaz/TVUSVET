import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, FileText, Edit, Trash2, Dog, Cat, HelpCircle, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/services/database';
import { PatientForm } from './PatientForm';
import { getAllExamTypes, getExamTypeName } from '@/lib/exam_types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function PatientCard({ patient, onUpdate }) {
  const [exams, setExams] = useState([]);
  const [examsCount, setExamsCount] = useState(0);
  const [showExams, setShowExams] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadExamsCount(); }, [patient.id]);

  const loadExamsCount = async () => {
    try {
      const patientExams = await db.getExams(patient.id);
      setExamsCount(patientExams.length);
      setExams(patientExams);
    } catch (e) { console.error(e); }
  };

  const loadExams = async () => {
    try {
      const patientExams = await db.getExams(patient.id);
      setExams(patientExams);
      setExamsCount(patientExams.length);
      setShowExams(true);
    } catch (e) { toast.error('Erro ao carregar'); }
  };

  const createNewExam = async (examType) => {
    try {
      const newExam = await db.createExam({ patient_id: patient.id, exam_weight: patient.weight, exam_type: examType });
      toast.success('Exame criado!');
      navigate(`/exam/${newExam.id}`);
    } catch (e) { toast.error('Erro ao criar'); }
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    try {
      await db.deleteExam(examToDelete);
      toast.success('Exame excluído');
      loadExamsCount();
      loadExams();
      setExamToDelete(null);
    } catch (e) { toast.error('Erro ao excluir'); }
  };

  // Ícone dinâmico com cores do tema
  const SpeciesIcon = patient.species === 'cat' ? Cat : (patient.species === 'dog' ? Dog : HelpCircle);
  
  const iconClass = patient.species === 'dog' 
    ? 'bg-primary/10 text-primary' 
    : 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300';

  return (
    <Card className="group hover:shadow-lg hover:border-primary/40 transition-all duration-300 bg-card overflow-hidden flex flex-col h-full">
      <CardHeader className="pb-2 pt-4 px-4 flex-none">
        <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2.5 rounded-full ${iconClass} transition-colors flex-shrink-0`}>
                    <SpeciesIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <CardTitle className="text-lg font-bold leading-tight mb-1 truncate" title={patient.name}>
                        {patient.name}
                    </CardTitle>
                    <CardDescription className="text-xs font-medium opacity-80 truncate">
                        {patient.breed} • {patient.weight}kg
                    </CardDescription>
                </div>
            </div>
            <Button 
                onClick={() => setShowEditDialog(true)} 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            >
                <Edit className="h-4 w-4" />
            </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-4 flex-1 flex flex-col justify-end">
        {patient.owner_name && (
            <div className="text-xs text-muted-foreground mb-3 pl-2 border-l-2 border-muted truncate">
                Tutor: <span className="font-semibold text-foreground">{patient.owner_name}</span>
            </div>
        )}

        <div className="flex gap-2 mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex-1 h-9 text-xs shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-3 w-3" /> Novo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {getAllExamTypes().map((type) => (
                <DropdownMenuItem key={type.id} onClick={() => createNewExam(type.id)} className="cursor-pointer gap-2 py-2">
                  <span className="text-lg">{type.icon}</span> 
                  <span className="font-medium">{type.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={loadExams} variant="secondary" className="flex-1 h-9 text-xs border border-transparent hover:border-primary/20 bg-secondary/50 hover:bg-secondary">
            <FileText className="mr-2 h-3 w-3" /> Exames ({examsCount})
          </Button>
        </div>

        {/* MODAL DE LISTA DE EXAMES */}
        <Dialog open={showExams} onOpenChange={setShowExams}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-primary flex items-center gap-2">
                  <Activity className="h-5 w-5" /> 
                  Histórico: {patient.name}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              {exams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50 border-2 border-dashed rounded-lg">
                    <FileText className="h-12 w-12 mb-3 opacity-20" />
                    <p>Nenhum exame realizado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {exams.map(exam => (
                    <Card key={exam.id} className="p-3 transition-colors cursor-pointer hover:bg-accent/50 group border-border/60 hover:border-primary/30" onClick={() => navigate(`/exam/${exam.id}`)}>
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground truncate">{getExamTypeName(exam.exam_type || 'ultrasound_abd')}</span>
                            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground bg-background whitespace-nowrap">
                              {new Date(exam.exam_date).toLocaleDateString('pt-BR')}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                            {exam.organs_data?.length || 0} estruturas
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setExamToDelete(exam.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* DIALOGOS DE EDIÇÃO E EXCLUSÃO MANTIDOS */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Paciente</DialogTitle></DialogHeader>
            <PatientForm patient={patient} onSuccess={() => { setShowEditDialog(false); onUpdate(); }} onCancel={() => setShowEditDialog(false)} />
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!examToDelete} onOpenChange={() => setExamToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Exame?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteExam} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}