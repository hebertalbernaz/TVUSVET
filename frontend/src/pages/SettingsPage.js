import React, { useState, useEffect, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState('profiles'); // 🟢 Padrão agora é Perfis
  const navigate = useNavigate();
  
  const fileInputRef = useRef(null);

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

  const importBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const success = await db.importBackup(e.target.result);
        if (success) {
          toast.success('Backup importado com sucesso!');
          await loadAllData();
        } else {
          toast.error('Erro ao importar: Formato inválido');
        }
      } catch (error) {
        console.error(error);
        toast.error('Erro ao ler arquivo de backup');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
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
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importBackup}
              className="hidden"
            />
            
            <Button 
              onClick={() => fileInputRef.current.click()} 
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar Backup (JSON)
            </Button>

            <Button onClick={() => navigate('/')} variant="ghost">
              <X className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* 🟢 LIMPEZA: Removidas as abas Clinic e Letterhead. Grid ajustado para 4 colunas. */}
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profiles">Perfis (Empresas)</TabsTrigger>
            <TabsTrigger value="backup">Backup Seguro</TabsTrigger>
            <TabsTrigger value="templates">Textos Padrão</TabsTrigger>
            <TabsTrigger value="references">Valores de Ref.</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
             {/* Quando o perfil muda, recarregamos os dados globais */}
             <ProfilesManager onProfileChanged={loadAllData} />
          </TabsContent>

          <TabsContent value="backup">
            <BackupSettings settings={settings} onSave={saveSettings} onImportSuccess={loadAllData} />
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

// --- SUB-COMPONENTES ---

function BackupSettings({ settings, onSave, onImportSuccess }) {
  const [useSavedPassphrase, setUseSavedPassphrase] = useState(!!settings.saved_backup_passphrase);
  const [passphrase, setPassphrase] = useState('');

  const handleExport = async () => {
    try {
      const { encryptBackup } = await import('@/services/cryptoBackup');
      const json = await db.exportBackup();
      const finalPass = useSavedPassphrase && settings.saved_backup_passphrase ? settings.saved_backup_passphrase : passphrase;
      if (!finalPass) {
        alert('Defina uma senha para criptografar o backup ou salve uma senha nas configurações.');
        return;
      }
      const enc = await encryptBackup(json, finalPass);
      const blob = new Blob([enc], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tvusvet_backup_${new Date().toISOString().split('T')[0]}.tvusvet.enc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup criptografado exportado!');
    } catch (error) {
      toast.error('Erro ao exportar backup');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const { decryptBackup } = await import('@/services/cryptoBackup');
        const enc = e.target.result;
        const finalPass = useSavedPassphrase && settings.saved_backup_passphrase ? settings.saved_backup_passphrase : passphrase;
        if (!finalPass) {
          alert('Informe a senha para importar o backup.');
          return;
        }
        const json = await decryptBackup(enc, finalPass);
        const ok = await db.importBackup(json);
        if (ok) {
          toast.success('Backup importado com sucesso!');
          if (onImportSuccess) onImportSuccess();
        } else {
          toast.error('Falha ao importar backup');
        }
      } catch (err) {
        toast.error('Senha incorreta ou arquivo inválido');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const savePassphrase = async () => {
    try {
      await onSave({ ...settings, saved_backup_passphrase: passphrase || settings.saved_backup_passphrase });
      setUseSavedPassphrase(true);
      setPassphrase('');
      toast.success('Senha salva para backups');
    } catch (e) {
      toast.error('Erro ao salvar senha');
    }
  };

  const clearPassphrase = async () => {
    try {
      await onSave({ ...settings, saved_backup_passphrase: null });
      setUseSavedPassphrase(false);
      toast.success('Senha removida');
    } catch (e) {
      toast.error('Erro ao remover senha');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup Seguro (.enc)</CardTitle>
        <CardDescription>Exporte e importe backups criptografados com senha</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Senha de Backup</Label>
          <div className="flex gap-2">
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder={useSavedPassphrase ? 'Usando senha salva' : 'Digite uma senha segura'}
              className="border rounded px-3 py-2 flex-1"
            />
            <Button onClick={savePassphrase} variant="outline">Salvar Senha</Button>
            {useSavedPassphrase && (
              <Button onClick={clearPassphrase} variant="outline" className="text-red-600">Remover</Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="use-saved" checked={useSavedPassphrase} onChange={(e) => setUseSavedPassphrase(e.target.checked)} />
            <Label htmlFor="use-saved">Usar senha salva</Label>
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <Button onClick={handleExport}>
            <Upload className="mr-2 h-4 w-4" /> Exportar Backup Criptografado
          </Button>
          <label>
            <input type="file" accept=".enc,.tvusvet.enc" onChange={handleImport} className="hidden" />
            <Button as="span" variant="outline">Importar Backup Criptografado</Button>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}