import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, FileText, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/services/database';
import { PatientForm } from './PatientForm';
import { getAllExamTypes, getExamTypeName } from '@/lib/exam_types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function PatientCard({ patient, onUpdate }) {
  const [exams, setExams] = useState([]);
  const [examsCount, setExamsCount] = useState(0);
  const [showExams, setShowExams] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadExamsCount();
  }, [patient.id]);

const loadExamsCount = async () => {
    try {
      const patientExams = await db.getExams(patient.id);
      setExamsCount(patientExams.length);
      setExams(patientExams);
    } catch (error) {
      console.error('Erro ao carregar contagem de exames:', error);
    }
  };

const loadExams = async () => {
    try {
      const patientExams = await db.getExams(patient.id);
      setExams(patientExams);
      setExamsCount(patientExams.length);
      setShowExams(true);
    } catch (error) {
      toast.error('Erro ao carregar exames');
    }
  };

  const createNewExam = async (examType) => {
    try {
      const newExam = await db.createExam({
        patient_id: patient.id,
        exam_weight: patient.weight,
        exam_type: examType
      });
      toast.success(`${getExamTypeName(examType)} criado!`);
      navigate(`/exam/${newExam.id}`);
    } catch (error) {
      toast.error('Erro ao criar exame');
    }
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    try {
      await db.deleteExam(examToDelete);
      toast.success('Exame deletado com sucesso');
      loadExamsCount();
      loadExams();
      setExamToDelete(null);
    } catch (error) {
      toast.error('Erro ao deletar exame');
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`patient-card-${patient.id}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{patient.name}</span>
          <div className="flex gap-2 items-center">
            <Button
              onClick={() => setShowEditDialog(true)}
              variant="ghost"
              size="sm"
              data-testid={`edit-patient-${patient.id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Badge variant={patient.species === 'dog' ? 'default' : 'secondary'}>
              {patient.species === 'dog' ? 'Cão' : 'Gato'}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          {patient.breed} • {patient.weight}kg • {patient.size === 'small' ? 'Pequeno' : patient.size === 'medium' ? 'Médio' : 'Grande'}
          {patient.owner_name && ` • Tutor: ${patient.owner_name}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="flex-1"
                data-testid={`new-exam-button-${patient.id}`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Exame
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {getAllExamTypes().map((examType) => (
                <DropdownMenuItem
                  key={examType.id}
                  onClick={() => createNewExam(examType.id)}
                  className="cursor-pointer"
                >
                  <span className="mr-2 text-lg">{examType.icon}</span>
                  <div>
                    <div className="font-medium">{examType.name}</div>
                    <div className="text-xs text-gray-500">{examType.description}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={loadExams}
            variant="outline"
            className="flex-1"
            data-testid={`view-exams-button-${patient.id}`}
          >
            <FileText className="mr-2 h-4 w-4" />
            Exames ({examsCount})
          </Button>
        </div>

        <Dialog open={showExams} onOpenChange={setShowExams}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Exames de {patient.name}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              {exams.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum exame realizado</p>
              ) : (
                <div className="space-y-3">
                  {exams.map(exam => (
                    <Card key={exam.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div 
                          className="flex-1 cursor-pointer" 
                          onClick={() => navigate(`/exam/${exam.id}`)}
                        >
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {getExamTypeName(exam.exam_type || 'ultrasound_abd')}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {new Date(exam.exam_date).toLocaleDateString('pt-BR')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {exam.organs_data?.length || 0} estruturas • {exam.images?.length || 0} imagens
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/exam/${exam.id}`)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExamToDelete(exam.id);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
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

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Paciente</DialogTitle>
              <DialogDescription>Atualize os dados do paciente</DialogDescription>
            </DialogHeader>
            <PatientForm 
              patient={patient}
              onSuccess={() => { setShowEditDialog(false); onUpdate(); }} 
              onCancel={() => setShowEditDialog(false)} 
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!examToDelete} onOpenChange={() => setExamToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar este exame? Esta ação não pode ser desfeita.
                Todas as imagens e dados do exame serão permanentemente removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteExam}
                className="bg-red-600 hover:bg-red-700"
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
