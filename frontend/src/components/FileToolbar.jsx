import FileNameDisplay from './FileNameDisplay';
import ReloadButton from './ReloadButton';
import EditButton from './EditButton';
import BookmarkButton from './BookmarkButton';
import SaveCancelButtons from './SaveCancelButtons';

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
      <div className="flex items-center">
        {loading ? (
          <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
        ) : error ? (
          <ReloadButton onClick={onReload} />
        ) : (
          <>
            {!editMode && (type === 'text' || type === 'markdown') && (
              <EditButton onClick={onEdit} />
            )}
            {!editMode && (
              <BookmarkButton isBookmarked={info?.isBookmarked} onClick={onToggleBookmark} />
            )}
            {!editMode && <ReloadButton onClick={onReload} />}
            {editMode && <SaveCancelButtons onSave={onSave} onCancel={onCancel} />}
          </>
        )}
      </div>
    </div>
  );
}
