import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import ErrorDisplay from './ErrorDisplay';

function isExternalURL(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

export default function MarkdownViewer({ file }) {
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

  if (error) return <ErrorDisplay message={error} file={file} />;

  return (
    <div className="p-6 prose prose-invert max-w-full">
      <ReactMarkdown
        components={{
          img({ node, ...props }) {
            const newSrc = isExternalURL(props.src) ? props.src : `api/files/raw?file=${props.src}&current=${file}`;
            return <img {...props} src={newSrc} className="rounded-lg shadow-md my-4" />;
          },
        }}
      >{content || ''}</ReactMarkdown>
    </div>
  );
}
