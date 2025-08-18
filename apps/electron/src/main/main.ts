import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';

console.log('🚀 Main process starting...');
console.log('📁 Current directory:', __dirname);
console.log('🔧 Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  VITE_DEV_SERVER_URL: process.env.VITE_DEV_SERVER_URL,
  __DEV__: process.env.NODE_ENV === 'development'
});

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = join(__dirname, '../renderer');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(__dirname, '..')  // Use root directory for public assets
  : process.env.DIST;

// 🚧 Use ['ENABLE_NAME_CONSOLE'] to access console on production.
// Or if you want to use the console in production, set this to false.
const __DEV__ = process.env.NODE_ENV === 'development';

// Create application menu
function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Handle new project
          }
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            // Handle open project
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Disable GPU Acceleration for Windows 7
if (process.platform === 'win32') {
  app.disableHardwareAcceleration();
}

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setName(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const isDev = process.env.NODE_ENV === 'development';
const preload = isDev ? undefined : join(__dirname, '../preload/index.js');
const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
const indexHtml = join(process.env.DIST, 'index.html');

console.log('🔍 Environment detection:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  isDev:', isDev);
console.log('  VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL);
console.log('  devServerUrl:', devServerUrl);
console.log('  __dirname:', __dirname);
console.log('  Preload path:', preload || 'DISABLED (dev mode)');
console.log('  Index HTML:', indexHtml);

async function createWindow() {
  console.log('🏗️ createWindow() function entered');

  win = new BrowserWindow({
    title: 'AI Video Editor',
    icon: join(process.env.VITE_PUBLIC || '', 'favicon.ico'),
    webPreferences: {
      ...(preload && { preload }), // Only include preload if it's defined
      // Warning: enableRemoteModule has been removed from Electron and is planned for removal from @electron/remote as well.
      // For more info, see: https://www.electronjs.org/docs/latest/breaking-changes#removed-remotemodule
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // https://www.electronjs.org/docs/latest/tutorial/security#sandbox
      webSecurity: false, // Allow loading from localhost in development
      allowRunningInsecureContent: process.env.NODE_ENV === 'development', // Allow HTTP in development
      webviewTag: false,
      experimentalFeatures: false,
      // Enable better debugging
      devTools: true,
    },
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    show: true, // Temporarily set to true for debugging
  });

  console.log('🏗️ BrowserWindow created:', {
    id: win.id,
    isVisible: win.isVisible(),
    isMinimized: win.isMinimized(),
    isMaximized: win.isMaximized(),
    bounds: win.getBounds(),
    platform: process.platform
  });

  // Simple development-focused loading
  if (isDev) {
    try {
      console.log('🚀 Loading from dev server:', devServerUrl);
      console.log('🔍 Checking if dev server is accessible...');

      // Test if dev server is accessible
      const response = await fetch(devServerUrl);
      if (response.ok) {
        console.log('✅ Dev server is accessible, loading app...');

        // First try to load the test page to see if Vite is working
        try {
          await win.loadURL(`${devServerUrl}/test.html`);
          console.log('✅ Successfully loaded test page from dev server');
          win.webContents.openDevTools();
        } catch (testError) {
          console.log('⚠️ Test page failed, trying main app...');
          await win.loadURL(devServerUrl);
          console.log('✅ Successfully loaded main app from dev server');
          win.webContents.openDevTools();
        }
      } else {
        throw new Error(`Dev server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Dev server not available:', error instanceof Error ? error.message : String(error));
      console.log('🔄 Falling back to local file');
      await win.loadFile(indexHtml);
    }
  } else {
    // Production mode - load from local file
    win.loadFile(indexHtml);
    console.log('📁 Loading from local file:', indexHtml);
  }

  // Debug environment variables
  console.log('🔍 Environment check:');
  console.log('  __DEV__:', __DEV__);
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL);
  console.log('  isDev:', isDev);
  console.log('  devServerUrl:', devServerUrl);

  // Don't open DevTools here - wait until the page is loaded
  console.log('🔧 DevTools will be opened after page loads');

  // Add keyboard shortcut to toggle DevTools (Cmd+Option+I on Mac, Ctrl+Shift+I on Windows/Linux)
  win.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key === 'I') {
      if (win?.webContents.isDevToolsOpened()) {
        win?.webContents.closeDevTools();
      } else {
        win?.webContents.openDevTools();
      }
      event.preventDefault();
    }

    // Also add F12 as a backup DevTools shortcut
    if (input.key === 'F12') {
      if (win?.webContents.isDevToolsOpened()) {
        win?.webContents.closeDevTools();
      } else {
        win?.webContents.openDevTools();
      }
      event.preventDefault();
    }
  });

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    console.log('✅ Page finished loading');
    win?.webContents.send('main-process-message', new Date().toLocaleString());

    // Open DevTools after the page is fully loaded
    setTimeout(() => {
      if (win && !win.webContents.isDevToolsOpened()) {
        win.webContents.openDevTools();
      }
    }, 1000);
  });

  // Add debugging for page load events
  win.webContents.on('did-start-loading', () => {
    console.log('🔄 Page started loading');
  });

  win.webContents.on('dom-ready', () => {
    console.log('🌐 DOM is ready');
  });

  // Handle page load errors
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Page failed to load:', {
      errorCode,
      errorDescription,
      validatedURL
    });

    // If dev server failed, try to reload after a delay
    if (isDev && validatedURL.includes('localhost:3000')) {
      console.log('🔄 Retrying dev server connection in 3 seconds...');
      setTimeout(async () => {
        try {
          await win?.loadURL(devServerUrl);
          console.log('✅ Successfully reloaded from dev server');
        } catch (retryError) {
          console.error('❌ Retry failed, falling back to local file');
          await win?.loadFile(indexHtml);
        }
      }, 3000);
    }
  });

  // Add reload functionality
  ipcMain.handle('window:reload', async () => {
    if (win) {
      if (isDev) {
        try {
          await win.loadURL(devServerUrl);
          console.log('✅ Successfully reloaded from dev server');
        } catch (error) {
          console.error('❌ Failed to reload from dev server:', error instanceof Error ? error.message : String(error));
          // Fallback to local file if dev server is not available
          await win.loadFile(indexHtml);
        }
      } else {
        win.reload();
      }
    }
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    else dialog.showErrorBox('Warning', 'Are you sure?');
    return { action: 'deny' };
  });

  // Apply electron-updater
  if (app.isPackaged) {
    // require('electron-updater').autoUpdater.checkForUpdatesAndNotify();
  }

  win.once('ready-to-show', () => {
    console.log('🎉 Window ready to show!');
    win?.show();
    win?.focus(); // Ensure window gets focus

    // Open DevTools when window is ready to show
    if (win && !win.webContents.isDevToolsOpened()) {
      win.webContents.openDevTools();
    }
  });

  // Fallback: force show window after 5 seconds if ready-to-show doesn't fire
  setTimeout(() => {
    if (win && !win.isVisible()) {
      console.log('⏰ Fallback: forcing window to show after timeout');
      win.show();
      win.focus();
    }
  }, 5000);

  // Additional macOS-specific window handling
  if (process.platform === 'darwin') {
    console.log('🍎 macOS detected, adding platform-specific handling');

    // Ensure window is visible on macOS
    win.on('show', () => {
      console.log('✅ Window show event fired');
    });

    // Force show after a short delay on macOS
    setTimeout(() => {
      if (win && !win.isVisible()) {
        console.log('🍎 macOS: forcing window to show');
        win.show();
        win.focus();
      }
    }, 1000);
  }

  win.on('closed', () => {
    win = null;
  });
}

app.whenReady().then(() => {
  console.log('🚀 App is ready, creating menu and window...');
  createMenu();
  console.log('✅ Menu created, now creating window...');
  createWindow();
  console.log('✅ createWindow() called');
});

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// IPC handlers for file operations
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'avi', 'mov', 'mkv', 'wmv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!canceled) {
    return filePaths[0];
  }
  return null;
});

ipcMain.handle('dialog:saveFile', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    filters: [
      { name: 'Video Files', extensions: ['mp4'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!canceled) {
    return filePath;
  }
  return null;
});

ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (!canceled) {
    return filePaths[0];
  }
  return null;
});

// IPC handlers for app info
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getPath', (event, name: string) => {
  return app.getPath(name as any);
});

// IPC handlers for window management
ipcMain.handle('window:minimize', () => {
  win?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.handle('window:close', () => {
  win?.close();
});

// IPC handler for toggling DevTools
ipcMain.handle('window:toggleDevTools', () => {
  if (win) {
    if (win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools();
    } else {
      win.webContents.openDevTools();
    }
  }
});
