export default function ImageViewer({ file }) {
  return (
    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', height: '100%' }}>
      <img
        src={`/api/files/raw?file=${encodeURIComponent(file)}`}
        alt={file}
        style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
      />
    </div>
  );
}
