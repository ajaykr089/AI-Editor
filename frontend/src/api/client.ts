import {
  AnalyzeIntent,
  AnalyzeResponse,
  AutocompleteResponse,
  ChatMessage,
  FileNode,
  SearchResult,
} from 'shared';

const apiBase =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? 'http://localhost:4000'
    : '';

const json = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(apiBase + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
};

export const fetchTree = () => json<{ nodes: FileNode[] }>('/api/files/tree');

export const fetchFileContent = (filePath: string) =>
  json<{ content: string }>('/api/files/read', { method: 'POST', body: JSON.stringify({ filePath }) });

export const writeFile = (filePath: string, content: string) =>
  json('/api/files/write', { method: 'POST', body: JSON.stringify({ filePath, content }) });

export const createEntry = (filePath: string, type: 'file' | 'folder') =>
  json('/api/files/create', { method: 'POST', body: JSON.stringify({ filePath, type }) });

export const deleteEntry = (filePath: string) =>
  json('/api/files/delete', { method: 'POST', body: JSON.stringify({ filePath }) });

export const renameEntry = (filePath: string, newPath: string) =>
  json('/api/files/rename', { method: 'POST', body: JSON.stringify({ filePath, newPath }) });

export const downloadZip = async () => {
  const res = await fetch(apiBase + '/api/export');
  if (!res.ok) throw new Error('Failed to export project');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'project.zip';
  a.click();
  URL.revokeObjectURL(url);
};

export const autocomplete = (payload: {
  content: string;
  language: string;
  cursorLine: number;
  cursorColumn: number;
}) => json<AutocompleteResponse>('/api/autocomplete', { method: 'POST', body: JSON.stringify(payload) });

export const analyzeCode = (payload: { code: string; language: string; intent: AnalyzeIntent }) =>
  json<AnalyzeResponse>('/api/analyze', { method: 'POST', body: JSON.stringify(payload) });

export const sendChat = (messages: ChatMessage[]) =>
  json<{ reply: string }>('/api/chat', { method: 'POST', body: JSON.stringify({ messages }) });

export const searchProject = (query: string) =>
  json<{ results: SearchResult[] }>('/api/search', { method: 'POST', body: JSON.stringify({ query }) });

