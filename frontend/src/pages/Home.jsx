import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function Viewer({ file }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

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
  }, [file]);

  if (!file) return <div style={{ padding: '1rem' }}>Select a file to view</div>;
  if (error) return <div style={{ padding: '1rem' }}>Error: {error}</div>;
  return <pre style={{ padding: '1rem' }}>{content || 'Loading...'}</pre>;
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
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

  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '300px', overflow: 'auto', borderRight: '1px solid #ccc', padding: '0.5rem' }}>
        <h2>Files</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {files.map((file) => (
            <li key={file} style={{ marginBottom: '0.25rem' }}>
              <button
                onClick={() => setSearchParams({ file })}
                style={{
                  background: file === selectedFile ? '#e0e0e0' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  padding: '0.25rem 0.5rem',
                  fontSize: 'inherit',
                }}
              >
                {file}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Viewer file={selectedFile} />
      </div>
    </div>
  );
}