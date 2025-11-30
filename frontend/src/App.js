import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner'; // Confirmando o caminho do seu UI kit
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Importação das Páginas
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ExamPage from './pages/ExamPage';
import PatientHistoryPage from './pages/PatientHistoryPage';
import SettingsPage from './pages/SettingsPage';
import ImageGalleryPage from './pages/ImageGalleryPage';

// Componente de Proteção de Rota
// Se não houver usuário logado, redireciona para /login
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  // Enquanto o Firebase verifica o login, você poderia retornar um "Loading..." aqui se quisesse
  // Mas como o AuthContext já trata o 'loading', aqui verificamos apenas a presença do usuário.
  return currentUser ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            {/* --- ROTA PÚBLICA (Login) --- */}
            <Route path="/login" element={<LoginPage />} />

            {/* --- ROTAS PRIVADAS (Protegidas) --- */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/exam" 
              element={
                <PrivateRoute>
                  <ExamPage />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/history" 
              element={
                <PrivateRoute>
                  <PatientHistoryPage />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/settings" 
              element={
                <PrivateRoute>
                  <SettingsPage />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/gallery" 
              element={
                <PrivateRoute>
                  <ImageGalleryPage />
                </PrivateRoute>
              } 
            />
          </Routes>

          {/* Componente de Notificações (Toasts) */}
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;