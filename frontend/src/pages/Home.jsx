import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import FileViewer from '../components/FileViewer';
import BookmarksList from '../components/BookmarksList';
import Sidemenu from '../components/Sidemenu';

// TODO: Not sure if the scrollbar should be in the div container or
// in the body, affecting the whole thing.
// (I'm talking about the scrollbar stylized in this page. Should THAT
// container be scrollable? or the body?)
// Remember that on mobile the layout is weird as hell (very buggy)
// so maybe the bug is caused by some weird layout structure.

// TODO: I don't want to load all bookmarks all the time like this. I think I
// can avoid doing that.
export default function Home() {
  const [files, setFiles] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [filesLoading, setFilesLoading] = useState(true);
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
        setFilesLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setFilesLoading(false);
      });
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
        className="fixed top-2 left-2 z-50 md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
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
                <Sidemenu files={files} loading={filesLoading} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} folderName={folderName} />
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
        <Sidemenu files={files} loading={filesLoading} folderName={folderName} />
      </aside>
      <main className="flex-1 flex flex-col bg-gray-950">
        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600">
          {selectedFile ? (
            <FileViewer file={selectedFile} onBookmarkChange={reloadBookmarks} />
          ) : (
            <BookmarksList bookmarks={bookmarks} loading={bookmarksLoading} onSelect={() => setSidebarOpen(false)} />
          )}
        </div>
      </main>
    </div>
  );
}
