import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { db } from '@/services/database';
import HomePage from '@/pages/HomePage';
import SettingsPage from '@/pages/SettingsPage';
import ExamPage from '@/pages/ExamPage';
import { ThemeProvider } from 'next-themes';
import '@/App.css';

function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      try {
        await db.init();
        setIsDbReady(true);
        console.log('✅ Database initialized (offline mode)');
      } catch (error) {
        console.error('❌ Database initialization error:', error);
      }
    };
    initDB();
  }, []);

  if (!isDbReady) {
    return <div className="flex h-screen items-center justify-center">Carregando sistema...</div>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="App bg-background text-foreground min-h-screen">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/exam/:examId" element={<ExamPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;