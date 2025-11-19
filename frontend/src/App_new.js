import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { db } from '@/services/database';
import HomePage from '@/pages/HomePage';
import SettingsPage from '@/pages/SettingsPage';
import '@/App.css';

function App() {
  useEffect(() => {
    // Inicializar banco de dados offline
    const initDB = async () => {
      try {
        await db.init();
        console.log('✅ Database initialized (offline mode)');
      } catch (error) {
        console.error('❌ Database initialization error:', error);
      }
    };
    initDB();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
