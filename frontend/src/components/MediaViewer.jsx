import { useState } from 'react';
import ErrorDisplay from './ErrorDisplay';

export default function MediaViewer({ file, type }) {
  const [error, setError] = useState(null);

  if (error) return <ErrorDisplay message={error} file={file} />;

  const src = `/api/files/raw?file=${encodeURIComponent(file)}`;

  if (type === 'audio') {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <audio
          src={src}
          controls
          onError={() => setError('File not found')}
          className="w-full max-w-lg"
        />
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center p-4 h-full">
      <video
        src={src}
        controls
        onError={() => setError('File not found')}
        className="max-w-full max-h-[90vh] rounded-lg shadow-lg"
      />
    </div>
  );
}
