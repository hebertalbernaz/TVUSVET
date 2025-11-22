import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Settings, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/services/database';
import { PatientCard } from '@/components/PatientCard';
import { PatientForm } from '@/components/PatientForm';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const allPatients = await db.getPatients();
      setPatients(allPatients);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.owner_name && p.owner_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 🔴 CORREÇÃO: Agora a função é async para esperar os dados
  const exportBackup = async () => {
    try {
      // 🔴 CORREÇÃO: await garante que pegamos os dados, não a Promise
      const backup = await db.exportBackup(); 
      
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tvusvet_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup exportado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao exportar backup');
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      <div className="container mx-auto p-6">
        <img 
          src="logo-tvusvet.png" 
          alt="TVUSVET Multi Laudos" 
          className="max-w-[300px] mx-auto mb-8"
        />
        <div className="flex justify-between items-center mb-8">
          <div></div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Button
              onClick={exportBackup}
              variant="outline"
              data-testid="export-backup-button"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Backup
            </Button>
            <Button
              onClick={() => navigate('/settings')}
              variant="outline"
              data-testid="settings-button"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
            <Button
              onClick={() => {setEditingPatient(null); setShowNewPatient(true);}}
              data-testid="new-patient-button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(patient => (
            <PatientCard key={patient.id} patient={patient} onUpdate={loadPatients} />
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500">
              {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado. Clique em "Novo Paciente" para começar!'}
            </p>
          </Card>
        )}
      </div>

      <Dialog open={showNewPatient} onOpenChange={setShowNewPatient}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPatient ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
            <DialogDescription>
              {editingPatient ? 'Atualize os dados do paciente' : 'Cadastre um novo paciente no sistema'}
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