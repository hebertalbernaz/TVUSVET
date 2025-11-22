import React, { useState, useEffect, useRef } from 'react'; // Adicionado useRef
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
import { LetterheadSettings } from '@/components/LetterheadSettings';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [referenceValues, setReferenceValues] = useState([]);
  const [activeTab, setActiveTab] = useState('clinic');
  const navigate = useNavigate();
  
  // Referência para o input de arquivo (Isso resolve o problema do clique)
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
        // AQUI: O await garante que esperamos o banco gravar antes de prosseguir
        const success = await db.importBackup(e.target.result);
        
        if (success) {
          toast.success('Backup importado com sucesso!');
          await loadAllData(); // Atualiza a tela imediatamente
        } else {
          toast.error('Erro ao importar: Formato inválido');
        }
      } catch (error) {
        console.error(error);
        toast.error('Erro ao ler arquivo de backup');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Limpa para permitir importar de novo se precisar
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
            
            {/* Input escondido conectado à referência */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importBackup}
              className="hidden"
            />
            
            {/* Botão que aciona o input via código */}
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="clinic">Dados da Clínica</TabsTrigger>
            <TabsTrigger value="letterhead">Timbrado</TabsTrigger>
            <TabsTrigger value="backup">Backup Seguro</TabsTrigger>
            <TabsTrigger value="templates">Textos Padrão</TabsTrigger>
            <TabsTrigger value="references">Valores de Referência</TabsTrigger>
          </TabsList>

          <TabsContent value="clinic">
            <ClinicSettings settings={settings} onSave={saveSettings} />
          </TabsContent>

          <TabsContent value="backup">
            <BackupSettings settings={settings} onSave={saveSettings} onImportSuccess={loadAllData} />
          </TabsContent>

          <TabsContent value="letterhead">
            <LetterheadSettings settings={settings} onSave={saveSettings} />
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

// ... (O resto dos componentes ClinicSettings e BackupSettings permanecem iguais ao arquivo anterior)
// Para economizar espaço, certifique-se de manter o restante do código que já estava lá,
// ou copie do meu envio anterior se precisar de tudo completo.
function ClinicSettings({ settings, onSave }) {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Clínica</CardTitle>
        <CardDescription>Configure os dados que aparecerão no cabeçalho dos laudos</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="clinic_name">Nome da Clínica</Label>
            <Input
              id="clinic_name"
              value={formData.clinic_name || ''}
              onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
              data-testid="clinic-name-input"
            />
          </div>
          <div>
            <Label htmlFor="clinic_address">Endereço</Label>
            <Input
              id="clinic_address"
              value={formData.clinic_address || ''}
              onChange={(e) => setFormData({ ...formData, clinic_address: e.target.value })}
              data-testid="clinic-address-input"
            />
          </div>
          <div>
            <Label htmlFor="veterinarian_name">Nome do Veterinário</Label>
            <Input
              id="veterinarian_name"
              value={formData.veterinarian_name || ''}
              onChange={(e) => setFormData({ ...formData, veterinarian_name: e.target.value })}
              data-testid="vet-name-input"
            />
          </div>
          <div>
            <Label htmlFor="crmv">CRMV</Label>
            <Input
              id="crmv"
              value={formData.crmv || ''}
              onChange={(e) => setFormData({ ...formData, crmv: e.target.value })}
              data-testid="crmv-input"
            />
          </div>
          <Button type="submit" data-testid="save-clinic-settings-button">
            Salvar Configurações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

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