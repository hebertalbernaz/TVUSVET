const path = require('path');
const { app, BrowserWindow } = require('electron');

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "TVUSVET Laudos",
    icon: path.join(__dirname, 'icon.png'), // Tenta carregar ícone se existir
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
  });

  win.setMenuBarVisibility(false);

  // Lógica de carregamento blindada
  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Em produção, busca o arquivo no diretório relativo correto
    // __dirname em produção geralmente é .../resources/app.asar/public
    // O build do React está em .../resources/app.asar/build
    // Então subimos um nível (..) e entramos em build
    win.loadURL(`file://${path.join(__dirname, '../build/index.html')}`);
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