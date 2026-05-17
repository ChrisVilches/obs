import { Link } from 'react-router-dom';
import PageHeader from './PageHeader';

// TODO: List doesn't get updated when the user uses the history buttons to go back and forth.
// I think it should, since the user probably expects it to get reloaded.
// I think even the button to bookmarks doesn't reload it (that's bad).

export default function BookmarksList({ bookmarks, loading, onSelect }) {
  return (
    <div className="min-h-full flex flex-col">
      <PageHeader title={<h1 className="text-sm font-semibold text-gray-300">Bookmarks</h1>} />
      <div className="flex-1 p-8">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : bookmarks.length === 0 ? (
          <p className="text-gray-500">No bookmarks found.</p>
        ) : (
          <ul className="space-y-2">
            {bookmarks.map((item, index) => (
              <li key={index}>
                <Link
                  to={`?file=${encodeURIComponent(item.path)}`}
                  onClick={onSelect}
                  className="block px-4 py-2 rounded-md text-sm text-indigo-400 hover:bg-gray-800 hover:text-indigo-300 transition-colors"
                >
                  {item.path}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
