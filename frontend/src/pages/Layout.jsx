import * as Dialog from "@radix-ui/react-dialog";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import FileList from "../components/FileList";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import SettingsModal from "../components/SettingsModal";
import Sidemenu from "../components/Sidemenu";
import useKeyShortcut from "../hooks/useKeyShortcut";
import { usePubSub } from "../hooks/usePubSub";

// When the modal closes during its exit transition, setting the SWR key to
// `false` would immediately clear the cached data, causing a flash of empty
// state. We fix this by keeping the key truthy once the modal has been opened.
function useBookmarksModal() {
  const [isOpen, setIsOpen] = useState(false);
  const fetched = useRef(false);
  const { data, isLoading, mutate } = useSWR(
    (isOpen || fetched.current) && "/api/bookmarks",
  );
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

function isMobile(desktopSidebarRef) {
  const rect = desktopSidebarRef.current.getBoundingClientRect();
  const desktopSidebarVisible = rect.width !== 0 && rect.height !== 0;
  return !desktopSidebarVisible;
}

// NOTE: `desktopSidebarRef` is used to avoid opening the sidebar when on
// desktop. This is to avoid an aria related error (prints warning and freezes
// the UI).
function useOpenSidebarOnFileFocus(desktopSidebarRef, setSidebarOpen) {
  const [searchParams] = useSearchParams();
  const fileParam = searchParams.get("f");

  const onFileFocused = useCallback(({ important }) => {
    if (important && isMobile(desktopSidebarRef)) {
      setSidebarOpen(true);
    }
  }, []);

  const { dispatch: fileFocusedDispatch } = usePubSub(
    "file-focused",
    onFileFocused,
  );

  useEffect(() => {
    if (fileParam) {
      fileFocusedDispatch({ path: fileParam, important: false });
    }
  }, [fileParam]);
}

function useFilePathExpandSet() {
  const [expandedSet, setExpandedSet] = useState(() => new Set());

  const expandPathAll = useCallback((path) => {
    const ancestors = path
      .split("/")
      .reduce((paths, _, i, parts) => {
        paths.push(parts.slice(0, i + 1).join("/"));
        return paths;
      }, []);

    setExpandedSet((prev) => {
      const next = new Set(prev);
      ancestors.forEach((p) => next.add(p));
      return next.size === prev.size ? prev : next;
    });
  }, [])

  const togglePathSingle = useCallback((path) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, [])

  return { expandedSet, expandPathAll, togglePathSingle }
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

  const desktopSidebarRef = useRef(null);
  useOpenSidebarOnFileFocus(desktopSidebarRef, setSidebarOpen);

  const filePathExpandSet = useFilePathExpandSet()

  if (filesError)
    return <div className="p-4 text-red-400">Error: {filesError.message}</div>;

  const sideMenuProps = {
    files,
    loading: filesLoading,
    folderName,
    ...filePathExpandSet,
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

  // TODO: The side menu state is reset each time the modal is closed and
  // reopened. This causes expanded tree nodes to collapse, resulting in a less
  // seamless UX. (cause: component gets mounted and unmounted each time due to
  // the dialog. At least it's not because of some bugs in the Sidemenu
  // component, but instead the issue is in how it is used in the
  // parent/caller, so we have decoupled the responsibilities - the Sidemenu
  // component itself works well, it can be verified in desktop). I think
  // this can be fixed by keeping the state alive (lift it up) and lower the
  // dialog, so that the state is kept alive even if the dialog (or its
  // content) gets unmounted.
  return (
    <div className="h-screen flex overflow-hidden bg-gray-950">
      <Dialog.Root open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-dialog-overlay-show data-[state=closed]:animate-dialog-overlay-hide md:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed left-0 top-0 z-50 h-full w-5/6 bg-gray-900 border-r border-gray-800 flex flex-col outline-none data-[state=open]:animate-drawer-show data-[state=closed]:animate-drawer-hide md:hidden"
          >
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Sidemenu
              {...sideMenuProps}
              smoothScroll={false}
              onClose={() => setSidebarOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <aside
        ref={desktopSidebarRef}
        className="hidden md:flex flex-shrink-0 w-64 lg:w-72 xl:w-80 bg-gray-900 border-r border-gray-800 flex-col"
      >
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

        <div className="flex-1 min-h-0">
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
          onItemClick={() => bookmarksModal.close()}
        />
      </Modal>

      <Modal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        title="Search"
        className="h-[70vh] flex flex-col overflow-hidden"
        childrenClass="flex-1 min-h-0"
      >
        <SearchBar onClose={() => setSearchModalOpen(false)} />
      </Modal>

      <SettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}
