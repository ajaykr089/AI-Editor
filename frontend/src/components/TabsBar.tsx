import { 
  SiJavascript, SiTypescript, SiPython, SiHtml5, SiCss3, 
  SiJson, SiMarkdown, SiVuedotjs, SiSvelte, SiGoland, SiRust, 
  SiPhp, SiRuby, SiSwift, SiKotlin, SiSass 
} from 'react-icons/si';
import { FaFile, FaFileCode } from 'react-icons/fa';

type Tab = {
  path: string;
  label: string;
  dirty?: boolean;
};

type Props = {
  tabs: Tab[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
};

const TabsBar = ({ tabs, activePath, onSelect, onClose }: Props) => {
  const getFileIcon = (path: string) => {
    const ext = path.toLowerCase();
    if (ext.endsWith('.js') || ext.endsWith('.jsx')) return <SiJavascript />;
    if (ext.endsWith('.ts') || ext.endsWith('.tsx')) return <SiTypescript />;
    if (ext.endsWith('.py')) return <SiPython />;
    if (ext.endsWith('.java')) return <span role="img" aria-label="Java">♨️</span>;
    if (ext.endsWith('.html')) return <SiHtml5 />;
    if (ext.endsWith('.css')) return <SiCss3 />;
    if (ext.endsWith('.scss') || ext.endsWith('.sass')) return <SiSass />;
    if (ext.endsWith('.json')) return <SiJson />;
    if (ext.endsWith('.md')) return <SiMarkdown />;
    if (ext.endsWith('.vue')) return <SiVuedotjs />;
    if (ext.endsWith('.svelte')) return <SiSvelte />;
    if (ext.endsWith('.go')) return <SiGoland />;
    if (ext.endsWith('.rust') || ext.endsWith('.rs')) return <SiRust />;
    if (ext.endsWith('.php')) return <SiPhp />;
    if (ext.endsWith('.rb')) return <SiRuby />;
    if (ext.endsWith('.swift')) return <SiSwift />;
    if (ext.endsWith('.kts') || ext.endsWith('.kt')) return <SiKotlin />;
    return <FaFileCode />;
  };

  return (
    <div className="tabs-bar">
      {tabs.map((tab) => {
        const isActive = tab.path === activePath;
        return (
          <div
            key={tab.path}
            className={`tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(tab.path)}
            title={tab.path}
            style={{ 
              borderLeft: tab.dirty ? '3px solid var(--accent)' : '3px solid transparent',
              paddingLeft: tab.dirty ? '9px' : '12px'
            }}
          >
            <span className="tab-icon" style={{ marginRight: '6px', fontSize: '12px' }}>
              {getFileIcon(tab.path)}
            </span>
            <span className="tab-label">
              {tab.label}
              {tab.dirty && (
                <span style={{ 
                  color: 'var(--accent)', 
                  marginLeft: '6px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>●</span>
              )}
            </span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.path);
              }}
              title="Close Tab (Ctrl+W)"
            >
              ×
            </button>
          </div>
        );
      })}
      {tabs.length === 0 && (
        <div className="muted" style={{ padding: '8px 12px', fontSize: '12px' }}>
          No files open. Create a new file or open an existing one.
        </div>
      )}
    </div>
  );
};

export default TabsBar;
