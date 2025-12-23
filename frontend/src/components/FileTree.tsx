import { FileNode } from 'shared';
import { MdOutlineNoteAdd, MdOutlineCreateNewFolder, MdOutlineRefresh, MdOutlineCropSquare } from 'react-icons/md';
import { FaFolder, FaFile } from 'react-icons/fa';
import { useState, useEffect } from 'react';

type Props = {
  nodes: FileNode[];
  onSelect: (path: string) => void;
  selectedPath: string | null;
  onRefresh: () => void;
  onContextMenu: (node: FileNode, pos: { x: number; y: number }) => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onCollapseAll: () => void;
  onRevealInFinder: (path: string) => void;
  onCopyPath: (path: string) => void;
  onCopyRelativePath: (path: string) => void;
  onOpenFolder: (path: string) => void;
};

type TreeNodeProps = {
  node: FileNode;
  level: number;
  onSelect: (path: string) => void;
  selectedPath: string | null;
  onContextMenu: (node: FileNode, pos: { x: number; y: number }) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
};

const TreeNode = ({
  node,
  level,
  onSelect,
  selectedPath,
  onContextMenu,
  expandedFolders,
  onToggleFolder,
}: TreeNodeProps) => {
  const isSelected = selectedPath === node.path;
  const isExpanded = expandedFolders.has(node.path);
  const hasChildren = node.children && node.children.length > 0;

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
        {hasChildren && (
          <span 
            className="tree-expand-icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFolder(node.path);
            }}
            style={{ 
              marginRight: '6px',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: '10px'
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        <span className="tree-icon">
          {node.type === 'folder' ? <FaFolder size={14} /> : <FaFile size={14} />}
        </span>
        <span>{node.name}</span>
      </div>
      {hasChildren && isExpanded && (
        node.children.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            level={level + 1}
            onSelect={onSelect}
            selectedPath={selectedPath}
            onContextMenu={onContextMenu}
            expandedFolders={expandedFolders}
            onToggleFolder={onToggleFolder}
          />
        ))
      )}
    </div>
  );
};

const FileTree = ({ nodes, onSelect, selectedPath, onRefresh, onContextMenu, onCreateFile, onCreateFolder, onCollapseAll }: Props) => {
  // State for managing expanded folders
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Initialize expanded state when nodes change
  useEffect(() => {
    // Expand folders that have children by default
    const newExpanded = new Set<string>();
    const expandFolders = (fileNodes: FileNode[]) => {
      fileNodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          newExpanded.add(node.path);
          expandFolders(node.children);
        }
      });
    };
    expandFolders(nodes);
    setExpandedFolders(newExpanded);
  }, [nodes]);

  const handleToggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleCollapseAll = () => {
    setExpandedFolders(new Set());
    if (onCollapseAll) onCollapseAll();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <strong>EXPLORER</strong>
        <div className="file-op-buttons">
          <button 
            className="ghost" 
            onClick={onCreateFile}
            title="New File (Ctrl+N)"
          >
            <MdOutlineNoteAdd size={16} />
          </button>
          <button 
            className="ghost" 
            onClick={onCreateFolder}
            title="New Folder"
          >
            <MdOutlineCreateNewFolder size={16} />
          </button>
          <button 
            className="ghost" 
            onClick={onRefresh}
            title="Refresh Explorer (Ctrl+R)"
          >
            <MdOutlineRefresh size={16} />
          </button>
          <button 
            className="ghost" 
            onClick={handleCollapseAll}
            title="Collapse Folders"
          >
            <MdOutlineCropSquare size={16} />
          </button>
        </div>
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
            expandedFolders={expandedFolders}
            onToggleFolder={handleToggleFolder}
          />
        ))}
      </div>
    </aside>
  );
};

export default FileTree;
