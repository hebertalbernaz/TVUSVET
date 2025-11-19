/**
 * TVUSVET - Exam Types Configuration
 * Defines structures/organs for each exam modality
 */

// Abdominal Ultrasound Organs
export const ABDOMINAL_ORGANS = [
  'Estômago', 'Fígado', 'Baço', 'Rim Esquerdo', 'Rim Direito',
  'Vesícula Urinária', 'Adrenal Esquerda', 'Adrenal Direita',
  'Duodeno', 'Jejuno', 'Cólon', 'Ceco', 'Íleo', 'Linfonodos'
];

// Reproductive organs for abdominal ultrasound
export const REPRODUCTIVE_ORGANS_MALE = ['Próstata', 'Testículo Direito', 'Testículo Esquerdo'];
export const REPRODUCTIVE_ORGANS_MALE_NEUTERED = ['Próstata'];
export const REPRODUCTIVE_ORGANS_FEMALE = ['Corpo Uterino', 'Corno Uterino Direito', 'Corno Uterino Esquerdo', 'Ovário Direito', 'Ovário Esquerdo'];

// Echocardiogram Structures
export const ECHOCARDIOGRAM_STRUCTURES = [
  'Valva Mitral',
  'Valva Aórtica',
  'Valva Tricúspide',
  'Valva Pulmonar',
  'Ventrículo Esquerdo (Modo M)',
  'Ventrículo Direito',
  'Átrio Esquerdo',
  'Átrio Direito',
  'Septo Interventricular',
  'Parede Livre VE',
  'Aorta',
  'Artéria Pulmonar',
  'Doppler Aórtico',
  'Doppler Mitral',
  'Doppler Tricúspide',
  'Derrame Pericárdico',
  'Função Sistólica',
  'Função Diastólica'
];

// ECG Leads and Parameters
export const ECG_LEADS = [
  'Traçado DII',
  'Análise de Ritmo',
  'Frequência Cardíaca',
  'Intervalo PR',
  'Duração QRS',
  'Intervalo QT',
  'Segmento ST',
  'Onda P',
  'Onda T',
  'Eixo Elétrico',
  'Arritmias',
  'Conclusão'
];

// Radiography Views
export const RADIOGRAPHY_VIEWS = [
  'Projeção VD (Ventro-Dorsal)',
  'Projeção LL (Látero-Lateral)',
  'Tórax - Campos Pulmonares',
  'Tórax - Silhueta Cardíaca',
  'Tórax - Traqueia e Brônquios',
  'Tórax - Mediastino',
  'Abdômen - Órgãos',
  'Abdômen - Intestinos',
  'Abdômen - Bexiga',
  'Musculoesquelético',
  'Coluna Vertebral',
  'Conclusão Radiográfica'
];

// Tomography Scan Regions
export const TOMOGRAPHY_SCANS = [
  'Região Escaneada',
  'Plano de Corte',
  'Uso de Contraste',
  'Fase Arterial',
  'Fase Venosa',
  'Fase Tardia',
  'Achados Crânio',
  'Achados Tórax',
  'Achados Abdômen',
  'Achados Membros',
  'Achados Coluna',
  'Medidas e Dimensões',
  'Conclusão Tomográfica'
];

/**
 * Exam type configurations
 */
export const EXAM_TYPES = {
  ultrasound_abd: {
    id: 'ultrasound_abd',
    name: 'Ultrassom Abdominal',
    icon: '🔊',
    description: 'Exame ultrassonográfico abdominal completo',
    getStructures: (patient) => {
      const structures = [...ABDOMINAL_ORGANS];
      if (patient?.sex === 'male') {
        if (patient?.is_neutered) {
          structures.push(...REPRODUCTIVE_ORGANS_MALE_NEUTERED);
        } else {
          structures.push(...REPRODUCTIVE_ORGANS_MALE);
        }
      } else {
        if (!patient?.is_neutered) {
          structures.push(...REPRODUCTIVE_ORGANS_FEMALE);
        }
      }
      return structures;
    }
  },
  echocardiogram: {
    id: 'echocardiogram',
    name: 'Ecocardiograma',
    icon: '❤️',
    description: 'Ecocardiografia com Doppler',
    getStructures: () => ECHOCARDIOGRAM_STRUCTURES
  },
  ecg: {
    id: 'ecg',
    name: 'Eletrocardiograma',
    icon: '📈',
    description: 'Eletrocardiograma (ECG)',
    getStructures: () => ECG_LEADS
  },
  radiography: {
    id: 'radiography',
    name: 'Radiografia',
    icon: '📷',
    description: 'Exame radiográfico',
    getStructures: () => RADIOGRAPHY_VIEWS
  },
  tomography: {
    id: 'tomography',
    name: 'Tomografia',
    icon: '🔬',
    description: 'Tomografia computadorizada',
    getStructures: () => TOMOGRAPHY_SCANS
  }
};

/**
 * Get structures for a specific exam type
 */
export function getStructuresForExam(examType, patient = null) {
  const config = EXAM_TYPES[examType];
  if (!config) {
    console.warn(`Unknown exam type: ${examType}, defaulting to ultrasound_abd`);
    return EXAM_TYPES.ultrasound_abd.getStructures(patient);
  }
  return config.getStructures(patient);
}

/**
 * Get exam type display name
 */
export function getExamTypeName(examType) {
  const config = EXAM_TYPES[examType];
  return config ? config.name : 'Exame';
}

/**
 * Get all exam types as array for selection
 */
export function getAllExamTypes() {
  return Object.values(EXAM_TYPES);
}
