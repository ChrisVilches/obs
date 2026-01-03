import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getFileType } from '../utils/fileType';
import ImageViewer from '../components/ImageViewer';
import MarkdownViewer from '../components/MarkdownViewer';

function Viewer({ file }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!file) return;
    setContent('');
    setError(null);
    fetch(`/api/files/content?file=${encodeURIComponent(file)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setContent(data.content);
      })
      .catch((err) => setError(err.message));
  }, [file, refreshKey]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-lg">
        Select a file to view
      </div>
    );
  }

  const type = getFileType(file);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-end px-4 py-2 border-b border-gray-800 bg-gray-900">
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reload
        </button>
      </div>
      {type === 'image' ? (
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
        <Viewer file={selectedFile} />
      </main>
    </div>
  );
}
