import { FaArrowLeft, FaArrowRight, FaSearch, FaFile, FaFolder } from 'react-icons/fa';
import { useEffect, useState } from 'react';

type Props = {
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  onBack?: () => void;
  onForward?: () => void;
  onSearch?: (query: string) => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  tree?: any[];
};

const TitleBar = ({ 
  onMinimize, 
  onMaximize, 
  onClose, 
  onBack, 
  onForward, 
  onSearch, 
  canGoBack = false, 
  canGoForward = false,
  tree = []
}: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredFiles, setFilteredFiles] = useState<any[]>([]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFiles([]);
      setShowDropdown(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: any[] = [];

    const searchNodes = (nodes: any[], path = '') => {
      nodes.forEach(node => {
        const fullPath = path ? `${path}/${node.name}` : node.name;
        if (node.name.toLowerCase().includes(query)) {
          results.push({
            ...node,
            fullPath
          });
        }
        if (node.children && node.children.length > 0) {
          searchNodes(node.children, fullPath);
        }
      });
    };

    searchNodes(tree);
    
    // Sort by relevance (exact match first, then partial match)
    results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === query;
      const bExact = b.name.toLowerCase() === query;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.name.localeCompare(b.name);
    });

    setFilteredFiles(results.slice(0, 10)); // Limit to 10 results
    setShowDropdown(results.length > 0);
  }, [searchQuery, tree]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredFiles.length > 0) {
      // Open first result
      onSearch?.(filteredFiles[0].fullPath);
      setSearchQuery('');
      setShowDropdown(false);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSearchQuery('');
    }
  };

  const handleFileSelect = (filePath: string) => {
    onSearch?.(filePath);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Handle clicks outside the search area to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.title-bar-search')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="title-bar" data-tauri-drag-region>
      <div className="title-bar-left">
        <div className="title-bar-title">AI Editor</div>
        <div className="title-bar-navigation">
          <button 
            className={`title-bar-button nav-button ${canGoBack ? 'enabled' : 'disabled'}`} 
            onClick={onBack} 
            title="Go Back (Alt+Left)"
            disabled={!canGoBack}
          >
            <FaArrowLeft size={12} />
          </button>
          <button 
            className={`title-bar-button nav-button ${canGoForward ? 'enabled' : 'disabled'}`} 
            onClick={onForward} 
            title="Go Forward (Alt+Right)"
            disabled={!canGoForward}
          >
            <FaArrowRight size={12} />
          </button>
        </div>
        <div className="title-bar-search">
          <div className="search-icon">
            <FaSearch size={12} />
          </div>
          <input
            type="text"
            placeholder="Search files by name (Ctrl+P)"
            className="search-input"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery.trim() && setShowDropdown(true)}
          />
          
          {/* Inline Search Dropdown */}
          {showDropdown && (
            <div className="search-dropdown">
              <div className="search-dropdown-header">
                <span className="muted">Quick Open</span>
                <span className="muted" style={{ fontSize: '11px' }}>
                  Enter to open, Esc to close
                </span>
              </div>
              <div className="search-dropdown-list">
                {filteredFiles.map((file, idx) => (
                  <div
                    key={`${file.fullPath}-${idx}`}
                    className="search-dropdown-item"
                    onClick={() => handleFileSelect(file.fullPath)}
                    title={file.fullPath}
                  >
                    <span style={{ marginRight: '8px' }}>
                      {file.type === 'folder' ? <FaFolder size={12} /> : <FaFile size={12} />}
                    </span>
                    <span style={{ flex: 1 }}>
                      {file.name}
                    </span>
                    <span className="muted" style={{ fontSize: '11px' }}>
                      {file.fullPath}
                    </span>
                  </div>
                ))}
                {filteredFiles.length === 0 && (
                  <div className="search-dropdown-item muted">
                    No files found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="title-bar-controls">
        <button className="title-bar-button" onClick={onMinimize} title="Minimize">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="0" y="5" width="12" height="2" fill="currentColor" />
          </svg>
        </button>
        <button className="title-bar-button" onClick={onMaximize} title="Maximize">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <button className="title-bar-button close" onClick={onClose} title="Close">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1 L11 11 M11 1 L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
