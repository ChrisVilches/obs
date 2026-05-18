import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';

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

export default function Dashboard() {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const [, setTick] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch('/api/files/recent?n=10')
      .then(res => res.json())
      .then(data => {
        setRecent(data.recent);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <PageHeader
        title={<h1 className="text-sm font-semibold text-gray-300">Dashboard</h1>}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recently Modified</h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-800 rounded-md animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-gray-500">No recent files found.</p>
        ) : (
          <ul className="space-y-0.5">
            {recent.map(file => (
              <li key={file.path}>
                <Link
                  to={`/file?f=${encodeURIComponent(file.path)}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
                >
                  <DocumentTextIcon className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="truncate block">{file.path.split('/').pop()}</span>
                    <span className="text-xs text-gray-600 truncate block">{file.path}</span>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">{formatRelativeTime(file.mtime)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
