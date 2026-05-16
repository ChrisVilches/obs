import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import {
  Bars3Icon,
  BookmarkIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useState, useRef } from "react";
import { Outlet } from "react-router-dom";
import useSWR from "swr";
import FileList from "../components/FileList";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import SettingsModal from "../components/SettingsModal";
import Sidemenu from "../components/Sidemenu";
import useKeyShortcut from "../hooks/useKeyShortcut";

// When the user picks a file inside the search or bookmarks modal, both the
// route navigation and the modal close are triggered synchronously. Without a
// brief deferral the dialog unmounts before Headless UI's transition exit
// phase can run, so the modal disappears abruptly rather than animating out.
// The delay lets the close state propagate first, allowing the transition to
// play.
const DELAY_MODAL_CLOSE = 20

// When the modal closes during its exit transition, setting the SWR key to
// `false` would immediately clear the cached data, causing a flash of empty
// state. We fix this by keeping the key truthy once the modal has been opened.
function useBookmarksModal() {
  const [isOpen, setIsOpen] = useState(false);
  const fetched = useRef(false);
  const { data, isLoading, mutate } = useSWR((isOpen || fetched.current) && "/api/bookmarks");
  return {
    open: async () => {
      if (fetched.current) await mutate();
      fetched.current = true;
      setIsOpen(true);
    },
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
  const [layoutTopContent, setLayoutTopContent] = useState({
    title: "",
    extra: null,
  });

  useKeyShortcut("/", () => setSearchModalOpen(true));
  const bookmarksModal = useBookmarksModal();

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
    <div className="h-screen flex overflow-hidden bg-gray-950">
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 md:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/60 transition-opacity duration-(--dialog-transition-duration) data-closed:opacity-0"
        />
        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="w-5/6 h-full bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-(--dialog-transition-duration) data-closed:-translate-x-full">
            <Sidemenu
              {...sideMenuProps}
              onClose={() => setSidebarOpen(false)}
            />
          </DialogPanel>
        </div>
      </Dialog>

      <aside className="hidden md:flex flex-shrink-0 w-64 lg:w-72 xl:w-80 bg-gray-900 border-r border-gray-800 flex-col">
        <Sidemenu {...sideMenuProps} />
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto bg-gray-950">
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

        <div className="flex-1 pb-18 md:pb-0">
          <Outlet context={{ setLayoutTopContent }} />
        </div>
      </main>

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
          onItemClick={() => setTimeout(() => bookmarksModal.close(), DELAY_MODAL_CLOSE)}
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
          onClose={() => setTimeout(() => setSearchModalOpen(false), DELAY_MODAL_CLOSE)}
        />
      </Modal>

      <SettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      <div className="md:hidden fixed bottom-0 left-0 right-0 flex justify-center p-3 pointer-events-none z-30">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl shadow-lg pointer-events-auto p-1">
          <button
            type="button"
            onClick={bookmarksModal.open}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Bookmarks"
            title="Bookmarks"
          >
            <BookmarkIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Search"
            title="Search"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Settings"
            title="Settings"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
