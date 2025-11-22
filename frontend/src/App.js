import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom'; // 🔴 MUDANÇA AQUI: HashRouter
import { ThemeProvider } from 'next-themes';
import '@/App.css';
import '@/print.css';
import { db } from '@/services/database';
import HomePage from '@/pages/HomePage';
import SettingsPage from '@/pages/SettingsPage';
import ExamPageV2 from '@/pages/ExamPageV2'; // Certifique-se que está importando o V2
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
        {/* 🔴 IMPORTANTE: HashRouter adiciona uma # na URL, permitindo rodar offline */}
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/exam/:examId" element={<ExamPageV2 />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </HashRouter>
        <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;