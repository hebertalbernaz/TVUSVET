import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import '@/App.css';
// import '@/print.css'; // (Já está unificado no App.css se você seguiu o passo anterior)
import { db } from '@/services/database';
import HomePage from '@/pages/HomePage';
import SettingsPage from '@/pages/SettingsPage';
import ExamPage from '@/pages/ExamPageV2'; // Mantendo ExamPage conforme seu uso atual
import PatientHistoryPage from '@/pages/PatientHistoryPage'; // 1. IMPORTAR AQUI
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      try {
        await db.init();
        console.log('✅ Database initialized');
        setIsDbReady(true);
      } catch (error) {
        console.error('❌ DB Error:', error);
        setIsDbReady(true); 
      }
    };
    initDB();
  }, []);

  if (!isDbReady) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="App">
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/exam/:examId" element={<ExamPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* 2. NOVA ROTA DE HISTÓRICO */}
            <Route path="/history/:patientId" element={<PatientHistoryPage />} />
          </Routes>
        </HashRouter>
        <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;