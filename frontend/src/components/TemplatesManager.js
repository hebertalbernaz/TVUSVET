import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Edit, Save, X, Bold, Italic, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/services/database';
import { 
  ECHOCARDIOGRAM_STRUCTURES, 
  ECG_STRUCTURES, 
  RADIOGRAPHY_STRUCTURES, 
  TOMOGRAPHY_STRUCTURES,
  ABDOMINAL_ORGANS,
  REPRODUCTIVE_ORGANS_MALE,
  REPRODUCTIVE_ORGANS_FEMALE
} from '@/lib/exam_types';

// Comprehensive list of ALL structures from ALL exam types
const ALL_STRUCTURES = [
  // Abdominal Ultrasound
  { category: 'Ultrassom Abdominal', structures: [
    ...ABDOMINAL_ORGANS,
    ...REPRODUCTIVE_ORGANS_MALE,
    ...REPRODUCTIVE_ORGANS_FEMALE
  ]},
  // Echocardiogram
  { category: 'Ecocardiograma', structures: ECHOCARDIOGRAM_STRUCTURES.map(s => s.label) },
  // ECG
  { category: 'Eletrocardiograma', structures: ECG_STRUCTURES.map(s => s.label) },
  // Radiography
  { category: 'Radiografia', structures: RADIOGRAPHY_STRUCTURES.map(s => s.label) },
  // Tomography
  { category: 'Tomografia', structures: TOMOGRAPHY_STRUCTURES.map(s => s.label) }
];

export function TemplatesManager({ templates, onUpdate }) {
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [newTemplate, setNewTemplate] = useState({ organ: '', category: 'normal', title: '', text: '' });
  const textareaRef = useRef(null);
  const editTextareaRef = useRef(null);

  // Rich text formatting helpers
  const wrapSelection = (textarea, prefix, suffix) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    if (selectedText) {
      const wrappedText = prefix + selectedText + suffix;
      const newText = text.substring(0, start) + wrappedText + text.substring(end);
      return { newText, newCursorPos: start + prefix.length + selectedText.length + suffix.length };
    }
    return null;
  };

  const insertAtCursor = (textarea, insertText) => {
    const start = textarea.selectionStart;
    const text = textarea.value;
    const newText = text.substring(0, start) + insertText + text.substring(start);
    return { newText, newCursorPos: start + insertText.length };
  };

  const applyBold = (isEdit = false) => {
    const textarea = isEdit ? editTextareaRef.current : textareaRef.current;
    if (!textarea) return;
    
    const result = wrapSelection(textarea, '**', '**');
    if (result) {
      if (isEdit) {
        setEditText(result.newText);
      } else {
        setNewTemplate({ ...newTemplate, text: result.newText });
      }
      setTimeout(() => textarea.setSelectionRange(result.newCursorPos, result.newCursorPos), 0);
    }
  };

  const applyItalic = (isEdit = false) => {
    const textarea = isEdit ? editTextareaRef.current : textareaRef.current;
    if (!textarea) return;
    
    const result = wrapSelection(textarea, '*', '*');
    if (result) {
      if (isEdit) {
        setEditText(result.newText);
      } else {
        setNewTemplate({ ...newTemplate, text: result.newText });
      }
      setTimeout(() => textarea.setSelectionRange(result.newCursorPos, result.newCursorPos), 0);
    }
  };

  const insertMeasurement = (isEdit = false) => {
    const textarea = isEdit ? editTextareaRef.current : textareaRef.current;
    if (!textarea) return;
    
    const result = insertAtCursor(textarea, '{MEDIDA}');
    if (result) {
      if (isEdit) {
        setEditText(result.newText);
      } else {
        setNewTemplate({ ...newTemplate, text: result.newText });
      }
      setTimeout(() => textarea.setSelectionRange(result.newCursorPos, result.newCursorPos), 0);
    }
  };

  const createTemplate = async () => {
    try {
      await db.createTemplate(newTemplate);
      toast.success('Texto adicionado!');
      setShowNew(false);
      setNewTemplate({ organ: '', category: 'normal', title: '', text: '' });
      onUpdate();
    } catch (error) {
      toast.error('Erro ao adicionar texto');
    }
  };

  const startEdit = (template) => {
    setEditingId(template.id);
    setEditTitle(template.title || '');
    setEditText(template.text);
  };

  const saveEdit = async (templateId) => {
    try {
      const template = templates.find(t => t.id === templateId);
      await db.updateTemplate(templateId, { ...template, title: editTitle, text: editText });
      toast.success('Texto atualizado!');
      setEditingId(null);
      setEditTitle('');
      setEditText('');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao atualizar texto');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditText('');
  };

  const deleteTemplate = async (id) => {
    try {
      await db.deleteTemplate(id);
      toast.success('Texto removido!');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao remover texto');
    }
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.organ]) {
      acc[template.organ] = [];
    }
    acc[template.organ].push(template);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Textos Padrão por Estrutura</span>
          <Button onClick={() => setShowNew(!showNew)} size="sm" data-testid="add-template-button">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showNew && (
          <Card className="mb-4 p-4 bg-teal-50 border-teal-200">
            <div className="space-y-3">
              <Select value={newTemplate.organ} onValueChange={(value) => setNewTemplate({ ...newTemplate, organ: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o órgão/estrutura" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {ALL_STRUCTURES.map((group) => (
                    <div key={group.category}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-primary bg-secondary/50">
                        {group.category}
                      </div>
                      {group.structures.map((structure) => (
                        <SelectItem key={`${group.category}-${structure}`} value={structure}>
                          {structure}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              
              <div>
                <Label htmlFor="new-title" className="text-sm">Título</Label>
                <Input
                  id="new-title"
                  placeholder="Ex: Achado Normal"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="new-text" className="text-sm">Texto</Label>
                  <div className="flex gap-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyBold(false)}
                      title="Negrito"
                    >
                      <Bold className="h-3 w-3" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyItalic(false)}
                      title="Itálico"
                    >
                      <Italic className="h-3 w-3" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertMeasurement(false)}
                      title="Inserir Medida"
                    >
                      <Hash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="new-text"
                  ref={textareaRef}
                  placeholder="Digite o texto padrão... Use **negrito** e *itálico*"
                  value={newTemplate.text}
                  onChange={(e) => setNewTemplate({ ...newTemplate, text: e.target.value })}
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createTemplate} size="sm" disabled={!newTemplate.organ || !newTemplate.text}>
                  <Save className="mr-2 h-3 w-3" />
                  Salvar
                </Button>
                <Button onClick={() => setShowNew(false)} variant="outline" size="sm">
                  <X className="mr-2 h-3 w-3" />
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {Object.entries(groupedTemplates).map(([organ, organTemplates]) => (
              <div key={organ}>
                <h3 className="font-semibold text-lg mb-2 text-teal-700">{organ}</h3>
                <div className="space-y-2 ml-4">
                  {organTemplates.map(template => (
                    <div key={template.id} className="p-3 bg-gray-50 rounded-lg border">
                      {editingId === template.id ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Título"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="font-medium"
                          />
                          <div className="flex items-center justify-end gap-1 mb-1">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => applyBold(true)}
                              title="Negrito"
                            >
                              <Bold className="h-3 w-3" />
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => applyItalic(true)}
                              title="Itálico"
                            >
                              <Italic className="h-3 w-3" />
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => insertMeasurement(true)}
                              title="Inserir Medida"
                            >
                              <Hash className="h-3 w-3" />
                            </Button>
                          </div>
                          <Textarea
                            ref={editTextareaRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={4}
                            className="w-full"
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => saveEdit(template.id)} size="sm" variant="default">
                              <Save className="mr-2 h-3 w-3" />
                              Salvar
                            </Button>
                            <Button onClick={cancelEdit} size="sm" variant="outline">
                              <X className="mr-2 h-3 w-3" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {template.title && (
                              <h4 className="font-semibold text-sm mb-1 text-gray-800">{template.title}</h4>
                            )}
                            <p className="text-sm text-gray-700">{template.text}</p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              onClick={() => startEdit(template)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              data-testid={`edit-template-${template.id}`}
                            >
                              <Edit className="h-3 w-3 text-blue-600" />
                            </Button>
                            <Button
                              onClick={() => deleteTemplate(template.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              data-testid={`delete-template-${template.id}`}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
