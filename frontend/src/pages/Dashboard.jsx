import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';
import FileList from '../components/FileList';

export default function Dashboard() {
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['files', 'recent', 10],
    queryFn: () => apiFetch('/api/files/recent?n=10'),
    refetchInterval: 60000,
  });
  const { data: bookmarksData, isLoading: bookmarksLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => apiFetch('/api/bookmarks'),
  });
  const { setLayoutTopContent } = useOutletContext();

  useEffect(() => {
    setLayoutTopContent({
      title: <h1 className="text-sm font-semibold text-gray-300">Dashboard</h1>
    });
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
