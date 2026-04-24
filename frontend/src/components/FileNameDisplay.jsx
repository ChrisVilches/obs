import Modal from "./Modal";

export function formatBytesBinary(bytes, decimals = 2) {
  if (decimals < 0) throw new Error("decimals must be >= 0");
  if (bytes < 0) return "Invalid size";
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];

  // Math.log(bytes) / Math.log(k) finds the correct exponent power
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Ensure we don't overflow past our defined array units
  const unitIndex = Math.min(i, sizes.length - 1);

  // Calculate the scaled value and format to fixed decimals
  const formattedValue = parseFloat((bytes / k ** unitIndex).toFixed(decimals));

  return `${formattedValue} ${sizes[unitIndex]}`;
}

export function formatLocalDateTime(isoString) {
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

export default function FileNameDisplay({
  file,
  info,
  showFileNameModal,
  onShowFileNameModal,
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <button
        type="button"
        onClick={() => onShowFileNameModal(true)}
        className="text-sm text-gray-300 truncate hover:text-indigo-400 transition-colors text-left min-w-0"
      >
        <span className="truncate block">{file}</span>
      </button>
      <Modal
        open={showFileNameModal}
        onClose={() => onShowFileNameModal(false)}
        title="Details"
      >
        <div className="space-y-2">
          <div>
            <span className="text-xs text-gray-500 block">Path</span>
            <span className="text-sm text-gray-200 break-all">{file}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">File exists</span>
            <span
              className={`text-sm ${info ? "text-green-400" : "text-red-400"}`}
            >
              {info ? "Yes" : "No"}
            </span>
          </div>
          {info && (
            <>
              <div>
                <span className="text-xs text-gray-500 block">
                  Last modified
                </span>
                <span className="text-sm text-gray-200">
                  {formatLocalDateTime(info.mtime)}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Size</span>
                <span className="text-sm text-gray-200">
                  {formatBytesBinary(info.size)} ({info.size} bytes)
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">File Type</span>
                <span className="text-sm text-gray-200">{info.type}</span>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
