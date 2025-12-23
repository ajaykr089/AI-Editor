import { FaFolderOpen, FaSearch, FaExclamationTriangle, FaRobot, FaAdjust } from 'react-icons/fa';

type Props = {
  activeView: string;
  onViewChange: (view: string) => void;
};

const ActivityBar = ({ activeView, onViewChange }: Props) => {
  const items = [
    { id: 'explorer', label: 'Explorer', icon: FaFolderOpen, shortcut: 'Ctrl/Cmd+E' },
    { id: 'search', label: 'Search', icon: FaSearch, shortcut: 'Ctrl/Cmd+F' },
    { id: 'problems', label: 'Problems', icon: FaExclamationTriangle, shortcut: 'Ctrl/Cmd+Shift+M' },
    { id: 'ai', label: 'AI Assistant', icon: FaRobot, shortcut: 'Ctrl/Cmd+I' },
  ];
  return (
    <div className="activity-bar">
      {items.map((item) => (
        <div
          key={item.id}
          className={`activity-item ${activeView === item.id ? 'active' : ''}`}
          title={`${item.label} ${item.shortcut}`}
          onClick={() => onViewChange(item.id)}
        >
          <span style={{ fontSize: '16px', marginBottom: '2px' }}>
            <item.icon />
          </span>
          <span style={{ fontSize: '10px', opacity: 0.8 }}>{item.label}</span>
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div 
        className="activity-item" 
        title="Toggle Theme"
        onClick={() => document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'}
      >
        <span style={{ fontSize: '16px' }}>
          <FaAdjust />
        </span>
      </div>
    </div>
  );
};

export default ActivityBar;
