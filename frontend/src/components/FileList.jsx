import { Link } from 'react-router-dom';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

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
            <DocumentTextIcon className="w-4 h-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="truncate block">{item.path.split('/').pop()}</span>
              <span className="text-xs text-gray-600 truncate block">{item.path}</span>
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
