import Modal from './Modal';

export default function FileToolbar({
  file,
  info,
  editMode,
  saveMessage,
  showFileNameModal,
  onShowFileNameModal,
  onEdit,
  onCancel,
  onSave,
  onToggleBookmark,
  onReload,
  loading,
  error,
}) {
  const type = info?.type;

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b border-gray-800 bg-gray-900 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => onShowFileNameModal(true)}
          className="text-sm text-gray-300 truncate hover:text-indigo-400 transition-colors text-left min-w-0"
        >
          <span className="truncate block">{file}</span>
        </button>
        <Modal open={showFileNameModal} onClose={() => onShowFileNameModal(false)} title="File name">
          {file}
        </Modal>
        {saveMessage && (
          <span className="text-sm text-gray-500 shrink-0">{saveMessage}</span>
        )}
      </div>
      <div className="flex items-center">
        {loading ? (
          <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
        ) : error ? (
          <button
            onClick={onReload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden md:inline">Reload</span>
          </button>
        ) : (
          <>
            {!editMode && (type === 'text' || type === 'markdown') && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-white transition-colors mr-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden md:inline">Edit</span>
              </button>
            )}
            {!editMode && (
              <button
                onClick={onToggleBookmark}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors mr-2 ${
                  info?.isBookmarked
                    ? 'text-yellow-300 bg-yellow-900/30 border-yellow-700 hover:bg-yellow-900/50 hover:text-yellow-200'
                    : 'text-gray-400 bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill={info?.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="hidden md:inline">{info?.isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </button>
            )}
            {!editMode && (
              <button
                onClick={onReload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden md:inline">Reload</span>
              </button>
            )}
            {editMode && (
              <>
                <button
                  onClick={onSave}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-300 bg-green-900 border border-green-700 rounded-md hover:bg-green-800 hover:text-green-200 transition-colors mr-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden md:inline">Save</span>
                </button>
                <button
                  onClick={onCancel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden md:inline">Cancel</span>
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
