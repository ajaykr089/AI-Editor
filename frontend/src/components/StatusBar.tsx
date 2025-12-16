type Props = {
  status: string;
  language: string;
  cursor: { line: number; column: number };
  path: string | null;
  serverOk: boolean;
  theme: 'light' | 'dark';
};

const StatusBar = ({ status, language, cursor, path, serverOk, theme }: Props) => {
  return (
    <div className="status-bar">
      <div className="status-left">
        <div className="status-item">
          <span className={`status-indicator ${serverOk ? 'online' : 'offline'}`}></span>
          {serverOk ? 'Online' : 'Offline'}
        </div>
        {path && (
          <div className="status-item">
            <span className="status-icon">📄</span>
            {path.split('/').pop()}
          </div>
        )}
        <div className="status-item">
          <span className="status-icon">Ln</span>
          {cursor.line}
          <span className="status-icon">Col</span>
          {cursor.column}
        </div>
        <div className="status-item">
          <span className="status-icon">🔤</span>
          {language}
        </div>
        {status && (
          <div className="status-item">
            <span className="status-icon">ℹ</span>
            {status}
          </div>
        )}
      </div>
      <div className="status-right">
        <div className="status-item">
          <span className="status-icon">🎨</span>
          {theme}
        </div>
      </div>
    </div>
  );
};

export default StatusBar;

