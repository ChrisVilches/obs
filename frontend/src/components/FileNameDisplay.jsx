import Modal from './Modal';

export default function FileNameDisplay({ file, showFileNameModal, onShowFileNameModal, saveMessage }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <button
        onClick={() => onShowFileNameModal(true)}
        className="text-sm text-gray-300 truncate hover:text-indigo-400 transition-colors text-left min-w-0"
      >
        <span className="truncate block">{file}</span>
      </button>
      <Modal open={showFileNameModal} onClose={() => onShowFileNameModal(false)} title="File name">
        {file}
      </Modal>
      {saveMessage && (
        <span className="text-sm text-gray-500 shrink-0">{saveMessage}</span>
      )}
    </div>
  );
}
