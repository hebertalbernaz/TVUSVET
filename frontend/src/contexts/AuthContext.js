/**
 * TVUSVET V2.0 - Contexto de Autenticação
 * Gerencia o estado global do usuário (Logado/Deslogado)
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { auth } from '../services/auth/firebase';

const AuthContext = createContext({});

// Hook personalizado para facilitar o uso em outros componentes
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função de Login
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Função de Logout
  const logout = () => {
    return signOut(auth);
  };

  // Ouve alterações no estado da autenticação (Login/Logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Só para de carregar quando o Firebase confirma o status
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};