import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import useSWR, { useSWRConfig } from "swr";
import FileList from "../components/FileList";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import Sidemenu from "../components/Sidemenu";
import useResizable from "../hooks/useResizable";
import { fetcher } from "../utils/fetcher";

export default function Layout() {
  const { mutate } = useSWRConfig();
  const {
    data: filesData,
    isLoading: filesLoading,
    error: filesError,
  } = useSWR("/api/files");
  const files = filesData?.files || [];
  const folderName = filesData?.folderName || "";
  const [bookmarksModalOpen, setBookmarksModalOpen] = useState(false);
  const [modalBookmarks, setModalBookmarks] = useState([]);
  const [modalBookmarksLoading, setModalBookmarksLoading] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
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

  async function openBookmarksModal() {
    setBookmarksModalOpen(true);
    setModalBookmarksLoading(true);
    try {
      const data = await mutate("/api/bookmarks", fetcher("/api/bookmarks"));
      setModalBookmarks(data?.items || []);
    } catch {
      // silently handled
    } finally {
      setModalBookmarksLoading(false);
    }
  }

  const [searchParams] = useSearchParams();
  const selectedFile = searchParams.get("f");

  if (filesError)
    return <div className="p-4 text-red-400">Error: {filesError.message}</div>;

  return (
    <div className="flex h-screen bg-gray-950">
      <Dialog
        open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-50 md:hidden"
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="fixed inset-0 flex">
          <DialogPanel className="w-72 h-full bg-gray-900 border-r border-gray-800 flex flex-col">
            <Sidemenu
              files={files}
              loading={filesLoading}
              onClose={() => setSidebarOpen(false)}
              folderName={folderName}
              onBookmarkClick={() => {
                setSidebarOpen(false);
                openBookmarksModal();
              }}
              onSearchClick={() => {
                setSidebarOpen(false);
                setSearchModalOpen(true);
              }}
            />
          </DialogPanel>
        </div>
      </Dialog>

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
        <Sidemenu
          files={files}
          loading={filesLoading}
          folderName={folderName}
          onBookmarkClick={openBookmarksModal}
          onSearchClick={() => setSearchModalOpen(true)}
        />
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

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-950 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600">
          <Outlet context={{ setLayoutTopContent }} />
        </main>
      </div>

      <Modal
        open={bookmarksModalOpen}
        onClose={() => setBookmarksModalOpen(false)}
        title="Bookmarks"
        className="h-[70vh] flex flex-col overflow-hidden"
        childrenClass="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600"
      >
        <FileList
          items={modalBookmarks}
          loading={modalBookmarksLoading}
          emptyMessage="No bookmarks found."
          onItemClick={() => setBookmarksModalOpen(false)}
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
    </div>
  );
}
