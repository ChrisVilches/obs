export default function BookmarkButton({ isBookmarked, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors mr-2 ${
        isBookmarked
          ? 'text-yellow-300 bg-yellow-900/30 border-yellow-700 hover:bg-yellow-900/50 hover:text-yellow-200'
          : 'text-gray-400 bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      <span className="hidden md:inline">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
    </button>
  );
}
