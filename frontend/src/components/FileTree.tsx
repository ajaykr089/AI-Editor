import { FileNode } from 'shared';

type Props = {
  nodes: FileNode[];
  onSelect: (path: string) => void;
  selectedPath: string | null;
  onRefresh: () => void;
  onContextMenu: (node: FileNode, pos: { x: number; y: number }) => void;
};

const TreeNode = ({
  node,
  level,
  onSelect,
  selectedPath,
  onContextMenu,
}: {
  node: FileNode;
  level: number;
  onSelect: (path: string) => void;
  selectedPath: string | null;
  onContextMenu: (node: FileNode, pos: { x: number; y: number }) => void;
}) => {
  const isSelected = selectedPath === node.path;
  return (
    <div className="tree-node" style={{ paddingLeft: `${level * 12}px` }}>
      <div
        className={`tree-row ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelect(node.path)}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(node, { x: e.clientX, y: e.clientY });
        }}
      >
        <span className="tree-icon">{node.type === 'folder' ? '📁' : '📄'}</span>
        <span>{node.name}</span>
      </div>
      {node.children?.map((child) => (
        <TreeNode
          key={child.path}
          node={child}
          level={level + 1}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
};

const FileTree = ({ nodes, onSelect, selectedPath, onRefresh, onContextMenu }: Props) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <strong>Files</strong>
        <button className="ghost" onClick={onRefresh}>
          ⟳
        </button>
      </div>
      <div className="tree">
        {nodes.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            level={0}
            onSelect={onSelect}
            selectedPath={selectedPath}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    </aside>
  );
};

export default FileTree;

