import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
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
    <Transition show={open}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          enter="transition-opacity duration-(--dialog-transition-duration)"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-(--dialog-transition-duration)"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            enter="transition-[scale,opacity] duration-(--dialog-transition-duration)"
            enterFrom="scale-90 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="transition-[scale,opacity] duration-(--dialog-transition-duration)"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-90 opacity-0"
          >
            <DialogPanel
              className={`w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-xl ${className}`}
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
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
