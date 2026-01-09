import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function Viewer() {
  const [searchParams] = useSearchParams();
  const file = searchParams.get('file');
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!file) return;
    fetch(`/api/files/content?file=${encodeURIComponent(file)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setContent(data.content);
      })
      .catch((err) => setError(err.message));
  }, [file]);

  if (!file) return <div>No file specified.</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <Link to="/">&larr; Back</Link>
      <h1>{file}</h1>
      <pre>{content || 'Loading...'}</pre>
    </div>
  );
}