import { EllipsisHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRef, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import useDebounce from "../hooks/useDebounce";
import useListKeyboardNav from "../hooks/useListKeyboardNav";
import FileList from "./FileList";

function Results({ results, tab, setTab, selectedIndex, onClose }) {
  const tabs = [
    { key: "all", label: "All", count: results.all.length },
    { key: "files", label: "File names", count: results.files.length },
    { key: "content", label: "Content", count: results.content.length },
  ];

  return (
    <>
      <div className="shrink-0 mb-4">
        <div className="flex border-b border-gray-700">
          {tabs.map((t) => (
            <button
              type="button"
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                tab === t.key
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0">
        {tab === "all" && (
          <FileList
            items={results.all}
            emptyMessage=""
            onItemClick={onClose}
            selectedIndex={selectedIndex}
          />
        )}
        {tab === "files" && (
          <FileList
            items={results.files}
            emptyMessage=""
            onItemClick={onClose}
            selectedIndex={selectedIndex}
          />
        )}
        {tab === "content" && (
          <FileList
            items={results.content}
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

const EMPTY_RESULTS = { all: [], files: [], content: [] };

function useAutoFocusWorkaround() {
  // Workaround for a bug: When using two Dialog components with transitions
  // enabled, opening a search modal while closing the sidemenu dialog causes the
  // auto focus input in the search modal to briefly receive focus and then
  // immediately lose it. Specifically: (1) the sidemenu dialog is open, (2)
  // clicking a button inside it opens a search modal (which contains an input
  // with auto focus) and simultaneously sets the sidemenu to close, (3) the
  // input in the search modal flickers—it appears focused for a moment and then
  // loses focus. This does not occur if the sidemenu remains open during the
  // transition, and it does not occur when transitions are disabled on both
  // dialogs.

  const elementRef = useRef(null);

  const autoFocusRef = useCallback((el) => {
    elementRef.current = el;
  }, []);

  useEffect(() => {
    const handler = (ev) => {
      console.log(ev);

      elementRef.current?.focus();
    };

    document.body.addEventListener("focusout", handler, {
      once: true,
    });

    return () => {
      document.body.removeEventListener("focusout", handler);
    };
  }, []);

  return autoFocusRef
}

export default function SearchBar({ onClose }) {
  const navigate = useNavigate();
  const autoFocusRef = useAutoFocusWorkaround()

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 150);
  const [tab, setTab] = useState("all");

  const [results, setResults] = useState(EMPTY_RESULTS);

  const { data, isValidating } = useSWR(
    debouncedQuery
      ? `/api/files/search?q=${encodeURIComponent(debouncedQuery)}`
      : null,
  );

  useEffect(() => {
    const intoPath = (path) => ({ path });
    if (data)
      setResults({
        all: [...new Set([...data.files, ...data.contentMatches])].map(
          intoPath,
        ),
        files: data.files.map(intoPath),
        content: data.contentMatches.map(intoPath),
      });
  }, [data]);
  useEffect(() => {
    if (!debouncedQuery) setResults(EMPTY_RESULTS);
  }, [debouncedQuery]);

  const { selectedIndex, handleKeyDown, setSelectedIndex } = useListKeyboardNav(
    {
      items: results[tab],
      onSelect: (item) => {
        navigate(`/file?f=${encodeURIComponent(item.path)}`);
        onClose();
      },
    },
  );

  useEffect(() => {
    setSelectedIndex(results[tab].length > 0 ? 0 : -1);
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

      <Results
        results={results}
        tab={tab}
        setTab={setTab}
        selectedIndex={selectedIndex}
        onClose={onClose}
      />
    </div>
  );
}
