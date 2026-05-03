import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import SearchBar from './SearchBar';

// TODO: The API returns only files (flat paths), so folders are derived by
// splitting file paths. Empty folders (with no files) never appear in the
// tree. If empty folders need to be visible, the backend would need to return
// directory entries as well.

// TODO: Don't use [data-selected]. Instead do it the React way, by using refs
// or whatever is suitable.

// TODO: There are two effects to scroll, however I'm under the impression that they both
// execute for both sidebars (desktop and mobile), since there's no way to distinguish.
// I should audit this code more and improve it.

function buildTree(files) {
  const root = [];

  for (const filePath of files) {
    const parts = filePath.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      let node = currentLevel.find(n => n.name === part);

      if (!node) {
        if (isLast) {
          node = { name: part, type: 'file', path: filePath };
        } else {
          node = {
            name: part,
            type: 'directory',
            path: parts.slice(0, i + 1).join('/'),
            children: [],
          };
        }
        currentLevel.push(node);
      }

      if (!isLast) {
        currentLevel = node.children;
      }
    }
  }

  function sortNodes(nodes) {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) {
      if (n.children) sortNodes(n.children);
    }
  }
  sortNodes(root);

  return root;
}

function TreeNode({ node, depth, selectedFile, onClose, expandedSet, onToggle }) {
  if (node.type === 'file') {
    const isSelected = node.path === selectedFile;
    return (
      <li>
        <Link
          to={`?file=${encodeURIComponent(node.path)}`}
          onClick={onClose}
          data-selected={isSelected || undefined}
          className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
            isSelected
              ? 'bg-indigo-900/40 text-indigo-300 font-medium'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <span className="truncate block">{node.name}</span>
        </Link>
      </li>
    );
  }

  const isExpanded = expandedSet.has(node.path);

  return (
    <li>
      <button
        onClick={() => onToggle(node.path)}
        className="w-full flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <ChevronRightIcon
          className={`w-3 h-3 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
        <span className="truncate">{node.name}</span>
      </button>
      {isExpanded && node.children.length > 0 && (
        <ul>
          {node.children.map(child => (
            <TreeNode
              key={child.path || child.name}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onClose={onClose}
              expandedSet={expandedSet}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Sidemenu({ files, onClose, sidebarOpen }) {
  const [searchParams] = useSearchParams();
  const selectedFile = searchParams.get('file');
  const [isSearching, setIsSearching] = useState(false);

  const tree = useMemo(() => buildTree(files), [files]);

  const allDirPaths = useMemo(() => {
    const paths = [];
    function collect(nodes) {
      for (const node of nodes) {
        if (node.type === 'directory') {
          paths.push(node.path);
          collect(node.children);
        }
      }
    }
    collect(tree);
    return paths;
  }, [tree]);

  const [expandedSet, setExpandedSet] = useState(() => new Set(allDirPaths));

  function handleToggle(path) {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  useEffect(() => {
    if (!selectedFile) return;
    if (!files?.includes(selectedFile)) return;
    const parts = selectedFile.split('/');
    if (parts.length <= 1) return;

    const ancestors = [];
    for (let i = 0; i < parts.length - 1; i++) {
      ancestors.push(parts.slice(0, i + 1).join('/'));
    }

    setExpandedSet(prev => {
      const next = new Set(prev);
      let changed = false;
      for (const path of ancestors) {
        if (!next.has(path)) {
          next.add(path);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selectedFile, files]);

  useEffect(() => {
    if (!selectedFile) return;
    const id = requestAnimationFrame(() => {
      const el = document.querySelector('[data-selected]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [selectedFile, files]);

  // TODO: This doesn't work for mobile. Should scroll when the sidemenu is open.
  useEffect(() => {
    if (!sidebarOpen || !selectedFile) return;
    const id = setTimeout(() => {
      const el = document.querySelector('[data-selected]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 350);
    return () => clearTimeout(id);
  }, [sidebarOpen, selectedFile]);

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
      <SearchBar
        files={files}
        onClose={onClose}
        selectedFile={selectedFile}
        onSearchActive={setIsSearching}
      />
      {!isSearching && (
        <ul className="space-y-0.5">
          {tree.map(node => (
            <TreeNode
              key={node.path || node.name}
              node={node}
              depth={0}
              selectedFile={selectedFile}
              onClose={onClose}
              expandedSet={expandedSet}
              onToggle={handleToggle}
            />
          ))}
        </ul>
      )}
    </nav>
  );
}
