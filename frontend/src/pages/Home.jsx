import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getFileType } from '../utils/fileType';
import ImageViewer from '../components/ImageViewer';
import MarkdownViewer from '../components/MarkdownViewer';

function Viewer({ file }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    if (!file) return;
    setContent('');
    setError(null);
    setEditMode(false);
    fetch(`/api/files/content?file=${encodeURIComponent(file)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setContent(data.content);
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

  if (!file) {
    return null;
  }

  const type = getFileType(file);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
        <div>
          {saveMessage && (
            <span className="text-sm text-gray-400">{saveMessage}</span>
          )}
        </div>
        <div className="flex items-center">
        {/* TODO: hide this button for binary files (check using file extension or magic bytes) */}
        {!editMode && (
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-white transition-colors mr-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
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
            Reload
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
              Save
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
            >
              Cancel
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
        <div className="p-4 text-red-400">Error: {error}</div>
      ) : (
        <pre className="p-6 text-sm text-gray-300 overflow-auto whitespace-pre-wrap font-mono">{content || 'Loading...'}</pre>
      )}
    </div>
  );
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const selectedFile = searchParams.get('file');

  useEffect(() => {
    fetch('/api/files')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setFiles(data.files);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    fetch('/api/bookmarks')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setBookmarks(data.items || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-4 text-red-400">Error: {error}</div>;

  return (
    <div className="flex h-screen bg-gray-950">
      <aside className="w-72 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Files</h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {files.map((file) => (
              <li key={file}>
                <Link
                  to={`?file=${encodeURIComponent(file)}`}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                    file === selectedFile
                      ? 'bg-indigo-900/40 text-indigo-300 font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  <span className="truncate block">{file}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-950">
        {selectedFile ? (
          <Viewer file={selectedFile} />
        ) : (
          <div className="p-8">
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Bookmarks</h2>
            {bookmarks.length === 0 ? (
              <p className="text-gray-500">No bookmarks found.</p>
            ) : (
              <ul className="space-y-2">
                {bookmarks.map((item, index) => (
                  <li key={index}>
                    <Link
                      to={`?file=${encodeURIComponent(item.path)}`}
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
