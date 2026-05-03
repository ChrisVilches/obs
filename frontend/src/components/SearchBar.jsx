import { useState, useEffect, useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import SearchResultItem from './SearchResultItem';

// TODO: This only works if all the file paths are loaded and are in memory. If
// not, then the search would need to be implemented in the server-side since
// we couldn't filter here.
// However, since the search result is very simple (just a list, without rendering it
// as a tree), I can implement it via server easily, and I can implement my other
// requirement, which is to search by content, and maybe fuzzy, etc.

export default function SearchBar({ files, onClose, selectedFile, onSearchActive }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (query === '') {
      setDebouncedQuery('');
    } else {
      const timer = setTimeout(() => {
        setDebouncedQuery(query);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [query]);

  useEffect(() => {
    onSearchActive?.(debouncedQuery.length > 0);
  }, [debouncedQuery, onSearchActive]);

  const filteredFiles = useMemo(() => {
    if (!debouncedQuery) return [];
    const lower = debouncedQuery.toLowerCase();
    return files.filter(f => f.toLowerCase().includes(lower));
  }, [files, debouncedQuery]);

  function handleClear() {
    setQuery('');
    setDebouncedQuery('');
  }

  return (
    <div>
      <div className="relative mb-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search files..."
          className="w-full bg-gray-800 text-gray-200 text-sm rounded-md px-3 py-1.5 pr-8 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
        {query && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      {debouncedQuery && (
        <div className="border-t border-gray-800">
          {filteredFiles.length > 0 ? (
            <ul>
              {filteredFiles.map(file => (
                <SearchResultItem
                  key={file}
                  file={file}
                  selectedFile={selectedFile}
                  onClose={onClose}
                />
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-sm text-gray-500">No files found</p>
          )}
        </div>
      )}
    </div>
  );
}
