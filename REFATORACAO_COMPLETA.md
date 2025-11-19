# 🎯 TVUSVET - Refatoração Completa para 100% Offline

## ✅ O QUE JÁ FOI FEITO:

1. ✅ **Database Service** criado: `/app/frontend/src/services/database.js`
   - 100% offline usando localStorage
   - Todos os CRUDs implementados
   - Sistema de backup/restore

2. ✅ **Componentes criados**:
   - `/app/frontend/src/components/PatientForm.js`
   - `/app/frontend/src/components/PatientCard.js`
   - `/app/frontend/src/components/TemplatesManager.js` (com edição inline)
   - `/app/frontend/src/components/ReferenceValuesManager.js` (com edição inline)
   - `/app/frontend/src/components/LetterheadSettings.js` (com preview)

---

## 🔨 O QUE FALTA FAZER:

### 1. Atualizar App.js para usar estrutura modular

Substitua o conteúdo de `/app/frontend/src/App.js` para apenas roteamento:

```javascript
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { db } from '@/services/database';
import HomePage from '@/pages/HomePage';
import ExamPage from '@/pages/ExamPage';
import SettingsPage from '@/pages/SettingsPage';
import '@/App.css';

function App() {
  useEffect(() => {
    // Inicializar banco de dados offline
    db.init();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/exam/:examId" element={<ExamPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
```

### 2. Criar HomePage.js

Arquivo: `/app/frontend/src/pages/HomePage.js`

```javascript
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

export default function HomePage() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPatients();
  }, []);

const loadPatients = async () => { // Novo (Async)
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

  const exportBackup = () => {
    try {
      const backup = db.exportBackup();
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
      toast.error('Erro ao exportar backup');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50" data-testid="home-page">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              TVUSVET Laudos
            </h1>
            <p className="text-gray-600">Sistema de Ultrassonografia Veterinária</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={exportBackup}
              variant="outline"
              data-testid="export-backup-button"
            >
              <Download className="mr-2 h-4 w-4" />
              Backup
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
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
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
            <p className="text-gray-500">Nenhum paciente encontrado</p>
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
```

### 3. Criar SettingsPage.js

Arquivo: `/app/frontend/src/pages/SettingsPage.js`

```javascript
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
import { LetterheadSettings } from '@/components/LetterheadSettings';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [referenceValues, setReferenceValues] = useState([]);
  const [activeTab, setActiveTab] = useState('clinic');
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
    loadTemplates();
    loadReferenceValues();
  }, []);

  const loadSettings = () => {
    const s = db.getSettings();
    setSettings(s);
  };

  const loadTemplates = () => {
    const t = db.getTemplates();
    setTemplates(t);
  };

  const loadReferenceValues = () => {
    const rv = db.getReferenceValues();
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
    reader.onload = (e) => {
      try {
        const success = db.importBackup(e.target.result);
        if (success) {
          toast.success('Backup importado com sucesso!');
          loadTemplates();
          loadReferenceValues();
          loadSettings();
        } else {
          toast.error('Erro ao importar backup');
        }
      } catch (error) {
        toast.error('Arquivo inválido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50" data-testid="settings-page">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Configurações
          </h1>
          <div className="flex gap-2">
            <label htmlFor="import-backup">
              <input
                id="import-backup"
                type="file"
                accept=".json"
                onChange={importBackup}
                className="hidden"
              />
              <Button variant="outline" as="span" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Importar Backup
              </Button>
            </label>
            <Button onClick={() => navigate('/')} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clinic">Dados da Clínica</TabsTrigger>
            <TabsTrigger value="letterhead">Timbrado</TabsTrigger>
            <TabsTrigger value="templates">Textos Padrão</TabsTrigger>
            <TabsTrigger value="references">Valores de Referência</TabsTrigger>
          </TabsList>

          <TabsContent value="clinic">
            {settings && <ClinicSettings settings={settings} onSave={saveSettings} />}
          </TabsContent>

          <TabsContent value="letterhead">
            {settings && <LetterheadSettings settings={settings} onSave={saveSettings} />}
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
          <Button type="submit" data-testid="save-clinic-settings-button">Salvar Configurações</Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 4. Simplificar ExamPage.js

O ExamPage é muito grande. Os pontos principais de mudança:

1. Remover todas as chamadas `axios`
2. Usar `db.getExam()`, `db.updateExam()`, etc.
3. Remover sistema de licença
4. Manter todo o resto igual

**Mudanças específicas:**

```javascript
// NO TOPO DO ARQUIVO
import { db } from '@/services/database';

// REMOVER:
// const API = `${BACKEND_URL}/api`;
// Todas as chamadas axios

// SUBSTITUIR loadExamData por:
const loadExamData = async () => {
  try {
    const examRes = await db.getExam(examId);
    setExam(examRes);
    setExamWeight(examRes.exam_weight || '');
    setExamImages(examRes.images || []);

    const patientRes = await db.getPatient(examRes.patient_id);
    setPatient(patientRes);

    const templatesRes = db.getTemplates();
    setTemplates(templatesRes);

    const refValuesRes = db.getReferenceValues();
    setReferenceValues(refValuesRes);

    // ... resto igual
  } catch (error) {
    toast.error('Erro ao carregar dados do exame');
  }
};

// SUBSTITUIR saveExam por:
const saveExam = async () => {
  try {
    await db.updateExam(examId, {
      organs_data: organsData,
      exam_weight: examWeight ? parseFloat(examWeight) : null
    });
    toast.success('Exame salvo com sucesso!');
  } catch (error) {
    toast.error('Erro ao salvar exame');
  }
};

// Para imagens, converter para base64 e salvar no db
const handleImageUpload = async (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  setUploading(true);
  try {
    for (let file of files) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = {
          filename: file.name,
          data: e.target.result, // base64
          organ: null
        };
        await db.saveImage(examId, imageData);
        await loadExamData();
      };
      reader.readAsDataURL(file);
    }
    toast.success('Imagens adicionadas com sucesso!');
  } catch (error) {
    toast.error('Erro ao fazer upload de imagens');
  } finally {
    setUploading(false);
  }
};
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO:

- [ ] Verificar que database.js está em `/src/services/database.js`
- [ ] Criar HomePage.js em `/src/pages/HomePage.js`
- [ ] Criar SettingsPage.js em `/src/pages/SettingsPage.js`
- [ ] Atualizar App.js para usar novo roteamento
- [ ] Remover TODAS as importações de axios
- [ ] Remover TODAS as referências a API/BACKEND_URL
- [ ] Remover sistema de licença (modal e estados)
- [ ] Atualizar ExamPage para usar db
- [ ] Testar cadastro de pacientes
- [ ] Testar criação de exames
- [ ] Testar edição de templates
- [ ] Testar edição de valores de referência
- [ ] Testar preview de timbrado
- [ ] Testar backup/restore

---

## 🎯 RESULTADO FINAL:

✅ Sistema 100% offline
✅ Sem chamadas HTTP
✅ Sem sistema de licença
✅ Edição inline de templates e valores de referência
✅ Preview de timbrado
✅ Estrutura modular e organizada
✅ Backup/restore de dados

---

**TEMPO ESTIMADO:** 2-3 horas para aplicar todas as mudanças
