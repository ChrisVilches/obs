import * as Dialog from "@radix-ui/react-dialog";
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
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-dialog-overlay-show data-[state=closed]:animate-dialog-overlay-hide" />
        <Dialog.Content
          aria-describedby={undefined}
          className={`
            fixed left-1/2 top-1/2 z-50
            w-[calc(100vw-2rem)] max-w-md
            -translate-x-1/2 -translate-y-1/2
            bg-gray-900 border border-gray-800 rounded-xl shadow-xl outline-none
            data-[state=open]:animate-dialog-content-show
            data-[state=closed]:animate-dialog-content-hide
            ${className}
          `}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
            <Dialog.Title className="text-sm font-semibold text-gray-300">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className={`px-5 py-4 text-sm text-gray-400 ${childrenClass}`}>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
