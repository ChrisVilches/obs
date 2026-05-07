import { ArrowPathIcon, PencilIcon, BookmarkIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import FileNameDisplay from './FileNameDisplay';
import Button from './Button';

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
      <FileNameDisplay
        file={file}
        showFileNameModal={showFileNameModal}
        onShowFileNameModal={onShowFileNameModal}
        saveMessage={saveMessage}
      />
      {info?.mtime && (
        <span className="text-xs text-gray-600 shrink-0 ml-2">
          {new Date(info.mtime).toLocaleString()}
        </span>
      )}
      <div className="flex items-center">
        {loading ? (
          <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
        ) : error ? (
          <Button
            variant="secondary"
            icon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={onReload}
          />
        ) : (
          <div className="flex items-center space-x-2">
            {!editMode && (type === 'text' || type === 'markdown') && (
              <Button
                variant="secondary"
                icon={<PencilIcon className="w-4 h-4" />}
                onClick={onEdit}
              >
                Edit
              </Button>
            )}
            {!editMode && (
              <Button
                variant="secondary"
                icon={<BookmarkIcon className={`w-4 h-4 ${info?.isBookmarked ? 'fill-current' : ''}`} />}
                onClick={onToggleBookmark}
                className={info?.isBookmarked ? '!text-yellow-300 !bg-yellow-900/30 !border-yellow-700 hover:!bg-yellow-900/50 hover:!text-yellow-200' : ''}
              >
                {info?.isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
            )}
            {!editMode && (
              <Button
                variant="secondary"
                icon={<ArrowPathIcon className="w-4 h-4" />}
                onClick={onReload}
              >
                Reload
              </Button>
            )}
            {editMode && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="primary"
                  icon={<CheckIcon className="w-4 h-4" />}
                  onClick={onSave}
                >
                  Save
                </Button>
                <Button
                  variant="secondary"
                  icon={<XMarkIcon className="w-4 h-4" />}
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
