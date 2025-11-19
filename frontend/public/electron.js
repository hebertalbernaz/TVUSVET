const path = require('path');
const { app, BrowserWindow } = require('electron');

// Verificação manual (Removemos a biblioteca problemática)
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "TVUSVET Laudos",
    // Ícone (tenta carregar, se falhar em dev não tem problema)
    icon: path.join(__dirname, 'favicon.ico'), 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Permite carregar imagens locais
    },
  });

  win.setMenuBarVisibility(false);

  // Em dev usa localhost, em prod usa o arquivo
  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );
  
  // Abre ferramentas de desenvolvedor apenas em modo DEV
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

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