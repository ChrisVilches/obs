export default function ImageViewer({ file }) {
  return (
    <div className="flex items-start justify-center p-4 h-full">
      <img
        src={`/api/files/raw?file=${encodeURIComponent(file)}`}
        alt={file}
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-lg"
      />
    </div>
  );
}
