import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

// TODO: Eventually I'll have to use a different markdown renderer because it doesn't show checklists.

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

  if (error) return <div style={{ padding: '1rem' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', lineHeight: '1.6' }}>
      <ReactMarkdown
        components={{
          img({ node, ...props }) {
            // Modify the image URL
            const newSrc = `api/files/raw?file=${props.src}&current=${file}`;

            return <img {...props} src={newSrc} />;
          },
        }}
      >{content || ''}</ReactMarkdown>
    </div>
  );
}
