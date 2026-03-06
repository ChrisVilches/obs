import { useState, useEffect, useRef } from 'react';
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useSWR from 'swr';
import FileList from './FileList';
import useDebounce from '../hooks/useDebounce';
import useAutoFocus from '../hooks/useAutoFocus';

function Results({ results, onClose }) {
  const [tab, setTab] = useState('all');

  const allItems = [...new Set([...results.files, ...results.contentMatches])].map(p => ({ path: p }));
  const fileItems = results.files.map(p => ({ path: p }));
  const contentItems = results.contentMatches.map(p => ({ path: p }));

  const tabs = [
    { key: 'all', label: 'All', count: allItems.length },
    { key: 'files', label: 'File names', count: results.files.length },
    { key: 'content', label: 'Content', count: results.contentMatches.length },
  ];

  return (
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
        {tab === 'all' && <FileList items={allItems} emptyMessage="" onItemClick={onClose} />}
        {tab === 'files' && <FileList items={fileItems} emptyMessage="" onItemClick={onClose} />}
        {tab === 'content' && <FileList items={contentItems} emptyMessage="" onItemClick={onClose} />}
      </div>
    </>
  )
}

function SearchInputIcon({ loading, onClear }) {
  if (loading) {
    return (
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-1">
        <EllipsisHorizontalIcon className="animate-spin w-4 h-4 text-gray-400" />
      </div>
    )
  }

  return (
    <button
      onClick={onClear}
      aria-label="Clear search"
      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-gray-400 hover:text-gray-200 transition-colors"
    >
      <XMarkIcon className="w-4 h-4" />
    </button>
  )
}

export default function SearchBar({ onClose }) {
  const inputRef = useRef(null);
  useAutoFocus(inputRef, { delay: 200 });

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 150);

  const [results, setResults] = useState({ files: [], contentMatches: [] });

  const { data, isValidating } = useSWR(
    debouncedQuery ? `/api/files/search?q=${encodeURIComponent(debouncedQuery)}` : null
  );

  useEffect(() => { if (data) setResults(data) }, [data]);
  useEffect(() => { if (!debouncedQuery) setResults({ files: [], contentMatches: [] }) }, [debouncedQuery])

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
          {query && <SearchInputIcon loading={isValidating} onClear={() => setQuery('')} />}
        </div>
      </div>

      <Results results={results} onClose={onClose} />
    </div>
  );
}
