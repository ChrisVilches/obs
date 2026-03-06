export default function MediaViewer({ file, type }) {
  const src = `/api/files/raw?file=${encodeURIComponent(file)}`;

  if (type === "audio") {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        {/* biome-ignore lint/a11y/useMediaCaption: user-provided media files */}
        <audio src={src} controls className="w-full max-w-lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      {/* biome-ignore lint/a11y/useMediaCaption: user-provided media files */}
      <video
        src={src}
        controls
        className="max-w-full max-h-[90vh] rounded-lg shadow-lg"
      />
    </div>
  );
}
