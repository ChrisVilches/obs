import { useState, useEffect } from 'react';
import ErrorDisplay from './ErrorDisplay';
import FileToolbar from './FileToolbar';
import TextViewer from './viewers/TextViewer';
import ImageViewer from './viewers/ImageViewer';
import MarkdownViewer from './viewers/MarkdownViewer';
import MediaViewer from './viewers/MediaViewer';
import BinaryFileViewer from './viewers/BinaryFileViewer';

export default function FileViewer({ file, onBookmarkChange }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saveMessage, setSaveMessage] = useState(null);
  const [showFileNameModal, setShowFileNameModal] = useState(false);

  useEffect(() => {
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
  }, [file, refreshKey]);

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
    fetch('/api/files/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file, content: editContent }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSaveMessage(data.message);
        setEditMode(false);
        setRefreshKey((k) => k + 1);
      })
      .catch((err) => setError(err.message));
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
          error
          onReload={() => setRefreshKey((k) => k + 1)}
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
        saveMessage={saveMessage}
        showFileNameModal={showFileNameModal}
        onShowFileNameModal={setShowFileNameModal}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSave={handleSave}
        onToggleBookmark={handleToggleBookmark}
        onReload={() => setRefreshKey((k) => k + 1)}
      />
      {editMode ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="flex-1 p-6 text-sm text-gray-200 bg-gray-900 font-mono resize-none outline-none border-2 border-indigo-500/50"
          spellCheck={false}
        />
      ) : type === 'image' ? (
        <ImageViewer key={refreshKey} file={file} />
      ) : type === 'markdown' ? (
        <MarkdownViewer key={refreshKey} file={file} content={info.content} />
      ) : type === 'audio' || type === 'video' ? (
        <MediaViewer key={refreshKey} file={file} type={type} />
      ) : type === 'binary' ? (
        <BinaryFileViewer file={file} />
      ) : (
        <TextViewer key={refreshKey} content={info.content} />
      )}
    </div>
  );
}
