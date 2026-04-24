import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import FileList from "../components/FileList";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import SettingsModal from "../components/SettingsModal";
import Sidemenu from "../components/Sidemenu";
import useKeyShortcut from "../hooks/useKeyShortcut";
import useResizable from "../hooks/useResizable";

function useBookmarksModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading, mutate } = useSWR("/api/bookmarks");

  const open = async () => {
    setIsOpen(true);
    try {
      await mutate();
    } catch (err) {
      console.error(err);
    }
  };

  return {
    open,
    close: () => setIsOpen(false),
    isOpen,
    bookmarks: data?.items ?? [],
    isLoading,
  };
}

export default function Layout() {
  const {
    data: filesData,
    isLoading: filesLoading,
    error: filesError,
  } = useSWR("/api/files");
  const files = filesData?.files || [];
  const folderName = filesData?.folderName || "";
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    ref: sidebarRef,
    size: sidebarWidth,
    onHandleMouseDown,
  } = useResizable({
    defaultValue: 288,
    min: 180,
    max: 600,
    storageKey: "sidebarWidth",
  });
  const [layoutTopContent, setLayoutTopContent] = useState({
    title: "",
    extra: null,
  });

  useKeyShortcut("/", () => setSearchModalOpen(true));
  const bookmarksModal = useBookmarksModal();
  const [searchParams] = useSearchParams();
  const selectedFile = searchParams.get("f");

  if (filesError)
    return <div className="p-4 text-red-400">Error: {filesError.message}</div>;

  const sideMenuProps = {
    files,
    loading: filesLoading,
    folderName,
    onBookmarkClick: () => {
      setSidebarOpen(false);
      bookmarksModal.open();
    },
    onSearchClick: () => {
      setSidebarOpen(false);
      setSearchModalOpen(true);
    },
    onSettingsClick: () => {
      setSidebarOpen(false);
      setSettingsModalOpen(true);
    },
  };

  return (
    <div className="flex h-screen bg-gray-950">
      <Transition show={sidebarOpen}>
        <Dialog onClose={setSidebarOpen} className="relative z-50 md:hidden">
          <TransitionChild
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 flex">
            <TransitionChild
              enter="transition-transform duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition-transform duration-200"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <DialogPanel className="w-72 h-full bg-gray-900 border-r border-gray-800 flex flex-col">
                <Sidemenu
                  {...sideMenuProps}
                  onClose={() => setSidebarOpen(false)}
                />
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      <aside
        ref={sidebarRef}
        className="hidden md:flex flex-shrink-0 bg-gray-900 border-r border-gray-800 flex-col relative"
        style={{ width: sidebarWidth }}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: drag resize handle */}
        <div
          onMouseDown={onHandleMouseDown}
          className="absolute right-[-4px] top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500/70 z-10 shrink-0"
        />
        <Sidemenu {...sideMenuProps} />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 h-14 border-b border-gray-800 bg-gray-900 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-md text-gray-400 active:text-white active:bg-gray-800 transition-colors"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="flex-1 flex justify-start min-w-0">
            {layoutTopContent.title}
          </div>
          {layoutTopContent.extra && (
            <div className="flex items-center flex-shrink-0">
              {layoutTopContent.extra}
            </div>
          )}
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-950">
          <Outlet context={{ setLayoutTopContent }} />
        </main>
      </div>

      <Modal
        open={bookmarksModal.isOpen}
        onClose={bookmarksModal.close}
        title="Bookmarks"
        className="h-[70vh] flex flex-col overflow-hidden"
        childrenClass="flex-1 min-h-0 overflow-y-auto"
      >
        <FileList
          items={bookmarksModal.bookmarks}
          loading={bookmarksModal.isLoading}
          emptyMessage="No bookmarks found."
          onItemClick={bookmarksModal.close}
        />
      </Modal>

      <Modal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        title="Search"
        className="h-[70vh] flex flex-col overflow-hidden"
        childrenClass="flex-1 min-h-0"
      >
        <SearchBar
          onClose={() => setSearchModalOpen(false)}
          selectedFile={selectedFile}
        />
      </Modal>

      <SettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}
