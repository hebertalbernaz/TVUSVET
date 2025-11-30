import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Edit, Save, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/services/database';
import { 
  ECHOCARDIOGRAM_STRUCTURES, ECG_STRUCTURES, 
  ABDOMINAL_ORGANS, REPRODUCTIVE_ORGANS_MALE, REPRODUCTIVE_ORGANS_FEMALE
} from '@/lib/exam_types';

// 🟢 CORREÇÃO: Função para remover duplicatas dos arrays
const unique = (arr) => [...new Set(arr)];

// Lista de sugestões corrigida e sem duplicatas
const SUGGESTED_ORGANS = [
  { 
    category: 'Abdômen', 
    structures: unique([...ABDOMINAL_ORGANS, ...REPRODUCTIVE_ORGANS_MALE, ...REPRODUCTIVE_ORGANS_FEMALE]) 
  },
  { 
    category: 'Cardio/ECG', 
    structures: unique([
        ...ECHOCARDIOGRAM_STRUCTURES.map(s => s.label), 
        ...ECG_STRUCTURES.map(s => s.label)
    ]) 
  },
  { 
    category: 'Outros', 
    structures: unique(['Conclusão', 'Impressões Diagnósticas', 'Laudo Geral']) 
  }
];

export function TemplatesManager({ templates, onUpdate }) {
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newTemplate, setNewTemplate] = useState({ title: '', text: '', organ: '', lang: 'pt' });

  const handleCreate = async () => {
    if (!newTemplate.title || !newTemplate.text) return toast.error("Preencha título e texto");
    try {
      await db.createTemplate(newTemplate);
      toast.success('Modelo criado!');
      setShowNew(false);
      setNewTemplate({ title: '', text: '', organ: '', lang: 'pt' });
      onUpdate();
    } catch (error) { toast.error('Erro ao criar'); }
  };

  const startEdit = (t) => { setEditingId(t.id); setEditData({ ...t }); };

  const saveEdit = async () => {
    try {
      await db.updateTemplate(editingId, editData);
      toast.success('Atualizado!');
      setEditingId(null);
      onUpdate();
    } catch (error) { toast.error('Erro ao atualizar'); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Apagar este modelo?")) return;
    try { await db.deleteTemplate(id); onUpdate(); } catch (error) { toast.error('Erro ao apagar'); }
  };

  const filtered = templates.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.organ?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* BARRA DE CONTROLE */}
      <div className="flex gap-4 items-center">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Buscar modelo por título ou órgão..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-9 bg-card"
              />
          </div>
          <Button onClick={() => setShowNew(!showNew)} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Novo Modelo
          </Button>
      </div>

      {/* FORMULÁRIO DE CRIAÇÃO */}
      {showNew && (
          <Card className="border-l-4 border-l-primary bg-muted/30 animate-in slide-in-from-top-2 border-primary/20">
              <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Novo Modelo de Texto
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Seletor de Órgão Corrigido */}
                      <div className="space-y-1">
                          <Select value={newTemplate.organ} onValueChange={v => setNewTemplate({...newTemplate, organ: v})}>
                              <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione ou Digite..." /></SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                  {SUGGESTED_ORGANS.map(grp => (
                                      <div key={grp.category}>
                                          <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground bg-muted">{grp.category}</div>
                                          {grp.structures.map((s, idx) => (
                                              /* Uso s + idx na key para garantir unicidade absoluta caso haja nomes iguais em categorias diferentes */
                                              <SelectItem key={`${grp.category}-${s}-${idx}`} value={s}>{s}</SelectItem>
                                          ))}
                                      </div>
                                  ))}
                              </SelectContent>
                          </Select>
                          <Input 
                              placeholder="Ou digite o órgão..." 
                              value={newTemplate.organ} 
                              onChange={e => setNewTemplate({...newTemplate, organ: e.target.value})} 
                              className="mt-1 bg-background text-xs h-8" 
                          />
                      </div>

                      <Input 
                          placeholder="Título (ex: Normal, Alterado...)" 
                          value={newTemplate.title} 
                          onChange={e => setNewTemplate({...newTemplate, title: e.target.value})} 
                          className="bg-background md:col-span-1" 
                      />

                      <Select value={newTemplate.lang} onValueChange={v => setNewTemplate({...newTemplate, lang: v})}>
                          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="pt">🇧🇷 Português</SelectItem>
                              <SelectItem value="en">🇺🇸 English</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>

                  <Textarea 
                      placeholder="Texto do modelo..." 
                      value={newTemplate.text} 
                      onChange={e => setNewTemplate({...newTemplate, text: e.target.value})} 
                      className="min-h-[100px] bg-background font-mono text-sm shadow-inner" 
                  />
                  
                  <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
                      <Button onClick={handleCreate}>Salvar Modelo</Button>
                  </div>
              </CardContent>
          </Card>
      )}

      {/* LISTA DE TEMPLATES */}
      <ScrollArea className="h-[600px] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(t => (
                <Card key={t.id} className="group hover:shadow-md transition-all border-border/60 hover:border-primary/30 bg-card">
                    <CardContent className="p-4">
                        {editingId === t.id ? (
                            <div className="space-y-3 animate-in fade-in">
                                <div className="flex gap-2">
                                    <Input value={editData.organ} onChange={e => setEditData({...editData, organ: e.target.value})} className="h-8 text-xs font-bold text-primary" />
                                    <Select value={editData.lang} onValueChange={v => setEditData({...editData, lang: v})}>
                                        <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="pt">PT</SelectItem><SelectItem value="en">EN</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <Input value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="font-bold" />
                                <Textarea value={editData.text} onChange={e => setEditData({...editData, text: e.target.value})} className="min-h-[100px] text-sm bg-background" />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                                    <Button size="sm" onClick={saveEdit}><Save className="h-3 w-3 mr-1"/> Salvar</Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{t.organ}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase border px-1 rounded">{t.lang}</span>
                                        </div>
                                        <h4 className="font-bold text-foreground mt-1">{t.title}</h4>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => startEdit(t)}><Edit className="h-3 w-3" /></Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t.id)}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded border border-transparent group-hover:border-border/50 transition-colors">
                                    <p className="line-clamp-3 leading-relaxed">{t.text}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}