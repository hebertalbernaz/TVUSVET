import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/services/database';
import { TemplatesManager } from '@/components/TemplatesManager';
import { ReferenceValuesManager } from '@/components/ReferenceValuesManager';
import { ProfilesManager } from '@/components/ProfilesManager';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [referenceValues, setReferenceValues] = useState([]);
  const [activeTab, setActiveTab] = useState('profiles');
  const navigate = useNavigate();
  
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await loadSettings();
    await loadTemplates();
    await loadReferenceValues();
  };

  const loadSettings = async () => {
    const s = await db.getSettings();
    setSettings(s);
  };

  const loadTemplates = async () => {
    const t = await db.getTemplates();
    setTemplates(t);
  };

  const loadReferenceValues = async () => {
    const rv = await db.getReferenceValues();
    setReferenceValues(rv);
  };
  
  const saveSettings = async (data) => {
    try {
      await db.updateSettings(data);
      toast.success('Configurações salvas!');
      loadSettings();
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  if (!settings) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="settings-page">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Configurações
          </h1>
          <div className="flex gap-2 items-center">
            <ThemeToggle />
            
            {/* 🔴 REMOVIDO: Input e Botão de Importar Backup duplicados */}

            <Button onClick={() => navigate('/')} variant="ghost">
              <X className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profiles">Perfis (Empresas)</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="templates">Textos Padrão</TabsTrigger>
            <TabsTrigger value="references">Valores de Ref.</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
             <ProfilesManager onProfileChanged={loadAllData} />
          </TabsContent>

          <TabsContent value="backup">
            <BackupSettings onImportSuccess={loadAllData} />
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesManager templates={templates} onUpdate={loadTemplates} />
          </TabsContent>

          <TabsContent value="references">
            <ReferenceValuesManager values={referenceValues} onUpdate={loadReferenceValues} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES (BackupSettings simplificado conforme solicitado antes) ---

function BackupSettings({ onImportSuccess }) {
  const fileInputRef = React.useRef(null); // 🟢 1. Referência para o input

  const handleExportFull = async () => {
    try {
      const json = await db.exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      downloadFile(blob, `TVUSVET_Backup_Completo_${new Date().toISOString().split('T')[0]}.json`);
      toast.success('Backup Completo salvo!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao exportar');
    }
  };

  const handleExportBase = async () => {
      try {
          const json = await db.exportBaseData();
          const blob = new Blob([json], { type: 'application/json' });
          downloadFile(blob, `TVUSVET_Textos_Refs_${new Date().toISOString().split('T')[0]}.json`);
          
          toast.success('Arquivo gerado! Você pode salvar no Drive manualmente.');
          // window.open removido conforme solicitado
      } catch (error) { toast.error('Erro ao exportar bases'); }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target.result;
        // Tenta importar
        const ok = await db.importBackup(json);
        if (ok) {
          toast.success('Dados importados com sucesso!');
          if (onImportSuccess) onImportSuccess(); // Atualiza a tela
        } else {
          toast.error('Arquivo inválido ou corrompido');
        }
      } catch (err) { 
          console.error(err);
          toast.error('Erro ao ler arquivo'); 
      }
    };
    reader.readAsText(file);
    // Limpa o input para permitir importar o mesmo arquivo 2x se precisar
    event.target.value = ''; 
  };

  const downloadFile = (blob, filename) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Central de Backup</CardTitle>
        <CardDescription>Gerencie seus dados com segurança.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* CARD 1: Backup Completo */}
        <div className="border p-4 rounded-lg bg-muted/30 dark:bg-slate-900/50">
            <h3 className="font-bold mb-2 flex items-center gap-2">💾 Backup Completo (PC)</h3>
            <p className="text-sm text-muted-foreground mb-4">Salva tudo: Pacientes, Exames, Imagens e Configurações.</p>
            <Button onClick={handleExportFull} variant="default" className="w-full sm:w-auto">
                <Upload className="mr-2 h-4 w-4" /> Baixar Completo (.json)
            </Button>
        </div>

        {/* CARD 2: Backup Leve */}
        <div className="border p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
            <h3 className="font-bold mb-2 text-blue-700 dark:text-blue-400 flex items-center gap-2">☁️ Sincronizar Textos</h3>
            <p className="text-sm text-blue-600/80 dark:text-blue-300/70 mb-4">
                Salva apenas Textos Padrão e Referências. Arquivo leve para jogar no Drive/Email.
            </p>
            <Button onClick={handleExportBase} variant="outline" className="w-full sm:w-auto border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                <Upload className="mr-2 h-4 w-4" /> Baixar Apenas Textos
            </Button>
        </div>

        {/* ÁREA DE IMPORTAÇÃO CORRIGIDA */}
        <div className="pt-4 border-t">
            {/* Input Invisível conectado à Ref */}
            <input 
                ref={fileInputRef}
                type="file" 
                accept=".json" 
                onChange={handleImport} 
                className="hidden" 
            />
            {/* Botão que clica no input via código */}
            <Button 
                variant="secondary" 
                className="w-full border-dashed border-2 hover:bg-accent"
                onClick={() => fileInputRef.current.click()} // 🟢 2. Ação direta de clique
            >
                <Upload className="mr-2 h-4 w-4" />
                Clique aqui para Restaurar um Backup (Importar)
            </Button>
        </div>

      </CardContent>
    </Card>
  );
}