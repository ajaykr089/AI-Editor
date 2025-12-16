import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import archiver from 'archiver';
import dotenv from 'dotenv';
import readline from 'node:readline';

dotenv.config();

type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const WORKSPACE_ROOT = path.join(process.cwd(), 'workspace');

const ensureWorkspace = async () => {
  if (!existsSync(WORKSPACE_ROOT)) {
    await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
  }
};

const resolveSafe = (requestedPath: string) => {
  const normalized = path.normalize(path.join(WORKSPACE_ROOT, requestedPath));
  if (!normalized.startsWith(WORKSPACE_ROOT)) {
    throw new Error('Invalid path');
  }
  return normalized;
};

const readTree = async (dir: string): Promise<FileNode[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nodes: FileNode[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relative = path.relative(WORKSPACE_ROOT, fullPath);
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: `/${relative}`,
        type: 'folder',
        children: await readTree(fullPath),
      });
    } else {
      nodes.push({
        name: entry.name,
        path: `/${relative}`,
        type: 'file',
      });
    }
  }
  return nodes;
};

const collectFiles = async (dir: string, acc: string[] = []): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(fullPath, acc);
    } else {
      acc.push(fullPath);
    }
  }
  return acc;
};

const callLLM = async (prompt: string): Promise<string> => {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? 'gpt-4o-mini';
  if (!apiKey) {
    return `[mocked ai] ${prompt.slice(0, 180)}...`;
  }
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        messages: [
          { role: 'system', content: 'You are a concise software assistant.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LLM request failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as any;
    return data.choices?.[0]?.message?.content ?? 'No completion returned.';
  } catch (err: any) {
    console.error('LLM error', err);
    return 'AI call failed. Please check server logs or your API key.';
  }
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/files/tree', async (_req, res) => {
  try {
    await ensureWorkspace();
    const tree = await readTree(WORKSPACE_ROOT);
    res.json({ root: '/', nodes: tree });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/files/read', async (req, res) => {
  try {
    const { filePath } = req.body as { filePath: string };
    if (!filePath) throw new Error('filePath required');
    const absolute = resolveSafe(filePath);
    const content = await fs.readFile(absolute, 'utf8');
    res.json({ content });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/files/write', async (req, res) => {
  try {
    const { filePath, content } = req.body as { filePath: string; content: string };
    if (!filePath) throw new Error('filePath required');
    const absolute = resolveSafe(filePath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, content ?? '', 'utf8');
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/files/create', async (req, res) => {
  try {
    const { filePath, type } = req.body as { filePath: string; type: 'file' | 'folder' };
    if (!filePath || !type) throw new Error('filePath and type required');
    const absolute = resolveSafe(filePath);
    if (type === 'folder') {
      await fs.mkdir(absolute, { recursive: true });
    } else {
      await fs.mkdir(path.dirname(absolute), { recursive: true });
      await fs.writeFile(absolute, '', 'utf8');
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/files/rename', async (req, res) => {
  try {
    const { filePath, newPath } = req.body as { filePath: string; newPath: string };
    if (!filePath || !newPath) throw new Error('filePath and newPath required');
    const from = resolveSafe(filePath);
    const to = resolveSafe(newPath);
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.rename(from, to);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/files/delete', async (req, res) => {
  try {
    const { filePath } = req.body as { filePath: string };
    if (!filePath) throw new Error('filePath required');
    const absolute = resolveSafe(filePath);
    const stat = await fs.stat(absolute);
    if (stat.isDirectory()) {
      await fs.rm(absolute, { recursive: true, force: true });
    } else {
      await fs.unlink(absolute);
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/export', async (_req, res) => {
  try {
    await ensureWorkspace();
    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment('project.zip');
    archive.pipe(res);
    archive.directory(WORKSPACE_ROOT, false);
    await archive.finalize();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body as { messages: { role: string; content: string }[] };
    const userContent = messages?.map((m) => `${m.role}: ${m.content}`).join('\n') ?? '';
    const reply = await callLLM(userContent);
    res.json({ reply });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/autocomplete', async (req, res) => {
  try {
    const { content, language, cursorLine, cursorColumn } = req.body as {
      content: string;
      language: string;
      cursorLine: number;
      cursorColumn: number;
    };

    const prompt = `You are an expert IDE completion engine. File language: ${language}. Cursor line ${cursorLine}, column ${cursorColumn}. Suggest 3 concise completions (up to ~20 tokens) that continue the code. Respond with bullet list of raw code snippets only. Current buffer:\n${content}`;
    const result = await callLLM(prompt);
    const suggestions = result
      .split('\n')
      .map((s) => s.replace(/^[*-]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 5);
    res.json({ suggestions });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { code, language, intent } = req.body as {
      code: string;
      language: string;
      intent: 'errors' | 'explain' | 'refactor' | 'fix';
    };
    const prompt = `Language: ${language}. Intent: ${intent}. Provide a short, actionable response. If intent is fix or refactor, include a patched version of the code after the analysis.\n\nCode:\n${code}`;
    const reply = await callLLM(prompt);
    res.json({ reply });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/search', async (req, res) => {
  try {
    const { query, maxResults = 50 } = req.body as { query: string; maxResults?: number };
    if (!query || query.length < 2) throw new Error('query required (min 2 chars)');
    await ensureWorkspace();
    const files = await collectFiles(WORKSPACE_ROOT);
    const results: { filePath: string; line: number; preview: string }[] = [];
    for (const file of files) {
      if (results.length >= maxResults) break;
      const relative = `/${path.relative(WORKSPACE_ROOT, file)}`;
      const stream = createReadStream(file, { encoding: 'utf8' });
      const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
      let lineNo = 0;
      for await (const line of rl) {
        lineNo += 1;
        if (line.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            filePath: relative,
            line: lineNo,
            preview: line.trim().slice(0, 200),
          });
          if (results.length >= maxResults) break;
        }
      }
      rl.close();
      stream.close();
    }
    res.json({ results });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

ensureWorkspace().then(() => {
  app.listen(PORT, () => {
    console.log(`API server ready on http://localhost:${PORT}`);
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection', reason);
});

