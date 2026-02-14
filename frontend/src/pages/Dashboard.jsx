import { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import FileList from '../components/FileList';

export default function Dashboard() {
  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const { setLayoutTopContent } = useOutletContext();

  const [, setTick] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    console.log("dashboard init")
    setLayoutTopContent({
      title: <h1 className="text-sm font-semibold text-gray-300">Dashboard</h1>
    });

    // return () => setHeaderContent({ title: 'Default', extra: null });
  }, []);

  useEffect(() => {
    fetch('/api/files/recent?n=10')
      .then(res => res.json())
      .then(data => {
        setRecent(data.recent);
        setRecentLoading(false);
      })
      .catch(() => setRecentLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/bookmarks')
      .then(res => res.json())
      .then(data => {
        setBookmarks(data.items || []);
        setBookmarksLoading(false);
      })
      .catch(() => setBookmarksLoading(false));
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recently Modified</h2>
          <FileList items={recent} showTime loading={recentLoading} emptyMessage="No recent files found." />
        </section>
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Bookmarks</h2>
          <FileList items={bookmarks} loading={bookmarksLoading} emptyMessage="No bookmarks found." />
        </section>
      </div>
    </div>
  );
}
