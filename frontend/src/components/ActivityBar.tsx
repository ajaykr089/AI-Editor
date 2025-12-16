type Props = {
  activeView: string;
  onViewChange: (view: string) => void;
};

const ActivityBar = ({ activeView, onViewChange }: Props) => {
  const items = [
    { id: 'explorer', label: 'Explorer', icon: '📁' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'problems', label: 'Problems', icon: '⚠️' },
    { id: 'ai', label: 'AI Assistant', icon: '🤖' },
  ];
  return (
    <div className="activity-bar">
      {items.map((item) => (
        <div
          key={item.id}
          className={`activity-item ${activeView === item.id ? 'active' : ''}`}
          title={item.label}
          onClick={() => onViewChange(item.id)}
        >
          <span>{item.icon}</span>
        </div>
      ))}
    </div>
  );
};

export default ActivityBar;

