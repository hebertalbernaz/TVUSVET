import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload, Save, FileText, Database, Shield, UserCog, Download } from 'lucide-react';
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
  
  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    await loadSettings();
    await loadTemplates();
    await loadReferenceValues();
  };

  const loadSettings = async () => { const s = await db.getSettings(); setSettings(s); };
  const loadTemplates = async () => { const t = await db.getTemplates(); setTemplates(t); };
  const loadReferenceValues = async () => { const rv = await db.getReferenceValues(); setReferenceValues(rv); };
  
  if (!settings) return <div className="flex h-screen items-center justify-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300" data-testid="settings-page">
      <div className="container mx-auto max-w-6xl p-6">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Configurações</h1>
            <p className="text-muted-foreground text-sm">Gerencie perfis, textos e segurança do sistema.</p>
          </div>
          
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Button onClick={() => navigate('/')} variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" /> Voltar
            </Button>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="profiles" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <UserCog className="h-4 w-4" /> Perfis (Empresas)
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <FileText className="h-4 w-4" /> Textos Padrão
            </TabsTrigger>
            <TabsTrigger value="references" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <Database className="h-4 w-4" /> Valores Ref.
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <Shield className="h-4 w-4" /> Backup
            </TabsTrigger>
          </TabsList>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          </div>
        </Tabs>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE DE BACKUP INTEGRADO ---
function BackupSettings({ onImportSuccess }) {
  const fileInputRef = useRef(null);

  const handleExportFull = async () => {
    try {
      const json = await db.exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      downloadFile(blob, `TVUSVET_Backup_Completo_${new Date().toISOString().split('T')[0]}.json`);
      toast.success('Backup Completo salvo!');
    } catch (error) { console.error(error); toast.error('Erro ao exportar'); }
  };

  const handleExportBase = async () => {
      try {
          const json = await db.exportBaseData();
          const blob = new Blob([json], { type: 'application/json' });
          downloadFile(blob, `TVUSVET_Textos_Refs_${new Date().toISOString().split('T')[0]}.json`);
          toast.success('Arquivo gerado! Salve onde preferir (Drive/Email).');
      } catch (error) { toast.error('Erro ao exportar bases'); }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const ok = await db.importBackup(e.target.result);
        if (ok) {
          toast.success('Dados importados com sucesso!');
          if (onImportSuccess) onImportSuccess();
        } else { toast.error('Arquivo inválido'); }
      } catch (err) { toast.error('Erro ao ler arquivo'); }
    };
    reader.readAsText(file);
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
    <Card className="border-l-4 border-l-primary/50">
      <CardHeader>
        <CardTitle>Central de Backup</CardTitle>
        <CardDescription>Mantenha seus dados seguros e sincronizados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
            {/* Opção 1: Backup Completo */}
            <div className="border p-5 rounded-lg bg-card hover:bg-accent/5 transition-colors border-border/60 shadow-sm">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-foreground"><Save className="h-4 w-4 text-primary"/> Backup Completo (PC)</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Salva tudo: Pacientes, Exames, Imagens e Configurações. Ideal para segurança local.</p>
                <Button onClick={handleExportFull} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Download className="mr-2 h-4 w-4" /> Baixar Completo
                </Button>
            </div>

            {/* Opção 2: Backup Leve */}
            <div className="border p-5 rounded-lg bg-card hover:bg-accent/5 transition-colors border-border/60 shadow-sm">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-foreground"><Upload className="h-4 w-4 text-blue-500"/> Sincronizar Textos</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Salva apenas Textos Padrão e Referências. Arquivo leve para enviar por email ou Drive.</p>
                <Button onClick={handleExportBase} variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5">
                    <Download className="mr-2 h-4 w-4" /> Baixar Apenas Textos
                </Button>
            </div>
        </div>

        <div className="pt-6 border-t border-border">
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            <Button variant="secondary" className="w-full border-dashed border-2 border-muted-foreground/20 hover:border-primary/50 h-12 bg-muted/30" onClick={() => fileInputRef.current.click()}>
                <Database className="mr-2 h-4 w-4" /> Clique aqui para Restaurar um Backup (Importar)
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}