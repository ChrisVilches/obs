import { EllipsisHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import useDebounce from "../hooks/useDebounce";
import useListKeyboardNav from "../hooks/useListKeyboardNav";
import FileList from "./FileList";

function Results({ allPaths, filePaths, contentPaths, tab, setTab, selectedIndex, onClose }) {
  const { allItems, fileItems, contentItems } = useMemo(() => ({
    allItems: allPaths.map((p) => ({ path: p })),
    fileItems: filePaths.map((p) => ({ path: p })),
    contentItems: contentPaths.map((p) => ({ path: p })),
  }), [allPaths, filePaths, contentPaths]);

  const tabs = [
    { key: "all", label: "All", count: allItems.length },
    { key: "files", label: "File names", count: fileItems.length },
    { key: "content", label: "Content", count: contentItems.length },
  ];

  return (
    <>
      <div className="shrink-0">
        <div className="flex border-b border-gray-700">
          {tabs.map((t) => (
            <button
              type="button"
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${tab === t.key
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-500 hover:text-gray-300"
                }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600">
        {tab === "all" && (
          <FileList items={allItems} emptyMessage="" onItemClick={onClose} selectedIndex={selectedIndex} />
        )}
        {tab === "files" && (
          <FileList items={fileItems} emptyMessage="" onItemClick={onClose} selectedIndex={selectedIndex} />
        )}
        {tab === "content" && (
          <FileList
            items={contentItems}
            emptyMessage=""
            onItemClick={onClose}
            selectedIndex={selectedIndex}
          />
        )}
      </div>
    </>
  );
}

function SearchInputIcon({ loading, onClear }) {
  if (loading) {
    return (
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-1">
        <EllipsisHorizontalIcon className="animate-spin w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClear}
      aria-label="Clear search"
      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-gray-400 hover:text-gray-200 transition-colors"
    >
      <XMarkIcon className="w-4 h-4" />
    </button>
  );
}

export default function SearchBar({ onClose }) {
  const navigate = useNavigate();
  const autoFocusRef = (el) => {
    if (!el) return;
    setTimeout(() => el.focus());
  };

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 150);
  const [tab, setTab] = useState("all");

  const [results, setResults] = useState({ files: [], contentMatches: [] });
  const filePaths = results.files;
  const contentPaths = results.contentMatches;
  const allPaths = useMemo(
    () => [...new Set([...filePaths, ...contentPaths])],
    [filePaths, contentPaths],
  );

  const { data, isValidating } = useSWR(
    debouncedQuery
      ? `/api/files/search?q=${encodeURIComponent(debouncedQuery)}`
      : null,
  );

  useEffect(() => {
    if (data) setResults(data);
  }, [data]);
  useEffect(() => {
    if (!debouncedQuery) setResults({ files: [], contentMatches: [] });
  }, [debouncedQuery]);

  const getVisibleItems = useCallback(() => {
    if (tab === "all") return allPaths;
    if (tab === "content") return contentPaths;
    return filePaths;
  }, [allPaths, filePaths, contentPaths, tab]);

  const visibleItems = getVisibleItems();

  const { selectedIndex, handleKeyDown, setSelectedIndex } = useListKeyboardNav({
    items: visibleItems,
    onSelect: (item) => {
      navigate(`/file?f=${encodeURIComponent(item)}`);
      onClose();
    },
  });

  useEffect(() => {
    setSelectedIndex(visibleItems.length > 0 ? 0 : -1);
  }, [tab]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0">
        <div className="relative mb-2">
          <input
            ref={autoFocusRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files..."
            className="w-full bg-gray-800 text-gray-200 text-sm rounded-md px-3 py-1.5 pr-8 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {query && (
            <SearchInputIcon
              loading={isValidating}
              onClear={() => setQuery("")}
            />
          )}
        </div>
      </div>

      <Results allPaths={allPaths} filePaths={filePaths} contentPaths={contentPaths} tab={tab} setTab={setTab} selectedIndex={selectedIndex} onClose={onClose} />
    </div>
  );
}
