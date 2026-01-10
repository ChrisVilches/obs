import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { getFileType } from '../utils/fileType';
import ImageViewer from '../components/ImageViewer';
import MarkdownViewer from '../components/MarkdownViewer';
import Sidemenu from '../components/Sidemenu';
import Modal from '../components/Modal';
import ErrorDisplay from '../components/ErrorDisplay';

function Viewer({ file, onBookmarkChange }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saveMessage, setSaveMessage] = useState(null);
  const [showFileNameModal, setShowFileNameModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!file) return;
    setContent('');
    setError(null);
    setEditMode(false);
    setIsBookmarked(false);
    fetch(`/api/files/content?file=${encodeURIComponent(file)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setContent(data.content);
        setIsBookmarked(data.isBookmarked);
      })
      .catch((err) => setError(err.message));
  }, [file, refreshKey]);

  useEffect(() => {
    setSaveMessage(null);
  }, [file]);

  function handleEdit() {
    setEditContent(content);
    setEditMode(true);
    setSaveMessage(null);
  }

  function handleCancel() {
    setEditMode(false);
  }

  function handleSave() {
    fetch('/api/files/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file, content: editContent }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSaveMessage(data.message);
        setEditMode(false);
        setRefreshKey((k) => k + 1);
      })
      .catch((err) => setError(err.message));
  }

  function handleToggleBookmark() {
    if (isBookmarked) {
      fetch(`/api/bookmarks?path=${encodeURIComponent(file)}`, { method: 'DELETE' })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setIsBookmarked(false);
          if (onBookmarkChange) onBookmarkChange();
        })
        .catch((err) => setError(err.message));
    } else {
      fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setIsBookmarked(true);
          if (onBookmarkChange) onBookmarkChange();
        })
        .catch((err) => setError(err.message));
    }
  }

  if (!file) {
    return null;
  }

  const type = getFileType(file);

  return (
    <div className="min-h-full flex flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setShowFileNameModal(true)} className="text-sm text-gray-300 truncate hover:text-indigo-400 transition-colors text-left min-w-0">
            <span className="truncate block">{file}</span>
          </button>
          <Modal open={showFileNameModal} onClose={() => setShowFileNameModal(false)} title="File name">
            {file}
          </Modal>
          {saveMessage && (
            <span className="text-sm text-gray-500 shrink-0">{saveMessage}</span>
          )}
        </div>
        <div className="flex items-center">
        {/* TODO: hide this button for binary files (check using file extension or magic bytes) */}
        {!editMode && !error && (
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-white transition-colors mr-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="hidden md:inline">Edit</span>
          </button>
        )}
        {!editMode && !error && (
          <button
            onClick={handleToggleBookmark}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors mr-2 ${
              isBookmarked
                ? 'text-yellow-300 bg-yellow-900/30 border-yellow-700 hover:bg-yellow-900/50 hover:text-yellow-200'
                : 'text-gray-400 bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="hidden md:inline">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        )}
        {!editMode && (
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden md:inline">Reload</span>
          </button>
        )}
        {editMode && (
          <>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-300 bg-green-900 border border-green-700 rounded-md hover:bg-green-800 hover:text-green-200 transition-colors mr-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden md:inline">Save</span>
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden md:inline">Cancel</span>
            </button>
          </>
        )}
        </div>
      </div>
      {editMode ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="flex-1 p-6 text-sm text-gray-200 bg-gray-900 font-mono resize-none outline-none border-2 border-indigo-500/50"
          spellCheck={false}
        />
      ) : type === 'image' ? (
        <ImageViewer key={refreshKey} file={file} />
      ) : type === 'markdown' ? (
        <MarkdownViewer key={refreshKey} file={file} />
      ) : error ? (
        <ErrorDisplay message={error} file={file} />
      ) : (
        <pre className="p-6 text-sm text-gray-300 overflow-auto whitespace-pre-wrap font-mono">{content || 'Loading...'}</pre>
      )}
    </div>
  );
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : 288;
  });
  const sidebarRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [searchParams] = useSearchParams();
  const selectedFile = searchParams.get('file');

  const MIN_SIDEBAR = 180;
  const MAX_SIDEBAR = 600;

  useEffect(() => {
    fetch('/api/files')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setFiles(data.files);
        setFolderName(data.folderName);
      })
      .catch((err) => setError(err.message));
  }, []);

  function reloadBookmarks() {
    setBookmarksLoading(true);
    fetch('/api/bookmarks')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setBookmarks(data.items || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setBookmarksLoading(false));
  }

  useEffect(() => {
    reloadBookmarks();
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    function onMouseMove(e) {
      if (!sidebarRef.current) return;
      const newWidth = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, e.clientX));
      sidebarRef.current.style.width = `${newWidth}px`;
    }
    function onMouseUp(e) {
      if (!sidebarRef.current) return;
      const finalWidth = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, e.clientX));
      setSidebarWidth(finalWidth);
      localStorage.setItem('sidebarWidth', finalWidth);
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing]);

  if (error) return <div className="p-4 text-red-400">Error: {error}</div>;

  return (
    <div className="flex h-screen bg-gray-950">
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-3 left-3 z-40 md:hidden p-2 rounded-md text-gray-400 bg-gray-900 border border-gray-800 hover:text-white hover:bg-gray-800 transition-colors"
        aria-label="Open sidebar"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      <Transition show={sidebarOpen}>
        <Dialog onClose={setSidebarOpen} className="relative z-50 md:hidden">
          <TransitionChild
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 flex">
            <TransitionChild
              enter="transition-transform duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition-transform duration-200"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <DialogPanel className="w-72 h-full bg-gray-900 border-r border-gray-800 flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                  <Link to="/" onClick={() => setSidebarOpen(false)} className="text-sm font-semibold text-gray-400 uppercase tracking-wider hover:text-indigo-400 transition-colors">{folderName}</Link>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    aria-label="Close sidebar"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <Sidemenu files={files} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      <aside ref={sidebarRef} className="hidden md:flex flex-shrink-0 bg-gray-900 border-r border-gray-800 flex-col relative" style={{ width: sidebarWidth }}>
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500/70 z-10 shrink-0"
        />
        <div className="px-4 py-3 border-b border-gray-800">
          <Link to="/" className="text-sm font-semibold text-gray-400 uppercase tracking-wider hover:text-indigo-400 transition-colors">{folderName}</Link>
        </div>
        <Sidemenu files={files} />
      </aside>
      <main className="flex-1 overflow-auto bg-gray-950 pt-12 md:pt-0">
        {selectedFile ? (
          <Viewer file={selectedFile} onBookmarkChange={reloadBookmarks} />
        ) : (
          <div className="p-8">
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Bookmarks</h2>
            {bookmarksLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : bookmarks.length === 0 ? (
              <p className="text-gray-500">No bookmarks found.</p>
            ) : (
              <ul className="space-y-2">
                {bookmarks.map((item, index) => (
                  <li key={index}>
                    <Link
                      to={`?file=${encodeURIComponent(item.path)}`}
                      onClick={() => setSidebarOpen(false)}
                      className="block px-4 py-2 rounded-md text-sm text-indigo-400 hover:bg-gray-800 hover:text-indigo-300 transition-colors"
                    >
                      {item.path}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
