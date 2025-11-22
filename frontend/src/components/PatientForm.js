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
    birth_date: '', // Novo campo
    weight: '',
    owner_name: '',
    owner_phone: ''
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        ...patient,
        // Garante que o peso seja string para o input
        weight: patient.weight || '',
        // Garante formato de data YYYY-MM-DD para o input
        birth_date: patient.birth_date ? patient.birth_date.split('T')[0] : '' 
      });
    }
  }, [patient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        // Salva data completa ISO
        birth_date: formData.birth_date ? new Date(formData.birth_date).toISOString() : null 
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
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input 
                id="birth_date" 
                type="date"
                value={formData.birth_date}
                onChange={e => setFormData({...formData, birth_date: e.target.value})}
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