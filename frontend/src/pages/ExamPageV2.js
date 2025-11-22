import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Save, Download, X, Check, ArrowLeft, Trash2, Plus, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/services/database';
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, 
  ImageRun, Header, SectionType, PageBreak, Table, TableRow, TableCell, 
  WidthType, BorderStyle 
} from 'docx';
import { getStructuresForExam, getExamTypeName } from '@/lib/exam_types';
import { translate, getAvailableLanguages } from '@/services/translation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export default function ExamPageV2() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [patient, setPatient] = useState(null);
  const [settings, setSettings] = useState(null); // NOVO: Settings para o PDF
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

  useEffect(() => { loadExamData(); }, [examId]);

  const loadExamData = async () => {
    try {
      const examRes = await db.getExam(examId);
      if (!examRes) return navigate('/');
      setExam(examRes);
      setExamWeight(examRes.exam_weight || '');
      setExamImages(examRes.images || []);

      const patientRes = await db.getPatient(examRes.patient_id);
      setPatient(patientRes);

      // NOVO: Carregar settings para usar no PDF
      const settingsRes = await db.getSettings();
      setSettings(settingsRes);

      const templatesRes = await db.getTemplates();
      setTemplates(templatesRes);

      const refValuesRes = await db.getReferenceValues();
      setReferenceValues(refValuesRes);

      const examType = examRes.exam_type || 'ultrasound_abd';
      const allStructures = getStructuresForExam(examType, patientRes);
      setStructureDefinitions(allStructures);

      if (examRes.organs_data && examRes.organs_data.length > 0) {
        setOrgansData(examRes.organs_data);
      } else {
        const initialOrgansData = allStructures.map(structure => ({
          organ_name: structure.label || structure, 
          measurements: {},
          report_text: ''
        }));
        setOrgansData(initialOrgansData);
      }
    } catch (error) { toast.error('Erro ao carregar'); }
  };

  const saveExam = async () => {
    try {
      await db.updateExam(examId, {
        organs_data: organsData,
        exam_weight: examWeight ? parseFloat(examWeight) : null
      });
      toast.success('Salvo!');
    } catch (error) { toast.error('Erro ao salvar'); }
  };

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;
    setUploading(true);
    try {
      for (let file of files) {
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            await db.saveImage(examId, { filename: file.name, data: e.target.result });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
      const updated = await db.getExam(examId);
      setExamImages(updated.images || []);
    } finally { setUploading(false); }
  };

  const handleDeleteImage = async (imageId) => {
    await db.deleteImage(examId, imageId);
    setExamImages(prev => prev.filter(img => img.id !== imageId));
  };

  const updateOrganData = (index, field, value) => {
    const newOrgans = [...organsData];
    newOrgans[index] = { ...newOrgans[index], [field]: value };
    setOrgansData(newOrgans);
  };

  // --- NOVAS FUNÇÕES AUXILIARES ---

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Não informada';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    if (age === 0) {
        let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        return `${months} meses`;
    }
    return `${age} anos`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
  };

  const getReferenceValueText = (organName) => {
    if (!patient || !referenceValues) return null;
    const ref = referenceValues.find(rv => 
        rv.organ === organName && 
        rv.species === patient.species
    );
    if (ref && ref.min_value !== undefined && ref.max_value !== undefined) {
        return `Valor de referência: de ${ref.min_value} a ${ref.max_value} ${ref.unit}`;
    }
    return null;
  };

  // --- DOCX HELPERS ---
  const dataURLToUint8Array = (dataURL) => {
    const base64 = dataURL.split(',')[1];
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const getImageSize = (base64, targetWidth = 250) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.height / img.width;
        resolve({ width: targetWidth, height: targetWidth * ratio });
      };
      img.onerror = () => resolve({ width: targetWidth, height: targetWidth * 0.75 });
      img.src = base64;
    });
  };

  const parseText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map(part => {
      if (part.startsWith('**')) return new TextRun({ text: part.slice(2, -2), bold: true });
      if (part.startsWith('*')) return new TextRun({ text: part.slice(1, -1), italics: true });
      if (part) return new TextRun({ text: part });
      return null;
    }).filter(Boolean);
  };

  const exportToDocx = async () => {
    try {
      await saveExam();
      // Recarregar settings
      const currentSettings = await db.getSettings();
      const headerChildren = [];

      if (currentSettings.letterhead_path?.startsWith('data:image')) {
         const dims = await getImageSize(currentSettings.letterhead_path, 600);
         const imgData = dataURLToUint8Array(currentSettings.letterhead_path);
         headerChildren.push(new Paragraph({
             children: [new ImageRun({ 
                 data: imgData, 
                 transformation: { width: dims.width, height: dims.height } 
             })],
             alignment: AlignmentType.CENTER,
             spacing: { after: 200 }
         }));
      } else {
         headerChildren.push(new Paragraph({
             children: [new TextRun({ text: currentSettings.clinic_name || 'LAUDO', bold: true, size: 28 })],
             alignment: AlignmentType.CENTER,
         }));
      }

      const t = (txt) => translate(txt, reportLanguage);
      const age = calculateAge(patient.birth_date);
      
      const docChildren = [
        new Paragraph({ text: `${t('Paciente')}: ${patient.name}`, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: `${t('Tutor')}: ${patient.owner_name || '-'} • ${t('Raça')}: ${patient.breed} • ${t('Idade')}: ${age}` }),
        new Paragraph({ text: `${t('Peso')}: ${examWeight || patient?.weight}kg • Data: ${formatDate(exam.exam_date)}` }),
        new Paragraph({ text: ' ' }),
        new Paragraph({ text: t('LAUDO'), heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
        new Paragraph({ text: ' ' }),
      ];

      getStructuresForExam(exam.exam_type, patient).forEach(struct => {
        const label = struct.label || struct;
        const data = organsData.find(o => o.organ_name === label);
        if (data && (data.report_text || Object.keys(data.measurements).length)) {
            docChildren.push(new Paragraph({ text: t(label), heading: HeadingLevel.HEADING_3 }));
            if (data.report_text) {
                let txt = data.report_text;
                Object.values(data.measurements).forEach(m => {
                    txt = txt.replace('{MEDIDA}', `${m.value} ${m.unit}`);
                });
                txt.split('\n').forEach(line => {
                    docChildren.push(new Paragraph({ children: parseText(line) }));
                });
                
                // NOVO: Adicionar Referência no DOCX
                const refText = getReferenceValueText(data.organ_name);
                if (refText) {
                    docChildren.push(new Paragraph({ 
                        children: [new TextRun({ text: refText, color: "666666", size: 20 })], // Texto cinza e menor
                        spacing: { before: 60 } 
                    }));
                }
            }
            docChildren.push(new Paragraph({ text: ' ' }));
        }
      });

      if (examImages.length > 0) {
        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
        const rows = [];
        for (let i = 0; i < examImages.length; i += 2) {
            const cells = [];
            const addImgCell = async (img) => {
                const dims = await getImageSize(img.data, 250);
                return new TableCell({
                    borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE} },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new ImageRun({ 
                                data: dataURLToUint8Array(img.data), 
                                transformation: { width: dims.width, height: dims.height } 
                            })]
                        }),
                        new Paragraph({ text: " " }) 
                    ],
                });
            };
            cells.push(await addImgCell(examImages[i]));
            if (i+1 < examImages.length) cells.push(await addImgCell(examImages[i+1]));
            rows.push(new TableRow({ children: cells }));
        }
        docChildren.push(new Table({ 
            rows, 
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE}, insideHorizontal: {style: BorderStyle.NONE}, insideVertical: {style: BorderStyle.NONE} }
        }));
      }

      const doc = new Document({
        sections: [{
            headers: { default: new Header({ children: headerChildren }) },
            properties: { type: SectionType.CONTINUOUS },
            children: docChildren
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laudo_${patient.name}.docx`;
      link.click();
      toast.success('Gerado!');
    } catch (e) { console.error(e); toast.error('Erro ao gerar.'); }
  };

  const handlePrintPdf = () => { window.print(); };

  if (!exam || !patient) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  const currentOrgan = organsData[currentOrganIndex];
  const organTemplates = templates.filter(t => t.organ === currentOrgan?.organ_name);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0 no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="h-5 w-5"/></Button>
          <div>
            <h1 className="font-bold text-lg leading-tight">{patient.name}</h1>
            <div className="text-xs text-muted-foreground flex gap-2 items-center">
               <span>{patient.species}</span><span>•</span>
               <Input className="h-5 w-16 text-xs px-1" placeholder="Peso" value={examWeight} onChange={e => setExamWeight(e.target.value)} /> kg
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <Select value={reportLanguage} onValueChange={setReportLanguage}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {getAvailableLanguages().map(l => <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>)}
            </SelectContent>
          </Select>
           <Button variant="outline" size="sm" onClick={handlePrintPdf}><Printer className="h-4 w-4 mr-2"/> PDF</Button>
           <Button variant="outline" size="sm" onClick={saveExam}><Save className="h-4 w-4 mr-2"/> Salvar</Button>
           <Button size="sm" onClick={exportToDocx}><Download className="h-4 w-4 mr-2"/> DOCX</Button>
        </div>
      </div>

      {/* Grid de 3 Colunas */}
      <div className="flex-1 overflow-hidden no-print">
         <ResizablePanelGroup direction="horizontal">
            
            {/* PAINEL 1: IMAGENS */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={50} className="border-r bg-muted/10">
                <div className="h-full flex flex-col">
                  <div className="p-2 border-b flex justify-between items-center">
                     <span className="text-xs font-bold text-muted-foreground">IMAGENS ({examImages.length})</span>
                     <label htmlFor="img-up" className="cursor-pointer bg-primary text-white p-1 rounded hover:opacity-80">
                        <Plus className="h-3 w-3" />
                        <input id="img-up" type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading}/>
                     </label>
                  </div>
                  <ScrollArea className="flex-1 p-2">
                     <div className="space-y-2">
                       {examImages.map(img => (
                         <div key={img.id} className="relative group aspect-video bg-black/5 rounded overflow-hidden border">
                           <img src={img.data} className="w-full h-full object-cover" alt="" />
                           <button onClick={() => handleDeleteImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                         </div>
                       ))}
                     </div>
                  </ScrollArea>
                </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* PAINEL 2: EDITOR */}
            <ResizablePanel defaultSize={60} minSize={30}>
                <div className="h-full p-4 bg-background">
                    {currentOrgan ? (
                        <OrganEditor organ={currentOrgan} templates={organTemplates} onChange={(field, value) => updateOrganData(currentOrganIndex, field, value)} />
                    ) : <div className="flex items-center justify-center h-full text-muted-foreground">Selecione uma estrutura ao lado</div>}
                </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* PAINEL 3: ROTEIRO */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="border-l bg-muted/10">
                <div className="h-full flex flex-col">
                   <div className="p-2 border-b"><span className="text-xs font-bold text-muted-foreground">ROTEIRO</span></div>
                   <ScrollArea className="flex-1">
                      <div className="flex flex-col">
                         {organsData.map((organ, idx) => (
                            <button key={idx} className={`text-left px-3 py-2 text-sm border-b border-transparent hover:bg-white transition-colors flex items-center justify-between ${currentOrganIndex === idx ? 'bg-white font-bold text-primary border-l-4 border-l-primary shadow-sm' : 'text-muted-foreground'} ${organ.report_text ? 'text-green-700' : ''}`} onClick={() => setCurrentOrganIndex(idx)}>
                              <span className="truncate">{organ.organ_name}</span>
                              {organ.report_text && <Check className="h-3 w-3" />}
                            </button>
                         ))}
                      </div>
                   </ScrollArea>
                </div>
            </ResizablePanel>

         </ResizablePanelGroup>
      </div>
      
      {/* ÁREA DE IMPRESSÃO (PDF) - ATUALIZADA */}
      <div id="printable-report" className="hidden print:block p-8 font-serif">
         {/* NOVO: Cabeçalho com Timbrado */}
         <div className="mb-6 text-center">
            {settings?.letterhead_path?.startsWith('data:image') ? (
                <img src={settings.letterhead_path} className="w-full max-h-40 object-contain mb-4" alt="Cabeçalho" />
            ) : (
                <h1 className="text-2xl font-bold uppercase border-b pb-2">{settings?.clinic_name || 'LAUDO VETERINÁRIO'}</h1>
            )}
            
            {/* NOVO: Dados do Paciente Completos */}
            <div className="text-left text-sm mt-4 border-b pb-4 space-y-1">
                <div className="grid grid-cols-2">
                    <p><strong>Paciente:</strong> {patient.name}</p>
                    <p><strong>Espécie:</strong> {patient.species}</p>
                </div>
                <div className="grid grid-cols-2">
                    <p><strong>Raça:</strong> {patient.breed}</p>
                    <p><strong>Idade:</strong> {calculateAge(patient.birth_date)}</p>
                </div>
                <div className="grid grid-cols-2">
                    <p><strong>Tutor:</strong> {patient.owner_name}</p>
                    <p><strong>Data:</strong> {formatDate(exam.exam_date)}</p>
                </div>
            </div>
         </div>
         
         <h2 className="text-xl font-bold text-center mb-6">LAUDO</h2>

         {organsData.map((o, i) => o.report_text && (
            <div key={i} className="mb-4 avoid-break">
               <h3 className="font-bold text-lg mb-1">{o.organ_name}</h3>
               <p className="whitespace-pre-wrap text-justify text-sm leading-relaxed">{o.report_text}</p>
               
               {/* NOVO: Valor de Referência (Só aparece se existir) */}
               {getReferenceValueText(o.organ_name) && (
                   <p className="text-xs text-gray-500 mt-1 italic">
                       {getReferenceValueText(o.organ_name)}
                   </p>
               )}
            </div>
         ))}
         
         {examImages.length > 0 && (
            <div className="mt-6 page-break-before">
               <h3 className="font-bold text-center mb-4">IMAGENS</h3>
               <div className="grid grid-cols-2 gap-4">
                  {examImages.map(img => <img key={img.id} src={img.data} className="w-full object-contain h-48 border-0"/>)}
               </div>
            </div>
         )}
      </div>
    </div>
  );
}

function OrganEditor({ organ, templates, onChange }) {
  const [text, setText] = useState(organ.report_text || '');
  const [measurements, setMeasurements] = useState(organ.measurements || {});

  useEffect(() => {
    setText(organ.report_text || '');
    setMeasurements(organ.measurements || {});
  }, [organ.organ_name]);

  const updateText = (val) => { setText(val); onChange('report_text', val); };
  const addTemplate = (txt) => { const newText = text ? text + '\n' + txt : txt; updateText(newText); };
  const addMeasurement = (val, unit) => { const id = `m_${Date.now()}`; const newM = { ...measurements, [id]: { value: val, unit } }; setMeasurements(newM); onChange('measurements', newM); };
  const deleteMeasurement = (key) => { const newM = { ...measurements }; delete newM[key]; setMeasurements(newM); onChange('measurements', newM); };

  return (
    <>
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2 mb-4">{organ.organ_name}</h2>
        <div className="grid grid-cols-2 gap-4 h-[calc(100%-3rem)]">
            <div className="flex flex-col gap-3 h-full">
                <div className="bg-muted/20 p-3 rounded border">
                    <div className="flex gap-2 mb-2">
                        <Input id="med-val" placeholder="0.0" className="h-8 bg-white" type="number" onKeyDown={e => { if(e.key==='Enter'){ const val = e.currentTarget.value; if(val) { addMeasurement(val, 'cm'); e.currentTarget.value=''; }}}} />
                        <span className="text-sm self-center">cm</span>
                        <Button size="sm" variant="secondary" onClick={() => { const el = document.getElementById('med-val'); if(el.value) { addMeasurement(el.value, 'cm'); el.value = ''; }}}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(measurements).map(([key, m]) => (
                            <Badge key={key} variant="outline" className="bg-white gap-1 pr-1 items-center">
                                {m.value} {m.unit}
                                <span onClick={() => deleteMeasurement(key)} className="cursor-pointer hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 flex items-center justify-center transition-colors"><X className="h-3 w-3" /></span>
                            </Badge>
                        ))}
                    </div>
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                    <Label className="mb-1">Texto</Label>
                    <Textarea className="flex-1 resize-none font-mono text-base p-4 leading-relaxed shadow-sm" value={text} onChange={e => updateText(e.target.value)} placeholder="Escreva aqui..." />
                    <p className="text-xs text-muted-foreground mt-1">Dica: Use **negrito** e *itálico*.</p>
                </div>
            </div>
            <Card className="flex flex-col h-full border-l-4 border-l-primary/20">
                <CardHeader className="py-2 px-3 bg-muted/20 border-b shrink-0"><CardTitle className="text-xs">MODELOS</CardTitle></CardHeader>
                <ScrollArea className="flex-1 bg-muted/5">
                    <div className="p-2 space-y-2">
                        {templates.length > 0 ? templates.map(t => (
                            <div key={t.id} className="p-2 bg-card border rounded hover:border-primary cursor-pointer transition-all" onClick={() => addTemplate(t.text)}>
                                <div className="font-bold text-xs text-primary">{t.title}</div>
                                <div className="text-[10px] text-muted-foreground line-clamp-2">{t.text}</div>
                            </div>
                        )) : <div className="p-4 text-xs text-center text-muted-foreground">Sem modelos cadastrados.</div>}
                    </div>
                </ScrollArea>
            </Card>
        </div>
    </>
  );
}