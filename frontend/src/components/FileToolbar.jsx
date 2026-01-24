import { ArrowPathIcon, PencilIcon, BookmarkIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import FileNameDisplay from './FileNameDisplay';
import Button from './Button';

function EditModeButtons({ onSave, onCancel }) {
  return (<div className="flex items-center space-x-2">
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
  </div>)
}

function ButtonsWhenFileExists({ onToggleBookmark, canBeEdited, isBookmarked, onEdit }) {
  return (
    <>
      {canBeEdited && (
        <Button
          variant="secondary"
          icon={<PencilIcon className="w-4 h-4" />}
          onClick={onEdit}
        >
          Edit
        </Button>
      )}
      <Button
        variant="secondary"
        icon={<BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />}
        onClick={onToggleBookmark}
        className={isBookmarked ? '!text-yellow-300 !bg-yellow-900/30 !border-yellow-700 hover:!bg-yellow-900/50 hover:!text-yellow-200' : ''}
      >
        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
      </Button>
    </>
  )
}

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
}) {
  const canBeEdited = info?.type === 'text' || info?.type === 'markdown';

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b border-gray-800 bg-gray-900 shrink-0">
      <FileNameDisplay
        file={file}
        showFileNameModal={showFileNameModal}
        onShowFileNameModal={onShowFileNameModal}
        saveMessage={saveMessage}
      />
      {info && (
        <span className="text-xs text-gray-600 shrink-0 ml-2">
          {new Date(info.mtime).toLocaleString()}
        </span>
      )}
      <div className="flex items-center">
        <div className="flex items-center space-x-2">
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            editMode ? (
              <EditModeButtons onCancel={onCancel} onSave={onSave} />
            ) : (
              <>
                {info && (
                  <ButtonsWhenFileExists
                    canBeEdited={canBeEdited}
                    isBookmarked={info.isBookmarked}
                    onEdit={onEdit}
                    onToggleBookmark={onToggleBookmark}
                  />
                )}

                <Button
                  variant="secondary"
                  icon={<ArrowPathIcon className="w-4 h-4" />}
                  onClick={onReload}
                >
                  Reload
                </Button>
              </>
            )
          )}
        </div>

      </div>
    </div >
  );
}
