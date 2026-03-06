import {
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useSWR, { useSWRConfig } from "swr";
import useFileToolbar from "../hooks/useFileToolbar";
import { fetcher } from "../utils/fetcher";
import Button from "./Button";
import ErrorDisplay from "./ErrorDisplay";
import Modal from "./Modal";
import BinaryFileViewer from "./viewers/BinaryFileViewer";
import ImageViewer from "./viewers/ImageViewer";
import MarkdownViewer from "./viewers/MarkdownViewer";
import MediaViewer from "./viewers/MediaViewer";
import TextViewer from "./viewers/TextViewer";

function showModifiedToast(modified) {
  toast.custom((t) => {
    const Icon = modified ? CheckCircleIcon : InformationCircleIcon;
    return (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-sm w-full bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-3">
          <div className="flex items-center">
            <Icon
              className={`h-5 w-5 ${modified ? "text-green-400" : "text-gray-400"}`}
            />
            <p className="ml-2 text-sm font-medium text-gray-200">
              {modified ? "Updated" : "No changes"}
            </p>
          </div>
        </div>
      </div>
    );
  });
}

export default function FileViewer({ file }) {
  const { mutate } = useSWRConfig();
  const infoKey = `/api/files/info?file=${encodeURIComponent(file)}`;
  const { data: info, isLoading, error } = useSWR(infoKey);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileContentRef = useRef(null);
  const [showFileNameModal, setShowFileNameModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);

  useEffect(() => {
    setEditMode(false);
    setErrorMessage(null);
  }, [file]);

  const handleEdit = useCallback(() => setEditMode(true), [setEditMode]);
  const handleCancel = useCallback(() => setEditMode(false), [setEditMode]);

  useEffect(() => {
    if (!fileContentRef.current || !editMode) return;
    fileContentRef.current.value = info.content;

    // Automatically focus on the first character.
    fileContentRef.current.focus();
    fileContentRef.current.setSelectionRange(0, 0);
    fileContentRef.current.scrollTop = 0;
  }, [editMode]);

  const saveFile = useCallback(
    async (force) => {
      setSaving(true);
      setShowConflictModal(false);

      try {
        const saveData = await fetcher("/api/files/content", {
          method: "PUT",
          body: {
            file,
            content: fileContentRef.current.value,
            mtime: info.mtime,
            force,
          },
        });

        await mutate(infoKey);

        showModifiedToast(saveData.modified);
        setEditMode(false);
      } catch (err) {
        if (err.code === "VERSION_CONFLICT") {
          setShowConflictModal(true);
          return;
        }
        setErrorMessage(err.message);
      } finally {
        setSaving(false);
      }
    },
    [file, info, infoKey, mutate],
  );

  const handleTrySave = useCallback(() => saveFile(false), [saveFile]);
  const handleSaveForce = useCallback(() => saveFile(true), [saveFile]);

  const handleToggleBookmark = useCallback(async () => {
    setBookmarking(true);

    try {
      const data = await fetcher("/api/bookmarks", {
        method: info.isBookmarked ? "DELETE" : "POST",
        body: { path: file },
      });

      mutate(
        infoKey,
        { ...info, isBookmarked: data.isBookmarked },
        { revalidate: false },
      );
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setBookmarking(false);
    }
  }, [file, info, infoKey, mutate]);

  const displayError = error?.message || errorMessage;

  useFileToolbar({
    file,
    loading: isLoading,
    info,
    editMode,
    saving,
    bookmarking,
    showFileNameModal,
    onShowFileNameModal: setShowFileNameModal,
    onEdit: handleEdit,
    onCancel: handleCancel,
    onSave: handleTrySave,
    onToggleBookmark: handleToggleBookmark,
  });

  if (displayError)
    return (
      <div className="min-h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <ErrorDisplay message={displayError} file={file} />
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
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              handleTrySave(false);
            }
          }}
          disabled={saving}
          className="flex-1 p-6 text-sm text-gray-200 bg-gray-900 font-mono resize-none outline-none border-2 border-indigo-500/50 disabled:opacity-50"
          spellCheck={false}
        />
      ) : type === "image" ? (
        <ImageViewer file={file} />
      ) : type === "markdown" ? (
        <MarkdownViewer file={file} content={info.content} />
      ) : type === "audio" || type === "video" ? (
        <MediaViewer file={file} type={type} />
      ) : type === "binary" ? (
        <BinaryFileViewer file={file} />
      ) : (
        <TextViewer content={info.content} />
      )}
      {info && (
        <Modal
          open={showConflictModal}
          onClose={() => setShowConflictModal(false)}
          title="File Modified"
        >
          <p>
            A version conflict was detected. The file has changed since you
            started editing.
          </p>
          <p className="mt-2">
            You can force save to overwrite their changes, or cancel and reload
            the file to see the latest version.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowConflictModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleSaveForce}
              disabled={saving}
            >
              Force Save
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
