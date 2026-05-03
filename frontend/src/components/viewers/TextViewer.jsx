export default function TextViewer({ content }) {
  return (
    <pre className="p-6 text-sm text-gray-300 overflow-auto whitespace-pre-wrap font-mono">
      {content || ''}
    </pre>
  );
}
