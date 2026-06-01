import {
  DocumentIcon,
  DocumentTextIcon,
  FolderIcon,
  MusicalNoteIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { usePubSub } from "../hooks/usePubSub"

const extToIcon = {
  // images
  jpg: PhotoIcon,
  jpeg: PhotoIcon,
  png: PhotoIcon,
  gif: PhotoIcon,
  webp: PhotoIcon,
  svg: PhotoIcon,
  bmp: PhotoIcon,
  ico: PhotoIcon,
  avif: PhotoIcon,
  // video
  mp4: VideoCameraIcon,
  webm: VideoCameraIcon,
  avi: VideoCameraIcon,
  mov: VideoCameraIcon,
  mkv: VideoCameraIcon,
  wmv: VideoCameraIcon,
  flv: VideoCameraIcon,
  m4v: VideoCameraIcon,
  // audio
  mp3: MusicalNoteIcon,
  wav: MusicalNoteIcon,
  ogg: MusicalNoteIcon,
  flac: MusicalNoteIcon,
  aac: MusicalNoteIcon,
  wma: MusicalNoteIcon,
  m4a: MusicalNoteIcon,
  opus: MusicalNoteIcon,
  // documents
  md: DocumentTextIcon,
  mdx: DocumentTextIcon,
  txt: DocumentTextIcon,
  pdf: DocumentTextIcon,
  csv: DocumentTextIcon,
  json: DocumentTextIcon,
  xml: DocumentTextIcon,
  yaml: DocumentTextIcon,
  yml: DocumentTextIcon,
  toml: DocumentTextIcon,
  log: DocumentTextIcon,
  rtf: DocumentTextIcon,
};

export function getFileIcon(path) {
  const ext = path.split(".").pop().toLowerCase();
  return extToIcon[ext] || DocumentIcon;
}

function FileIcon({ path, className }) {
  const Icon = getFileIcon(path);
  return <Icon className={className} />;
}

export function dirPath(path) {
  return path.includes("/") ? `/${path.slice(0, path.lastIndexOf("/"))}` : "/";
}

export function formatRelativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function FileItem({ selected, onClick, path, mtime }) {
  return (
    <Link
      to={`/file?f=${encodeURIComponent(path)}`}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${selected
        ? "bg-gray-800 text-gray-200"
        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
        }`}
    >
      <FileIcon path={path} className="w-4 h-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="truncate block">
          {path.split("/").pop()}
        </span>
        <span className="text-xs text-gray-600 truncate block">
          {dirPath(path)}
        </span>
      </div>
      {mtime && (
        <span className="text-xs text-gray-600 shrink-0">
          {formatRelativeTime(mtime)}
        </span>
      )}
    </Link>
  )
}

function FolderItem({ path, onClick }) {
  // NOTE: Currently folders don't appear in search results, so they can't be
  // selected using the keyboard.

  const fileFocusedDispatch = usePubSub("file-focused")

  // TODO: style the button properly
  return (
    <button
      type="button"
      onClick={(ev) => {
        fileFocusedDispatch({ path, important: true })
        if (onClick) onClick(ev)
      }}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-gray-400 hover:bg-gray-800 hover:text-gray-200"
    >
      <FolderIcon className="w-4 h-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="truncate block">
          {path.split("/").pop()}
        </span>
        <span className="text-xs text-gray-600 truncate block">
          {dirPath(path)}
        </span>
      </div>
    </button>
  )
}

export default function FileList({
  items,
  showTime = false,
  loading = false,
  emptyMessage = "No files found.",
  onItemClick,
  selectedIndex = -1,
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (selectedIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <div key={i} className="h-10 bg-gray-800 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-gray-500">{emptyMessage}</p>;
  }

  return (
    <ul ref={listRef} className="space-y-0.5">
      {items.map((item, index) => (
        <li key={item.path || index}>
          {item.type === "folder" ? (
            <FolderItem
              onClick={onItemClick ? () => onItemClick(item) : undefined}
              path={item.path}
            />
          ) : (
            <FileItem
              onClick={onItemClick ? () => onItemClick(item) : undefined}
              path={item.path}
              mtime={showTime ? item.mtime : null}
              selected={index === selectedIndex} />
          )}
        </li>
      ))}
    </ul>
  );
}
