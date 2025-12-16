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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

