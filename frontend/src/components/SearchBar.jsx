import { useState, useEffect, useRef } from 'react';
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import FileList from './FileList';
import useDebounce from '../hooks/useDebounce';
import useAutoFocus from '../hooks/useAutoFocus';

export default function SearchBar({ onClose, onSearchActive }) {
  const inputRef = useRef(null);
  useAutoFocus(inputRef, { delay: 200 });

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 150);
  const [results, setResults] = useState({ files: [], contentMatches: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onSearchActive?.(debouncedQuery.length > 0);
  }, [debouncedQuery, onSearchActive]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults({ files: [], contentMatches: [] });
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/files/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setResults({ files: data.files || [], contentMatches: data.contentMatches || [] });
        }
      })
      .catch(() => {
        if (!cancelled) setResults({ files: [], contentMatches: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  function handleClear() {
    setQuery('');
    setResults({ files: [], contentMatches: [] });
  }

  const [tab, setTab] = useState('all');

  const hasAnyResults = results.files.length > 0 || results.contentMatches.length > 0;

  const allItems = [...new Set([...results.files, ...results.contentMatches])].map(p => ({ path: p }));
  const fileItems = results.files.map(p => ({ path: p }));
  const contentItems = results.contentMatches.map(p => ({ path: p }));

  const tabs = [
    { key: 'all', label: 'All', count: allItems.length },
    { key: 'files', label: 'File names', count: results.files.length },
    { key: 'content', label: 'Content', count: results.contentMatches.length },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0">
        <div className="relative mb-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-gray-800 text-gray-200 text-sm rounded-md px-3 py-1.5 pr-8 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {query && (
            loading ? (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-1">
                <EllipsisHorizontalIcon className="animate-spin w-4 h-4 text-gray-400" />
              </div>
            ) : (
              <button
                onClick={handleClear}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
      {debouncedQuery && (
        <div className="border-t border-gray-800 flex flex-col flex-1 min-h-0">
          {loading ? (
            <div className="overflow-y-auto flex-1 min-h-0">
              <FileList loading emptyMessage="" />
            </div>
          ) : hasAnyResults ? (
            <>
              <div className="shrink-0">
                <div className="flex border-b border-gray-700">
                  {tabs.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${tab === t.key
                        ? 'text-indigo-400 border-b-2 border-indigo-400'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                      {t.label} ({t.count})
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-y-auto flex-1 min-h-0 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600">
                {tab === 'all' && (
                  <FileList items={allItems} onItemClick={onClose} emptyMessage="" />
                )}
                {tab === 'files' && (
                  <FileList items={fileItems} onItemClick={onClose} emptyMessage="No filename matches." />
                )}
                {tab === 'content' && (
                  <FileList items={contentItems} onItemClick={onClose} emptyMessage="No content matches." />
                )}
              </div>
            </>
          ) : (
            <p className="px-3 py-2 text-sm text-gray-500">No files found</p>
          )}
        </div>
      )}
    </div>
  );
}
