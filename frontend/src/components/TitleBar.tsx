type Props = {
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
};

const TitleBar = ({ onMinimize, onMaximize, onClose }: Props) => {
  return (
    <div className="title-bar" data-tauri-drag-region>
      <div className="title-bar-title">AI Editor</div>
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

