const path = require('path');
const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');

function createWindow() {
  // Cria a janela do navegador.
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "TVUSVET Laudos",
    icon: path.join(__dirname, 'favicon.ico'), // Usa o ícone existente
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Necessário para algumas interações locais simples
      webSecurity: false // Permite carregar imagens locais (file://) se necessário
    },
  });

  // Remove a barra de menu padrão (File, Edit, etc) para parecer mais nativo
  win.setMenuBarVisibility(false);

  // Em desenvolvimento, carrega do localhost. Em produção, carrega o arquivo index.html compilado.
  // Note que em produção, o arquivo estará na mesma pasta (build), então usamos __dirname
  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, 'index.html')}`
  );

  // Abre o DevTools apenas em modo de desenvolvimento
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

// Configuração necessária para evitar erros de caminho em produção
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});