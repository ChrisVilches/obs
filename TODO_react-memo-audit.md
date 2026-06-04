# React.memo Audit Report

> Generated 2026-06-04 — target: `frontend/src/`

## Result: No recommendations

No components in this repository are strong candidates for `React.memo`. The two
components where memo *could* provide value — `TreeNode` and `FileItem` — are
blocked by unstable prop references that would cause `React.memo` to reject
every instance on every render, adding comparison overhead with zero skip
benefit.

---

## Collection renderers

| Component | File | Map context | Fan-out |
|-----------|------|-------------|---------|
| `TreeNode` | `components/Sidemenu.jsx:278` | `node.children.map(...)` (recursive) | Hundreds |
| `FileItem` / `FolderItem` | `components/FileList.jsx:172` | `items.map(...)` | Tens–Hundreds |
| tab buttons | `components/SearchBar.jsx:20` | `tabs.map(...)` | 3 (fixed) |
| `SettingRow` | `components/SettingsModal.jsx:67` | `category.settings.map(...)` | 1 |

---

## Why memo won't help the two high-fan-out components

### TreeNode

`expandedSet` (a `Set` instance) is passed to every node. `useFilePathExpandSet`
creates a new `Set` on every toggle:

```js
// useFilePathExpandSet.js:24
setExpandedSet((prev) => {
  const next = new Set(prev);
  // toggle logic
  return next;  // always a new reference
});
```

`selectedNodeRef` is a callback ref whose identity changes on every file-focus
event — and it is passed to all tree nodes.

These two props create global-footprint re-renders: when *any* folder toggles or
*any* file is focused, every `TreeNode` receives new prop references. `React.memo`
would compare-and-reject every node, producing no skips.

### FileItem

`onClick` is an inline arrow created per-item per-render:

```js
// FileList.jsx:181
onClick={onItemClick ? () => onItemClick(item) : undefined}
```

A new function per item per render guarantees prop inequality every time.

---

## What would need to change before memo is viable

### TreeNode — two fixes needed

1. **Stabilize `expandedSet`**: Store expanded paths as a sorted string array
   rather than a `Set`. Arrays with identical content that are created brand-new
   still fail `Object.is`, so the Sidemenu would need to pass the set as a
   stable reference via `useRef` + imperative read, or use a context with
   selector that only triggers re-renders for affected nodes.

   Alternative: move `expandedSet` into a context and have `TreeNode` consume
   only its own path's expanded state via a selector-like pattern, so sibling
   toggle doesn't trigger sibling re-renders.

2. **Stabilize `selectedNodeRef`**: Instead of passing a callback ref through
   all tree nodes, use an effect inside `Sidemenu` that queries the DOM for the
   selected node (via `data-selected` attribute) and scrolls to it imperatively.
   This removes `selectedNodeRef` from the TreeNode prop surface entirely.

### FileItem — one fix needed

1. **Stabilize `onClick`**: Pass a stable `onItemClick(path)` callback and use
   `data-path` on the DOM element instead of closing over `item`:

   ```jsx
   <Link
     data-path={path}
     onClick={onItemClick}
     ...
   >
   ```

   The parent handler extracts `event.currentTarget.dataset.path`. This makes
   `onClick` a stable reference — `React.memo` can then work.

---

## Full component table

| Component | File | Rec | Reason |
|-----------|------|-----|--------|
| TreeNode | Sidemenu.jsx:207 | No | Unstable `expandedSet` / `selectedNodeRef` props, low render cost |
| FileItem | FileList.jsx:84 | No | Unstable inline `onClick`, low render cost |
| FolderItem | FileList.jsx:111 | No | Unstable inline `onClick`, low fan-out |
| SettingRow | SettingsModal.jsx:25 | No | Low frequency, low fan-out (1 setting) |
| ToggleSwitch | SettingsModal.jsx:4 | No | Tiny component |
| FileList | FileList.jsx:137 | No | Low render cost, low fan-out |
| FileIcon | FileList.jsx:62 | No | Too small |
| Sidemenu | Sidemenu.jsx:342 | No | Own state drives re-renders |
| SidemenuHeader | Sidemenu.jsx:99 | No | Single instance, low cost |
| SidemenuFooter | Sidemenu.jsx:77 | No | Single instance, trivial |
| SidemenuSkeleton | Sidemenu.jsx:296 | No | Transient loading state |
| SearchBar | SearchBar.jsx:88 | No | Single instance, self-managed state |
| Results | SearchBar.jsx:9 | No | Single instance |
| SearchInputIcon | SearchBar.jsx:65 | No | Tiny, single instance |
| SettingsModal | SettingsModal.jsx:53 | No | Context-dependent, low frequency |
| Modal | Modal.jsx:4 | No | `children` changes every render |
| Button | Button.jsx:1 | No | Too small, inline onClick |
| FileViewer | FileViewer.jsx:63 | No | `key={file}` forces remount |
| MarkdownSkeleton | FileViewer.jsx:34 | No | No props, transient |
| MarkdownViewer | MarkdownViewer.jsx:24 | No | `key={file}`, context consumer, code-split |
| Code | markdown/Code.jsx:1 | No | Controlled by ReactMarkdown |
| ListComponent | markdown/List.jsx:165 | No | Controlled by ReactMarkdown |
| LiComponent | markdown/List.jsx:249 | No | Controlled by ReactMarkdown |
| TaskListComponent | markdown/List.jsx:126 | No | Context provider |
| TaskLiComponent | markdown/List.jsx:187 | No | Context consumer |
| Table | markdown/Table.jsx:1 | No | Too small |
| ErrorDisplay | ErrorDisplay.jsx:3 | No | Error-only, single instance |
| FileNameDisplay | FileNameDisplay.jsx:36 | No | Single instance |
| BinaryFileViewer | viewers/BinaryFileViewer.jsx:4 | No | Single instance, trivial |
| ImageViewer | viewers/ImageViewer.jsx:1 | No | Single instance, trivial |
| MediaViewer | viewers/MediaViewer.jsx:1 | No | Single instance, trivial |
| TextViewer | viewers/TextViewer.jsx:1 | No | Single instance, trivial |
| Dashboard | pages/Dashboard.jsx:7 | No | Page component |
| FilePage | pages/FilePage.jsx:4 | No | Page component |
| Layout | pages/Layout.jsx:65 | No | Root component |
| NotFound | pages/NotFound.jsx:3 | No | Rarely rendered |
| AppConfigProvider | contexts/AppConfigContext.jsx:30 | No | Context provider |
