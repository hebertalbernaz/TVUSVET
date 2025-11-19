import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
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

export function ReferenceValuesManager({ values, onUpdate }) {
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
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
      toast.success('Valor de referência adicionado!');
      setShowNew(false);
      setNewValue({ organ: '', measurement_type: '', species: 'dog', size: 'medium', min_value: '', max_value: '', unit: 'cm' });
      onUpdate();
    } catch (error) {
      toast.error('Erro ao adicionar valor de referência');
    }
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
      toast.success('Valor atualizado!');
      setEditingId(null);
      setEditData(null);
      onUpdate();
    } catch (error) {
      toast.error('Erro ao atualizar valor');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const deleteReferenceValue = async (id) => {
    try {
      await db.deleteReferenceValue(id);
      toast.success('Valor removido!');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao remover valor');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Valores de Referência</span>
          <Button onClick={() => setShowNew(!showNew)} size="sm" data-testid="add-reference-button">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showNew && (
          <Card className="mb-4 p-4 bg-teal-50 border-teal-200">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select value={newValue.organ} onValueChange={(value) => setNewValue({ ...newValue, organ: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estrutura/Órgão" />
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
                <Input
                  placeholder="Tipo de medida (ex: comprimento)"
                  value={newValue.measurement_type}
                  onChange={(e) => setNewValue({ ...newValue, measurement_type: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select value={newValue.species} onValueChange={(value) => setNewValue({ ...newValue, species: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Cão</SelectItem>
                    <SelectItem value="cat">Gato</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newValue.size} onValueChange={(value) => setNewValue({ ...newValue, size: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Valor mínimo"
                  value={newValue.min_value}
                  onChange={(e) => setNewValue({ ...newValue, min_value: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Valor máximo"
                  value={newValue.max_value}
                  onChange={(e) => setNewValue({ ...newValue, max_value: e.target.value })}
                />
                <Select value={newValue.unit} onValueChange={(value) => setNewValue({ ...newValue, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={createReferenceValue} 
                  size="sm"
                  disabled={!newValue.organ || !newValue.measurement_type || !newValue.min_value || !newValue.max_value}
                >
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
          <div className="space-y-2">
            {values.map(value => (
              <div key={value.id} className="p-3 bg-gray-50 rounded-lg border">
                {editingId === value.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Tipo de medida"
                        value={editData.measurement_type}
                        onChange={(e) => setEditData({ ...editData, measurement_type: e.target.value })}
                      />
                      <Select value={editData.size} onValueChange={(v) => setEditData({ ...editData, size: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Pequeno</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Mín"
                        value={editData.min_value}
                        onChange={(e) => setEditData({ ...editData, min_value: e.target.value })}
                      />
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Máx"
                        value={editData.max_value}
                        onChange={(e) => setEditData({ ...editData, max_value: e.target.value })}
                      />
                      <Select value={editData.unit} onValueChange={(v) => setEditData({ ...editData, unit: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="mm">mm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveEdit} size="sm" variant="default">
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
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-teal-700">{value.organ}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        {value.measurement_type} • {value.species === 'dog' ? 'Cão' : 'Gato'} • {value.size === 'small' ? 'Pequeno' : value.size === 'medium' ? 'Médio' : 'Grande'}
                      </span>
                      <div className="text-sm mt-1">
                        <Badge variant="outline" className="bg-white">
                          {value.min_value} - {value.max_value} {value.unit}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => startEdit(value)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        data-testid={`edit-reference-${value.id}`}
                      >
                        <Edit className="h-3 w-3 text-blue-600" />
                      </Button>
                      <Button
                        onClick={() => deleteReferenceValue(value.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        data-testid={`delete-reference-${value.id}`}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
