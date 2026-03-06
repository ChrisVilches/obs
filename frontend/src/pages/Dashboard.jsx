import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import useSWR from "swr";
import FileList from "../components/FileList";
import useInterval from "../hooks/useInterval";

export default function Dashboard() {
  const { setLayoutTopContent } = useOutletContext();
  const [, setTick] = useState(0);
  useInterval(() => setTick((t) => t + 1), 60000);
  const { data: recentData, isLoading: recentLoading } = useSWR(
    "/api/files/recent?n=10",
  );
  const { data: bookmarksData, isLoading: bookmarksLoading } =
    useSWR("/api/bookmarks");

  useEffect(() => {
    setLayoutTopContent({
      title: <h1 className="text-sm font-semibold text-gray-300">Dashboard</h1>,
    });
  }, [setLayoutTopContent]);

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Recently Modified
          </h2>
          <FileList
            items={recentData?.recent || []}
            showTime
            loading={recentLoading}
            emptyMessage="No recent files found."
          />
        </section>
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Bookmarks
          </h2>
          <FileList
            items={bookmarksData?.items || []}
            loading={bookmarksLoading}
            emptyMessage="No bookmarks found."
          />
        </section>
      </div>
    </div>
  );
}
