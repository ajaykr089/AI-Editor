# AI Code Editor

Full-stack AI-powered editor with Monaco, chat assistant, AI autocomplete, error detection, refactoring, and a Node.js backend. The project is split into `frontend/`, `backend/`, and `shared/`.

## Features
- Monaco editor with multi-language syntax highlighting and AI autocomplete.
- AI chat sidebar for Q&A, explanations, and refactoring help.
- AI error detection, bug fixing, and code explanations via `/api/analyze`.
- File system operations (create, delete, rename, folders) stored in `backend/workspace`.
- Export current project as a ZIP file.
- Light/dark themes.
- Secure server-side AI key handling.

## Quick Start
### Prereqs
- Node.js 18+

### Install
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Configure backend
Create `backend/.env`:
```
PORT=4000
AI_API_KEY=your-key-here   # kept server-side only
AI_MODEL=gpt-4o-mini       # or any chat-completions model
```

### Run
```bash
# in one terminal
cd backend
npm run dev

# in another terminal
cd frontend
npm run dev
```
Open http://localhost:5173.

### Build
```bash
cd backend && npm run build
cd ../frontend && npm run build
```

## Electron packaging
### One-time install
```bash
cd frontend
npm install
```

### Build desktop app
```bash
cd frontend
npm run electron:dist   # produces installers/binaries via electron-builder
```
### Targets
- macOS: dmg, zip
- Windows: nsis, zip
- Linux: AppImage, deb

### Windows build
- Ensure Node 18+ (we use `nvm use v22.12.0`).
- Install deps once: `cd frontend && npm install`.
- Build renderer: `npm run build`.
- Package for Windows: `npm run electron:dist` (generates NSIS `.exe` and zip). On macOS/Linux you may need Wine to cross-build; simplest is to run this on a Windows machine/VM.

### Dev file drop (unpacked)
```bash
cd frontend
npm run electron:pack   # creates an unpacked build in dist/
```

### When adding new features
- Re-run `npm run build` then `npm run electron:dist` to refresh the packaged app.
- If backend API changes, rebuild backend separately (`cd backend && npm run build`) and update the packaged app to point to your running backend (the Electron shell loads the built frontend from `frontend/dist`; backend still runs at http://localhost:4000 by default).
- Note: Electron main process is CommonJS (`electron-main.cjs`) to avoid ES module `require` issues in packaged apps.

## API surface
- `GET /api/health`
- File system: `/api/files/tree`, `/api/files/read`, `/api/files/write`, `/api/files/create`, `/api/files/rename`, `/api/files/delete`
- AI: `/api/chat`, `/api/autocomplete`, `/api/analyze`
- Export: `GET /api/export` (downloads ZIP)

## Notes
- Workspace files live in `backend/workspace`; safe-path checks prevent escaping that folder.
- If no `AI_API_KEY` is set, the backend returns mocked AI responses so the UI still works for demos.
- Shared types sit in `shared/` and are imported by both frontend and backend.

