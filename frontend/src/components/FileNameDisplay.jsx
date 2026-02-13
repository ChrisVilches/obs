import Modal from './Modal';

function formatLocalDateTime(isoString) {
  const d = new Date(isoString);

  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, "0")}-` +
    `${String(d.getDate()).padStart(2, "0")} ` +
    `${String(d.getHours()).padStart(2, "0")}:` +
    `${String(d.getMinutes()).padStart(2, "0")}:` +
    `${String(d.getSeconds()).padStart(2, "0")}`
  );
}

export default function FileNameDisplay({ file, info, showFileNameModal, onShowFileNameModal }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <button
        onClick={() => onShowFileNameModal(true)}
        className="text-sm text-gray-300 truncate hover:text-indigo-400 transition-colors text-left min-w-0"
      >
        <span className="truncate block">{file}</span>
      </button>
      <Modal open={showFileNameModal} onClose={() => onShowFileNameModal(false)} title="Details">
        <div className="space-y-2">
          <div>
            <span className="text-xs text-gray-500 block">Path</span>
            <span className="text-sm text-gray-200 break-all">{file}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">File exists</span>
            <span className={`text-sm ${info ? 'text-green-400' : 'text-red-400'}`}>{info ? 'Yes' : 'No'}</span>
          </div>
          {info && (
            <div>
              <span className="text-xs text-gray-500 block">Last modified</span>
              <span className="text-sm text-gray-200">{formatLocalDateTime(info.mtime)}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
