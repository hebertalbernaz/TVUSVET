/**
 * TVUSVET Database Service - 100% Offline & High Capacity
 * Usa IndexedDB (via idb-keyval) para suportar armazenamento de imagens grandes
 */
import { get, set, update } from 'idb-keyval';

class DatabaseService {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    // Inicializar arrays vazios se não existirem
    const patients = await get('patients');
    if (!patients) await set('patients', []);

    const exams = await get('exams');
    if (!exams) await set('exams', []);

    const templates = await get('templates');
    if (!templates) await this.initializeDefaultTemplates();

    const refValues = await get('reference_values');
    if (!refValues) await this.initializeDefaultReferenceValues();

    const settings = await get('settings');
    if (!settings) {
      await set('settings', {
        id: 'global_settings',
        clinic_name: '',
        clinic_address: '',
        veterinarian_name: '',
        crmv: '',
        letterhead_path: null,
        letterhead_filename: null,
        letterhead_margins_mm: { top: 30, left: 15, right: 15, bottom: 20 },
        saved_backup_passphrase: null
      });
    }
    
    this.initialized = true;
  }

  // ============= PACIENTES =============
  
  async createPatient(patient) {
    const newPatient = {
      ...patient,
      id: this.generateId(),
      created_at: new Date().toISOString()
    };
    await update('patients', (val) => [...(val || []), newPatient]);
    return newPatient;
  }

  async getPatients() {
    return (await get('patients')) || [];
  }

  async getPatient(id) {
    const patients = await this.getPatients();
    return patients.find(p => p.id === id) || null;
  }

  async updatePatient(id, patientData) {
    const patients = await this.getPatients();
    const index = patients.findIndex(p => p.id === id);
    if (index !== -1) {
      patients[index] = { ...patients[index], ...patientData };
      await set('patients', patients);
      return patients[index];
    }
    throw new Error('Patient not found');
  }

  async deletePatient(id) {
    const patients = await this.getPatients();
    const newPatients = patients.filter(p => p.id !== id);
    await set('patients', newPatients);
    
    // Deletar exames do paciente
    const exams = await this.getExams();
    const newExams = exams.filter(e => e.patient_id !== id);
    await set('exams', newExams);
  }

  // ============= EXAMES =============
  
  async createExam(examData) {
    const newExam = {
      ...examData,
      id: this.generateId(),
      exam_type: examData.exam_type || 'ultrasound_abd',
      exam_date: examData.exam_date || new Date().toISOString(),
      organs_data: examData.organs_data || [],
      images: examData.images || [],
      created_at: new Date().toISOString()
    };
    await update('exams', (val) => [...(val || []), newExam]);
    return newExam;
  }

  async getExams(patientId = null) {
    const exams = (await get('exams')) || [];
    if (patientId) {
      return exams.filter(e => e.patient_id === patientId)
        .sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));
    }
    return exams.sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));
  }

  async getExam(id) {
    const exams = await this.getExams();
    return exams.find(e => e.id === id) || null;
  }

  async updateExam(id, examData) {
    const exams = await this.getExams();
    const index = exams.findIndex(e => e.id === id);
    if (index !== -1) {
      exams[index] = { ...exams[index], ...examData };
      await set('exams', exams);
      return exams[index];
    }
    throw new Error('Exam not found');
  }

  async deleteExam(id) {
    const exams = await this.getExams();
    const newExams = exams.filter(e => e.id !== id);
    await set('exams', newExams);
  }

  // ============= IMAGENS =============
  
  async saveImage(examId, imageData) {
    const exam = await this.getExam(examId);
    if (!exam) throw new Error('Exam not found');
    
    const imageId = this.generateId();
    const image = {
      id: imageId,
      filename: imageData.filename,
      data: imageData.data, // Base64
      organ: imageData.organ || null
    };
    
    // Garantir que images é um array
    exam.images = Array.isArray(exam.images) ? exam.images : [];
    exam.images.push(image);
    await this.updateExam(examId, exam);
    return image;
  }

  async deleteImage(examId, imageId) {
    const exam = await this.getExam(examId);
    if (!exam) throw new Error('Exam not found');
    
    if (Array.isArray(exam.images)) {
      exam.images = exam.images.filter(img => img.id !== imageId);
      await this.updateExam(examId, exam);
    }
  }

  // ============= TEMPLATES E CONFIGS =============

  async initializeDefaultTemplates() {
    // Lista simplificada para inicialização. 
    // Em produção, você pode copiar a lista completa do arquivo antigo se desejar.
    const templates = [
      {
        id: this.generateId(),
        organ: 'Fígado',
        category: 'normal',
        title: 'Achado Normal',
        text: 'Fígado com dimensões, contornos, ecogenicidade e ecotextura preservados.',
        order: 1
      }
      // Adicione mais templates padrão aqui se necessário
    ];
    await set('templates', templates);
  }

  async getTemplates(organ = null) {
    const templates = (await get('templates')) || [];
    if (organ) {
      return templates.filter(t => t.organ === organ).sort((a, b) => a.order - b.order);
    }
    return templates.sort((a, b) => a.order - b.order);
  }

  async createTemplate(templateData) {
    const newTemplate = { ...templateData, id: this.generateId() };
    await update('templates', (val) => [...(val || []), newTemplate]);
    return newTemplate;
  }

  async updateTemplate(id, templateData) {
    const templates = await this.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
      templates[index] = { ...templates[index], ...templateData };
      await set('templates', templates);
      return templates[index];
    }
  }

  async deleteTemplate(id) {
    const templates = await this.getTemplates();
    const newTemplates = templates.filter(t => t.id !== id);
    await set('templates', newTemplates);
  }

  // ============= REFERENCIAS =============

  async initializeDefaultReferenceValues() {
     // Inicializa vazio para evitar erros, usuário pode adicionar depois
    await set('reference_values', []);
  }

  async getReferenceValues(filters = {}) {
    let values = (await get('reference_values')) || [];
    if (filters.organ) values = values.filter(v => v.organ === filters.organ);
    if (filters.species) values = values.filter(v => v.species === filters.species);
    if (filters.size) values = values.filter(v => v.size === filters.size);
    return values;
  }

  async createReferenceValue(valueData) {
    const newValue = { ...valueData, id: this.generateId() };
    await update('reference_values', (val) => [...(val || []), newValue]);
    return newValue;
  }

  async updateReferenceValue(id, valueData) {
    const values = await this.getReferenceValues();
    const index = values.findIndex(v => v.id === id);
    if (index !== -1) {
      values[index] = { ...values[index], ...valueData };
      await set('reference_values', values);
      return values[index];
    }
  }

  async deleteReferenceValue(id) {
    const values = await this.getReferenceValues();
    const newValues = values.filter(v => v.id !== id);
    await set('reference_values', newValues);
  }

  // ============= SETTINGS & BACKUP =============

  async getSettings() {
    return (await get('settings')) || {};
  }

  async updateSettings(settingsData) {
    const current = await this.getSettings();
    const updated = { ...current, ...settingsData };
    await set('settings', updated);
    return updated;
  }

  async exportBackup() {
    const data = {
      patients: await this.getPatients(),
      exams: await this.getExams(),
      templates: await this.getTemplates(),
      reference_values: await this.getReferenceValues(),
      settings: await this.getSettings(),
      exported_at: new Date().toISOString(),
      version: '1.0.0'
    };
    return JSON.stringify(data, null, 2);
  }

  async importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.patients) await set('patients', data.patients);
      if (data.exams) await set('exams', data.exams);
      if (data.templates) await set('templates', data.templates);
      if (data.reference_values) await set('reference_values', data.reference_values);
      if (data.settings) await set('settings', data.settings);
      return true;
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const db = new DatabaseService();