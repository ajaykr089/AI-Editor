const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Define workspace root path
const WORKSPACE_ROOT = path.join(process.cwd(), 'backend', 'workspace');

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

  // Terminal command execution
  ipcMain.on('terminal-command', async (event, data) => {
    const { spawn } = require('child_process');
    const path = require('path');
    const fs = require('fs');

    try {
      // Handle both string and object formats
      const command = typeof data === 'string' ? data : data.command;
      const terminalId = typeof data === 'object' ? data.terminalId : null;

      // Get the current workspace directory
      const workspaceDir = global.WORKSPACE_ROOT || WORKSPACE_ROOT;

      // Parse command and arguments
      const [cmd, ...args] = command.trim().split(/\s+/);

      console.log('Executing command:', cmd, args, 'in directory:', workspaceDir);

      // Determine the appropriate shell for the system
      let shell;
      if (process.platform === 'win32') {
        shell = 'cmd.exe';
      } else {
        // Try to find a suitable shell
        const possibleShells = ['/bin/bash', '/usr/bin/bash', '/bin/sh', '/usr/bin/sh'];
        for (const shellPath of possibleShells) {
          try {
            if (fs.existsSync(shellPath)) {
              shell = shellPath;
              break;
            }
          } catch (e) {
            // Continue checking other shells
          }
        }
        // Fallback to system default if no shell found
        if (!shell) {
          shell = true; // Use default system shell
        }
      }

      console.log('Using shell:', shell);

      // Try to execute without shell first for simple commands
      let child;
      try {
        if (shell === true) {
          // Use system default shell
          child = spawn(cmd, args, {
            cwd: workspaceDir,
            stdio: ['pipe', 'pipe', 'pipe']
          });
        } else {
          // Try with detected shell
          child = spawn(cmd, args, {
            cwd: workspaceDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: shell
          });
        }
      } catch (spawnError) {
        console.log('Direct spawn failed, trying with shell:', spawnError.message);
        // Fallback: try with basic shell options
        const fallbackShell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
        child = spawn(cmd, args, {
          cwd: workspaceDir,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: fallbackShell
        });
      }

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log('STDOUT:', chunk);
      });

      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        console.log('STDERR:', chunk);
      });

      child.on('close', (code) => {
        console.log('Command exited with code:', code);
        const result = output.trim() || errorOutput.trim() || `Command completed with code ${code}`;

        const response = {
          command,
          output: result,
          success: code === 0,
          terminalId: terminalId
        };

        console.log('Sending response:', response);
        event.sender.send('terminal-output', response);
      });

      child.on('error', (error) => {
        console.error('Spawn error:', error);
        const response = {
          command,
          output: `Error executing command: ${error.message}`,
          success: false,
          terminalId: terminalId
        };
        event.sender.send('terminal-output', response);
      });

    } catch (error) {
      console.error('Command execution error:', error);
      const response = {
        command: typeof data === 'string' ? data : data.command,
        output: `Failed to execute command: ${error.message}`,
        success: false,
        terminalId: typeof data === 'object' ? data.terminalId : null
      };
      event.sender.send('terminal-output', response);
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
