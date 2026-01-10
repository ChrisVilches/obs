import { useState } from 'react';
import ErrorDisplay from './ErrorDisplay';

// TODO: some images are invisible depending on the background and their color.

export default function ImageViewer({ file }) {
  const [error, setError] = useState(null);

  if (error) return <ErrorDisplay message={error} file={file} />;

  return (
    <div className="flex items-start justify-center p-4 h-full">
      <img
        src={`/api/files/raw?file=${encodeURIComponent(file)}`}
        alt={file}
        onError={() => setError('File not found')}
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-lg"
      />
    </div>
  );
}
