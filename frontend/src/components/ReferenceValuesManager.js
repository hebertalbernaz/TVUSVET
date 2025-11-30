import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Edit, Save, X, Search } from 'lucide-react';
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

// Lista completa de estruturas (Mantida intacta)
const ALL_STRUCTURES = [
  { category: 'Ultrassom Abdominal', structures: [
    ...ABDOMINAL_ORGANS,
    ...REPRODUCTIVE_ORGANS_MALE,
    ...REPRODUCTIVE_ORGANS_FEMALE
  ]},
  { category: 'Ecocardiograma', structures: ECHOCARDIOGRAM_STRUCTURES.map(s => s.label) },
  { category: 'Eletrocardiograma', structures: ECG_STRUCTURES.map(s => s.label) },
  { category: 'Radiografia', structures: RADIOGRAPHY_STRUCTURES.map(s => s.label) },
  { category: 'Tomografia', structures: TOMOGRAPHY_STRUCTURES.map(s => s.label) }
];

export function ReferenceValuesManager({ values, onUpdate }) {
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // Mantive a busca que adicionei pois é útil
  
  const [newValue, setNewValue] = useState({
    organ: '',
    measurement_type: '',
    species: 'dog',
    size: 'medium',
    min_value: '',
    max_value: '',
    unit: 'cm'
  });

  const createReferenceValue = async () => {
    try {
      await db.createReferenceValue({
        ...newValue,
        min_value: parseFloat(newValue.min_value),
        max_value: parseFloat(newValue.max_value)
      });
      toast.success('Valor adicionado!');
      setShowNew(false);
      setNewValue({ organ: '', measurement_type: '', species: 'dog', size: 'medium', min_value: '', max_value: '', unit: 'cm' });
      onUpdate();
    } catch (error) { toast.error('Erro ao adicionar'); }
  };

  const startEdit = (value) => {
    setEditingId(value.id);
    setEditData({ ...value });
  };

  const saveEdit = async () => {
    try {
      await db.updateReferenceValue(editingId, {
        ...editData,
        min_value: parseFloat(editData.min_value),
        max_value: parseFloat(editData.max_value)
      });
      toast.success('Atualizado!');
      setEditingId(null);
      setEditData(null);
      onUpdate();
    } catch (error) { toast.error('Erro ao atualizar'); }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const deleteReferenceValue = async (id) => {
    if(!window.confirm("Excluir este valor?")) return;
    try {
      await db.deleteReferenceValue(id);
      toast.success('Removido!');
      onUpdate();
    } catch (error) { toast.error('Erro ao remover'); }
  };

  // Filtro de busca
  const filteredValues = values.filter(v => 
    v.organ.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.measurement_type && v.measurement_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* HEADER + BUSCA */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Buscar órgão ou medida..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-8"
            />
        </div>
        <Button onClick={() => setShowNew(!showNew)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Valor
        </Button>
      </div>

      {/* FORMULÁRIO DE ADIÇÃO (Modo Escuro Corrigido) */}
      {showNew && (
        <Card className="p-4 bg-muted/40 border-primary/20 animate-in slide-in-from-top-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select value={newValue.organ} onValueChange={(value) => setNewValue({ ...newValue, organ: value })}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Órgão/Estrutura" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {ALL_STRUCTURES.map((group) => (
                    <div key={group.category}>
                      <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground bg-muted">
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
              <Input
                className="bg-background"
                placeholder="Tipo (ex: Parede, Lúmen)"
                value={newValue.measurement_type}
                onChange={(e) => setNewValue({ ...newValue, measurement_type: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Select value={newValue.species} onValueChange={(value) => setNewValue({ ...newValue, species: value })}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Cão</SelectItem>
                  <SelectItem value="cat">Gato</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newValue.size} onValueChange={(value) => setNewValue({ ...newValue, size: value })}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input type="number" step="0.1" className="bg-background" placeholder="Min" value={newValue.min_value} onChange={(e) => setNewValue({ ...newValue, min_value: e.target.value })} />
              <Input type="number" step="0.1" className="bg-background" placeholder="Max" value={newValue.max_value} onChange={(e) => setNewValue({ ...newValue, max_value: e.target.value })} />
              <Select value={newValue.unit} onValueChange={(value) => setNewValue({ ...newValue, unit: value })}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="cm">cm</SelectItem><SelectItem value="mm">mm</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowNew(false)} size="sm">Cancelar</Button>
              <Button onClick={createReferenceValue} size="sm" disabled={!newValue.organ || !newValue.min_value}>
                <Save className="mr-2 h-3 w-3" /> Salvar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* LISTA DE ITENS (Modo Escuro Corrigido) */}
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-2">
          {filteredValues.map(value => (
            <div key={value.id} className="p-3 rounded-lg border bg-card text-card-foreground hover:bg-accent/30 transition-colors">
              {editingId === value.id ? (
                // MODO EDIÇÃO
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input className="bg-background" value={editData.measurement_type} onChange={(e) => setEditData({ ...editData, measurement_type: e.target.value })} />
                    <Select value={editData.size} onValueChange={(v) => setEditData({ ...editData, size: v })}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeno</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input type="number" className="bg-background" value={editData.min_value} onChange={(e) => setEditData({ ...editData, min_value: e.target.value })} />
                    <Input type="number" className="bg-background" value={editData.max_value} onChange={(e) => setEditData({ ...editData, max_value: e.target.value })} />
                    <Select value={editData.unit} onValueChange={(v) => setEditData({ ...editData, unit: v })}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="cm">cm</SelectItem><SelectItem value="mm">mm</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button onClick={cancelEdit} size="sm" variant="ghost">Cancelar</Button>
                    <Button onClick={saveEdit} size="sm"><Save className="mr-2 h-3 w-3" /> Salvar</Button>
                  </div>
                </div>
              ) : (
                // MODO VISUALIZAÇÃO
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{value.organ}</span>
                        {value.measurement_type && <span className="text-xs text-muted-foreground">({value.measurement_type})</span>}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">
                        {value.species === 'dog' ? 'Cão' : 'Gato'} • {value.size === 'small' ? 'Pequeno' : value.size === 'medium' ? 'Médio' : 'Grande'}
                      </Badge>
                      <span className="font-mono bg-muted px-1.5 rounded text-foreground">
                        {value.min_value} - {value.max_value} {value.unit}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button onClick={() => startEdit(value)} variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => deleteReferenceValue(value.id)} variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}