import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/services/database';
import { toast } from 'sonner';

export function PatientForm({ patient, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    sex: 'male',
    is_neutered: false,
    birth_year: '', // Mudamos de birth_date para birth_year
    weight: '',
    owner_name: '',
    owner_phone: ''
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        ...patient,
        weight: patient.weight || '',
        // Carrega o ano se existir, ou tenta extrair da data antiga se houver migração
        birth_year: patient.birth_year || (patient.birth_date ? new Date(patient.birth_date).getFullYear() : '')
      });
    }
  }, [patient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
        // Limpamos o campo antigo para evitar confusão
        birth_date: null 
      };

      if (patient) {
        await db.updatePatient(patient.id, dataToSave);
        toast.success('Paciente atualizado!');
      } else {
        await db.createPatient(dataToSave);
        toast.success('Paciente cadastrado!');
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar paciente');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Paciente *</Label>
          <Input 
            id="name" 
            required 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="owner_name">Nome do Tutor</Label>
          <Input 
            id="owner_name" 
            value={formData.owner_name}
            onChange={e => setFormData({...formData, owner_name: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="species">Espécie</Label>
          <Select 
            value={formData.species} 
            onValueChange={val => setFormData({...formData, species: val})}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dog">Canino</SelectItem>
              <SelectItem value="cat">Felino</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="breed">Raça</Label>
          <Input 
            id="breed" 
            value={formData.breed}
            onChange={e => setFormData({...formData, breed: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sex">Sexo</Label>
          <Select 
            value={formData.sex} 
            onValueChange={val => setFormData({...formData, sex: val})}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Macho</SelectItem>
              <SelectItem value="female">Fêmea</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
            {/* CAMPO NOVO: Apenas Ano */}
            <Label htmlFor="birth_year">Ano de Nascimento (Aprox.)</Label>
            <Input 
                id="birth_year" 
                type="number"
                placeholder="Ex: 2018"
                min="1990"
                max={new Date().getFullYear()}
                value={formData.birth_year}
                onChange={e => setFormData({...formData, birth_year: e.target.value})}
            />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input 
            id="weight" 
            type="number" 
            step="0.1"
            value={formData.weight}
            onChange={e => setFormData({...formData, weight: e.target.value})}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}