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
  apiKey: "AIzaSyB7pXsHHY05pmxVpiDdOTpjJHCMUjbq5-k",
  authDomain: "tvus-v2.firebaseapp.com",
  projectId: "tvus-v2",
  storageBucket: "tvus-v2.firebasestorage.app",
  messagingSenderId: "320970420744",
  appId: "1:320970420744:web:f7e53a38bc41e3a04117bd"
};

// Inicializa o app apenas uma vez
const app = initializeApp(firebaseConfig);

// Exporta o serviço de autenticação para ser usado no AuthContext
export const auth = getAuth(app);

export default app;