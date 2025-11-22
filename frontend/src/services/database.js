/**
 * TVUSVET Database Service - Multi-language Support (PT/EN)
 */
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
    // Se não existirem templates ou se forem antigos (sem idioma), recarrega
    if (!templates || templates.length < 5 || !templates[0].lang) {
        await this.initializeDefaultTemplates();
    }

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

  // ... Métodos CRUD padrão (encurtados para focar no importante) ...
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

  async saveImage(eid, d) { const e = await this.getExam(eid); if(!e) throw new Error('Exam not found'); const img = { id: this.genId(), filename: d.filename, data: d.data, organ: d.organ||null }; e.images = Array.isArray(e.images)?e.images:[]; e.images.push(img); await this.updateExam(eid, e); return img; }
  async deleteImage(eid, iid) { const e = await this.getExam(eid); if(!e) throw new Error('Exam not found'); if(Array.isArray(e.images)) { e.images = e.images.filter(i => i.id !== iid); await this.updateExam(eid, e); } }

  // ============= TEMPLATES BILINGUES =============

  async initializeDefaultTemplates() {
    const templates = [
      // FÍGADO
      { id: this.genId(), organ: 'Fígado', lang: 'pt', title: 'Normal', text: 'Fígado com dimensões, contornos, ecogenicidade e ecotextura preservados. Calibre dos vasos intra-hepáticos preservado.' },
      { id: this.genId(), organ: 'Fígado', lang: 'en', title: 'Normal', text: 'Liver with preserved dimensions, contours, echogenicity, and echotexture. Intrahepatic vessel caliber preserved.' },
      
      // VESÍCULA BILIAR
      { id: this.genId(), organ: 'Vesícula Biliar', lang: 'pt', title: 'Normal', text: 'Vesícula biliar com paredes finas e regulares, repleta por conteúdo anecóico.' },
      { id: this.genId(), organ: 'Vesícula Biliar', lang: 'en', title: 'Normal', text: 'Gallbladder with thin and regular walls, filled with anechoic content.' },

      // BAÇO
      { id: this.genId(), organ: 'Baço', lang: 'pt', title: 'Normal', text: 'Baço com dimensões, ecogenicidade e ecotextura preservados.' },
      { id: this.genId(), organ: 'Baço', lang: 'en', title: 'Normal', text: 'Spleen with preserved dimensions, echogenicity, and echotexture.' },

      // RINS
      { id: this.genId(), organ: 'Rim Esquerdo', lang: 'pt', title: 'Normal', text: 'Rim esquerdo com dimensões preservadas, relação cortico-medular mantida e arquitetura interna preservada.' },
      { id: this.genId(), organ: 'Rim Esquerdo', lang: 'en', title: 'Normal', text: 'Left kidney with preserved dimensions, maintained corticomedullary ratio, and preserved internal architecture.' },
      
      { id: this.genId(), organ: 'Rim Direito', lang: 'pt', title: 'Normal', text: 'Rim direito com dimensões preservadas, relação cortico-medular mantida e arquitetura interna preservada.' },
      { id: this.genId(), organ: 'Rim Direito', lang: 'en', title: 'Normal', text: 'Right kidney with preserved dimensions, maintained corticomedullary ratio, and preserved internal architecture.' },

      // VESÍCULA URINÁRIA
      { id: this.genId(), organ: 'Vesícula Urinária', lang: 'pt', title: 'Normal', text: 'Vesícula urinária com paredes finas e regulares, conteúdo anecóico.' },
      { id: this.genId(), organ: 'Vesícula Urinária', lang: 'en', title: 'Normal', text: 'Urinary bladder with thin and regular walls, anechoic content.' },

      // TGI
      { id: this.genId(), organ: 'Estômago', lang: 'pt', title: 'Normal', text: 'Estômago com estratificação parietal preservada e espessura de parede dentro dos limites da normalidade.' },
      { id: this.genId(), organ: 'Estômago', lang: 'en', title: 'Normal', text: 'Stomach with preserved wall stratification and wall thickness within normal limits.' },

      { id: this.genId(), organ: 'Jejuno', lang: 'pt', title: 'Normal', text: 'Alças jejunais com peristaltismo presente, estratificação parietal preservada e espessura adequada.' },
      { id: this.genId(), organ: 'Jejuno', lang: 'en', title: 'Normal', text: 'Jejunal loops with peristalsis present, preserved wall stratification, and adequate thickness.' },
      
      // CONCLUSÃO
      { id: this.genId(), organ: 'Conclusão', lang: 'pt', title: 'Normal', text: 'Exame ultrassonográfico dentro dos limites da normalidade para a espécie e faixa etária.' },
      { id: this.genId(), organ: 'Conclusão', lang: 'en', title: 'Normal', text: 'Ultrasound examination within normal limits for the species and age group.' }
    ];
    await set('templates', templates);
  }

  async getTemplates(organ = null) { const t = (await get('templates')) || []; if(organ) return t.filter(x => x.organ === organ); return t; }
  async createTemplate(d) { const n = { ...d, id: this.genId(), lang: d.lang || 'pt' }; await update('templates', (v) => [...(v||[]), n]); return n; }
  async updateTemplate(id, d) { const ts = await this.getTemplates(); const i = ts.findIndex(t => t.id === id); if(i!==-1) { ts[i] = {...ts[i], ...d}; await set('templates', ts); return ts[i]; } }
  async deleteTemplate(id) { const ts = await this.getTemplates(); await set('templates', ts.filter(t => t.id !== id)); }

  // ... (Reference Values, Settings, Backup mantêm iguais) ...
  async initializeDefaultReferenceValues() { await set('reference_values', []); }
  async getReferenceValues(f={}) { let v = (await get('reference_values'))||[]; if(f.organ) v=v.filter(x=>x.organ===f.organ); if(f.species) v=v.filter(x=>x.species===f.species); return v; }
  async createReferenceValue(d) { const n={...d,id:this.genId()}; await update('reference_values',(v)=>[...(v||[]),n]); return n; }
  async deleteReferenceValue(id) { const v=await this.getReferenceValues(); await set('reference_values', v.filter(x=>x.id!==id)); }
  async getSettings() { return (await get('settings'))||{}; }
  async updateSettings(d) { const c=await this.getSettings(); const u={...c,...d}; await set('settings',u); return u; }
  async exportBackup() { return JSON.stringify({ patients:await this.getPatients(), exams:await this.getExams(), templates:await this.getTemplates(), reference_values:await this.getReferenceValues(), settings:await this.getSettings() }); }
  async importBackup(j) { try { const d=JSON.parse(j); if(d.patients) await set('patients',d.patients); if(d.exams) await set('exams',d.exams); if(d.templates) await set('templates',d.templates); if(d.settings) await set('settings',d.settings); return true; } catch(e) { return false; } }

  genId() { return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }
}

export const db = new DatabaseService();