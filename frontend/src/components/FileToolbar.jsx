import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PencilIcon, BookmarkIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import FileNameDisplay from './FileNameDisplay';
import Button from './Button';

function EditModeButtons({ onSave, onCancel, saving }) {
  return (<div className="flex items-center">
    <Button
      variant="primary"
      icon={saving ? <div className="w-4 h-4 border-2 border-green-300 border-t-transparent rounded-full animate-spin" /> : <CheckIcon className="w-4 h-4" />}
      onClick={onSave}
      disabled={saving}
    >
      {saving ? 'Saving...' : 'Save'}
    </Button>
    <Button
      variant="secondary"
      icon={<XMarkIcon className="w-4 h-4" />}
      onClick={onCancel}
      disabled={saving}
    >
      Cancel
    </Button>
  </div>)
}

function ButtonsWhenFileExists({ onToggleBookmark, canBeEdited, isBookmarked, onEdit, bookmarking }) {
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
        icon={bookmarking ? (
          <div className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin" />
        ) : (
          <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        )}
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
  saving,
  bookmarking,
  showFileNameModal,
  onShowFileNameModal,
  onEdit,
  onCancel,
  onSave,
  onToggleBookmark,
  loading,
}) {
  const canBeEdited = info?.type === 'text' || info?.type === 'markdown';
  const { setLayoutTopContent } = useOutletContext();

  useEffect(() => {
    console.log("file changed (from toolbar)", file)
    setLayoutTopContent({
      title: (
        <FileNameDisplay file={file}
          info={info}
          showFileNameModal={showFileNameModal}
          onShowFileNameModal={onShowFileNameModal}
        />
      ),
      extra: (
        <div className="flex items-center space-x-2">
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            editMode ? (
              <EditModeButtons onCancel={onCancel} onSave={onSave} saving={saving} />
            ) : (
              info && (
                <ButtonsWhenFileExists
                  canBeEdited={canBeEdited}
                  isBookmarked={info.isBookmarked}
                  onEdit={onEdit}
                  onToggleBookmark={onToggleBookmark}
                  bookmarking={bookmarking}
                />
              )
            )
          )}
        </div>
      )
    });

    // return () => setHeaderContent({ title: 'Default', extra: null });
    // TODO: and maybe other dependencies too
  }, [file, canBeEdited, loading]);


  // TODO: Instead of rendering null, we can put all this logic in the component that USES this component,
  // therefore it becomes part of the logic of that component.
  return null

  // return (
  //   <PageHeader
  //     title={
  //       <FileNameDisplay
  //         file={file}
  //         info={info}
  //         showFileNameModal={showFileNameModal}
  //         onShowFileNameModal={onShowFileNameModal}
  //       />
  //     }
  //     actions={
  //       <div className="flex items-center space-x-2">
  //         {loading ? (
  //           <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
  //         ) : (
  //           editMode ? (
  //             <EditModeButtons onCancel={onCancel} onSave={onSave} saving={saving} />
  //           ) : (
  //             info && (
  //               <ButtonsWhenFileExists
  //                 canBeEdited={canBeEdited}
  //                 isBookmarked={info.isBookmarked}
  //                 onEdit={onEdit}
  //                 onToggleBookmark={onToggleBookmark}
  //                 bookmarking={bookmarking}
  //               />
  //             )
  //           )
  //         )}
  //       </div>
  //     }
  //   />
  // );
}
