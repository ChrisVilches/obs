import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import useSWR, { useSWRConfig } from "swr";
import { UnsavedChangesModal, useEditBlocker } from "../hooks/useEditBlocker";
import useFileToolbar from "../hooks/useFileToolbar";
import { fetcher } from "../utils/fetcher";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "../utils/toast";
import Button from "./Button";
import ErrorDisplay from "./ErrorDisplay";
import Modal from "./Modal";
import BinaryFileViewer from "./viewers/BinaryFileViewer";
import ImageViewer from "./viewers/ImageViewer";
import MediaViewer from "./viewers/MediaViewer";
import TextViewer from "./viewers/TextViewer";

// MarkdownViewer is code-split because react-markdown + katex + remark/rehype
// plugins are too large to bundle eagerly. While the lazy chunk loads, we
// show a skeleton of text lines instead of a spinner to avoid an
// identical-looking spinner in the preceding useSWR-loading phase — two
// back-to-back spinners would cause a visual glitch where the animation
// resets when React swaps the DOM nodes.
const MarkdownViewer = lazy(() => import("./viewers/MarkdownViewer"));

function MarkdownSkeleton() {
  const lines = [
    "w-3/4",
    "w-full",
    "w-1/2",
    "w-5/6",
    "w-2/3",
    "w-full",
    "w-1/3",
    "w-4/5",
    "w-3/5",
    "w-full",
    "w-1/4",
    "w-2/3",
    "w-5/6",
    "w-1/2",
    "w-3/4",
  ];
  return (
    <div className="flex-1 p-6 animate-pulse">
      <div className="max-w-full space-y-3">
        {lines.map((w, i) => (
          <div key={i} className={`h-4 bg-gray-800 rounded ${w}`} />
        ))}
      </div>
    </div>
  );
}

export default function FileViewer({ file }) {
  const { mutate } = useSWRConfig();
  const infoKey = `/api/files/info?file=${encodeURIComponent(file)}`;
  const { data: info, isLoading, error } = useSWR(infoKey);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const fileContentRef = useRef(null);
  const originalContentRef = useRef("");
  const [showFileNameModal, setShowFileNameModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);

  const handleEdit = useCallback(() => setEditMode(true), [setEditMode]);
  const handleCancel = useCallback(() => setEditMode(false), [setEditMode]);

  useEffect(() => {
    if (!fileContentRef.current || !editMode) return;
    originalContentRef.current = info.content;
    fileContentRef.current.value = info.content;

    // Automatically focus on the first character.
    fileContentRef.current.focus();
    fileContentRef.current.setSelectionRange(0, 0);
    fileContentRef.current.scrollTop = 0;
  }, [editMode, info?.content]);

  const saveFile = useCallback(
    async (force) => {
      setSaving(true);
      setShowConflictModal(false);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "content",
          new Blob([fileContentRef.current.value], { type: "text/plain" }),
          file,
        );
        formData.append("mtime", info.mtime);
        formData.append("force", force);

        const saveData = await fetcher("/api/files/content", {
          method: "PUT",
          body: formData,
        });

        await mutate(infoKey);

        saveData.modified
          ? showSuccessToast("Updated")
          : showInfoToast("No changes");
        setEditMode(false);
      } catch (err) {
        if (err.code === "VERSION_CONFLICT") {
          setShowConflictModal(true);
          return;
        }
        showErrorToast(err.message);
      } finally {
        setSaving(false);
      }
    },
    [file, info, infoKey, mutate],
  );

  const handleTrySave = useCallback(() => saveFile(false), [saveFile]);
  const handleSaveForce = useCallback(() => saveFile(true), [saveFile]);

  const isDirty = useCallback(() => {
    if (!editMode || !fileContentRef.current) return false;
    return fileContentRef.current.value !== originalContentRef.current;
  }, [editMode, fileContentRef, originalContentRef]);

  const blocker = useEditBlocker({
    enabled: editMode,
    hasUnsavedChanges: isDirty,
  });

  const handleToggleBookmark = useCallback(async () => {
    setBookmarking(true);

    try {
      const data = await fetcher("/api/bookmarks", {
        method: info.isBookmarked ? "DELETE" : "POST",
        body: { path: file },
      });

      await mutate(
        infoKey,
        { ...info, isBookmarked: data.isBookmarked },
        { revalidate: false },
      );
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      setBookmarking(false);
    }
  }, [file, info, infoKey, mutate]);

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

  if (error?.message)
    return (
      <div className="min-h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <ErrorDisplay message={error?.message} file={file} />
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
          className="flex-1 p-6 text-sm text-gray-200 bg-gray-900 font-mono resize-none outline-none border-2 border-indigo-500/50"
          spellCheck={false}
        />
      ) : type === "image" ? (
        <ImageViewer file={file} />
      ) : type === "markdown" ? (
        <Suspense fallback={<MarkdownSkeleton />}>
          <MarkdownViewer
            mtime={info.mtime}
            file={file}
            content={info.content}
          />
        </Suspense>
      ) : type === "audio" || type === "video" ? (
        <MediaViewer file={file} type={type} />
      ) : type === "binary" ? (
        <BinaryFileViewer file={file} />
      ) : (
        <TextViewer content={info.content} />
      )}
      <UnsavedChangesModal blocker={blocker} />
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
