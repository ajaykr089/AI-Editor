import { useEffect, useMemo, useState, lazy, useCallback, Suspense } from 'react';
import { AnalyzeIntent, ChatMessage, FileNode } from 'shared';
import EditorPane from './components/EditorPane';
import FileTree from './components/FileTree';
import StatusBar from './components/StatusBar';
import BottomPanel from './components/BottomPanel';
import CommandPalette from './components/CommandPalette';
import QuickOpen from './components/QuickOpen';
import ProblemsPanel from './components/ProblemsPanel';
import ActivityBar from './components/ActivityBar';
import SearchPanel from './components/SearchPanel';
import FileOperationModal from './components/FileOperationModal';
import TitleBar from './components/TitleBar';

// Lazy load heavy AI components
const ChatSidebar = lazy(() => import('./components/ChatSidebar'));
import {
  analyzeCode,
  autocomplete,
  createEntry,
  deleteEntry,
  downloadZip,
  fetchFileContent,
  fetchTree,
  renameEntry,
  sendChat,
  searchProject,
  writeFile,
} from './api/client';

const detectLanguage = (filePath?: string) => {
  if (!filePath) return 'typescript';
  const ext = filePath.toLowerCase();
  if (ext.endsWith('.ts')) return 'typescript';
  if (ext.endsWith('.tsx')) return 'typescript';
  if (ext.endsWith('.js')) return 'javascript';
  if (ext.endsWith('.jsx')) return 'javascript';
  if (ext.endsWith('.py')) return 'python';
  if (ext.endsWith('.java')) return 'java';
  if (ext.endsWith('.c')) return 'c';
  if (ext.endsWith('.cpp') || ext.endsWith('.cc') || ext.endsWith('.cxx')) return 'cpp';
  if (ext.endsWith('.h')) return 'c';
  if (ext.endsWith('.hpp')) return 'cpp';
  if (ext.endsWith('.cs')) return 'csharp';
  if (ext.endsWith('.php')) return 'php';
  if (ext.endsWith('.rb')) return 'ruby';
  if (ext.endsWith('.go')) return 'go';
  if (ext.endsWith('.rust') || ext.endsWith('.rs')) return 'rust';
  if (ext.endsWith('.swift')) return 'swift';
  if (ext.endsWith('.kts') || ext.endsWith('.kt')) return 'kotlin';
  if (ext.endsWith('.scala')) return 'scala';
  if (ext.endsWith('.json')) return 'json';
  if (ext.endsWith('.jsonc')) return 'jsonc';
  if (ext.endsWith('.xml')) return 'xml';
  if (ext.endsWith('.html')) return 'html';
  if (ext.endsWith('.htm')) return 'html';
  if (ext.endsWith('.css')) return 'css';
  if (ext.endsWith('.scss')) return 'scss';
  if (ext.endsWith('.sass')) return 'sass';
  if (ext.endsWith('.less')) return 'less';
  if (ext.endsWith('.md')) return 'markdown';
  if (ext.endsWith('.yaml') || ext.endsWith('.yml')) return 'yaml';
  if (ext.endsWith('.toml')) return 'toml';
  if (ext.endsWith('.ini')) return 'ini';
  if (ext.endsWith('.sh')) return 'shell';
  if (ext.endsWith('.bash')) return 'shell';
  if (ext.endsWith('.ps1')) return 'powershell';
  if (ext.endsWith('.sql')) return 'sql';
  if (ext.endsWith('.vue')) return 'vue';
  if (ext.endsWith('.svelte')) return 'svelte';
  if (ext.endsWith('.jsx')) return 'javascriptreact';
  if (ext.endsWith('.tsx')) return 'typescriptreact';
  return 'plaintext';
};

function App() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [aiResult, setAiResult] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! Select a file to start coding.' },
  ]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [status, setStatus] = useState<string>('');
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [contextMenu, setContextMenu] = useState<{
    path: string;
    type: 'file' | 'folder';
    x: number;
    y: number;
  } | null>(null);
  const [tabs, setTabs] = useState<{ path: string; label: string; dirty?: boolean }[]>([]);
  const [originalContents, setOriginalContents] = useState<Record<string, string>>({});

  // Navigation history for file navigation
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [navigationIndex, setNavigationIndex] = useState(-1);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickOpenQuery, setQuickOpenQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ filePath: string; line: number; preview: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [problems, setProblems] = useState<{ message: string }[]>([]);
  const [output, setOutput] = useState<string[]>([]);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [outline, setOutline] = useState<{ label: string; line: number }[]>([]);
  const [serverOk, setServerOk] = useState(true);
  const [activeView, setActiveView] = useState('explorer');

  // File operation modal state
  const [showFileModal, setShowFileModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [modalTargetPath, setModalTargetPath] = useState<string | null>(null);
 const [terminalTabs, setTerminalTabs] = useState<{ id: string; name: string; output: string[]; currentCommand: string }[]>([
    { id: 'terminal-1', name: 'Terminal 1', output:["Welcome to the terminal. Type 'help' for a list of commands."], currentCommand: '' }]);
  const [activeTerminalTab, setActiveTerminalTab] = useState<string>('terminal-1');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const refreshTree = async () => {
    try {
      const data = await fetchTree();
      setTree(data.nodes ?? []);
      setStatus('Explorer refreshed');
    } catch (error) {
      console.error('Error refreshing tree:', error);
      setStatus('Failed to refresh explorer');
    }
  };

  useEffect(() => {
    refreshTree();
  }, []);

  const findNode = (nodes: FileNode[], target: string): FileNode | undefined => {
    for (const node of nodes) {
      if (node.path === target) return node;
      if (node.children) {
        const child = findNode(node.children, target);
        if (child) return child;
      }
    }
    return undefined;
  };

  const loadEntry = async (path: string) => {
    const node = findNode(tree, path);
    const previousPath = selectedPath;

    setSelectedPath(path);
    if (node?.type === 'folder') {
      setContent('');
      return;
    }
    setLanguage(detectLanguage(path));
    const data = await fetchFileContent(path);
    const fileContent = data.content ?? '';
    setContent(fileContent);
    const label = path.split('/').pop() ?? path;

    // Store original content for dirty state comparison
    setOriginalContents(prev => ({
      ...prev,
      [path]: fileContent
    }));

    setTabs((prev) => {
      const exists = prev.find((t) => t.path === path);
      if (exists) return prev;
      return [...prev, { path, label, dirty: false }];
    });

    // Update navigation history
    if (previousPath && previousPath !== path) {
      // If we're navigating to a different file, add to history
      setNavigationHistory(prev => {
        // Remove any entries after current index (when navigating back then opening new file)
        const newHistory = prev.slice(0, navigationIndex + 1);
        // Add new entry if it's different from the last one
        if (newHistory[newHistory.length - 1] !== previousPath) {
          newHistory.push(previousPath);
        }
        // Add current file to history
        newHistory.push(path);
        return newHistory;
      });
      setNavigationIndex(prev => prev + 1);
    }
  };

  const saveFile = async () => {
    if (!selectedPath) return;
    await writeFile(selectedPath, content);
    setStatus(`Saved ${selectedPath}`);
    setTabs((prev) => prev.map((t) => (t.path === selectedPath ? { ...t, dirty: false } : t)));
  };

  const askName = (message: string, fallback: string) => {
    const postfix = fallback.split("-");
    console.log("postfix", postfix);
    const _postfix = postfix?.length > 1 ? parseInt(postfix[1]) + 1 : 1;
    const name = `${fallback}-${_postfix}`;
    setStatus(`Using default ${name} (prompts disabled in desktop)`);
    return name;
  };

  const handleCreate = async (type: 'file' | 'folder') => {
    if (type === 'file') {
      setShowFileModal(true);
    } else {
      setShowFolderModal(true);
    }
  };

  const handleCreateAt = async (targetPath: string, type: 'file' | 'folder') => {
    setModalTargetPath(targetPath);
    if (type === 'file') {
      setShowFileModal(true);
    } else {
      setShowFolderModal(true);
    }
  };

  const handleCreateConfirm = async (name: string, type: 'file' | 'folder') => {
    try {
      const selectedNode = modalTargetPath ? findNode(tree, modalTargetPath) : (selectedPath ? findNode(tree, selectedPath) : undefined);
      const baseDir =
        selectedNode?.type === 'folder'
          ? modalTargetPath ?? selectedPath ?? '/'
          : modalTargetPath
          ? modalTargetPath.substring(0, modalTargetPath.lastIndexOf('/')) || '/'
          : selectedPath
          ? selectedPath.substring(0, selectedPath.lastIndexOf('/')) || '/'
          : '/';
      const normalizedBase = baseDir.endsWith('/') ? baseDir : `${baseDir}/`;
      const fullPath = `${normalizedBase}${name}`;
      await createEntry(fullPath, type);
      await refreshTree();
      setStatus(`Created ${type}: ${name}`);
    } catch (error) {
      setStatus(`Failed to create ${type}: ${error}`);
    } finally {
      setModalTargetPath(null);
      setShowFileModal(false);
      setShowFolderModal(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPath) return;
    if (!confirm(`Delete ${selectedPath}?`)) return;
    await deleteEntry(selectedPath);
    setSelectedPath(null);
    setContent('');
    await refreshTree();
  };

  const handleDeleteAt = async (path: string) => {
    if (!confirm(`Delete ${path}?`)) return;
    await deleteEntry(path);
    if (selectedPath === path) {
      setSelectedPath(null);
      setContent('');
    }
    await refreshTree();
  };

  const handleRename = async () => {
    if (!selectedPath) return;
    setModalTargetPath(selectedPath);
    setShowRenameModal(true);
  };

  const handleRenameAt = async (path: string) => {
    setModalTargetPath(path);
    setShowRenameModal(true);
  };

  const handleRenameConfirm = async (newName: string) => {
    if (!modalTargetPath) return;
    try {
      const base = modalTargetPath.slice(0, modalTargetPath.lastIndexOf('/')) || '/';
      const newPath = `${base === '/' ? '' : base}/${newName}`;
      await renameEntry(modalTargetPath, newPath);
      if (selectedPath === modalTargetPath) {
        setSelectedPath(newPath);
      }
      await refreshTree();
      setStatus(`Renamed to: ${newName}`);
    } catch (error) {
      setStatus(`Failed to rename: ${error}`);
    } finally {
      setModalTargetPath(null);
      setShowRenameModal(false);
    }
  };

  const handleAnalyze = async (intent: AnalyzeIntent) => {
    if (!content) return;
    setStatus('Running AI analysis...');
    setOutput((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Starting AI analysis: ${intent}`]);
    try {
      const result = await analyzeCode({ code: content, language, intent });
      setAiResult(result.reply);
      setOutput((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Analysis complete`]);
      setStatus('');
    } catch (error) {
      setOutput((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${error}`]);
      setStatus('Analysis failed');
    }
  };

  const handleSendMessage = async (text: string) => {
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setOutput((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Sending chat message`]);
    try {
      const reply = await sendChat(nextMessages);
      setMessages([...nextMessages, { role: 'assistant', content: reply.reply }]);
      setOutput((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Received AI response`]);
    } catch (error) {
      setOutput((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Chat error: ${error}`]);
    }
  };

  // Terminal tab management functions
  const createNewTerminalTab = () => {
    const newId = `terminal-${Date.now()}`;
    const terminalNumber = terminalTabs.length + 1;
    setTerminalTabs(prev => [...prev, {
      id: newId,
      name: `Terminal ${terminalNumber}`,
      output: [],
      currentCommand: ''
    }]);
    setActiveTerminalTab(newId);
  };

  const closeTerminalTab = (tabId: string) => {
    if (terminalTabs.length <= 1) return; // Keep at least one terminal

    setTerminalTabs(prev => prev.filter(tab => tab.id !== tabId));

    // Switch to another tab if the active one is being closed
    if (activeTerminalTab === tabId) {
      const remainingTabs = terminalTabs.filter(tab => tab.id !== tabId);
      setActiveTerminalTab(remainingTabs[0]?.id || '');
    }
  };

  const updateTerminalOutput = (tabId: string, newOutput: string[]) => {
    setTerminalTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, output: newOutput } : tab
    ));
  };

  const handleTerminalCommand = useCallback((cmd: string) => {
    const activeTab = terminalTabs.find(tab => tab.id === activeTerminalTab);
    if (!activeTab) return;

    const newOutput = [...activeTab.output, `$ ${cmd}`];

    // Built-in commands
    if (cmd === 'clear') {
      updateTerminalOutput(activeTerminalTab, []);
      return;
    } else if (cmd.startsWith('echo ')) {
      updateTerminalOutput(activeTerminalTab, [...newOutput, cmd.substring(5)]);
      return;
    } else if (cmd === 'help') {
      const helpOutput = [
        'Available commands:',
        '  clear           - Clear terminal',
        '  echo <text>     - Print text',
        '  help            - Show this help',
        '  pwd             - Show current directory',
        '  ls              - List files (if supported)',
        '  node -v         - Check Node.js version',
        '  npm -v          - Check npm version',
        '  git --version   - Check Git version',
        '  cd <path>       - Change directory',
        '  mkdir <name>    - Create directory',
        '  touch <file>    - Create file'
      ];
      updateTerminalOutput(activeTerminalTab, [...newOutput, ...helpOutput]);
      return;
    } else if (cmd === 'pwd') {
      // Try to get current working directory
      if (window && (window as any).electron && (window as any).electron.ipcRenderer) {
        (window as any).electron.ipcRenderer.send('terminal-command', { command: cmd, terminalId: activeTerminalTab });
      } else {
        updateTerminalOutput(activeTerminalTab, [...newOutput, 'Command not available in web mode']);
      }
      return;
    } else if (cmd === 'ls' || cmd === 'dir') {
      // Try to list files
      if (window && (window as any).electron && (window as any).electron.ipcRenderer) {
        (window as any).electron.ipcRenderer.send('terminal-command', { command: cmd, terminalId: activeTerminalTab });
      } else {
        updateTerminalOutput(activeTerminalTab, [...newOutput, 'Command not available in web mode']);
      }
      return;
    }

    // Native CLI commands (Node.js, npm, git, etc.)
    if (window && (window as any).electron && (window as any).electron.ipcRenderer) {
      // Send command to Electron main process for execution
      (window as any).electron.ipcRenderer.send('terminal-command', { command: cmd, terminalId: activeTerminalTab });
    } else {
      // Web mode - limited functionality
      const cmdLower = cmd.toLowerCase();
      let response = '';
      if (cmdLower.includes('node') && cmdLower.includes('-v')) {
        response = 'Node.js version check not available in web mode';
      } else if (cmdLower.includes('npm') && cmdLower.includes('-v')) {
        response = 'npm version check not available in web mode';
      } else if (cmdLower.includes('git') && cmdLower.includes('--version')) {
        response = 'Git version check not available in web mode';
      } else {
        response = `Command not found: ${cmd}. Try 'help' for available commands`;
      }
      updateTerminalOutput(activeTerminalTab, [...newOutput, response]);
    }
  }, [terminalTabs, activeTerminalTab, updateTerminalOutput]);

  const handleExport = async () => {
    setStatus('Preparing ZIP...');
    await downloadZip();
    setStatus('');
  };

  const handleAutocomplete = async (params: {
    content: string;
    line: number;
    column: number;
  }) => autocomplete({ content: params.content, language, cursorLine: params.line, cursorColumn: params.column });

  const editorLanguage = useMemo(() => language, [language]);

  const commands = useMemo(() => [
    { id: 'save', label: 'File: Save', shortcut: 'Ctrl/Cmd+S', action: saveFile },
    { id: 'new-file', label: 'File: New File', shortcut: 'Ctrl/Cmd+N', action: () => handleCreate('file') },
    { id: 'new-folder', label: 'File: New Folder', action: () => handleCreate('folder') },
    { id: 'export', label: 'File: Export ZIP', action: handleExport },
    { id: 'rename', label: 'Edit: Rename', action: handleRename },
    { id: 'delete', label: 'Edit: Delete', action: handleDelete },
    { id: 'find-errors', label: 'AI: Find Errors', action: () => handleAnalyze('errors') },
    { id: 'fix', label: 'AI: Fix', action: () => handleAnalyze('fix') },
    { id: 'explain', label: 'AI: Explain', action: () => handleAnalyze('explain') },
    { id: 'refactor', label: 'AI: Refactor', action: () => handleAnalyze('refactor') },
    { id: 'theme', label: 'View: Toggle Theme', action: () => setTheme(theme === 'light' ? 'dark' : 'light') },
    { id: 'quick-open', label: 'Go: Quick Open', shortcut: 'Ctrl/Cmd+P', action: () => setQuickOpen(true) },
    { id: 'command', label: 'Go: Command Palette', shortcut: 'Ctrl/Cmd+Shift+P', action: () => setPaletteOpen(true) },
  ], [saveFile, handleCreate, handleExport, handleRename, handleDelete, handleAnalyze, setTheme, setQuickOpen, setPaletteOpen]);

  const menus = useMemo(() => [
    {
      label: 'File',
      items: [
        { label: 'New File', action: () => handleCreate('file') },
        { label: 'New Folder', action: () => handleCreate('folder') },
        { label: 'Save', action: saveFile },
        { label: 'Export ZIP', action: handleExport },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Rename', action: handleRename },
        { label: 'Delete', action: handleDelete },
        { label: 'Quick Open', action: () => setQuickOpen(true) },
      ],
    },
    {
      label: 'AI',
      items: [
        { label: 'Find Errors', action: () => handleAnalyze('errors') },
        { label: 'Fix Bugs', action: () => handleAnalyze('fix') },
        { label: 'Explain', action: () => handleAnalyze('explain') },
        { label: 'Refactor', action: () => handleAnalyze('refactor') },
      ],
    },
    {
      label: 'View',
      items: [{ label: `Theme: ${theme}`, action: () => setTheme(theme === 'light' ? 'dark' : 'light') }],
    },
  ], [handleCreate, saveFile, handleExport, handleRename, handleDelete, setQuickOpen, handleAnalyze, theme, setTheme]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      
      // Save file
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveFile();
      }
      
      // Command palette
      if (mod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      
      // Quick open
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setQuickOpen(true);
      }
      
      // Close tab
      if (mod && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (selectedPath) {
          const target = tabs.find((t) => t.path === selectedPath);
          if (target) {
            if (target.dirty && !confirm(`Close ${target.label} without saving?`)) return;
            setTabs((prev) => prev.filter((t) => t.path !== selectedPath));
            if (tabs.length > 1) {
              const next = tabs.find((t) => t.path !== selectedPath);
              if (next) loadEntry(next.path);
              else {
                setSelectedPath(null);
                setContent('');
              }
            } else {
              setSelectedPath(null);
              setContent('');
            }
          }
        }
      }
      
      // New file
      if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreate('file');
      }
      
      // New folder
      if (mod && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreate('folder');
      }
      
      // Toggle explorer
      if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setActiveView('explorer');
      }
      
      // Toggle search
      if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setActiveView('search');
      }
      
      // Toggle problems
      if ((mod && e.shiftKey && e.key.toLowerCase() === 'm') || (mod && e.key.toLowerCase() === 'm')) {
        e.preventDefault();
        setActiveView('problems');
      }
      
      // Toggle AI assistant
      if (mod && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setActiveView('ai');
      }
      
      // Toggle theme
      if (mod && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setTheme(theme === 'light' ? 'dark' : 'light');
      }

      // Navigation shortcuts (Alt+Left/Right)
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canGoBack) goBack();
      }

      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (canGoForward) goForward();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  useEffect(() => {
    const api = (window as any)?.api;
    if (!api?.onMenuAction) return;
    const dispose = api.onMenuAction((action: string) => {
      switch (action) {
        case 'new-file':
          handleCreate('file');
          break;
        case 'new-folder':
          handleCreate('folder');
          break;
        case 'save':
          saveFile();
          break;
        case 'export':
          handleExport();
          break;
        case 'rename':
          handleRename();
          break;
        case 'delete':
          handleDelete();
          break;
        case 'quick-open':
          setQuickOpen(true);
          break;
        case 'ai-errors':
          handleAnalyze('errors');
          break;
        case 'ai-fix':
          handleAnalyze('fix');
          break;
        case 'ai-explain':
          handleAnalyze('explain');
          break;
        case 'ai-refactor':
          handleAnalyze('refactor');
          break;
        case 'open-folder':
          // Open native folder picker dialog
          if (window && (window as any).electron && (window as any).electron.ipcRenderer) {
            (window as any).electron.ipcRenderer.send('open-folder-picker');
          } else {
            alert('Native folder picker requires Electron environment.');
          }
          break;
        default:
          break;
      }
    });
    return () => {
      if (typeof dispose === 'function') dispose();
    };
  }, [handleCreate, handleDelete, handleRename, handleAnalyze, handleExport, saveFile]);

  // Handle folder selection from native dialog
  useEffect(() => {
    if (window && (window as any).electron && (window as any).electron.ipcRenderer) {
      const handleFolderSelected = async (event: any, selectedPath: string) => {
        console.log('Folder selected:', selectedPath);
        
      try {
        // Send the selected folder path to the backend to change workspace
        const base = typeof window !== 'undefined' && window.location.protocol === 'file:' ? 'http://localhost:4000' : '';
        const response = await fetch(base + '/api/change-workspace', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ workspacePath: selectedPath })
        });

        if (response.ok) {
          const result = await response.json();
          setStatus(`Workspace changed to: ${selectedPath}`);
          
          // Update the tree with the new workspace data
          if (result.tree) {
            setTree(result.tree);
          } else {
            // Fallback to refresh if tree data not returned
            await refreshTree();
          }
          
          // Clear selected file since we're in a new workspace
          setSelectedPath(null);
          setContent('');
          setTabs([]);
        } else {
          throw new Error('Failed to change workspace');
        }
      } catch (error) {
          console.error('Error changing workspace:', error);
          alert(`Failed to change workspace: ${error}\n\nSelected folder: ${selectedPath}`);
        }
      };

      (window as any).electron.ipcRenderer.on('folder-selected', handleFolderSelected);

      return () => {
        (window as any).electron.ipcRenderer.removeListener('folder-selected', handleFolderSelected);
      };
    }
  }, [refreshTree]);

  // Handle terminal output from Electron
  useEffect(() => {
    if (window && (window as any).electron && (window as any).electron.ipcRenderer) {
      const handleTerminalOutput = (event: any, data: { command: string; output: string; success: boolean; terminalId?: string }) => {
        console.log('Received terminal output:', data);
        // Route output to the correct terminal tab
        const targetTerminalId = data.terminalId || activeTerminalTab;
        const activeTab = terminalTabs.find(tab => tab.id === targetTerminalId);

        if (activeTab) {
          const newOutput = [...activeTab.output, data.output];
          updateTerminalOutput(targetTerminalId, newOutput);
        } else {
          console.error('No terminal tab found for id:', targetTerminalId);
        }
      };

      (window as any).electron.ipcRenderer.on('terminal-output', handleTerminalOutput);

      return () => {
        (window as any).electron.ipcRenderer.removeListener('terminal-output', handleTerminalOutput);
      };
    }
  }, [terminalTabs, activeTerminalTab, updateTerminalOutput]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const base = typeof window !== 'undefined' && window.location.protocol === 'file:' ? 'http://localhost:4000' : '';
        const res = await fetch(base + '/api/health');
        setServerOk(res.ok);
      } catch {
        setServerOk(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const lines = content.split('\n');
    const items: { label: string; line: number }[] = [];
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const match =
        trimmed.match(/^class\s+([A-Za-z0-9_]+)/) ||
        trimmed.match(/^function\s+([A-Za-z0-9_]+)/) ||
        trimmed.match(/^const\s+([A-Za-z0-9_]+)\s*=\s*\(/);
      if (match) {
        items.push({ label: match[1], line: idx + 1 });
      }
    });
    setOutline(items);
  }, [content]);

  const openTab = (path: string) => {
    loadEntry(path);
  };

  const closeTab = (path: string) => {
    const target = tabs.find((t) => t.path === path);
    if (target?.dirty && !confirm(`Close ${path} without saving?`)) return;
    setTabs((prev) => prev.filter((t) => t.path !== path));
    if (selectedPath === path) {
      const next = tabs.find((t) => t.path !== path);
      if (next) loadEntry(next.path);
      else {
        setSelectedPath(null);
        setContent('');
      }
    }
  };

  const handleQuickOpen = (path: string) => {
    setQuickOpen(false);
    openTab(path);
  };

  // Navigation functions for file navigation (like VSCode)
  const goBack = useCallback(() => {
    if (navigationIndex > 0) {
      const newIndex = navigationIndex - 1;
      const targetPath = navigationHistory[newIndex];
      setNavigationIndex(newIndex);
      loadEntry(targetPath);
    }
  }, [navigationIndex, navigationHistory, loadEntry]);

  const goForward = useCallback(() => {
    if (navigationIndex < navigationHistory.length - 1) {
      const newIndex = navigationIndex + 1;
      const targetPath = navigationHistory[newIndex];
      setNavigationIndex(newIndex);
      loadEntry(targetPath);
    }
  }, [navigationIndex, navigationHistory, loadEntry]);

  // Determine if navigation buttons should be enabled
  const canGoBack = navigationIndex > 0;
  const canGoForward = navigationIndex < navigationHistory.length - 1;

  const runSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const res = await searchProject(query);
    setSearchResults(res.results);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      runSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedPath) {
      const isDirty = content !== originalContents[selectedPath];
      setTabs((prev) => prev.map((t) => (t.path === selectedPath ? { ...t, dirty: isDirty } : t)));
    }
  }, [content, selectedPath, originalContents]);

  const parsedProblems = useMemo(() => {
    if (!aiResult) return [];
    const lines = aiResult.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.map((l) => ({ message: l }));
  }, [aiResult]);


  const handleContextMenu = (node: FileNode, pos: { x: number; y: number }) => {
    setContextMenu({ path: node.path, type: node.type, x: pos.x, y: pos.y });
  };

  // New context menu handlers for VSCode-like functionality
  const handleRevealInFinder = async (path: string) => {
    if (window && (window as any).electron && (window as any).electron.ipcRenderer) {
      (window as any).electron.ipcRenderer.send('reveal-in-finder', path);
    }
  };

  const handleCopyPath = async (path: string) => {
    try {
      // Use Electron clipboard if available, otherwise use web API
      if (window && (window as any).electron && (window as any).electron.ipcRenderer) {
        (window as any).electron.ipcRenderer.send('copy-path', path);
      } else {
        await navigator.clipboard.writeText(path);
      }
      setStatus(`Copied path: ${path}`);
    } catch (error) {
      setStatus(`Failed to copy path: ${error}`);
    }
  };

  const handleCopyRelativePath = async (path: string) => {
    try {
      // For now, just copy the path as-is (could be enhanced to calculate relative path)
      if (window && (window as any).electron && (window as any).electron.ipcRenderer) {
        (window as any).electron.ipcRenderer.send('copy-relative-path', path);
      } else {
        await navigator.clipboard.writeText(path);
      }
      setStatus(`Copied relative path: ${path}`);
    } catch (error) {
      setStatus(`Failed to copy relative path: ${error}`);
    }
  };

  const handleOpenFolder = async (path: string) => {
    if (window && (window as any).electron && (window as any).electron.ipcRenderer) {
      (window as any).electron.ipcRenderer.send('open-folder', path);
    }
  };

  const executeContextAction = async (action: string) => {
    if (!contextMenu) return;
    const { path, type } = contextMenu;
    switch (action) {
      case 'open':
        await loadEntry(path);
        break;
      case 'new-file':
        await handleCreateAt(path, 'file');
        break;
      case 'new-folder':
        await handleCreateAt(path, 'folder');
        break;
      case 'rename':
        await handleRenameAt(path);
        break;
      case 'delete':
        await handleDeleteAt(path);
        break;
      case 'reveal-in-finder':
        await handleRevealInFinder(path);
        break;
      case 'copy-path':
        await handleCopyPath(path);
        break;
      case 'copy-relative-path':
        await handleCopyRelativePath(path);
        break;
      case 'open-folder':
        await handleOpenFolder(path);
        break;
      default:
        break;
    }
    setContextMenu(null);
  };

  return (
    <div className="app-shell">
      <TitleBar
        onMinimize={() => {
          if (window && (window as any).electron && (window as any).electron.ipcRenderer) {
            (window as any).electron.ipcRenderer.send('minimize-window');
          }
        }}
        onMaximize={() => {
          if (window && (window as any).electron && (window as any).electron.ipcRenderer) {
            (window as any).electron.ipcRenderer.send('maximize-window');
          }
        }}
        onClose={() => {
          if (window && (window as any).electron && (window as any).electron.ipcRenderer) {
            (window as any).electron.ipcRenderer.send('close-window');
          }
        }}
        onBack={goBack}
        onForward={goForward}
        onSearch={(query) => {
          // Handle search query - open file if it's a file path
          if (query && query.trim()) {
            // Check if the query is a file path (contains a file extension or is in the tree)
            const isFilePath = query.includes('.') || tree.some(node =>
              node.path === query || node.name === query
            );

            if (isFilePath) {
              // Find the file in the tree and open it
              const findFileInTree = (nodes: FileNode[], target: string): FileNode | undefined => {
                for (const node of nodes) {
                  if (node.path === target || node.name === target) return node;
                  if (node.children) {
                    const child = findFileInTree(node.children, target);
                    if (child) return child;
                  }
                }
                return undefined;
              };

              let fileNode = findFileInTree(tree, query);

              // If not found by full path, try by name
              if (!fileNode) {
                const fileName = query.split('/').pop() || query;
                fileNode = findFileInTree(tree, fileName);
              }

              if (fileNode && fileNode.type === 'file') {
                loadEntry(fileNode.path);
              } else if (fileNode && fileNode.type === 'folder') {
                // If it's a folder, just update the search but don't open
                console.log('Selected folder:', fileNode.path);
              }
            } else {
              // If it's a search term, switch to search view
              setActiveView('search');
              setSearchQuery(query);
            }
          }
        }}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        tree={tree}
      />
      <div
        className={`workspace ${activeView === "ai" ? "with-right-rail" : ""}`}
      >
        <ActivityBar activeView={activeView} onViewChange={setActiveView} />
        <div className="sidebar-container">
          {activeView === "explorer" && (
            <FileTree
              nodes={tree}
              onSelect={loadEntry}
              selectedPath={selectedPath}
              onRefresh={refreshTree}
              onContextMenu={handleContextMenu}
              onCreateFile={() => handleCreate('file')}
              onCreateFolder={() => handleCreate('folder')}
              onCollapseAll={() => {
                // For now, collapse all by refreshing
                // In a future enhancement, we could add actual collapse state
                refreshTree();
              }}
              onRevealInFinder={handleRevealInFinder}
              onCopyPath={handleCopyPath}
              onCopyRelativePath={handleCopyRelativePath}
              onOpenFolder={handleOpenFolder}
            />
          )}
          {activeView === "search" && (
            <SearchPanel
              query={searchQuery}
              onQueryChange={setSearchQuery}
              results={searchResults}
              onOpenFile={openTab}
              onOpenFileAtLine={(path: string, line: number) => {
                openTab(path);
                // TODO: Navigate to specific line in editor
                // This would require editor API integration
              }}
              currentFile={selectedPath}
              currentLine={cursor.line}
            />
          )}
          {activeView === "problems" && (
            <ProblemsPanel problems={parsedProblems} />
          )}
        </div>
        <EditorPane
          value={content}
          onChange={setContent}
          language={editorLanguage}
          filePath={selectedPath ?? "untitled"}
          theme={theme}
          onRequestAutocomplete={handleAutocomplete}
          onCursorChange={setCursor}
          tabs={tabs}
          activePath={selectedPath}
          onSelect={openTab}
          onClose={closeTab}
        />
        {activeView === "ai" && (
          <div className="right-rail">
            <Suspense fallback={
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%', 
                color: 'var(--muted)',
                fontSize: '14px'
              }}>
                Loading AI Assistant...
              </div>
            }>
              <ChatSidebar
                messages={messages}
                onSend={handleSendMessage}
                outline={outline}
                problems={parsedProblems}
                onJumpToLine={(line) => setCursor({ line, column: 1 })}
              />
            </Suspense>
          </div>
        )}
      </div>
      <div className="status-container">
        <StatusBar
          status={status || "Ready"}
          language={language}
          cursor={cursor}
          path={selectedPath}
          serverOk={serverOk}
          theme={theme}
        />
        <BottomPanel
          problems={parsedProblems}
          output={output}
          debugMessages={debugMessages}
          onTerminalCommand={handleTerminalCommand}
          terminalTabs={terminalTabs}
          activeTerminalTab={activeTerminalTab}
          onTerminalTabSwitch={setActiveTerminalTab}
          onNewTerminalTab={createNewTerminalTab}
          onCloseTerminalTab={closeTerminalTab}
        />
      </div>
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button onClick={() => executeContextAction("open")}>Open</button>
          <button onClick={() => executeContextAction("rename")}>Rename</button>
          <button onClick={() => executeContextAction("delete")}>Delete</button>
          <button onClick={() => executeContextAction("new-file")}>
            New File
          </button>
          <button onClick={() => executeContextAction("new-folder")}>
            New Folder
          </button>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0', width: '100%' }} />
          <button onClick={() => executeContextAction("reveal-in-finder")}>
            Reveal in Finder
          </button>
          <button onClick={() => executeContextAction("copy-path")}>
            Copy Path
          </button>
          <button onClick={() => executeContextAction("copy-relative-path")}>
            Copy Relative Path
          </button>
          <button onClick={() => executeContextAction("open-folder")}>
            Open Folder
          </button>
          <div className="context-hint">{contextMenu.type.toUpperCase()}</div>
        </div>
      )}
      <CommandPalette
        open={paletteOpen}
        commands={commands}
        query={paletteQuery}
        onQueryChange={setPaletteQuery}
        onClose={() => setPaletteOpen(false)}
      />
      <QuickOpen
        open={quickOpen}
        tree={tree}
        query={quickOpenQuery}
        onQueryChange={setQuickOpenQuery}
        onOpen={handleQuickOpen}
        onClose={() => setQuickOpen(false)}
      />

      {/* File Operation Modals */}
      <FileOperationModal
        isOpen={showFileModal}
        onClose={() => setShowFileModal(false)}
        operation="create"
        targetType="file"
        onConfirm={(name) => handleCreateConfirm(name, 'file')}
      />

      <FileOperationModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        operation="create"
        targetType="folder"
        onConfirm={(name) => handleCreateConfirm(name, 'folder')}
      />

      <FileOperationModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        operation="rename"
        targetType={modalTargetPath && findNode(tree, modalTargetPath)?.type === 'folder' ? 'folder' : 'file'}
        currentPath={modalTargetPath}
        onConfirm={handleRenameConfirm}
      />
    </div>
  );
}

export default App;
