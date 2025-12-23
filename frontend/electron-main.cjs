const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'AI Editor',
    backgroundColor: '#0f172a',
    frame: false, // Remove default title bar
    titleBarStyle: 'hidden', // Hide title bar on macOS
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#e7ecf5',
      height: 32
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  win.loadFile(indexPath);

  if (!app.isPackaged) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load', { errorCode, errorDescription, validatedURL });
  });

  win.webContents.on('did-finish-load', () => {
    console.log('Renderer loaded successfully');
  });

  return win;
};

const createAppMenu = (win) => {
  const isMac = process.platform === 'darwin';

  const targetWindow = () => {
    if (win && !win.isDestroyed()) return win;
    const focused = BrowserWindow.getFocusedWindow();
    return focused && !focused.isDestroyed() ? focused : null;
  };

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            const w = targetWindow();
            if (w) w.webContents.send('menu-action', 'new-file');
          },
        },
        {
          label: 'New Folder',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            const w = targetWindow();
            if (w) w.webContents.send('menu-action', 'new-folder');
          },
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            const w = targetWindow();
            if (w) w.webContents.send('menu-action', 'open-folder');
          },
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            const w = targetWindow();
            if (w) w.webContents.send('menu-action', 'save');
          },
        },
        {
          label: 'Export ZIP',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            const w = targetWindow();
            if (w) w.webContents.send('menu-action', 'export');
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut', accelerator: 'CmdOrCtrl+X' },
        { role: 'copy', accelerator: 'CmdOrCtrl+C' },
        { role: 'paste', accelerator: 'CmdOrCtrl+V' },
        { type: 'separator' },
        {
          label: 'Rename',
          accelerator: 'F2',
          click: () => {
            const w = targetWindow();
            if (w) w.webContents.send('menu-action', 'rename');
          },
        },
        {
          label: 'Delete',
          accelerator: 'Delete',
          click: () => {
            const w = targetWindow();
            if (w) w.webContents.send('menu-action', 'delete');
          },
        },
        {
          label: 'Quick Open',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            const w = targetWindow();
            if (w) w.webContents.send('menu-action', 'quick-open');
          },
        },
      ],
    },
    {
      label: 'AI',
      submenu: [
        {
          label: 'Find Errors',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            const w = targetWindow();
            if (w) w.webContents.send('menu-action', 'ai-errors');
          },
        },
        {
          label: 'Fix Bugs',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => {
            const w = targetWindow();
            if (w) w.webContents.send('menu-action', 'ai-fix');
          },
        },
        {
          label: 'Explain',
          accelerator: 'CmdOrCtrl+Shift+X',
          click: () => {
            const w = targetWindow();
            if (w) w.webContents.send('menu-action', 'ai-explain');
          },
        },
        {
          label: 'Refactor',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            const w = targetWindow();
            if (w) w.webContents.send('menu-action', 'ai-refactor');
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [{ role: 'reload' }, { role: 'toggledevtools' }, { type: 'separator' }, { role: 'togglefullscreen' }],
    },
    {
      role: 'window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://www.electronjs.org');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.whenReady().then(() => {
  const win = createWindow();
  createAppMenu(win);

  // Handle IPC messages from TitleBar
  const { ipcMain } = require('electron');
  
  ipcMain.on('minimize-window', () => {
    if (win) win.minimize();
  });

  ipcMain.on('maximize-window', () => {
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.on('close-window', () => {
    if (win) win.close();
  });

  // VSCode-like file operations
  ipcMain.on('reveal-in-finder', (event, path) => {
    const { shell } = require('electron');
    try {
      shell.showItemInFolder(path);
      console.log('Revealed in finder:', path);
    } catch (error) {
      console.error('Failed to reveal in finder:', error);
    }
  });

  ipcMain.on('copy-path', (event, path) => {
    const { clipboard } = require('electron');
    try {
      clipboard.writeText(path);
      console.log('Copied path to clipboard:', path);
    } catch (error) {
      console.error('Failed to copy path:', error);
    }
  });

  ipcMain.on('copy-relative-path', (event, path) => {
    const { clipboard } = require('electron');
    try {
      // For now, just copy the full path (could be enhanced to calculate relative path)
      clipboard.writeText(path);
      console.log('Copied relative path to clipboard:', path);
    } catch (error) {
      console.error('Failed to copy relative path:', error);
    }
  });

  ipcMain.on('open-folder', (event, path) => {
    const { shell } = require('electron');
    try {
      // Get the directory path (remove file name if it's a file)
      const pathToOpen = path.replace(/\/[^\/]+$/, '') || path;
      shell.openPath(pathToOpen);
      console.log('Opened folder:', pathToOpen);
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  });

  // Native folder picker dialog
  ipcMain.handle('dialog:showOpenDialog', async (event, options) => {
    const { dialog } = require('electron');
    try {
      const result = await dialog.showOpenDialog(options);
      return result;
    } catch (error) {
      console.error('Failed to open folder picker:', error);
      throw error;
    }
  });

  // Legacy folder picker for backward compatibility
  ipcMain.on('open-folder-picker', async (event) => {
    const { dialog } = require('electron');
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory']
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        console.log('Selected folder:', selectedPath);
        
        // Send the selected folder path back to the renderer
        event.sender.send('folder-selected', selectedPath);
      }
    } catch (error) {
      console.error('Failed to open folder picker:', error);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
