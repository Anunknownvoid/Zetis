import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { AssistantManager } from './core/assistant'
import { setupIPC } from './ipc'

// Load Native Module
let nativeEngine: any = null;
try {
  // In production, the file is unpacked to process.resourcesPath
  const nativePath = is.dev
    ? join(__dirname, '../../resources/assistant_native.node')
    : join(process.resourcesPath, 'assistant_native.node');

  const nativeModule = require(nativePath);
  if (nativeModule && nativeModule.NativeEngine) {
    nativeEngine = new nativeModule.NativeEngine();
    console.log('Native Engine initialized');
  }
} catch (e) {
  console.error('Failed to load native engine, using fallback:', e);
}

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.astra.assistant')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createWindow()
  const assistantManager = new AssistantManager(mainWindow, nativeEngine)
  setupIPC(assistantManager)

  // Default provider
  assistantManager.setProvider('openai-realtime', { apiKey: process.env.OPENAI_API_KEY })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
