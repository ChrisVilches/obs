import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

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

  if (error) return <div className="p-4 text-red-400">Error: {error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto prose prose-invert">
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
