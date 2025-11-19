import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Save, Download, X, Image as ImageIcon, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/services/database';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Header, SectionType, PageBreak, Table, TableRow, TableCell, WidthType } from 'docx';
import { getStructuresForExam, getExamTypeName } from '@/lib/exam_types';
import { translate, getAvailableLanguages } from '@/services/translation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ExamPage() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [patient, setPatient] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [referenceValues, setReferenceValues] = useState([]);
  const [organsData, setOrgansData] = useState([]);
  const [currentOrganIndex, setCurrentOrganIndex] = useState(0);
  const [examWeight, setExamWeight] = useState('');
  const [examImages, setExamImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [reportLanguage, setReportLanguage] = useState('pt');
  const [structureDefinitions, setStructureDefinitions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadExamData();
  }, [examId]);

  const loadExamData = async () => {
    try {
      const examRes = await db.getExam(examId);
      if (!examRes) {
        toast.error('Exame não encontrado');
        navigate('/');
        return;
      }
      setExam(examRes);
      setExamWeight(examRes.exam_weight || '');
      setExamImages(examRes.images || []);

      const patientRes = await db.getPatient(examRes.patient_id);
      setPatient(patientRes);

      const templatesRes = await db.getTemplates();
      setTemplates(templatesRes);

      const refValuesRes = await db.getReferenceValues();
      setReferenceValues(refValuesRes);

      // RECALCULAR ESTRUTURAS SEMPRE para garantir sincronia
      const examType = examRes.exam_type || 'ultrasound_abd';
      const allStructures = getStructuresForExam(examType, patientRes);
      setStructureDefinitions(allStructures);

      if (examRes.organs_data && examRes.organs_data.length > 0) {
        // Se já tem dados salvos, usa eles
        setOrgansData(examRes.organs_data);
      } else {
        // Se é novo, inicializa baseado nas estruturas
        const initialOrgansData = allStructures.map(structure => ({
          organ_name: structure.label || structure, 
          structure_id: structure.id || null,
          measurements: {},
          selected_findings: [],
          custom_notes: '',
          report_text: ''
        }));
        setOrgansData(initialOrgansData);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do exame');
      console.error(error);
    }
  };

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

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      let processed = 0;
      for (let file of files) {
        await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const imageData = {
                filename: file.name,
                data: e.target.result,
                organ: null
              };
              await db.saveImage(examId, imageData);
              processed += 1;
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      toast.success(`${processed} imagens adicionadas!`);
      // Recarregar apenas imagens para não piscar a tela toda
      const updatedExam = await db.getExam(examId);
      setExamImages(updatedExam.images || []);
    } catch (error) {
      toast.error('Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await db.deleteImage(examId, imageId);
      setExamImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Imagem removida');
    } catch (error) {
      toast.error('Erro ao remover imagem');
    }
  };

  const updateOrganData = (index, field, value) => {
    const newOrgansData = [...organsData];
    newOrgansData[index] = {
      ...newOrgansData[index],
      [field]: value
    };
    setOrgansData(newOrgansData);
  };

  const dataURLToUint8Array = (dataURL) => {
    const base64 = dataURL.split(',')[1];
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const exportToDocx = async () => {
    try {
      await saveExam();
      const settings = await db.getSettings();

      // Configurar Cabeçalho
      let headerChildren = [];
      
      // Tentar usar imagem se disponível e for imagem
      if (settings.letterhead_path && settings.letterhead_path.startsWith('data:image')) {
        try {
          const imgData = dataURLToUint8Array(settings.letterhead_path);
          headerChildren.push(
            new Paragraph({
              children: [
                new ImageRun({ 
                  data: imgData, 
                  transformation: { width: 600, height: 100 } // Ajuste altura para não quebrar página
                })
              ],
              alignment: AlignmentType.CENTER,
            })
          );
        } catch (e) {
          console.warn("Não foi possível processar a imagem do cabeçalho", e);
        }
      } else if (settings.letterhead_path) {
        // Se tem path mas não é imagem (ex: docx), avisamos no console
        console.log("Cabeçalho DOCX/PDF não é renderizado na prévia do gerador, apenas texto.");
      }

      // Texto do cabeçalho sempre vai, caso a imagem falhe ou para complementar
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: settings.clinic_name || 'Laudo Veterinário', bold: true, size: 28 }),
          ],
        }),
      );
      
      if (settings.veterinarian_name) {
        headerChildren.push(
          new Paragraph({ 
            alignment: AlignmentType.CENTER, 
            children: [ new TextRun(`${settings.veterinarian_name} ${settings.crmv ? '• CRMV ' + settings.crmv : ''}`) ] 
          })
        );
      }

      const header = new Header({ children: headerChildren });

      // Corpo do Laudo
      const t = (text) => translate(text, reportLanguage);
      const examTypeName = getExamTypeName(exam?.exam_type);

      const docChildren = [
        new Paragraph({ text: `${t('Paciente')}: ${patient?.name}`, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: `${t('Tutor')}: ${patient?.owner_name || '-'} • ${t('Raça')}: ${patient?.breed} • ${t('Peso')}: ${examWeight || patient?.weight}kg` }),
        new Paragraph({ text: `${t('Exame')}: ${t(examTypeName)} • Data: ${new Date(exam.exam_date).toLocaleDateString()}` }),
        new Paragraph({ text: ' ' }), // Espaço
        new Paragraph({ 
          text: t('LAUDO'), 
          heading: HeadingLevel.HEADING_1, 
          alignment: AlignmentType.CENTER 
        }),
        new Paragraph({ text: ' ' }),
      ];

      // Iterar órgãos
      const structureOrder = getStructuresForExam(exam?.exam_type, patient);
      
      structureOrder.forEach((struct) => {
        const label = struct.label || struct; // Compatibilidade string/objeto
        const od = organsData.find(o => o.organ_name === label);
        
        if (od && (od.report_text || Object.keys(od.measurements).length > 0)) {
          docChildren.push(new Paragraph({ 
            text: t(label), 
            heading: HeadingLevel.HEADING_3 
          }));

          if (od.report_text) {
            // Processar texto com medidas
            let text = od.report_text;
            // Substituir placeholders {MEDIDA}
            Object.values(od.measurements).forEach(m => {
               text = text.replace('{MEDIDA}', `${m.value} ${m.unit}`);
            });
            docChildren.push(new Paragraph({ text: t(text) }));
          }
          docChildren.push(new Paragraph({ text: ' ' }));
        }
      });

      // Imagens
      if (examImages.length > 0) {
        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
        docChildren.push(new Paragraph({ text: t('IMAGENS'), heading: HeadingLevel.HEADING_2 }));
        
        // Grid de imagens (2 por linha para caber melhor)
        const rows = [];
        for (let i = 0; i < examImages.length; i += 2) {
          const rowChildren = [];
          
          // Imagem 1
          try {
            const img1 = examImages[i];
            rowChildren.push(new TableCell({
              children: [
                new Paragraph({
                  children: [new ImageRun({ data: dataURLToUint8Array(img1.data), transformation: { width: 250, height: 200 } })],
                  alignment: AlignmentType.CENTER
                }),
                new Paragraph({ text: img1.organ || '', alignment: AlignmentType.CENTER })
              ],
              width: { size: 50, type: WidthType.PERCENTAGE }
            }));
          } catch(e) {}

          // Imagem 2
          if (i + 1 < examImages.length) {
            try {
              const img2 = examImages[i+1];
              rowChildren.push(new TableCell({
                children: [
                  new Paragraph({
                    children: [new ImageRun({ data: dataURLToUint8Array(img2.data), transformation: { width: 250, height: 200 } })],
                    alignment: AlignmentType.CENTER
                  }),
                  new Paragraph({ text: img2.organ || '', alignment: AlignmentType.CENTER })
                ],
                width: { size: 50, type: WidthType.PERCENTAGE }
              }));
            } catch(e) {}
          }

          rows.push(new TableRow({ children: rowChildren }));
        }

        docChildren.push(new Table({
          rows: rows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        }));
      }

      const doc = new Document({
        sections: [{
          headers: { default: header },
          properties: { type: SectionType.CONTINUOUS },
          children: docChildren,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laudo_${patient.name}.docx`;
      link.click();
      toast.success('Laudo gerado!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar documento');
    }
  };

  if (!exam || !patient) {
    return <div className="flex items-center justify-center h-screen">Carregando exame...</div>;
  }

  // Proteção contra índices inválidos ou dados não carregados
  const currentOrgan = organsData[currentOrganIndex];
  // Busca segura da definição estrutural
  const currentDefinition = structureDefinitions[currentOrganIndex] || { label: currentOrgan?.organ_name, measurements: [] };
  
  const organTemplates = templates.filter(t => t.organ === currentOrgan?.organ_name);

  return (
    <div className="min-h-screen bg-background" data-testid="exam-page">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{patient.name}</h1>
              <p className="text-sm text-muted-foreground">
                {patient.species === 'dog' ? 'Cão' : 'Gato'} • {patient.breed}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
             <Select value={reportLanguage} onValueChange={setReportLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableLanguages().map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            <Button onClick={saveExam} variant="outline">
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
            <Button onClick={exportToDocx}>
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          
          {/* Sidebar (Lista de Estruturas) */}
          <div className="col-span-3 h-full">
            <Card className="h-full flex flex-col">
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Estruturas</CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {organsData.map((organ, idx) => (
                    <Button
                      key={idx}
                      variant={currentOrganIndex === idx ? 'secondary' : 'ghost'}
                      className={`w-full justify-start ${organ.report_text ? 'border-l-4 border-l-green-500' : ''}`}
                      onClick={() => setCurrentOrganIndex(idx)}
                    >
                      <span className="truncate">{organ.organ_name}</span>
                      {organ.report_text && <Check className="ml-auto h-3 w-3 text-green-500" />}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Editor Central */}
          <div className="col-span-6 h-full">
            {currentOrgan && (
              <OrganEditor
                organ={currentOrgan}
                templates={organTemplates}
                referenceValues={referenceValues}
                structureDefinition={currentDefinition} // Passando definição segura
                onChange={(field, value) => updateOrganData(currentOrganIndex, field, value)}
              />
            )}
          </div>

          {/* Painel de Imagens */}
          <div className="col-span-3 h-full">
            <Card className="h-full flex flex-col">
              <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Imagens</CardTitle>
                <label htmlFor="img-upload" className="cursor-pointer">
                  <div className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8 rounded-full flex items-center justify-center">
                    <Upload className="h-4 w-4" />
                  </div>
                  <input 
                    id="img-upload" 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </CardHeader>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {examImages.map(img => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border bg-muted/20">
                      <img src={img.data} className="w-full h-32 object-cover" alt="Exame" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteImage(img.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="p-2 text-xs text-center text-muted-foreground">
                        {img.filename}
                      </div>
                    </div>
                  ))}
                  {examImages.length === 0 && (
                    <div className="text-center text-muted-foreground py-10 text-sm">
                      Sem imagens
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}

// Componente Editor Isolado
function OrganEditor({ organ, templates, onChange, structureDefinition }) {
  const [text, setText] = useState(organ.report_text || '');

  useEffect(() => {
    setText(organ.report_text || '');
  }, [organ.organ_name]); // Atualiza quando muda de órgão

  const handleTextChange = (e) => {
    setText(e.target.value);
    onChange('report_text', e.target.value);
  };

  const addTemplate = (templateText) => {
    const newText = text ? text + '\n' + templateText : templateText;
    setText(newText);
    onChange('report_text', newText);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-4 border-b bg-muted/10">
        <CardTitle>{organ.organ_name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        <Tabs defaultValue="report" className="flex-1 flex flex-col">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="report">Laudo</TabsTrigger>
              <TabsTrigger value="templates">Frases Prontas</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="report" className="flex-1 p-4 flex flex-col data-[state=active]:flex">
            <Label className="mb-2">Texto do Relatório</Label>
            <Textarea 
              className="flex-1 resize-none text-base leading-relaxed" 
              value={text}
              onChange={handleTextChange}
              placeholder="Digite os achados aqui..."
            />
          </TabsContent>

          <TabsContent value="templates" className="flex-1 p-0 data-[state=active]:flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {templates.length > 0 ? templates.map(t => (
                  <div 
                    key={t.id} 
                    className="p-3 border rounded-md hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => addTemplate(t.text)}
                  >
                    <div className="font-medium text-sm">{t.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{t.text}</div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum modelo encontrado para este órgão.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}