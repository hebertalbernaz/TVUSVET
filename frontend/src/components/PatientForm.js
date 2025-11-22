import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/services/database';
import { toast } from 'sonner';

export function PatientForm({ patient, onSuccess, onCancel }) {
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    sex: 'male',
    is_neutered: false,
    birth_year: '',
    weight: '',
    owner_name: '',
    owner_phone: ''
  });

  // Estado separado para a idade (apenas visual/calculadora)
  const [age, setAge] = useState('');

  useEffect(() => {
    if (patient) {
      // Tenta recuperar o ano
      let year = patient.birth_year || '';
      // Fallback para dados antigos (data completa)
      if (!year && patient.birth_date) {
        try { year = new Date(patient.birth_date).getFullYear().toString(); } catch (e) {}
      }

      setFormData({
        ...patient,
        weight: patient.weight || '',
        birth_year: year
      });

      // Calcula a idade inicial se tiver ano
      if (year) {
        setAge((currentYear - parseInt(year)).toString());
      }
    }
  }, [patient, currentYear]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
        birth_date: null // Limpa campo legado
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

  // --- Lógica Bidirecional Inteligente ---

  const handleAgeChange = (val) => {
    setAge(val);
    if (val && !isNaN(val)) {
      // Se digitou idade, calcula o ano
      const calculatedYear = currentYear - parseInt(val);
      setFormData(prev => ({ ...prev, birth_year: calculatedYear.toString() }));
    } else {
      setFormData(prev => ({ ...prev, birth_year: '' }));
    }
  };

  const handleYearChange = (val) => {
    setFormData(prev => ({ ...prev, birth_year: val }));
    if (val && !isNaN(val) && val.length === 4) {
      // Se digitou ano completo, calcula idade
      const calculatedAge = currentYear - parseInt(val);
      setAge(calculatedAge > 0 ? calculatedAge.toString() : '0');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Paciente *</Label>
          <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="owner_name">Nome do Tutor</Label>
          <Input id="owner_name" value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="species">Espécie</Label>
          <Select value={formData.species} onValueChange={val => setFormData({...formData, species: val})}>
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
          <Input id="breed" value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})} />
        </div>
      </div>

      {/* GRID INTELIGENTE: SEXO | IDADE | ANO | PESO */}
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sex">Sexo</Label>
          <Select value={formData.sex} onValueChange={val => setFormData({...formData, sex: val})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Macho</SelectItem>
              <SelectItem value="female">Fêmea</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
            <Label htmlFor="age_calc" className="text-blue-600 font-semibold">Idade</Label>
            <Input 
                id="age_calc" 
                type="number"
                placeholder="Ex: 5"
                value={age}
                onChange={e => handleAgeChange(e.target.value)}
            />
        </div>

        <div className="space-y-2">
            <Label htmlFor="birth_year">Ano Nasc.</Label>
            <Input 
                id="birth_year" 
                type="number"
                placeholder="Ex: 2020"
                value={formData.birth_year}
                onChange={e => handleYearChange(e.target.value)}
            />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input id="weight" type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}