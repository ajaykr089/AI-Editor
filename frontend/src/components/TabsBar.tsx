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
          >
            <span className="tab-label">
              {tab.label}
              {tab.dirty ? ' •' : ''}
            </span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.path);
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default TabsBar;

