import { Link } from 'react-router-dom';
import { DocumentTextIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon, DocumentIcon } from '@heroicons/react/24/outline';

const extToIcon = {
  // images
  jpg: PhotoIcon, jpeg: PhotoIcon, png: PhotoIcon, gif: PhotoIcon,
  webp: PhotoIcon, svg: PhotoIcon, bmp: PhotoIcon, ico: PhotoIcon, avif: PhotoIcon,
  // video
  mp4: VideoCameraIcon, webm: VideoCameraIcon, avi: VideoCameraIcon,
  mov: VideoCameraIcon, mkv: VideoCameraIcon, wmv: VideoCameraIcon,
  flv: VideoCameraIcon, m4v: VideoCameraIcon,
  // audio
  mp3: MusicalNoteIcon, wav: MusicalNoteIcon, ogg: MusicalNoteIcon,
  flac: MusicalNoteIcon, aac: MusicalNoteIcon, wma: MusicalNoteIcon,
  m4a: MusicalNoteIcon, opus: MusicalNoteIcon,
  // documents
  md: DocumentTextIcon, mdx: DocumentTextIcon, txt: DocumentTextIcon,
  pdf: DocumentTextIcon, csv: DocumentTextIcon, json: DocumentTextIcon,
  xml: DocumentTextIcon, yaml: DocumentTextIcon, yml: DocumentTextIcon,
  toml: DocumentTextIcon, log: DocumentTextIcon, rtf: DocumentTextIcon,
};

function getFileIcon(path) {
  const ext = path.split('.').pop().toLowerCase();
  return extToIcon[ext] || DocumentIcon;
}

function FileIcon({ path, className }) {
  const Icon = getFileIcon(path);
  return <Icon className={className} />;
}

function dirPath(path) {
  return path.includes('/') ? '/' + path.slice(0, path.lastIndexOf('/')) : '/';
}

function formatRelativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function FileList({ items, showTime = false, loading = false, emptyMessage = 'No files found.', onItemClick }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-800 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-gray-500">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-0.5">
      {items.map((item, index) => (
        <li key={item.path || index}>
          <Link
            to={`/file?f=${encodeURIComponent(item.path)}`}
            onClick={onItemClick ? () => onItemClick(item) : undefined}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            <FileIcon path={item.path} className="w-4 h-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="truncate block">{item.path.split('/').pop()}</span>
              <span className="text-xs text-gray-600 truncate block">{dirPath(item.path)}</span>
            </div>
            {showTime && item.mtime && (
              <span className="text-xs text-gray-600 shrink-0">{formatRelativeTime(item.mtime)}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
