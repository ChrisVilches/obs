import { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import FileList from '../components/FileList';
import useFetch from '../hooks/useFetch';

export default function Dashboard() {
  const { data: recentData, loading: recentLoading } = useFetch('/api/files/recent?n=10');
  const { data: bookmarksData, loading: bookmarksLoading } = useFetch('/api/bookmarks');
  const { setLayoutTopContent } = useOutletContext();

  const [, setTick] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    setLayoutTopContent({
      title: <h1 className="text-sm font-semibold text-gray-300">Dashboard</h1>
    });
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const recent = recentData?.recent ?? [];
  const bookmarks = bookmarksData?.items ?? [];

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
