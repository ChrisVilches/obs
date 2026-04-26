export default function ImageViewer({ file }) {
  return (
    <div className="flex items-start justify-center p-4 h-full">
      <div className="bg-white inline-flex shadow-lg">
        <img
          src={`/api/files/raw?file=${encodeURIComponent(file)}`}
          alt={file}
          className="max-w-full max-h-[90vh] object-contain"
        />
      </div>
    </div>
  );
}
