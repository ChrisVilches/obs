import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

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
    <div>
      <h1>Files</h1>
      <ul>
        {files.map((file) => (
          <li key={file}>
            <Link to={`/view?file=${encodeURIComponent(file)}`}>{file}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}