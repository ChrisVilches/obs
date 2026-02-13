import { BookmarkIcon } from '@heroicons/react/24/outline';
import { useLayoutContext } from './Layout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function Dashboard() {
  const { openBookmarksModal } = useLayoutContext();

  return (
    <div className="min-h-full flex flex-col">
      <PageHeader
        title={<h1 className="text-sm font-semibold text-gray-300">Dashboard</h1>}
        actions={
          <Button variant="secondary" icon={<BookmarkIcon className="w-4 h-4" />} onClick={openBookmarksModal}>
            Bookmarks
          </Button>
        }
      />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Select a file from the sidebar to view its contents.</p>
      </div>
    </div>
  );
}
