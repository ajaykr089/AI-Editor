type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  results: { filePath: string; line: number; preview: string }[];
  onOpenFile: (path: string) => void;
};

const SearchPanel = ({ query, onQueryChange, results, onOpenFile }: Props) => {
  return (
    <div className="search-panel">
      <div className="sidebar-header">
        <strong>Search</strong>
      </div>
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search in files..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <div className="search-results-list">
        {results.length > 0 ? (
          results.map((r, idx) => (
            <div key={idx} className="search-hit" onClick={() => onOpenFile(r.filePath)}>
              <div className="hit-path">
                {r.filePath}:{r.line}
              </div>
              <div className="hit-preview">{r.preview}</div>
            </div>
          ))
        ) : (
          <div className="muted">No results</div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;

