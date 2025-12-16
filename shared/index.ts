export type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
};

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type AutocompleteResponse = {
  suggestions: string[];
};

export type AnalyzeIntent = 'errors' | 'explain' | 'refactor' | 'fix';

export type AnalyzeResponse = {
  reply: string;
};

export type SearchResult = {
  filePath: string;
  line: number;
  preview: string;
};

