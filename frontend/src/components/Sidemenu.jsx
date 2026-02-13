import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRightIcon, BookmarkIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SearchBar from './SearchBar';
import Modal from './Modal';

const GITHUB_URL = 'https://github.com/ChrisVilches/obs';

function SidemenuFooter() {
  return (
    <div className="px-4 h-14 flex items-center border-t border-gray-800 shrink-0 text-xs text-gray-500 gap-2">
      <span>Created by ChrisVilches</span>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto hover:text-gray-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      </a>
    </div>
  );
}

function SidemenuHeader({ folderName, onClose, onSearchClick, onBookmarkClick }) {
  return (
    <div className="flex items-center justify-between px-4 h-14 border-b border-gray-800 shrink-0">
      <div className="flex items-center gap-2">
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
        <Link to="/" className="text-sm font-semibold text-gray-400 uppercase tracking-wider hover:text-indigo-400 transition-colors">{folderName}</Link>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onBookmarkClick}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Bookmarks"
          title="Bookmarks"
        >
          <BookmarkIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onSearchClick}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Search"
          title="Search"
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// TODO: scrollbar is hard to grab because of the resize functionality

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
          to={`/file?f=${encodeURIComponent(node.path)}`}
          onClick={onClose}
          data-selected={isSelected || undefined}
          className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${isSelected
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

function SidemenuSkeleton() {
  const items = [
    { depth: 0, width: 'w-3/4', folder: true },
    { depth: 0, width: 'w-1/2', folder: true },
    { depth: 1, width: 'w-2/3', folder: false },
    { depth: 1, width: 'w-1/3', folder: false },
    { depth: 1, width: 'w-3/5', folder: false },
    { depth: 0, width: 'w-2/5', folder: true },
    { depth: 1, width: 'w-1/2', folder: false },
    { depth: 1, width: 'w-3/4', folder: false },
    { depth: 1, width: 'w-2/5', folder: false },
    { depth: 1, width: 'w-1/3', folder: false },
    { depth: 2, width: 'w-1/2', folder: false },
    { depth: 2, width: 'w-2/5', folder: false },
    { depth: 0, width: 'w-3/5', folder: true },
    { depth: 1, width: 'w-1/2', folder: false },
    { depth: 1, width: 'w-2/3', folder: false },
    { depth: 2, width: 'w-3/4', folder: false },
    { depth: 2, width: 'w-2/5', folder: false },
    { depth: 0, width: 'w-2/3', folder: true },
    { depth: 1, width: 'w-3/5', folder: false },
    { depth: 1, width: 'w-1/3', folder: false },
    { depth: 2, width: 'w-1/2', folder: false },
    { depth: 2, width: 'w-3/5', folder: false },
  ];

  return (
    <ul className="space-y-0.5 animate-pulse" aria-hidden="true">
      {items.map((item, i) => (
        <li key={i}>
          <div
            className="flex items-center gap-1 px-3 py-1.5"
            style={{ paddingLeft: `${12 + item.depth * 16}px` }}
          >
            {item.folder && <div className="w-3 h-3 rounded-sm bg-gray-800 shrink-0" />}
            <div className={`h-3 rounded bg-gray-800 ${item.width}`} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Sidemenu({ files, onClose, sidebarOpen, loading, folderName, onBookmarkClick }) {
  const navRef = useRef(null);
  const [searchParams] = useSearchParams();
  const selectedFile = searchParams.get('f');
  const [searchOpen, setSearchOpen] = useState(false);

  const tree = useMemo(() => buildTree(files), [files]);

  const [expandedSet, setExpandedSet] = useState(() => new Set());

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

  // TODO: I replaced this useEffect with the navRef, but not the other one (for mobile)
  // anyway there should just be one useEffect for both.
  useEffect(() => {
    if (!selectedFile || !navRef.current) return;

    const id = requestAnimationFrame(() => {
      const el = navRef.current.querySelector('[data-selected]');
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

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <SidemenuHeader folderName={folderName} onClose={onClose} onSearchClick={() => setSearchOpen(true)} onBookmarkClick={onBookmarkClick} />
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600" style={{ scrollbarGutter: 'stable' }}>
          <SidemenuSkeleton />
        </nav>
        <SidemenuFooter />
        <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Search" className="h-[70vh] flex flex-col overflow-hidden" childrenClass="flex-1 min-h-0">
          <SearchBar
            onClose={() => { setSearchOpen(false); onClose?.(); }}
            selectedFile={selectedFile}
          />
        </Modal>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <SidemenuHeader folderName={folderName} onClose={onClose} onSearchClick={() => setSearchOpen(true)} onBookmarkClick={onBookmarkClick} />
      <nav ref={navRef} className="flex-1 overflow-y-auto overflow-x-hidden p-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600" style={{ scrollbarGutter: 'stable' }}>
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
      </nav>
      <SidemenuFooter />
      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Search" className="h-[70vh] flex flex-col overflow-hidden" childrenClass="flex-1 min-h-0">
        <SearchBar
          onClose={() => { setSearchOpen(false); onClose?.(); }}
          selectedFile={selectedFile}
        />
      </Modal>
    </div>
  );
}
