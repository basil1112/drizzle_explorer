import { app, BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import { registerFileSystemHandlers } from './api/ipcHandlers';
import { initDatabase, closeDatabase } from './database/db';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../../index.html'));
  
  // Open DevTools in development
 mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Remove default menu
  Menu.setApplicationMenu(null);
  
  // Initialize database
  initDatabase();
  
  // Register IPC handlers
  registerFileSystemHandlers();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase();
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});
