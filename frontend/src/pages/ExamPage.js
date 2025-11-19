import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Save, Download, X, AlertCircle, Image as ImageIcon, FileText, Check } from 'lucide-react';
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

      // AQUI ERA SÍNCRONO, AGORA É ASYNC:
      const templatesRes = await db.getTemplates();
      setTemplates(templatesRes);

      const refValuesRes = await db.getReferenceValues();
      setReferenceValues(refValuesRes);

      // Initialize structures data dynamically based on exam type
      const examType = examRes.exam_type || 'ultrasound_abd';
      // ... resto da lógica de inicialização das estruturas mantém igual ...
      const allStructures = getStructuresForExam(examType, patientRes);
      setStructureDefinitions(allStructures);
      // ... (código de organsData) ...
      // ...
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
      toast.success(`${processed} imagem(ns) adicionada(s)!`);
      await loadExamData();
    } catch (error) {
      toast.error('Erro ao fazer upload de imagens');
      console.error(error);
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

  // Check if a structure is completed
  const isStructureCompleted = (organ) => {
    const hasReport = organ.report_text && organ.report_text.trim().length > 0;
    const hasMeasurements = organ.measurements && Object.keys(organ.measurements).length > 0;
    return hasReport || hasMeasurements;
  };

  const dataURLToUint8Array = (dataURL) => {
    const base64 = dataURL.split(',')[1];
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  // Parse text with markdown and measurement placeholders
  const parseTextToRuns = (text, measurements) => {
    // Replace {MEDIDA} with first available measurement
    let processedText = text;
    if (measurements && Object.keys(measurements).length > 0) {
      const firstMeasurement = Object.values(measurements)[0];
      const measurementText = `${firstMeasurement.value} ${firstMeasurement.unit || ''}`;
      processedText = processedText.replace(/{MEDIDA}/g, measurementText);
    }
    
    // Parse markdown **bold** and *italic*
    const runs = [];
    const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|([^*]+)/g;
    let match;
    
    while ((match = regex.exec(processedText)) !== null) {
      if (match[2]) {
        // Bold text
        runs.push(new TextRun({ text: match[2], bold: true }));
      } else if (match[4]) {
        // Italic text
        runs.push(new TextRun({ text: match[4], italic: true }));
      } else if (match[5]) {
        // Regular text
        runs.push(new TextRun({ text: match[5] }));
      }
    }
    
    return runs.length > 0 ? runs : [new TextRun({ text: processedText })];
  };

const exportToDocx = async () => {
    try {
      await saveExam();
      const settings = await db.getSettings();

      // Header: clinic info + optional letterhead image
      let headerChildren = [];
      if (settings.letterhead_path && settings.letterhead_path.startsWith('data:image')) {
        try {
          const imgData = dataURLToUint8Array(settings.letterhead_path);
          headerChildren.push(
            new Paragraph({
              children: [
                new ImageRun({ data: imgData, transformation: { width: 600, height: 120 } })
              ],
              alignment: AlignmentType.CENTER,
            })
          );
        } catch (e) {
          // ignore image issues, fallback to text header
        }
      }
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: settings.clinic_name || 'TVUSVET Laudos', bold: true }),
          ],
        }),
      );
      if (settings.veterinarian_name) {
        headerChildren.push(
          new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun(`${settings.veterinarian_name} ${settings.crmv ? '• CRMV ' + settings.crmv : ''}`) ] })
        );
      }
      if (settings.clinic_address) {
        headerChildren.push(
          new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun(settings.clinic_address) ] })
        );
      }

      const header = new Header({ children: headerChildren });

      // Patient + exam info (with translation)
      const examType = exam?.exam_type || 'ultrasound_abd';
      const examTypeName = getExamTypeName(examType);
      
      // Translate labels based on selected language
      const t = (text) => translate(text, reportLanguage);
      
      const docChildren = [
        new Paragraph({ text: `${t('Paciente')}: ${patient?.name || ''} (${t(patient?.species === 'dog' ? 'Cão' : 'Gato')})`, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: `${t('Raça')}: ${patient?.breed || ''} • ${t('Peso cadastrado')}: ${patient?.weight || ''} kg • ${t('Peso no exame')}: ${examWeight || ''} kg` }),
        new Paragraph({ text: `${t('Tipo de Exame')}: ${t(examTypeName)}` }),
        new Paragraph({ text: `${t('Data do exame')}: ${exam ? new Date(exam.exam_date).toLocaleDateString(reportLanguage === 'pt' ? 'pt-BR' : 'en-US') : ''}` }),
        new Paragraph({ text: ' ' }),
        new Paragraph({ text: t('Laudo'), heading: HeadingLevel.HEADING_2 }),
      ];

      // Structure order - use dynamic structures based on exam type
      const structureOrder = getStructuresForExam(examType, patient);

      structureOrder.forEach((organName) => {
        const od = organsData.find((o) => o.organ_name === organName);
        if (!od) return;
        if (od.report_text && od.report_text.trim()) {
          // Translate organ name and report text
          docChildren.push(new Paragraph({ text: t(organName), heading: HeadingLevel.HEADING_3 }));
          const translatedText = t(od.report_text);
          const lines = translatedText.split('\n');
          lines.forEach((line) => {
            const runs = parseTextToRuns(line, od.measurements);
            docChildren.push(new Paragraph({ children: runs }));
          });
          docChildren.push(new Paragraph({ text: ' ' }));
        }
      });

      // Images: 6 per page grid (3 columns x 2 rows)
      const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
      const groups = chunk(examImages, 6);

      groups.forEach((group, gi) => {
        if (group.length > 0) {
          // build rows of 3
          const rows = chunk(group, 3).map((rowImgs) => new TableRow({
            children: rowImgs.map((img) => {
              try {
                const imgData = dataURLToUint8Array(img.data);
                return new TableCell({
                  width: { size: 33, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new ImageRun({ data: imgData, transformation: { width: 180, height: 140 } })],
                    }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(img.organ || '')] }),
                  ],
                });
              } catch (e) {
                return new TableCell({ children: [new Paragraph('Imagem inválida')] });
              }
            }),
          }));

          docChildren.push(new Paragraph({ text: ' ' }));
          docChildren.push(new Paragraph({ text: t('Imagens'), heading: HeadingLevel.HEADING_3 }));
          docChildren.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows,
          }));

          if (gi < groups.length - 1) {
            docChildren.push(new Paragraph({ children: [new PageBreak()] }));
          }
        }
      });

      const doc = new Document({
        sections: [
          {
            headers: { default: header },
            properties: { type: SectionType.CONTINUOUS },
            children: docChildren,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laudo_${patient?.name || 'paciente'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Laudo exportado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao exportar laudo');
    }
  };

  if (!exam || !patient) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  const currentOrgan = organsData[currentOrganIndex];
  const organTemplates = templates.filter(t => t.organ === currentOrgan?.organ_name);

  return (
    <div className="min-h-screen bg-background" data-testid="exam-page">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Exame de {patient.name}
              </h1>
              <Badge variant="secondary" className="text-sm">
                {getExamTypeName(exam?.exam_type || 'ultrasound_abd')}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-3">
              {patient.breed} • {new Date(exam.exam_date).toLocaleDateString('pt-BR')}
            </p>
            <div className="flex items-center gap-2">
              <Label htmlFor="exam-weight" className="text-sm">Peso no exame (kg):</Label>
              <Input
                id="exam-weight"
                type="number"
                step="0.1"
                value={examWeight}
                onChange={(e) => setExamWeight(e.target.value)}
                className="w-32"
                placeholder={patient.weight}
                data-testid="exam-weight-input"
              />
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Idioma:</Label>
              <Select value={reportLanguage} onValueChange={setReportLanguage}>
                <SelectTrigger className="w-32 h-10">
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
            </div>
            <Button onClick={saveExam} variant="outline" className="h-12 text-base px-6" data-testid="save-exam-button">
              <Save className="mr-2 h-5 w-5" />
              Salvar
            </Button>
            <Button onClick={exportToDocx} className="h-12 text-base px-6" data-testid="export-button">
              <Download className="mr-2 h-5 w-5" />
              Exportar Laudo
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="h-12 text-base px-6">
              <X className="mr-2 h-5 w-5" />
              Fechar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Imagens */}
          <div className="col-span-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Imagens ({examImages.length})</span>
                  <label htmlFor="image-upload">
                    <Button
                      size="default"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload').click()}
                      disabled={uploading}
                      className="h-10"
                      data-testid="upload-images-button"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Enviando...' : 'Adicionar'}
                    </Button>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-3">
                    {examImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.data}
                          alt={image.organ || 'Exam image'}
                          className="w-full h-auto max-h-96 object-contain rounded-lg border-2 border-gray-200 hover:border-teal-400 transition-colors bg-gray-50"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-full shadow-lg"
                          onClick={() => handleDeleteImage(image.id)}
                          data-testid={`delete-image-${image.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {image.organ && (
                          <div className="mt-2 p-2 bg-emerald-50 rounded text-center">
                            <p className="text-sm font-medium text-emerald-900">{image.organ}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {examImages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <ImageIcon className="h-20 w-20 text-gray-300 mb-4" />
                      <p className="text-base text-gray-600 font-medium">
                        Nenhuma imagem adicionada
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Clique em "Adicionar" para fazer upload
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Editor de Órgão */}
          <div className="col-span-5">
            {currentOrgan && (
              <OrganEditor
                organ={currentOrgan}
                templates={organTemplates}
                referenceValues={referenceValues.filter(rv => rv.organ === currentOrgan.organ_name && rv.species === patient.species && rv.size === patient.size)}
                onChange={(field, value) => updateOrganData(currentOrganIndex, field, value)}
                structureDefinition={structureDefinitions[currentOrganIndex]}
              />
            )}
          </div>

          {/* Sidebar de Estruturas */}
          <div className="col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Estruturas</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-1">
                    {organsData.map((organ, idx) => {
                      const isCompleted = isStructureCompleted(organ);
                      const isActive = currentOrganIndex === idx;
                      
                      return (
                        <Button
                          key={idx}
                          variant={isActive ? 'default' : 'ghost'}
                          className={`w-full justify-start text-left text-xs py-3 h-auto min-h-[44px] relative ${
                            !isActive && isCompleted ? 'bg-green-50 hover:bg-green-100 border-green-200 border' : ''
                          }`}
                          onClick={() => setCurrentOrganIndex(idx)}
                          data-testid={`organ-button-${idx}`}
                        >
                          <span className="flex items-center gap-2 w-full">
                            {isCompleted && (
                              <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                            )}
                            <span className="flex-1">{organ.organ_name}</span>
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrganEditor({ organ, templates, referenceValues, onChange, structureDefinition }) {
  const [measurements, setMeasurements] = useState(organ.measurements || {});
  const [reportText, setReportText] = useState(organ.report_text || '');

  // Check if this structure has defined clinical measurements
  const hasClinicalMeasurements = structureDefinition?.measurements && structureDefinition.measurements.length > 0;

  useEffect(() => {
    setReportText(organ.report_text || '');
    setMeasurements(organ.measurements || {});
  }, [organ.organ_name]);

  const checkIfAbnormal = (type, value, unit) => {
    const ref = referenceValues.find(rv => rv.measurement_type === type && rv.unit === unit);
    if (!ref) return false;
    return value < ref.min_value || value > ref.max_value;
  };

  const addMeasurement = (type, value, unit) => {
    const newMeasurements = {
      ...measurements,
      [type]: {
        value: parseFloat(value),
        unit,
        // alerts disabled per user request
        is_abnormal: false
      }
    };
    setMeasurements(newMeasurements);
    onChange('measurements', newMeasurements);
  };

  const insertTemplate = (templateText) => {
    const newText = reportText ? `${reportText}\n${templateText}` : templateText;
    setReportText(newText);
    onChange('report_text', newText);
  };

  return (
    <Card data-testid="organ-editor">
      <CardHeader>
        <CardTitle>{organ.organ_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="measurements">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="measurements" className="text-base">Medidas</TabsTrigger>
            <TabsTrigger value="findings" className="text-base">Achados</TabsTrigger>
            <TabsTrigger value="report" className="text-base">Laudo</TabsTrigger>
          </TabsList>

          <TabsContent value="measurements" className="space-y-4">
            {hasClinicalMeasurements ? (
              // Clinical measurements system (Echo, ECG, some Radiography)
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Medidas Clínicas</h3>
                <div className="grid gap-4">
                  {structureDefinition.measurements.map((measurementDef) => (
                    <div key={measurementDef.id} className="grid gap-2">
                      <Label 
                        htmlFor={`measure-${measurementDef.id}`}
                        className="text-sm font-medium"
                        title={measurementDef.description}
                      >
                        {measurementDef.label} {measurementDef.unit && `(${measurementDef.unit})`}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`measure-${measurementDef.id}`}
                          type="number"
                          step="0.01"
                          placeholder={`Ex: ${measurementDef.unit === 'cm' ? '1.2' : measurementDef.unit === '%' ? '60' : '100'}`}
                          value={measurements[measurementDef.id]?.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value) {
                              addMeasurement(measurementDef.id, value, measurementDef.unit);
                            } else {
                              // Remove measurement if empty
                              const newMeasurements = { ...measurements };
                              delete newMeasurements[measurementDef.id];
                              setMeasurements(newMeasurements);
                              onChange('measurements', newMeasurements);
                            }
                          }}
                          className="flex-1"
                        />
                        {measurementDef.unit && (
                          <span className="flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">
                            {measurementDef.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {Object.keys(measurements).length > 0 && (
                  <div className="mt-6 p-4 bg-accent/20 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Resumo das Medidas</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(measurements).map(([id, data]) => {
                        const def = structureDefinition.measurements.find(m => m.id === id);
                        return def ? (
                          <div key={id}>
                            <span className="text-muted-foreground">{def.label}:</span>{' '}
                            <span className="font-semibold">{data.value} {data.unit}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Generic measurement system (Ultrasound, Tomography, some Radiography)
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Adicionar Medida</h3>
                <MeasurementInput 
                  onAdd={addMeasurement} 
                  existingMeasurementsCount={Object.keys(measurements).length}
                />

                {Object.keys(measurements).length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h4 className="font-medium text-lg">Medidas Registradas</h4>
                    {Object.entries(measurements).map(([type, data], index) => (
                      <div key={type} className="flex items-center justify-between p-4 bg-accent/20 rounded-lg border border-border">
                        <div>
                          <span className="font-semibold">Medida {index + 1}: </span>
                          <span className="text-lg">{data.value} {data.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="findings" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-lg mb-3">Achados Pré-definidos</h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {templates.map(template => (
                    <Button
                      key={template.id}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 px-4"
                      onClick={() => insertTemplate(template.text)}
                      data-testid={`template-button-${template.id}`}
                    >
                      <div className="flex flex-col items-start w-full">
                        <span className="font-semibold text-emerald-900">{template.title || template.text.substring(0, 50)}</span>
                        <span className="text-xs text-gray-500 mt-1">{template.category}</span>
                      </div>
                    </Button>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Nenhum texto pré-definido para este órgão
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            <div>
              <Label htmlFor="report-text">Texto do Laudo</Label>
              <Textarea
                id="report-text"
                value={reportText}
                onChange={(e) => {
                  setReportText(e.target.value);
                  onChange('report_text', e.target.value);
                }}
                rows={15}
                placeholder="Digite ou selecione textos pré-definidos..."
                className="mt-2"
                data-testid="report-textarea"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MeasurementInput({ onAdd, existingMeasurementsCount }) {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('cm');

  const handleAdd = () => {
    if (value) {
      const measurementNumber = existingMeasurementsCount + 1;
      onAdd(`medida_${measurementNumber}`, value, unit);
      setValue('');
    }
  };

  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-8">
        <Label className="text-base">Medida {existingMeasurementsCount + 1} ({unit})</Label>
        <Input
          type="number"
          step="0.1"
          placeholder={`Digite o valor em ${unit}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-12 text-base"
          data-testid="measurement-value-input"
        />
      </div>
      <div className="col-span-2">
        <Label className="text-base">Unidade</Label>
        <select className="h-12 w-full border rounded px-2" value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="cm">cm</option>
          <option value="mm">mm</option>
        </select>
      </div>
      <div className="col-span-2 flex items-end">
        <Button onClick={handleAdd} className="w-full h-12 text-base" data-testid="add-measurement-button">
          Adicionar
        </Button>
      </div>
    </div>
  );
}
