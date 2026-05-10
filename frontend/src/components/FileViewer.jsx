import { useState, useEffect } from 'react';
import ErrorDisplay from './ErrorDisplay';
import FileToolbar from './FileToolbar';
import Modal from './Modal';
import Button from './Button';
import TextViewer from './viewers/TextViewer';
import ImageViewer from './viewers/ImageViewer';
import MarkdownViewer from './viewers/MarkdownViewer';
import MediaViewer from './viewers/MediaViewer';
import BinaryFileViewer from './viewers/BinaryFileViewer';

export default function FileViewer({ file, onBookmarkChange }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saveMessage, setSaveMessage] = useState(null);
  const [showFileNameModal, setShowFileNameModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);

  function loadFile() {
    if (!file) return;
    setInfo(null);
    setError(null);
    setEditMode(false);
    fetch(`/api/files/info?file=${encodeURIComponent(file)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setInfo(data);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadFile();
  }, [file]);

  useEffect(() => {
    setSaveMessage(null);
  }, [file]);

  if (!file) return null;

  function handleEdit() {
    setEditContent(info.content);
    setEditMode(true);
    setSaveMessage(null);
  }

  function handleCancel() {
    setEditMode(false);
  }

  function handleSave() {
    setSaving(true);
    const body = { file, content: editContent, mtime: info.mtime };

    const saveFetch = fetch('/api/files/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((res) => res.json());

    const refetchFetch = fetch(`/api/files/info?file=${encodeURIComponent(file)}`)
      .then((res) => res.json());

    Promise.all([saveFetch, refetchFetch])
      .then(([saveData, newInfo]) => {
        if (saveData.error === 'VERSION_CONFLICT') {
          setShowConflictModal(true);
          setSaving(false);
          return;
        }
        if (saveData.error) throw new Error(saveData.error);
        if (newInfo.error) throw new Error(newInfo.error);
        setInfo(newInfo);
        setSaveMessage(saveData.message);
        setEditMode(false);
        setSaving(false);
      })
      .catch((err) => {
        setError(err.message);
        setSaving(false);
      });
  }

  // TODO: This is too similar to the other one. Could be implemented as just one method, with variants.
  function handleForceSave() {
    setShowConflictModal(false);
    setSaving(true);
    const body = { file, content: editContent, force: true, mtime: info.mtime };

    const saveFetch = fetch('/api/files/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((res) => res.json());

    const refetchFetch = fetch(`/api/files/info?file=${encodeURIComponent(file)}`)
      .then((res) => res.json());

    Promise.all([saveFetch, refetchFetch])
      .then(([saveData, newInfo]) => {
        if (saveData.error) throw new Error(saveData.error);
        if (newInfo.error) throw new Error(newInfo.error);
        setInfo(newInfo);
        setSaveMessage(saveData.message);
        setEditMode(false);
        setSaving(false);
      })
      .catch((err) => {
        setError(err.message);
        setSaving(false);
      });
  }

  function handleToggleBookmark() {
    if (info.isBookmarked) {
      fetch(`/api/bookmarks?path=${encodeURIComponent(file)}`, { method: 'DELETE' })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setInfo({ ...info, isBookmarked: false });
          if (onBookmarkChange) onBookmarkChange();
        })
        .catch((err) => setError(err.message));
    } else {
      fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setInfo({ ...info, isBookmarked: true });
          if (onBookmarkChange) onBookmarkChange();
        })
        .catch((err) => setError(err.message));
    }
  }

  if (error) {
    return (
      <div className="min-h-full flex flex-col">
        <FileToolbar
          file={file}
          onReload={loadFile}
          showFileNameModal={showFileNameModal}
          onShowFileNameModal={setShowFileNameModal}
        />
        <ErrorDisplay message={error} file={file} />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-full flex flex-col">
        <FileToolbar
          file={file}
          loading
          showFileNameModal={showFileNameModal}
          onShowFileNameModal={setShowFileNameModal}
        />
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
      <FileToolbar
        file={file}
        info={info}
        editMode={editMode}
        saving={saving}
        saveMessage={saveMessage}
        showFileNameModal={showFileNameModal}
        onShowFileNameModal={setShowFileNameModal}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSave={handleSave}
        onToggleBookmark={handleToggleBookmark}
        onReload={loadFile}
      />
      {editMode ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSave();
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
            <Button variant="danger" onClick={handleForceSave} disabled={saving}>Force Save</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
