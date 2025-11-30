/**
 * TVUSVET V2.0 - Serviço de Conexão com Firebase
 * Responsável por inicializar a conexão com a nuvem.
 */
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// No futuro, importaremos também o Firestore (banco) e Storage (imagens) aqui.

// CONFIGURAÇÃO PROVISÓRIA
// Quando você criar o projeto no console do Firebase, substituirá estes dados.
const firebaseConfig = {
  apiKey: "API_KEY_PENDENTE",
  authDomain: "tvusvet-v2.firebaseapp.com",
  projectId: "tvusvet-v2",
  storageBucket: "tvusvet-v2.appspot.com",
  messagingSenderId: "000000000",
  appId: "1:000000000:web:000000000"
};

// Inicializa o app apenas uma vez
const app = initializeApp(firebaseConfig);

// Exporta o serviço de autenticação para ser usado no AuthContext
export const auth = getAuth(app);

export default app;