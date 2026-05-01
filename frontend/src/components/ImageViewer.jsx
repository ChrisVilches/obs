export default function ImageViewer({ file }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
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
