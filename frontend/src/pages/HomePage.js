import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Settings, Plus, Users, LayoutGrid } from 'lucide-react';
import { db } from '@/services/database';
import { PatientCard } from '@/components/PatientCard';
import { PatientForm } from '@/components/PatientForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ProfileSelector } from '@/components/ProfileSelector';
import logoImg from '../logo-tvusvet.png';

export default function HomePage() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadPatients(); }, []);

  const loadPatients = async () => {
    try {
      const allPatients = await db.getPatients();
      setPatients(allPatients);
    } catch (error) { console.error(error); }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.owner_name && p.owner_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 relative overflow-hidden" data-testid="home-page">
      
      {/* 1. MARCA D'ÁGUA NO FUNDO (Fixa e Transparente) */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] dark:opacity-[0.05]">
          <img src={logoImg} alt="" className="w-[80%] max-w-[600px] grayscale" />
      </div>

      {/* CONTEÚDO PRINCIPAL (Fica acima da marca d'água) */}
      <div className="relative z-10 container mx-auto max-w-7xl p-6">
        
        {/* CABEÇALHO ALINHADO */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            {/* Título/Identidade Esquerda */}
            <div className="flex items-center gap-3 self-start md:self-auto">
               <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <LayoutGrid className="h-6 w-6" />
               </div>
               <div>
                  <h1 className="text-xl font-bold tracking-tight leading-none text-foreground">TVUSVET</h1>
                  <p className="text-xs text-muted-foreground font-medium">Sistema de Laudos</p>
               </div>
            </div>

            {/* Controles Direita (Alinhados) */}
            <div className="flex items-center gap-2 bg-card p-1.5 rounded-lg border shadow-sm w-full md:w-auto justify-between md:justify-end">
                <ProfileSelector onProfileChange={() => window.location.reload()} />
                <div className="h-6 w-px bg-border mx-1"></div>
                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <Button 
                        onClick={() => navigate('/settings')} 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        title="Configurações"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>

        {/* ÁREA DE BUSCA E AÇÃO */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-stretch">
            {/* Barra de Busca Grande */}
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Buscar paciente, tutor ou raça..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-lg shadow-sm border-muted bg-card/80 backdrop-blur-sm hover:bg-card focus-visible:ring-primary/30 transition-all"
                />
            </div>
            
            {/* Botão Novo Paciente (Destaque) */}
            <Button 
                onClick={() => {setEditingPatient(null); setShowNewPatient(true);}} 
                size="lg" 
                className="h-12 px-8 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
                <Plus className="mr-2 h-5 w-5" /> Novo Paciente
            </Button>
        </div>

        {/* LISTA DE PACIENTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-10">
          {filteredPatients.map(patient => (
            <PatientCard key={patient.id} patient={patient} onUpdate={loadPatients} />
          ))}
        </div>

        {/* ESTADO VAZIO (Centralizado) */}
        {filteredPatients.length === 0 && (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-muted bg-card/50 mt-8 backdrop-blur-sm">
            <div className="bg-muted p-4 rounded-full mb-4">
                <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
                {searchTerm ? 'Nenhum paciente encontrado' : 'Lista de pacientes vazia'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                {searchTerm ? 'Verifique a grafia ou tente outro termo.' : 'Comece cadastrando seu primeiro paciente.'}
            </p>
            {!searchTerm && (
                <Button onClick={() => setShowNewPatient(true)} variant="outline" className="mt-4 border-primary/20 text-primary hover:bg-primary/5">
                    Cadastrar Agora
                </Button>
            )}
          </Card>
        )}
      </div>

      {/* DIALOGO (MODAL) DE PACIENTE */}
      <Dialog open={showNewPatient} onOpenChange={setShowNewPatient}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary font-bold">
                {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados clínicos e cadastrais abaixo.
            </DialogDescription>
          </DialogHeader>
          <PatientForm 
            patient={editingPatient}
            onSuccess={() => { setShowNewPatient(false); setEditingPatient(null); loadPatients(); }} 
            onCancel={() => { setShowNewPatient(false); setEditingPatient(null); }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}