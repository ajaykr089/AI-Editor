import { AnalyzeIntent } from 'shared';

type Props = {
  theme: 'light' | 'dark';
  status?: string;
  aiResult?: string;
  onToggleTheme: () => void;
  onSave: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onDelete: () => void;
  onRename: () => void;
  onExport: () => void;
  onAnalyze: (intent: AnalyzeIntent) => void;
};

const Toolbar = ({
  theme,
  status,
  aiResult,
  onToggleTheme,
  onSave,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRename,
  onExport,
  onAnalyze,
}: Props) => {
  return (
    <header className="topbar">
      <div className="left">
        <button onClick={onSave}>Save</button>
        <button onClick={onCreateFile}>New File</button>
        <button onClick={onCreateFolder}>New Folder</button>
        <button className="ghost" onClick={onRename}>
          Rename
        </button>
        <button className="ghost danger" onClick={onDelete}>
          Delete
        </button>
        <button onClick={onExport}>Export ZIP</button>
      </div>
      <div className="center">
        <button onClick={() => onAnalyze('errors')}>Find Errors</button>
        <button onClick={() => onAnalyze('fix')}>Bug Fix</button>
        <button onClick={() => onAnalyze('explain')}>Explain</button>
        <button onClick={() => onAnalyze('refactor')}>Refactor</button>
      </div>
      <div className="right">
        <span className="status">{status}</span>
        <button onClick={onToggleTheme}>Theme: {theme}</button>
      </div>
      {aiResult && (
        <div className="ai-result">
          <strong>AI</strong>
          <div>{aiResult}</div>
        </div>
      )}
    </header>
  );
};

export default Toolbar;

