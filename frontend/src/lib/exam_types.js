/**
 * TVUSVET - Clinical Exam Types Configuration
 * Clinically accurate structures and measurements for veterinary diagnostics
 */

// ============= ECHOCARDIOGRAM STRUCTURES =============
export const ECHOCARDIOGRAM_STRUCTURES = [
  {
    id: 'analise_2d',
    label: 'Análise 2D (Modo-B)',
    measurements: []  // Descriptive analysis, no specific measurements
  },
  {
    id: 'lv_m_mode',
    label: 'Ventrículo Esquerdo (Modo-M)',
    measurements: [
      { id: 'ivsd', label: 'SIVd (diástole)', unit: 'cm', description: 'Septo Interventricular em diástole' },
      { id: 'lvidd', label: 'DIVEd (diástole)', unit: 'cm', description: 'Diâmetro Interno do VE em diástole' },
      { id: 'pwd', label: 'PPVEd (diástole)', unit: 'cm', description: 'Parede Posterior do VE em diástole' },
      { id: 'ivss', label: 'SIVs (sístole)', unit: 'cm', description: 'Septo Interventricular em sístole' },
      { id: 'lvids', label: 'DIVEs (sístole)', unit: 'cm', description: 'Diâmetro Interno do VE em sístole' },
      { id: 'pws', label: 'PPVEs (sístole)', unit: 'cm', description: 'Parede Posterior do VE em sístole' },
      { id: 'fe', label: 'Fração de Ejeção (FE)', unit: '%', description: 'Fração de Ejeção' },
      { id: 'fs', label: 'Fração de Encurtamento (FS)', unit: '%', description: 'Fração de Encurtamento' }
    ]
  },
  {
    id: 'ao_la_ratio',
    label: 'Relação Aorta/Átrio Esquerdo (Modo-M)',
    measurements: [
      { id: 'ao', label: 'Aorta (Ao)', unit: 'cm', description: 'Diâmetro da Aorta' },
      { id: 'la', label: 'Átrio Esquerdo (AE)', unit: 'cm', description: 'Diâmetro do Átrio Esquerdo' },
      { id: 'la_ao_ratio', label: 'Relação AE/Ao', unit: '', description: 'Razão AE/Ao' }
    ]
  },
  {
    id: 'doppler_mitral',
    label: 'Análise Doppler (Valva Mitral)',
    measurements: [
      { id: 'e_wave', label: 'Onda E', unit: 'cm/s', description: 'Velocidade da onda E' },
      { id: 'a_wave', label: 'Onda A', unit: 'cm/s', description: 'Velocidade da onda A' },
      { id: 'e_a_ratio', label: 'Relação E/A', unit: '', description: 'Razão E/A' },
      { id: 'decel_time', label: 'Tempo de Desaceleração', unit: 'ms', description: 'Tempo de desaceleração da onda E' }
    ]
  },
  {
    id: 'doppler_aortic',
    label: 'Análise Doppler (Valva Aórtica)',
    measurements: [
      { id: 'max_velocity', label: 'Velocidade Máxima', unit: 'cm/s', description: 'Velocidade máxima do fluxo aórtico' },
      { id: 'pressure_gradient', label: 'Gradiente de Pressão', unit: 'mmHg', description: 'Gradiente de pressão transvalvar' }
    ]
  },
  {
    id: 'doppler_pulmonary',
    label: 'Análise Doppler (Valva Pulmonar)',
    measurements: [
      { id: 'max_velocity', label: 'Velocidade Máxima', unit: 'cm/s', description: 'Velocidade máxima do fluxo pulmonar' },
      { id: 'pressure_gradient', label: 'Gradiente de Pressão', unit: 'mmHg', description: 'Gradiente de pressão transvalvar' }
    ]
  },
  {
    id: 'doppler_tricuspid',
    label: 'Análise Doppler (Valva Tricúspide)',
    measurements: [
      { id: 'max_velocity', label: 'Velocidade Máxima', unit: 'cm/s', description: 'Velocidade máxima de regurgitação' },
      { id: 'pressure_gradient', label: 'Gradiente de Pressão', unit: 'mmHg', description: 'Gradiente de pressão sistólica' }
    ]
  },
  {
    id: 'echo_conclusion',
    label: 'Conclusão Ecocardiográfica',
    measurements: []  // Summary section, no measurements
  }
];

// ============= ELECTROCARDIOGRAM STRUCTURES =============
export const ECG_STRUCTURES = [
  {
    id: 'rhythm_frequency',
    label: 'Ritmo e Frequência',
    measurements: [
      { id: 'rhythm_type', label: 'Tipo de Ritmo', unit: '', description: 'Ex: Sinusal, Arritmia Sinusal' },
      { id: 'heart_rate', label: 'Frequência Cardíaca (FC)', unit: 'bpm', description: 'Batimentos por minuto' }
    ]
  },
  {
    id: 'wave_measurements',
    label: 'Medições (Ondas e Intervalos)',
    measurements: [
      { id: 'p_duration', label: 'Onda P (duração)', unit: 'ms', description: 'Duração da onda P' },
      { id: 'p_amplitude', label: 'Onda P (amplitude)', unit: 'mV', description: 'Amplitude da onda P' },
      { id: 'qrs_duration', label: 'Complexo QRS', unit: 'ms', description: 'Duração do complexo QRS' },
      { id: 'qrs_amplitude', label: 'Amplitude QRS', unit: 'mV', description: 'Amplitude do QRS' },
      { id: 'pr_interval', label: 'Intervalo PR', unit: 'ms', description: 'Intervalo PR' },
      { id: 'qt_interval', label: 'Intervalo QT', unit: 'ms', description: 'Intervalo QT' }
    ]
  },
  {
    id: 'electrical_axis',
    label: 'Eixo Elétrico',
    measurements: [
      { id: 'axis_degrees', label: 'Eixo', unit: 'graus', description: 'Eixo elétrico médio' }
    ]
  },
  {
    id: 'ecg_conclusion',
    label: 'Conclusão Ritmológica',
    measurements: []  // Summary section
  }
];

// ============= RADIOGRAPHY STRUCTURES =============
export const RADIOGRAPHY_STRUCTURES = [
  {
    id: 'projections',
    label: 'Projeções Realizadas',
    measurements: []  // Descriptive: LL Direita, LL Esquerda, VD, etc.
  },
  {
    id: 'thorax_lungs',
    label: 'Tórax - Campos Pulmonares',
    measurements: []  // Generic measurements if needed (nodule size, etc.)
  },
  {
    id: 'thorax_heart',
    label: 'Tórax - Silhueta Cardíaca',
    measurements: [
      { id: 'vhs', label: 'VHS (Vertebral Heart Score)', unit: 'v', description: 'Escore Cardíaco Vertebral' }
    ]
  },
  {
    id: 'thorax_trachea',
    label: 'Tórax - Traqueia e Vasos',
    measurements: []
  },
  {
    id: 'abdomen_serosa',
    label: 'Abdômen - Serosas e Fígado',
    measurements: []
  },
  {
    id: 'abdomen_spleen_kidney',
    label: 'Abdômen - Baço e Rins',
    measurements: []
  },
  {
    id: 'abdomen_gi',
    label: 'Abdômen - Trato Gastrointestinal',
    measurements: []
  },
  {
    id: 'musculoskeletal',
    label: 'Sistema Musculoesquelético',
    measurements: []
  },
  {
    id: 'radio_conclusion',
    label: 'Conclusão Radiográfica',
    measurements: []
  }
];

// ============= TOMOGRAPHY STRUCTURES =============
export const TOMOGRAPHY_STRUCTURES = [
  {
    id: 'study_info',
    label: 'Informações do Estudo',
    measurements: []  // Descriptive: Region, Planes, Contrast usage
  },
  {
    id: 'findings_lungs',
    label: 'Achados - Parênquima Pulmonar',
    measurements: []  // Ad-hoc measurements (nodule HU, size)
  },
  {
    id: 'findings_mediastinum',
    label: 'Achados - Mediastino',
    measurements: []
  },
  {
    id: 'findings_bone',
    label: 'Achados - Estruturas Ósseas',
    measurements: []
  },
  {
    id: 'findings_soft_tissue',
    label: 'Achados - Tecidos Moles',
    measurements: []
  },
  {
    id: 'tomo_conclusion',
    label: 'Conclusão Tomográfica',
    measurements: []
  }
];

// ============= ABDOMINAL ULTRASOUND (Original) =============
export const ABDOMINAL_ORGANS = [
  'Estômago', 'Fígado', 'Baço', 'Rim Esquerdo', 'Rim Direito',
  'Vesícula Urinária', 'Adrenal Esquerda', 'Adrenal Direita',
  'Duodeno', 'Jejuno', 'Cólon', 'Ceco', 'Íleo', 'Linfonodos'
];

export const REPRODUCTIVE_ORGANS_MALE = ['Próstata', 'Testículo Direito', 'Testículo Esquerdo'];
export const REPRODUCTIVE_ORGANS_MALE_NEUTERED = ['Próstata'];
export const REPRODUCTIVE_ORGANS_FEMALE = ['Corpo Uterino', 'Corno Uterino Direito', 'Corno Uterino Esquerdo', 'Ovário Direito', 'Ovário Esquerdo'];

/**
 * Exam type configurations with clinical measurements
 */
export const EXAM_TYPES = {
  ultrasound_abd: {
    id: 'ultrasound_abd',
    name: 'Ultrassom Abdominal',
    icon: '🔊',
    description: 'Exame ultrassonográfico abdominal completo',
    useGenericMeasurements: true,  // Uses old "Adicionar Medida" system
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
      // Convert to structure objects for consistency
      return structures.map(name => ({ label: name, measurements: [] }));
    }
  },
  echocardiogram: {
    id: 'echocardiogram',
    name: 'Ecocardiograma',
    icon: '❤️',
    description: 'Ecocardiografia com Doppler',
    useGenericMeasurements: false,  // Uses clinical measurement schema
    getStructures: () => ECHOCARDIOGRAM_STRUCTURES
  },
  ecg: {
    id: 'ecg',
    name: 'Eletrocardiograma',
    icon: '📈',
    description: 'Eletrocardiograma (ECG)',
    useGenericMeasurements: false,
    getStructures: () => ECG_STRUCTURES
  },
  radiography: {
    id: 'radiography',
    name: 'Radiografia',
    icon: '📷',
    description: 'Exame radiográfico',
    useGenericMeasurements: true,  // Hybrid: some structures have specific measurements, others allow ad-hoc
    getStructures: () => RADIOGRAPHY_STRUCTURES
  },
  tomography: {
    id: 'tomography',
    name: 'Tomografia',
    icon: '🔬',
    description: 'Tomografia computadorizada',
    useGenericMeasurements: true,  // Always allows ad-hoc measurements
    getStructures: () => TOMOGRAPHY_STRUCTURES
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

/**
 * Check if exam type uses generic measurements
 */
export function usesGenericMeasurements(examType) {
  const config = EXAM_TYPES[examType];
  return config ? config.useGenericMeasurements : true;
}
