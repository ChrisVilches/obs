import { useState, useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import ErrorDisplay from './ErrorDisplay';
import useFileToolbar from '../hooks/useFileToolbar';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch, queryClient } from '../api';
import Modal from './Modal';
import Button from './Button';
import TextViewer from './viewers/TextViewer';
import ImageViewer from './viewers/ImageViewer';
import MarkdownViewer from './viewers/MarkdownViewer';
import MediaViewer from './viewers/MediaViewer';
import BinaryFileViewer from './viewers/BinaryFileViewer';

export default function FileViewer({ file }) {
  const [editMode, setEditMode] = useState(false);
  const [operationalError, setOperationalError] = useState(null);
  const fileContentRef = useRef(null)
  const [showFileNameModal, setShowFileNameModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);

  if (!file) throw new Error("fatal. File is null")

  const { data: info, error: fetchError, refetch } = useQuery({
    queryKey: ['files', 'info', file],
    queryFn: () => apiFetch(`/api/files/info?file=${encodeURIComponent(file)}`),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ file: f, content, mtime, force }) => {
      const res = await fetch('/api/files/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: f, content, mtime, force }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'VERSION_CONFLICT') throw { _code: 'VERSION_CONFLICT' };
        throw new Error(data.error || 'Save failed');
      }
      return data;
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({ path, method }) => {
      const res = await fetch('/api/bookmarks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
  });

  const error = fetchError || operationalError;

  useEffect(() => {
    setEditMode(false);
    setOperationalError(null);
  }, [file]);

  const handleEdit = useCallback(() => setEditMode(true), [])
  const handleCancel = useCallback(() => setEditMode(false), [])

  useEffect(() => {
    if (!fileContentRef.current || !editMode) return
    fileContentRef.current.value = info?.content ?? '';

    fileContentRef.current.focus();
    fileContentRef.current.setSelectionRange(0, 0);
    fileContentRef.current.scrollTop = 0;

  }, [editMode]);

  const onSaveSuccess = useCallback(async (saveData) => {
    const result = await refetch();
    if (result.error) return;
    const modified = saveData.modified;
    toast.custom((t) => {
      const Icon = modified ? CheckCircleIcon : InformationCircleIcon;
      return (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-3">
            <div className="flex items-center">
              <Icon className={`h-5 w-5 ${modified ? 'text-green-400' : 'text-gray-400'}`} />
              <p className="ml-2 text-sm font-medium text-gray-200">{modified ? 'Updated' : 'No changes'}</p>
            </div>
          </div>
        </div>
      );
    });
    setEditMode(false);
  }, [refetch]);

  const onSaveError = useCallback((err) => {
    if (err._code === 'VERSION_CONFLICT') {
      setShowConflictModal(true);
      return;
    }
    setOperationalError(err.message);
  }, []);

  const handleTrySave = useCallback(() => {
    setOperationalError(null);
    saveMutation.mutate(
      { file, content: fileContentRef.current.value, mtime: info?.mtime, force: false },
      { onSuccess: onSaveSuccess, onError: onSaveError },
    );
  }, [file, info, saveMutation, onSaveSuccess, onSaveError]);

  const handleSaveForce = useCallback(() => {
    setShowConflictModal(false);
    setOperationalError(null);
    saveMutation.mutate(
      { file, content: fileContentRef.current.value, mtime: info?.mtime, force: true },
      { onSuccess: onSaveSuccess, onError: onSaveError },
    );
  }, [file, info, saveMutation, onSaveSuccess, onSaveError]);

  const onBookmarkError = useCallback((err) => {
    setOperationalError(err.message);
  }, []);

  const handleToggleBookmark = useCallback(() => {
    setOperationalError(null);
    bookmarkMutation.mutate(
      { path: file, method: info.isBookmarked ? 'DELETE' : 'POST' },
      {
        onSuccess: () => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        },
        onError: onBookmarkError,
      },
    );
  }, [file, info, refetch, bookmarkMutation, onBookmarkError]);

  const isLoading = !info && !error;

  useFileToolbar({
    file,
    loading: isLoading,
    info,
    editMode,
    saving: saveMutation.isPending,
    bookmarking: bookmarkMutation.isPending,
    showFileNameModal,
    onShowFileNameModal: setShowFileNameModal,
    onEdit: handleEdit,
    onCancel: handleCancel,
    onSave: handleTrySave,
    onToggleBookmark: handleToggleBookmark
  })

  if (error) return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <ErrorDisplay message={error} file={file} />
      </div>
    </div>
  );
  if (isLoading) {
    return (
      <div className="min-h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  const type = info.type;

  return (
    <div className="min-h-full flex flex-col">
      {editMode ? (
        <textarea
          ref={fileContentRef}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleTrySave(false);
            }
          }}
          disabled={saving}
          className="flex-1 p-6 text-sm text-gray-200 bg-gray-900 font-mono resize-none outline-none border-2 border-indigo-500/50 disabled:opacity-50"
          spellCheck={false}
        />
      ) : type === 'image' ? (
        <ImageViewer file={file} />
      ) : type === 'markdown' ? (
        <MarkdownViewer file={file} content={info.content} />
      ) : type === 'audio' || type === 'video' ? (
        <MediaViewer file={file} type={type} />
      ) : type === 'binary' ? (
        <BinaryFileViewer file={file} />
      ) : (
        <TextViewer content={info.content} />
      )}
      {info && (
        <Modal open={showConflictModal} onClose={() => setShowConflictModal(false)} title="File Modified">
          <p>A version conflict was detected. The file has changed since you started editing.</p>
          <p className="mt-2">You can force save to overwrite their changes, or cancel and reload the file to see the latest version.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowConflictModal(false)} disabled={saving}>Cancel</Button>
            <Button variant="danger" onClick={handleSaveForce} disabled={saving}>Force Save</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
