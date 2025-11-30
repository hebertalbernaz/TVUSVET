import { get, set, update } from 'idb-keyval';

class DatabaseService {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    const patients = await get('patients');
    if (!patients) await set('patients', []);

    const exams = await get('exams');
    if (!exams) await set('exams', []);

    const templates = await get('templates');
    if (!templates || templates.length < 5 || !templates[0].lang) {
        await this.initializeDefaultTemplates();
    }

    const refValues = await get('reference_values');
    if (!refValues) await this.initializeDefaultReferenceValues();

    // 🟢 NOVO: Inicializa lista de perfis
    const profiles = await get('profiles');
    if (!profiles) await set('profiles', []);

    const settings = await get('settings');
    if (!settings) {
      await set('settings', {
        id: 'global_settings',
        clinic_name: '',
        clinic_address: '',
        veterinarian_name: '',
        crmv: '',
        professional_email: '',
        professional_phone: '',
        letterhead_path: null,
        signature_path: null,
        letterhead_margins_mm: { top: 30, left: 15, right: 15, bottom: 20 },
        saved_backup_passphrase: null
      });
    }
    
    this.initialized = true;
  }

  // --- MÉTODOS EXISTENTES (Pacientes, Exames, Imagens...) MANTENHA IGUAL ---
  async createPatient(p) { const np = { ...p, id: this.genId(), created_at: new Date().toISOString() }; await update('patients', (v) => [...(v||[]), np]); return np; }
  async getPatients() { return (await get('patients')) || []; }
  async getPatient(id) { return (await this.getPatients()).find(p => p.id === id) || null; }
  async updatePatient(id, d) { const ps = await this.getPatients(); const i = ps.findIndex(p => p.id === id); if(i!==-1) { ps[i] = {...ps[i], ...d}; await set('patients', ps); return ps[i]; } throw new Error('Not found'); }
  async deletePatient(id) { const ps = await this.getPatients(); await set('patients', ps.filter(p => p.id !== id)); const es = await this.getExams(); await set('exams', es.filter(e => e.patient_id !== id)); }

  async createExam(d) { const ne = { ...d, id: this.genId(), exam_type: d.exam_type||'ultrasound_abd', exam_date: d.exam_date||new Date().toISOString(), organs_data: d.organs_data||[], images: d.images||[], created_at: new Date().toISOString() }; await update('exams', (v) => [...(v||[]), ne]); return ne; }
  async getExams(pid = null) { const es = (await get('exams')) || []; if(pid) return es.filter(e => e.patient_id === pid).sort((a,b)=>new Date(b.exam_date)-new Date(a.exam_date)); return es.sort((a,b)=>new Date(b.exam_date)-new Date(a.exam_date)); }
  async getExam(id) { return (await this.getExams()).find(e => e.id === id) || null; }
  async updateExam(id, d) { const es = await this.getExams(); const i = es.findIndex(e => e.id === id); if(i!==-1) { es[i] = {...es[i], ...d}; await set('exams', es); return es[i]; } throw new Error('Not found'); }
  async deleteExam(id) { const es = await this.getExams(); await set('exams', es.filter(e => e.id !== id)); }

  async saveImage(eid, d) { 
      const e = await this.getExam(eid); 
      if(!e) throw new Error('Exam not found'); 
      const img = { 
          id: this.genId(), 
          filename: d.filename, 
          data: d.data, 
          originalData: d.data,
          organ: d.organ||null,
          mimeType: d.mimeType || 'image/png'
      }; 
      e.images = Array.isArray(e.images)?e.images:[]; 
      e.images.push(img); 
      await this.updateExam(eid, e); 
      return img; 
  }
  
  async deleteImage(eid, iid) { const e = await this.getExam(eid); if(!e) throw new Error('Exam not found'); if(Array.isArray(e.images)) { e.images = e.images.filter(i => i.id !== iid); await this.updateExam(eid, e); } }

  // --- TEMPLATES & REFS (MANTENHA IGUAL) ---
  async initializeDefaultTemplates() {
    // (Mantenha o conteúdo original aqui para economizar espaço na resposta, ele não mudou)
    // ... Se precisar que eu repita, avise.
    const templates = [
      { id: this.genId(), organ: 'Fígado', lang: 'pt', title: 'Normal', text: 'Fígado com dimensões...' },
      // ...
    ];
    await set('templates', templates);
  }
  async getTemplates(organ = null) { const t = (await get('templates')) || []; if(organ) return t.filter(x => x.organ === organ); return t; }
  async createTemplate(d) { const n = { ...d, id: this.genId(), lang: d.lang || 'pt' }; await update('templates', (v) => [...(v||[]), n]); return n; }
  async updateTemplate(id, d) { const ts = await this.getTemplates(); const i = ts.findIndex(t => t.id === id); if(i!==-1) { ts[i] = {...ts[i], ...d}; await set('templates', ts); return ts[i]; } }
  async deleteTemplate(id) { const ts = await this.getTemplates(); await set('templates', ts.filter(t => t.id !== id)); }
  async initializeDefaultReferenceValues() { await set('reference_values', []); }
  async getReferenceValues(f={}) { let v = (await get('reference_values'))||[]; if(f.organ) v=v.filter(x=>x.organ===f.organ); if(f.species) v=v.filter(x=>x.species===f.species); return v; }
  async createReferenceValue(d) { const n={...d,id:this.genId()}; await update('reference_values',(v)=>[...(v||[]),n]); return n; }
  async deleteReferenceValue(id) { const v=await this.getReferenceValues(); await set('reference_values', v.filter(x=>x.id!==id)); }
  
async getSettings() { return (await get('settings'))||{}; }
  
  // 🔴 ATUALIZADO: Agora salva o ID do perfil ativo nas configurações
  async updateSettings(d) { 
      const c = await this.getSettings(); 
      const u = {...c, ...d}; 
      await set('settings', u); 
      return u; 
  }
  
  // 🟢 ÁREA DE PERFIS REFORMULADA
  async getProfiles() { return (await get('profiles')) || []; }
  
async createProfile(name, settingsData) {
      const profile = {
          id: this.genId(),
          name: name,
          // Garante que salve campos vazios se não existirem
          clinic_name: settingsData.clinic_name || '',
          clinic_address: settingsData.clinic_address || '',
          veterinarian_name: settingsData.veterinarian_name || '',
          crmv: settingsData.crmv || '',
          professional_email: settingsData.professional_email || '',
          professional_phone: settingsData.professional_phone || '',
          letterhead_path: settingsData.letterhead_path || null,
          signature_path: settingsData.signature_path || null,
          letterhead_margins_mm: settingsData.letterhead_margins_mm || { top: 30, left: 15, right: 15, bottom: 20 }
      };
      await update('profiles', (v) => [...(v||[]), profile]);
      await this.activateProfile(profile.id);
      return profile;
  }

  // 🟢 NOVO: Atualiza um perfil com dados específicos (Edição Direta)
  async updateProfile(id, data) {
      const profiles = await this.getProfiles();
      const index = profiles.findIndex(p => p.id === id);
      if (index !== -1) {
          profiles[index] = { ...profiles[index], ...data };
          await set('profiles', profiles);
          
          // Se este for o perfil ativo, atualiza as configurações globais imediatamente
          const settings = await this.getSettings();
          if (settings.active_profile_id === id) {
              await this.activateProfile(id);
          }
          return true;
      }
      return false;
  }

  async activateProfile(profileId) {
      const profiles = await this.getProfiles();
      const target = profiles.find(p => p.id === profileId);
      if (!target) throw new Error("Perfil não encontrado");

      const currentSettings = await this.getSettings();
      const newSettings = {
          ...currentSettings,
          active_profile_id: target.id,
          active_profile_name: target.name,
          
          // Força a atualização de todos os campos
          clinic_name: target.clinic_name,
          clinic_address: target.clinic_address,
          veterinarian_name: target.veterinarian_name,
          crmv: target.crmv,
          professional_email: target.professional_email,
          professional_phone: target.professional_phone,
          letterhead_path: target.letterhead_path,
          signature_path: target.signature_path,
          // Mantém margens padrão se faltar
          letterhead_margins_mm: target.letterhead_margins_mm || { top: 30, left: 15, right: 15, bottom: 20 }
      };
      await set('settings', newSettings);
      return newSettings;
  }

  async deleteProfile(id) {
      await update('profiles', (list) => list.filter(p => p.id !== id));
      const s = await this.getSettings();
      if (s.active_profile_id === id) {
          await this.updateSettings({ active_profile_id: null, active_profile_name: null });
      }
  }
  genId() { return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }
}

export const db = new DatabaseService();