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
import { ABDOMINAL_ORGANS, REPRODUCTIVE_ORGANS_MALE, REPRODUCTIVE_ORGANS_FEMALE } from '@/lib/exam_types';

const ALL_STRUCTURES = [
  { category: 'Ultrassom', structures: [...ABDOMINAL_ORGANS, ...REPRODUCTIVE_ORGANS_MALE, ...REPRODUCTIVE_ORGANS_FEMALE, 'Conclusão'] }
];

export function TemplatesManager({ templates, onUpdate }) {
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [newTemplate, setNewTemplate] = useState({ organ: '', lang: 'pt', category: 'normal', title: '', text: '' });
  
  const createTemplate = async () => {
    try {
      await db.createTemplate(newTemplate);
      toast.success('Texto adicionado!');
      setShowNew(false);
      setNewTemplate({ organ: '', lang: 'pt', category: 'normal', title: '', text: '' });
      onUpdate();
    } catch (error) { toast.error('Erro'); }
  };

  const saveEdit = async (id) => {
      const t = templates.find(x => x.id === id);
      await db.updateTemplate(id, { ...t, title: editTitle, text: editText });
      setEditingId(null);
      onUpdate();
  };

  const deleteTemplate = async (id) => { await db.deleteTemplate(id); onUpdate(); };

  // Agrupa por Órgão para facilitar visualização
  const grouped = templates.reduce((acc, t) => {
      const key = `${t.organ} (${t.lang || 'pt'})`;
      if(!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
  }, {});

  return (
    <Card>
      <CardHeader><CardTitle className="flex justify-between"><span>Textos Padrão</span><Button size="sm" onClick={()=>setShowNew(!showNew)}><Plus className="mr-2 h-4 w-4"/>Novo</Button></CardTitle></CardHeader>
      <CardContent>
        {showNew && (
            <Card className="mb-4 p-4 bg-muted/30">
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label>Órgão</Label>
                            <Select value={newTemplate.organ} onValueChange={v => setNewTemplate({...newTemplate, organ: v})}>
                                <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                                <SelectContent>
                                    {ALL_STRUCTURES[0].structures.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Idioma</Label>
                            <Select value={newTemplate.lang} onValueChange={v => setNewTemplate({...newTemplate, lang: v})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pt">Português 🇧🇷</SelectItem>
                                    <SelectItem value="en">Inglês 🇺🇸</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div><Label>Título</Label><Input value={newTemplate.title} onChange={e => setNewTemplate({...newTemplate, title: e.target.value})} placeholder="Ex: Normal"/></div>
                    <div><Label>Texto</Label><Textarea value={newTemplate.text} onChange={e => setNewTemplate({...newTemplate, text: e.target.value})} rows={3}/></div>
                    <Button size="sm" onClick={createTemplate}>Salvar</Button>
                </div>
            </Card>
        )}
        <ScrollArea className="h-[500px]">
            {Object.entries(grouped).map(([group, items]) => (
                <div key={group} className="mb-4">
                    <h3 className="font-bold text-sm text-primary mb-2">{group}</h3>
                    <div className="space-y-2">
                        {items.map(t => (
                            <div key={t.id} className="p-2 border rounded bg-card flex justify-between">
                                {editingId === t.id ? (
                                    <div className="w-full space-y-2">
                                        <Input value={editTitle} onChange={e=>setEditTitle(e.target.value)}/>
                                        <Textarea value={editText} onChange={e=>setEditText(e.target.value)}/>
                                        <div className="flex gap-2"><Button size="sm" onClick={()=>saveEdit(t.id)}>Salvar</Button><Button variant="outline" size="sm" onClick={()=>setEditingId(null)}>Cancelar</Button></div>
                                    </div>
                                ) : (
                                    <>
                                        <div><div className="font-semibold text-xs">{t.title}</div><div className="text-xs text-muted-foreground">{t.text}</div></div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={()=>{setEditingId(t.id); setEditTitle(t.title); setEditText(t.text)}}><Edit className="h-3 w-3"/></Button>
                                            <Button variant="ghost" size="icon" onClick={()=>deleteTemplate(t.id)}><Trash2 className="h-3 w-3 text-red-500"/></Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}