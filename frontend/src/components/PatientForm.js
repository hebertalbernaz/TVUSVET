import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { db } from '@/services/database';

export function PatientForm({ patient, onSuccess, onCancel }) {
  const [formData, setFormData] = useState(patient || {
    name: '',
    species: 'dog',
    breed: '',
    weight: '',
    size: 'medium',
    sex: 'male',
    is_neutered: false,
    owner_name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        weight: parseFloat(formData.weight)
      };
      
      if (patient) {
        await db.updatePatient(patient.id, data);
        toast.success('Paciente atualizado com sucesso!');
      } else {
        await db.createPatient(data);
        toast.success('Paciente cadastrado com sucesso!');
      }
      onSuccess();
    } catch (error) {
      toast.error(`Erro ao ${patient ? 'atualizar' : 'cadastrar'} paciente`);
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="patient-form">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Paciente *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            data-testid="patient-name-input"
          />
        </div>
        <div>
          <Label htmlFor="owner_name">Nome do Tutor</Label>
          <Input
            id="owner_name"
            value={formData.owner_name}
            onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
            data-testid="owner-name-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="species">Espécie *</Label>
          <Select value={formData.species} onValueChange={(value) => setFormData({ ...formData, species: value })}>
            <SelectTrigger data-testid="species-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dog">Cão</SelectItem>
              <SelectItem value="cat">Gato</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="breed">Raça *</Label>
          <Input
            id="breed"
            value={formData.breed}
            onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
            required
            data-testid="breed-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="weight">Peso (kg) *</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            required
            data-testid="weight-input"
          />
        </div>
        <div>
          <Label htmlFor="size">Porte *</Label>
          <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
            <SelectTrigger data-testid="size-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeno</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sex">Sexo *</Label>
          <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
            <SelectTrigger data-testid="sex-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Macho</SelectItem>
              <SelectItem value="female">Fêmea</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_neutered"
          checked={formData.is_neutered}
          onChange={(e) => setFormData({ ...formData, is_neutered: e.target.checked })}
          className="rounded"
          data-testid="neutered-checkbox"
        />
        <Label htmlFor="is_neutered">Paciente Castrado</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1" data-testid="save-patient-button">
          {patient ? 'Atualizar' : 'Salvar'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
      </div>
    </form>
  );
}
