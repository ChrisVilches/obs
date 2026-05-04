import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import SearchResultItem from './SearchResultItem';

export default function SearchBar({ onClose, selectedFile, onSearchActive }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/files/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setResults(data.files || []);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  function handleClear() {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
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
          {loading ? (
            <p className="px-3 py-2 text-sm text-gray-500">Searching...</p>
          ) : results.length > 0 ? (
            <ul>
              {results.map(file => (
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
