const path = require('path');
const { app, BrowserWindow } = require('electron');

// Verificação manual de ambiente de desenvolvimento
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "TVUSVET Laudos",
    // O ícone pode falhar em dev se não existir, mas não quebra o app
    icon: path.join(__dirname, 'favicon.ico'), 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
  });

  win.setMenuBarVisibility(false);

  // Em dev carrega o localhost, em prod carrega o arquivo local
  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );
  
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