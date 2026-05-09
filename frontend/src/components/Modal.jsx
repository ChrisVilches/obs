import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
  childrenClass = "",
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/60 transition-opacity duration-(--dialog-transition-duration) data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className={`w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-xl transition-[scale,opacity] duration-(--dialog-transition-duration) data-closed:scale-90 data-closed:opacity-0 ${className}`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
            <DialogTitle className="text-sm font-semibold text-gray-300">
              {title}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div
            className={`px-5 py-4 text-sm text-gray-400 ${childrenClass}`}
          >
            {children}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
