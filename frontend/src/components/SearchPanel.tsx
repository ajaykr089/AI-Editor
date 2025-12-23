type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  results: { filePath: string; line: number; preview: string }[];
  onOpenFile: (path: string) => void;
  onOpenFileAtLine: (path: string, line: number) => void;
  currentFile?: string;
  currentLine?: number;
};

const SearchPanel = ({ 
  query, 
  onQueryChange, 
  results, 
  onOpenFile, 
  onOpenFileAtLine,
  currentFile,
  currentLine
}: Props) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      // Open first result
      onOpenFile(results[0].filePath);
    }
  };

  const isCurrentFile = (filePath: string) => {
    return currentFile && filePath === currentFile;
  };

  const getLineIndicator = (filePath: string, line: number) => {
    if (isCurrentFile(filePath) && currentLine === line) {
      return '• Current Line';
    }
    return `: ${line}`;
  };

  return (
    <div className="search-panel">
      <div className="sidebar-header">
        <strong>Search</strong>
        <span className="muted" style={{ fontSize: '11px', marginLeft: '8px' }}>
          {results.length} result{results.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search in files... (Ctrl+P for Quick Open)"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>
      
      {/* Go to Line Section */}
      {currentFile && (
        <div className="search-input-wrapper" style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Go to Line</span>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {currentFile.split('/').pop()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              className="search-input"
              placeholder="Line number..."
              min="1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const line = parseInt((e.target as HTMLInputElement).value);
                  if (line > 0 && currentFile) {
                    onOpenFileAtLine(currentFile, line);
                  }
                }
              }}
              style={{ flex: 1 }}
            />
            <button 
              className="ghost"
              onClick={() => {
                if (currentFile && currentLine) {
                  onOpenFileAtLine(currentFile, currentLine);
                }
              }}
              title="Go to current line"
              style={{ padding: '8px 12px' }}
            >
              Current: {currentLine || 1}
            </button>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="search-results-list">
        {results.length > 0 ? (
          results.map((r, idx) => (
            <div key={`${r.filePath}:${r.line}:${idx}`} className="search-hit">
              <div 
                className="hit-path"
                onClick={() => onOpenFile(r.filePath)}
                style={{ cursor: 'pointer' }}
                title="Open file"
              >
                <span style={{ color: 'var(--accent)' }}>📁</span>
                <span style={{ marginLeft: '6px' }}>
                  {r.filePath}
                </span>
                <span style={{ 
                  marginLeft: '8px', 
                  color: isCurrentFile(r.filePath) ? 'var(--accent)' : 'var(--muted)',
                  fontSize: '11px'
                }}>
                  {getLineIndicator(r.filePath, r.line)}
                </span>
              </div>
              <div 
                className="hit-preview"
                onClick={() => onOpenFileAtLine(r.filePath, r.line)}
                style={{ cursor: 'pointer' }}
                title="Go to line"
              >
                <span style={{ color: 'var(--accent)', marginRight: '6px' }}>→</span>
                {r.preview}
              </div>
            </div>
          ))
        ) : query.trim() === '' ? (
          <div className="muted">
            Start typing to search files by name and content. 
            Use Ctrl+P for Quick Open to navigate files faster.
          </div>
        ) : (
          <div className="muted">
            No results found for "{query}". Try a different search term.
          </div>
        )}
      </div>

      {/* Search Tips */}
      <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Search Tips:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--muted)' }}>
          <div>• Type file names to quickly open files</div>
          <div>• Search content across all files</div>
          <div>• Press Enter to open the first result</div>
          <div>• Click file path to open file, click preview to go to line</div>
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;
