import { useEffect, useMemo, useState } from 'react';
import { AnalyzeIntent, ChatMessage, FileNode } from 'shared';
import EditorPane from './components/EditorPane';
import FileTree from './components/FileTree';
import ChatSidebar from './components/ChatSidebar';
import TabsBar from './components/TabsBar';
import StatusBar from './components/StatusBar';
import BottomPanel from './components/BottomPanel';
import CommandPalette from './components/CommandPalette';
import QuickOpen from './components/QuickOpen';
import ProblemsPanel from './components/ProblemsPanel';
import ActivityBar from './components/ActivityBar';
import SearchPanel from './components/SearchPanel';
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
  if (filePath.endsWith('.ts')) return 'typescript';
  if (filePath.endsWith('.tsx')) return 'typescript';
  if (filePath.endsWith('.js')) return 'javascript';
  if (filePath.endsWith('.jsx')) return 'javascript';
  if (filePath.endsWith('.py')) return 'python';
  if (filePath.endsWith('.java')) return 'java';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.css')) return 'css';
  if (filePath.endsWith('.html')) return 'html';
  return 'typescript';
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const refreshTree = async () => {
    const data = await fetchTree();
    setTree(data.nodes ?? []);
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
    setSelectedPath(path);
    if (node?.type === 'folder') {
      setContent('');
      return;
    }
    setLanguage(detectLanguage(path));
    const data = await fetchFileContent(path);
    setContent(data.content ?? '');
    const label = path.split('/').pop() ?? path;
    setTabs((prev) => {
      const exists = prev.find((t) => t.path === path);
      if (exists) return prev;
      return [...prev, { path, label }];
    });
  };

  const saveFile = async () => {
    if (!selectedPath) return;
    await writeFile(selectedPath, content);
    setStatus(`Saved ${selectedPath}`);
    setTabs((prev) => prev.map((t) => (t.path === selectedPath ? { ...t, dirty: false } : t)));
  };

  const askName = (message: string, fallback: string) => {
    const name = `${fallback}-${Date.now()}`;
    setStatus(`Using default ${name} (prompts disabled in desktop)`);
    return name;
  };

  const handleCreate = async (type: 'file' | 'folder') => {
    const name = askName(`Enter ${type} name`, type === 'file' ? 'untitled' : 'new-folder');
    const selectedNode = selectedPath ? findNode(tree, selectedPath) : undefined;
    const baseDir =
      selectedNode?.type === 'folder'
        ? selectedPath ?? '/'
        : selectedPath
        ? selectedPath.substring(0, selectedPath.lastIndexOf('/')) || '/'
        : '/';
    const normalizedBase = baseDir.endsWith('/') ? baseDir : `${baseDir}/`;
    const fullPath = `${normalizedBase}${name}`;
    await createEntry(fullPath, type);
    await refreshTree();
  };

  const handleCreateAt = async (targetPath: string, type: 'file' | 'folder') => {
    const name = askName(`Enter ${type} name`, type === 'file' ? 'untitled' : 'new-folder');
    const targetNode = findNode(tree, targetPath);
    const baseDir =
      targetNode?.type === 'folder'
        ? targetPath
        : targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
    const normalizedBase = baseDir.endsWith('/') ? baseDir : `${baseDir}/`;
    const fullPath = `${normalizedBase}${name}`;
    await createEntry(fullPath, type);
    await refreshTree();
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
    const name = askName('New name', selectedPath.split('/').pop() || 'renamed');
    const base = selectedPath.slice(0, selectedPath.lastIndexOf('/')) || '/';
    const newPath = `${base === '/' ? '' : base}/${name}`;
    await renameEntry(selectedPath, newPath);
    setSelectedPath(newPath);
    await refreshTree();
  };

  const handleRenameAt = async (path: string) => {
    const name = askName('New name', path.split('/').pop() || 'renamed');
    const base = path.slice(0, path.lastIndexOf('/')) || '/';
    const newPath = `${base === '/' ? '' : base}/${name}`;
    await renameEntry(path, newPath);
    if (selectedPath === path) setSelectedPath(newPath);
    await refreshTree();
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

  const handleTerminalCommand = (cmd: string) => {
    setOutput((prev) => [...prev, `$ ${cmd}`]);
    if (cmd === 'clear') {
      setOutput([]);
    } else if (cmd.startsWith('echo ')) {
      setOutput((prev) => [...prev, cmd.substring(5)]);
    } else {
      setOutput((prev) => [...prev, `Command not found: ${cmd}. Try 'clear' or 'echo <text>'`]);
    }
  };

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

  const commands = [
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
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveFile();
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setQuickOpen(true);
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
        default:
          break;
      }
    });
    return () => {
      if (typeof dispose === 'function') dispose();
    };
  }, [handleCreate, handleDelete, handleRename, handleAnalyze, handleExport, saveFile]);

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
    setTabs((prev) => prev.map((t) => (t.path === selectedPath ? { ...t, dirty: content !== '' ? true : t.dirty } : t)));
  }, [content, selectedPath]);

  const parsedProblems = useMemo(() => {
    if (!aiResult) return [];
    const lines = aiResult.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.map((l) => ({ message: l }));
  }, [aiResult]);

  const menus = [
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
  ];

  const handleContextMenu = (node: FileNode, pos: { x: number; y: number }) => {
    setContextMenu({ path: node.path, type: node.type, x: pos.x, y: pos.y });
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
      default:
        break;
    }
    setContextMenu(null);
  };

  return (
    <div className="app-shell">
      <TabsBar tabs={tabs} activePath={selectedPath} onSelect={openTab} onClose={closeTab} />
      <div className={`workspace ${activeView === 'ai' ? 'with-right-rail' : ''}`}>
        <ActivityBar activeView={activeView} onViewChange={setActiveView} />
        <div className="sidebar-container">
          {activeView === 'explorer' && (
            <FileTree
              nodes={tree}
              onSelect={loadEntry}
              selectedPath={selectedPath}
              onRefresh={refreshTree}
              onContextMenu={handleContextMenu}
            />
          )}
          {activeView === 'search' && (
            <SearchPanel
              query={searchQuery}
              onQueryChange={setSearchQuery}
              results={searchResults}
              onOpenFile={openTab}
            />
          )}
          {activeView === 'problems' && <ProblemsPanel problems={parsedProblems} />}
        </div>
        <EditorPane
          value={content}
          onChange={setContent}
          language={editorLanguage}
          filePath={selectedPath ?? 'untitled'}
          theme={theme}
          onRequestAutocomplete={handleAutocomplete}
          onCursorChange={setCursor}
        />
        {activeView === 'ai' && (
          <div className="right-rail">
            <ChatSidebar
              messages={messages}
              onSend={handleSendMessage}
              outline={outline}
              problems={parsedProblems}
              onJumpToLine={(line) => setCursor({ line, column: 1 })}
            />
          </div>
        )}
      </div>
      <div className="status-container">
        <StatusBar
          status={status || 'Ready'}
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
        />
      </div>
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button onClick={() => executeContextAction('open')}>Open</button>
          <button onClick={() => executeContextAction('rename')}>Rename</button>
          <button onClick={() => executeContextAction('delete')}>Delete</button>
          <button onClick={() => executeContextAction('new-file')}>New File</button>
          <button onClick={() => executeContextAction('new-folder')}>New Folder</button>
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
    </div>
  );
}

export default App;

