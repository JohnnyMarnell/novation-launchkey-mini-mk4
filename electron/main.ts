import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import MidiHandler from './midi-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let midiHandler: MidiHandler | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Launchkey Mini MK4 GUI',
    backgroundColor: '#1e1e2e'
  });

  // Pipe renderer console logs to terminal
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const logLevels = ['verbose', 'info', 'warning', 'error'];
    const logType = logLevels[level] || 'log';
    const source = sourceId ? ` (${sourceId}:${line})` : '';

    console.log(`[Renderer ${logType.toUpperCase()}]${source}`, message);
  });

  // In development, load from Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize MIDI handler
  midiHandler = new MidiHandler();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (midiHandler) {
    midiHandler.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
