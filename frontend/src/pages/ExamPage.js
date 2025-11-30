import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Save, Download, X, Check, ArrowLeft, Trash2, Plus, Printer, Bold, Italic, Edit, RotateCcw, History, Images, FileDigit } from 'lucide-react';
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
import { ImageEditor } from '@/components/ImageEditor';
import { parseDicomTags } from '@/services/dicomService';
import { DicomViewer } from '@/components/DicomViewer';
import { cn, dataURItoBlob } from '@/lib/utils';
import '@/print.css';

export default function ExamPage() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [patient, setPatient] = useState(null);
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [referenceValues, setReferenceValues] = useState([]);
  const [organsData, setOrgansData] = useState([]);
  const [currentOrganIndex, setCurrentOrganIndex] = useState(0);
  
  const [examWeight, setExamWeight] = useState('');
  const [examDateTime, setExamDateTime] = useState('');
  const [referringVet, setReferringVet] = useState(''); // Estado do Vet Solicitante
  const [examImages, setExamImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [reportLanguage, setReportLanguage] = useState('pt');
  const navigate = useNavigate();
  const [editingImage, setEditingImage] = useState(null);
// Lógica para definir o título do relatório dinamicamente
  const getReportTitle = () => {
      const type = exam?.exam_type || 'ultrasound_abd';
      
      switch (type) {
          case 'echocardiogram':
              return 'RELATÓRIO ECOCARDIOGRÁFICO';
          case 'ecg':
              return 'RELATÓRIO ELETROCARDIOGRÁFICO';
          case 'radiography':
              return 'RELATÓRIO RADIOGRÁFICO';
          case 'tomography':
              return 'RELATÓRIO TOMOGRÁFICO';
          case 'ultrasound_abd':
          default:
              return 'RELATÓRIO ULTRASSONOGRÁFICO';
      }
  };

  useEffect(() => { loadExamData(); }, [examId]);

  const toLocalISO = (dateObj) => {
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const loadExamData = async () => {
    try {
      const examRes = await db.getExam(examId);
      if (!examRes) return navigate('/');
      setExam(examRes);
      setExamWeight(examRes.exam_weight || '');
      setReferringVet(examRes.referring_vet || ''); // Carrega Vet Solicitante
      
      let initialDate = new Date();
      if (examRes.exam_date) {
        const savedDate = new Date(examRes.exam_date);
        if (!isNaN(savedDate.getTime())) initialDate = savedDate;
      }
      setExamDateTime(toLocalISO(initialDate));

      setExamImages(examRes.images || []);
      const patientRes = await db.getPatient(examRes.patient_id);
      setPatient(patientRes);
      const settingsRes = await db.getSettings();
      setSettings(settingsRes);
      const templatesRes = await db.getTemplates();
      setTemplates(templatesRes);
      const refValuesRes = await db.getReferenceValues();
      setReferenceValues(refValuesRes);

      const examType = examRes.exam_type || 'ultrasound_abd';
      const allStructures = getStructuresForExam(examType, patientRes);
      
      if (examRes.organs_data && examRes.organs_data.length > 0) {
         const mergedData = allStructures.map(struct => {
            const saved = examRes.organs_data.find(od => od.organ_name === struct.label);
            return saved || { organ_name: struct.label, measurements: {}, report_text: '' };
         });
         setOrgansData(mergedData);
      } else {
         setOrgansData(allStructures.map(s => ({ organ_name: s.label, measurements: {}, report_text: '' })));
      }
    } catch (error) { toast.error('Erro ao carregar'); }
  };

  const handleOpenHistory = () => {
      if (!patient) return;
      const baseUrl = window.location.href.split('#')[0];
      const historyUrl = `${baseUrl}?t=${Date.now()}#/history/${patient.id}`;
      window.open(historyUrl, 'Histórico', 'width=600,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes');
  };

  const handleOpenGallery = () => {
      if (!examId) return;
      const baseUrl = window.location.href.split('#')[0];
      const galleryUrl = `${baseUrl}?t=${Date.now()}#/gallery/${examId}`;
      window.open(galleryUrl, 'Galeria', 'width=1000,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes');
  };

  const saveExam = async () => {
    try {
      await db.updateExam(examId, {
        organs_data: organsData,
        exam_weight: examWeight ? parseFloat(examWeight) : null,
        exam_date: examDateTime ? new Date(examDateTime).toISOString() : new Date().toISOString(),
        referring_vet: referringVet
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
        // 1. DETECÇÃO ROBUSTA DE DICOM (Por extensão OU Conteúdo)
        let isDicom = file.name.toLowerCase().endsWith('.dcm');
        
        if (!isDicom) {
             // Lê os primeiros bytes para ver se tem a assinatura "DICM"
             await new Promise((resolve) => {
                 const slice = file.slice(0, 132);
                 const reader = new FileReader();
                 reader.onload = (e) => {
                     try {
                         const view = new DataView(e.target.result);
                         if (view.byteLength >= 132) {
                             const magic = String.fromCharCode(
                                 view.getUint8(128), view.getUint8(129), view.getUint8(130), view.getUint8(131)
                             );
                             if (magic === 'DICM') isDicom = true;
                         }
                     } catch(err) { console.log("Não é DICOM"); }
                     resolve();
                 };
                 reader.readAsArrayBuffer(slice);
             });
        }

        // 2. Extrai Tags se for DICOM
        if (isDicom) {
            try {
                const tags = await parseDicomTags(file);
                if (!patient.name && tags.PatientName) toast.info(`Paciente detectado: ${tags.PatientName}`);
            } catch (e) { console.error(e); }
        }

        // 3. Salva no Banco com o mimeType correto
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
             const base64 = e.target.result;
             const imgData = { 
                 filename: file.name, 
                 data: base64, 
                 originalData: base64,
                 mimeType: isDicom ? 'application/dicom' : (file.type || 'application/octet-stream')
             };
             await db.saveImage(examId, imgData);
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
    if (!window.confirm('Apagar imagem?')) return;
    await db.deleteImage(examId, imageId);
    setExamImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleResetImage = async (imgId) => {
      if (!window.confirm('Restaurar original?')) return;
      try {
          const examData = await db.getExam(examId);
          const imageIndex = examData.images.findIndex(i => i.id === imgId);
          if (imageIndex !== -1 && examData.images[imageIndex].originalData) {
              examData.images[imageIndex].data = examData.images[imageIndex].originalData;
              await db.updateExam(examId, examData);
              setExamImages(prev => prev.map(img => img.id === imgId ? examData.images[imageIndex] : img));
              toast.success('Restaurada!');
          }
      } catch (e) { toast.error('Erro ao restaurar'); }
  };

  const handleSaveEditedImage = async (newDataBase64) => {
    if (!editingImage) return;
    try {
        const updatedImage = { ...editingImage, data: newDataBase64, originalData: editingImage.originalData || editingImage.data };
        const examData = await db.getExam(examId);
        const imageIndex = examData.images.findIndex(img => img.id === editingImage.id);
        if (imageIndex !== -1) {
            examData.images[imageIndex] = updatedImage;
            await db.updateExam(examId, examData);
            setExamImages(prev => prev.map(img => img.id === editingImage.id ? updatedImage : img));
            toast.success('Salva!');
        }
        setEditingImage(null);
    } catch (e) { toast.error('Erro ao salvar'); }
  };

  const updateOrganData = (index, field, value) => {
    const newOrgans = [...organsData];
    newOrgans[index] = { ...newOrgans[index], [field]: value };
    setOrgansData(newOrgans);
  };

  const calculateAge = (patient) => {
    if (patient.birth_year) {
        const currentYear = new Date().getFullYear();
        const age = currentYear - patient.birth_year;
        return age <= 0 ? '< 1 ano' : `${age} anos`;
    }
    if (patient.birth_date) {
        const today = new Date();
        const birth = new Date(patient.birth_date);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) { age--; }
        return `${age} anos`;
    }
    return 'Não informada';
  };

  const formatDateTimeText = (isoString) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
  };

  const getReferenceValueText = (organName) => {
    if (!patient || !referenceValues) return null;
    const ref = referenceValues.find(rv => rv.organ === organName && rv.species === patient.species);
    if (ref && ref.min_value !== undefined && ref.max_value !== undefined) {
        return `Valor de referência: de ${ref.min_value} a ${ref.max_value} ${ref.unit}`;
    }
    return null;
  };

  const processTextPlaceholders = (text, measurementsObj) => {
    if (!text) return '';
    let processed = text;
    const m1 = measurementsObj?.m1;
    const m2 = measurementsObj?.m2;
    const m3 = measurementsObj?.m3;
    processed = processed.replace(/\{(MEDIDA1|medida1|M1)\}/g, m1 ? `${m1.value} ${m1.unit}` : '___');
    processed = processed.replace(/\{(MEDIDA2|medida2|M2)\}/g, m2 ? `${m2.value} ${m2.unit}` : '___');
    processed = processed.replace(/\{(MEDIDA3|medida3|M3)\}/g, m3 ? `${m3.value} ${m3.unit}` : '___');
    const sortedM = [m1, m2, m3].filter(Boolean);
    let genericIndex = 0;
    processed = processed.replace(/\{(MEDIDA|medida)\}/g, () => {
        const m = sortedM[genericIndex++];
        return m ? `${m.value} ${m.unit}` : '{MEDIDA}';
    });
    return processed;
  };

  const renderProcessedTextHTML = (text, measurementsObj) => {
    const processed = processTextPlaceholders(text, measurementsObj);
    const parts = processed.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
      return <span key={index}>{part}</span>;
    });
  };

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

  const parseTextDocx = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map(part => {
      if (part.startsWith('**')) return new TextRun({ text: part.slice(2, -2), bold: true });
      if (part.startsWith('*')) return new TextRun({ text: part.slice(1, -1), italics: true });
      if (part) return new TextRun({ text: part });
      return null;
    }).filter(Boolean);
  };

  // Função auxiliar para linhas do cabeçalho DOCX
  const createHeaderRow = (text, isBold = false, size = 20) => {
      return new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: text || '', bold: isBold, size: size, font: "Arial" })],
          spacing: { after: 0, line: 240 }
      });
  };

const exportToDocx = async () => {
    try {
      await saveExam();
      const currentSettings = await db.getSettings();
      const t = (txt) => translate(txt, reportLanguage);
      const dynamicTitle = getReportTitle(); // 🟢 Título Dinâmico
      
      const headerRows = [];
      let logoCell = new TableCell({ children: [], borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE} } });
      
      if (currentSettings.letterhead_path?.startsWith('data:image')) {
          const dims = await getImageSize(currentSettings.letterhead_path, 200);
          const imgData = dataURLToUint8Array(currentSettings.letterhead_path);
          logoCell = new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE} },
              children: [new Paragraph({ children: [new ImageRun({ data: imgData, transformation: { width: dims.width, height: dims.height } })] })]
          });
      }

      // Função auxiliar local para criar linhas
      const createHeaderRow = (text, isBold = false) => new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: text || '', bold: isBold, size: 20, font: "Arial" })] });

      const infoCell = new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE} },
          children: [
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: currentSettings.clinic_name || '', bold: true, size: 28, font: "Arial" })] }),
              createHeaderRow(currentSettings.veterinarian_name, true),
              createHeaderRow(currentSettings.crmv ? `CRMV: ${currentSettings.crmv}` : ''),
              createHeaderRow(currentSettings.professional_phone ? `Tel: ${currentSettings.professional_phone}` : ''),
              createHeaderRow(currentSettings.professional_email || ''),
              createHeaderRow(currentSettings.clinic_address || ''),
              referringVet ? new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Solicitante: Dr(a). ${referringVet}`, bold: true, size: 20, font: "Arial" })], spacing: { before: 100 } }) : new Paragraph({})
          ],
      });

      const headerTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.SINGLE, size: 12}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE}, insideVertical: {style: BorderStyle.NONE} }, 
          rows: [new TableRow({ children: [logoCell, infoCell] })],
      });

      const patientBox = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          shading: { fill: "F5F5F5" },
          borders: { top: {style: BorderStyle.SINGLE, color: "CCCCCC"}, bottom: {style: BorderStyle.SINGLE, color: "CCCCCC"}, left: {style: BorderStyle.SINGLE, color: "CCCCCC"}, right: {style: BorderStyle.SINGLE, color: "CCCCCC"} },
          rows: [
              new TableRow({ children: [
                  new TableCell({ width: {size: 50, type: WidthType.PERCENTAGE}, children: [
                      new Paragraph({ children: [new TextRun({ text: `${t('Paciente')}: `, bold: true }), new TextRun(patient.name)] }),
                      new Paragraph({ children: [new TextRun({ text: `${t('Tutor')}: `, bold: true }), new TextRun(patient.owner_name || '-')] }),
                  ]}),
                  new TableCell({ width: {size: 50, type: WidthType.PERCENTAGE}, children: [
                      new Paragraph({ children: [new TextRun({ text: `${t('Raça')}: `, bold: true }), new TextRun(patient.breed)] }),
                      new Paragraph({ children: [new TextRun({ text: `${t('Data')}: `, bold: true }), new TextRun(formatDateTimeText(examDateTime))] }),
                  ]})
              ]})
          ]
      });

      const docChildren = [
          headerTable, new Paragraph({ text: " " }), patientBox, new Paragraph({ text: " " }),
          new Paragraph({ text: dynamicTitle, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 300 } }), // 🟢 Título aqui
      ];

      organsData.forEach(data => {
        if (data.report_text || Object.keys(data.measurements).length) {
            docChildren.push(new Paragraph({ text: t(data.organ_name), heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
            if (data.report_text) {
                const processed = processTextPlaceholders(data.report_text, data.measurements);
                processed.split('\n').forEach(line => docChildren.push(new Paragraph({ children: parseTextDocx(line), alignment: AlignmentType.JUSTIFIED })));
                if(getReferenceValueText(data.organ_name)) docChildren.push(new Paragraph({ children: [new TextRun({ text: getReferenceValueText(data.organ_name), color: "666666", italics: true })] }));
            }
            docChildren.push(new Paragraph({ text: ' ' }));
        }
      });

      const validImages = examImages.filter(img => !img.mimeType?.includes('dicom') && !img.filename.toLowerCase().endsWith('.dcm'));
      if (validImages.length > 0) {
        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
        docChildren.push(new Paragraph({ text: t('IMAGENS'), heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }));
        // ... (Lógica de grid de imagens mantém-se igual, omitida aqui para brevidade se não mudou)
        // Se precisar do bloco de imagens completo me avise, mas o foco era o título.
        // Vou incluir o bloco de imagens simplificado para garantir:
        const rows = [];
        for (let i = 0; i < validImages.length; i += 2) {
            const cells = [];
            const addImg = async (img) => {
                const dims = await getImageSize(img.data, 220);
                return new TableCell({ borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE} }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: dataURLToUint8Array(img.data), transformation: { width: dims.width, height: dims.height } })] })] });
            };
            cells.push(await addImg(validImages[i]));
            if(i+1 < validImages.length) cells.push(await addImg(validImages[i+1]));
            rows.push(new TableRow({ children: cells }));
        }
        docChildren.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE}, insideHorizontal: {style: BorderStyle.NONE}, insideVertical: {style: BorderStyle.NONE} } }));
      }

      // ... (Assinatura mantém-se igual) ...
      if (currentSettings.signature_path?.startsWith('data:image')) {
          const sigData = dataURLToUint8Array(currentSettings.signature_path);
          const sigDims = await getImageSize(currentSettings.signature_path, 150);
          docChildren.push(new Paragraph({ text: " ", spacing: { before: 400 } }));
          docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: sigData, transformation: { width: sigDims.width, height: sigDims.height } })] }));
          docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "_________________________________", color: "000000" })] }));
          docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: currentSettings.veterinarian_name, bold: true })] }));
          if (currentSettings.crmv) docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `CRMV: ${currentSettings.crmv}` })] }));
      }

      const doc = new Document({ styles: { default: { document: { run: { font: "Arial", size: 22 }, paragraph: { spacing: { line: 276 } } } } }, sections: [{ properties: { type: SectionType.CONTINUOUS, page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } }, children: docChildren }] });
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Relatorio_${patient.name}.docx`; // 🟢 Nome do arquivo ajustado
      link.click();
      toast.success('Gerado!');
    } catch (e) { console.error(e); toast.error('Erro ao gerar DOCX.'); }
  };

  const handlePrintPdf = () => { 
      window.focus();
      setTimeout(() => window.print(), 100);
  };

  if (!exam || !patient) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  const currentOrgan = organsData[currentOrganIndex];
  const organTemplates = templates.filter(t => 
    t.organ === currentOrgan?.organ_name && 
    (t.lang === reportLanguage || (!t.lang && reportLanguage === 'pt'))
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      
      {editingImage && (
          (editingImage.mimeType === 'application/dicom' || editingImage.filename.toLowerCase().endsWith('.dcm')) ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                <div className="w-full h-[90vh] bg-black border border-gray-700 rounded relative flex flex-col">
                     <button onClick={() => setEditingImage(null)} className="absolute top-2 right-2 text-white bg-red-600 p-2 rounded z-50"><X className="h-4 w-4"/></button>
                     <DicomViewer imageBlob={dataURItoBlob(editingImage.data)} />
                </div>
            </div>
          ) : (
            <ImageEditor 
                isOpen={!!editingImage}
                imageUrl={editingImage.data}
                onClose={() => setEditingImage(null)}
                onSave={handleSaveEditedImage}
            />
          )
      )}

      <div className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0 no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="h-5 w-5"/></Button>
          <div>
            <h1 className="font-bold text-lg leading-tight">{patient.name}</h1>
            <div className="text-xs text-muted-foreground flex gap-2 items-center">
               <span>{patient.species}</span><span>•</span>
               <Input className="h-6 w-16 text-xs px-1" placeholder="Peso" value={examWeight} onChange={e => setExamWeight(e.target.value)} /> kg
               <span className="ml-2 border-l pl-2">Data:</span>
               <Input type="datetime-local" className="h-6 w-auto min-w-[220px] text-xs px-1" value={examDateTime} onChange={e => setExamDateTime(e.target.value)} />
               <span className="ml-2 border-l pl-2">Vet. Solicitante:</span>
               <Input className="h-6 w-40 text-xs px-1" placeholder="Nome do Colega" value={referringVet} onChange={e => setReferringVet(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" size="sm" onClick={handleOpenHistory}><History className="h-4 w-4 mr-2"/> Histórico</Button>
           <Button variant="secondary" size="sm" onClick={handleOpenGallery}><Images className="h-4 w-4 mr-2"/> Galeria</Button>
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

      <div className="flex-1 overflow-hidden no-print">
         <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={50} className="border-r bg-muted/10">
                <div className="h-full flex flex-col">
                  <div className="p-2 border-b flex justify-between items-center">
                     <span className="text-xs font-bold text-muted-foreground">IMAGENS ({examImages.length})</span>
                     <label htmlFor="img-up" className="cursor-pointer bg-primary text-white p-1 rounded hover:opacity-80">
                        <Plus className="h-3 w-3" />
                        <input id="img-up" type="file" multiple accept="image/*,.dcm,application/dicom,*" className="hidden" onChange={handleImageUpload} disabled={uploading}/>
                     </label>
                  </div>
                  <ScrollArea className="flex-1 p-2">
                     <div className="space-y-2">
                       {examImages.map(img => (
                         <div key={img.id} className="relative group aspect-video bg-black/5 rounded overflow-hidden border cursor-pointer" onClick={() => setEditingImage(img)}>
                           {(img.mimeType === 'application/dicom' || img.filename.toLowerCase().endsWith('.dcm')) ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                                    <FileDigit className="h-8 w-8 mb-1" />
                                    <span className="text-[10px] font-bold">DICOM</span>
                                </div>
                           ) : (
                                <img src={img.data} className="w-full h-full object-cover" alt="" />
                           )}
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><Edit className="h-6 w-6" /></div>
                           <div className="absolute top-1 right-1 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }} className="bg-red-500 text-white p-1 rounded hover:bg-red-600"><Trash2 className="h-3 w-3" /></button>
                           </div>
                         </div>
                       ))}
                     </div>
                  </ScrollArea>
                </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border w-2 hover:bg-primary/20 transition-colors" />
            <ResizablePanel defaultSize={60} minSize={30}>
                <div className="h-full p-4 bg-background">
                    {currentOrgan ? (
                        <OrganEditor organ={currentOrgan} templates={organTemplates} onChange={(field, value) => updateOrganData(currentOrganIndex, field, value)} />
                    ) : <div className="flex items-center justify-center h-full text-muted-foreground">Selecione uma estrutura ao lado</div>}
                </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border w-2 hover:bg-primary/20 transition-colors" />
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
      
      <div id="printable-report">
         <table className="report-table">
            <thead>
               <tr>
                  <td className="report-header-cell">
                     <div className="header-flex">
                        <div className="header-logo">
                           {settings?.letterhead_path && <img src={settings.letterhead_path} alt="Logo" />}
                        </div>
                        <div className="header-info">
                           <h1 className="clinic-name">{settings?.clinic_name}</h1>
                           <div className="prof-info">
                              <p><strong>{settings?.veterinarian_name}</strong></p>
                              {settings?.crmv && <p>CRMV: {settings.crmv}</p>}
                              {settings?.professional_phone && <p>Tel: {settings.professional_phone}</p>}
                              {settings?.professional_email && <p>{settings.professional_email}</p>}
                              {settings?.clinic_address && <p className="address">{settings.clinic_address}</p>}
                              {referringVet && <p className="ref-vet"><strong>Solicitante:</strong> Dr(a). {referringVet}</p>}
                           </div>
                        </div>
                     </div>
                  </td>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td className="report-content-cell">
                     <div className="patient-box">
                        <div className="pb-row">
                            <span><strong>Paciente:</strong> {patient.name}</span>
                            <span><strong>Espécie:</strong> {translate(patient.species, reportLanguage)}</span>
                            <span><strong>Raça:</strong> {patient.breed}</span>
                        </div>
                        <div className="pb-row">
                            <span><strong>Tutor:</strong> {patient.owner_name}</span>
                            <span><strong>Idade:</strong> {calculateAge(patient)}</span>
                            <span><strong>Data:</strong> {formatDateTimeText(examDateTime)}</span>
                        </div>
                     </div>

                     <h2 className="report-title">{getReportTitle()}</h2>

                     {organsData.map((o, i) => o.report_text && (
                        <div key={i} className="organ-section avoid-break">
                           <h3 className="organ-title">{translate(o.organ_name, reportLanguage)}</h3>
                           <div className="organ-text">
                               {renderProcessedTextHTML(o.report_text, o.measurements)}
                           </div>
{getReferenceValueText(o.organ_name) && (
    // 🟢 CORREÇÃO AQUI: Adicionado dark:text-gray-400
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic border-l-2 border-gray-300 dark:border-gray-700 pl-2">
        {getReferenceValueText(o.organ_name)}
    </p>
)}
                        </div>
                     ))}

                     {examImages.length > 0 && (
                        <div className="images-section avoid-break">
                           <h3 className="images-title">{translate('IMAGENS', reportLanguage)}</h3>
                           <div className="print-image-grid">
                              {examImages.map(img => {
                                 const isDicom = img.mimeType === 'application/dicom' || img.filename.toLowerCase().endsWith('.dcm');
                                 if (isDicom) return null;
                                 return (
                                     <div key={img.id} className="print-image-item">
                                        <img src={img.data} alt="Exame" />
                                     </div>
                                 );
                              })}
                           </div>
                        </div>
                     )}

                     {settings?.signature_path && (
                        <div className="signature-box avoid-break">
                           <img src={settings.signature_path} alt="Assinatura" />
                           <div className="signature-line"></div>
                           <p>{settings.veterinarian_name}</p>
                           <p>CRMV {settings.crmv}</p>
                        </div>
                     )}
                  </td>
               </tr>
            </tbody>
         </table>
      </div>
    </div>
  );
}

function OrganEditor({ organ, templates, onChange }) {
  const [text, setText] = useState(organ.report_text || '');
  const [measurements, setMeasurements] = useState(organ.measurements || {});
  const textAreaRef = useRef(null);

  useEffect(() => {
    setText(organ.report_text || '');
    setMeasurements(organ.measurements || {});
  }, [organ.organ_name]);

  const updateText = (val) => { setText(val); onChange('report_text', val); };
  const addTemplate = (txt) => { const newText = text ? text + '\n' + txt : txt; updateText(newText); };
  
  const setMeasurement = (index, val, unit) => {
      const key = `m${index}`;
      const newM = { ...measurements };
      if (val) newM[key] = { value: val, unit };
      else delete newM[key];
      setMeasurements(newM);
      onChange('measurements', newM);
  };

  const insertFormatting = (type) => {
    if (!textAreaRef.current) return;
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    const selected = text.substring(start, end);
    const marker = type === 'bold' ? '**' : '*';
    const newText = text.substring(0, start) + `${marker}${selected}${marker}` + text.substring(end);
    updateText(newText);
    setTimeout(() => {
        textAreaRef.current.focus();
        textAreaRef.current.selectionStart = start + marker.length;
        textAreaRef.current.selectionEnd = end + marker.length;
    }, 10);
  };

  return (
    <>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">{organ.organ_name}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 h-[calc(100%-4rem)]">
            <div className="flex flex-col gap-3 h-full">
                <div className="bg-muted/20 p-3 rounded border">
                    <div className="space-y-2">
                        {[1, 2, 3].map(num => (
                            <div key={num} className="flex items-center gap-2">
                                <span className="text-xs font-bold text-muted-foreground w-6">M{num}</span>
                                <Input className="h-7 bg-white text-sm" placeholder="0.0" type="number" value={measurements[`m${num}`]?.value || ''} onChange={(e) => setMeasurement(num, e.target.value, 'cm')} />
                                <span className="text-xs text-muted-foreground">cm</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-end mb-1">
                        <Label>Texto</Label>
                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => insertFormatting('bold')} title="Negrito"><Bold className="h-3 w-3"/></Button>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => insertFormatting('italic')} title="Itálico"><Italic className="h-3 w-3"/></Button>
                        </div>
                    </div>
                    <Textarea ref={textAreaRef} className="flex-1 resize-none font-mono text-base p-4 leading-relaxed shadow-sm" value={text} onChange={e => updateText(e.target.value)} placeholder="Escreva aqui..." />
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