const path = require('path');
const { app, BrowserWindow, session } = require('electron');

// Verifica se é desenvolvimento ou produção (sem depender de libs externas)
const isDev = !app.isPackaged;

async function createWindow() {
  // 🔴 NOVO: Limpeza de Cache Nuclear ao iniciar
  // Isso impede que versões antigas fiquem presas e causem tela branca
  await session.defaultSession.clearCache();
  await session.defaultSession.clearStorageData({
    storages: ['appcache', 'serviceworkers', 'cachestorage', 'shadercache']
  });

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "TVUSVET Laudos",
    icon: path.join(__dirname, 'icon-512.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Permite carregar imagens locais
      // Desativa cache adicional
      cache: false 
    },
  });

  win.setMenuBarVisibility(false);

if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // 🔴 CORREÇÃO: Adiciona query param para ignorar cache do arquivo local
    win.loadURL(`file://${path.join(__dirname, '../build/index.html')}?v=${Date.now()}`);
  }

  // 🔴 NOVO: Força o foco na janela ao abrir para garantir renderização
  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });
}

// Inicialização do App
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});