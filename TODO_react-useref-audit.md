# useRef Rules Audit Report

> Generated 2026-06-06 — target: `frontend/src/`

## Rules

1. **Don't mutate `ref.current` if it holds an object used for rendering.**
2. **Don't write or read `ref.current` during rendering**, except for initialization.

---

## Result: 1 violation found

`fetched.current` is read during render in `useBookmarksModal()` (`pages/Layout.jsx:22`).

All other refs across the codebase (6 declared, 4 files) are Rule 1 and Rule 2 compliant.

---

## Findings

| File | Ref | Type | Reads/renders | Writes/renders | Rule 1 | Rule 2 |
|------|-----|------|:---:|:---:|:------:|:------:|
| `Sidemenu.jsx:44` | `canScroll` | `boolean` | 0 | 0 | OK | OK |
| `Layout.jsx:20` | `fetched` | `boolean` | **1** | 0 | OK | **VIOLATION** |
| `Layout.jsx:84` | `desktopSidebarRef` | DOM element | 0 | 0 | OK | OK |
| `FileList.jsx:145` | `listRef` | DOM element | 0 | 0 | OK | OK |
| `FileViewer.jsx:70` | `fileContentRef` | DOM element | 0 | 0 | OK | OK |
| `FileViewer.jsx:71` | `originalContentRef` | `string` | 0 | 0 | OK | OK |

### Rule 1 — clean

All six refs hold either DOM elements or primitives (`boolean` / `string`). None
hold objects that are used for rendering, so there is nothing to improperly
mutate.

### Rule 2 — one violation

#### `fetched` in `useBookmarksModal()` — `Layout.jsx:18–35`

```jsx
function useBookmarksModal() {
  const [isOpen, setIsOpen] = useState(false);
  const fetched = useRef(false);
  const { data, isLoading, mutate } = useSWR(
    (isOpen || fetched.current) && "/api/bookmarks",   // ← read during render
  );
  return {
    open: async () => {
      if (fetched.current) await mutate();
      fetched.current = true;                           // mutation in callback
      setIsOpen(true);
    },
    close: () => setIsOpen(false),
    isOpen,
    bookmarks: data?.items ?? [],
    isLoading,
  };
}
```

**What it does:** Once the bookmarks modal has been opened at least once, the SWR
key stays truthy even after `isOpen` becomes `false` (when the user closes the
modal). This prevents the SWR cache from clearing during the close transition,
avoiding a flash of empty state.

**Why it violates Rule 2:** The expression `(isOpen || fetched.current)` is
evaluated in the hook function body every render cycle — that reads
`ref.current` during rendering. Since ref mutations don't trigger re-renders,
the output of this expression can become desynchronized from the actual value.

**Practical severity — low.** In practice, `fetched.current` is only mutated in
`open()`, which also calls `setIsOpen(true)` (triggering a re-render). The
current code works correctly because the mutation site and the re-render trigger
are co-located. However, the pattern is brittle: a second mutation site or a
refactor that separates the write from the state setter would silently produce
stale reads.

**Fix:** Replace the ref with a state variable, since the value directly affects
what's rendered (the SWR key):

```diff
- const fetched = useRef(false);
+ const [hasFetched, setHasFetched] = useState(false);
  const { data, isLoading, mutate } = useSWR(
-   (isOpen || fetched.current) && "/api/bookmarks",
+   (isOpen || hasFetched) && "/api/bookmarks",
  );
  return {
    open: async () => {
-     if (fetched.current) await mutate();
-     fetched.current = true;
+     if (hasFetched) await mutate();
+     setHasFetched(true);
      setIsOpen(true);
    },
```

---

## Detailed ref-by-ref trace

### `canScroll` — `Sidemenu.jsx:44` (in `useExpandTreeToFile`)

| Line | Operation | Phase |
|------|-----------|-------|
| 51 | `canScroll.current = true` | callback (`onFileFocused`) |
| 67 | `!canScroll.current` | callback ref (`selectedNodeRef`) |
| 69 | `canScroll.current = false` | callback ref (`selectedNodeRef`) |

All accesses happen in callbacks/ref callbacks — not during render. Clean.

### `desktopSidebarRef` — `Layout.jsx:84`

The single `.current` read happens in the `isMobile()` helper, which is only
called from the `onFileFocused` callback inside `useOpenSidebarOnFileFocus`
(line 51). DOM ref reads in event handlers are standard and safe. Clean.

### `listRef` — `FileList.jsx:145`

Reads `listRef.current.children[selectedIndex]` inside a `useEffect` that
responds to `selectedIndex` changes (lines 147–153). DOM reads in effects are
standard and safe. Clean.

### `fileContentRef` — `FileViewer.jsx:70`

| Line | Operation | Phase |
|------|-----------|-------|
| 79 | `!fileContentRef.current` | `useEffect` |
| 81 | `.value = info.content` | `useEffect` |
| 84 | `.focus()` | `useEffect` |
| 85 | `.setSelectionRange(0, 0)` | `useEffect` |
| 86 | `.scrollTop = 0` | `useEffect` |
| 99 | `.value` (read, for FormData) | callback (`saveFile`) |
| 133 | `!fileContentRef.current` | callback (`isDirty`) |
| 134 | `.value` (read, dirty check) | callback (`isDirty`) |

`isDirty` is passed to `useEditBlocker` → `useBlocker`, which invokes it during
navigation events (not render), and in `beforeunload` handlers. Clean.

### `originalContentRef` — `FileViewer.jsx:71`

| Line | Operation | Phase |
|------|-----------|-------|
| 80 | `.current = info.content` | `useEffect` |
| 134 | `.current` (read, dirty check) | callback (`isDirty`) |

Clean.
