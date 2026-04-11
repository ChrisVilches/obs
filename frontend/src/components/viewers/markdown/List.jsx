// TASK LIST RENDERING
//   Two-pass approach: the ul/ol component (ListComponent) inspects the HAST
//   node to decide whether the list qualifies as a "task list", then passes
//   the decision down to each li via React context (ListContext).
//
//   A list only becomes a task list when ALL of these hold:
//     1. Flat — no nested ul/ol inside any li (hasNestedChildren), AND not
//        nested inside another list (listDepth > 0 via ListContext).
//     2. Tight — no <p> wrapper around item content (hasLoose).  Loose
//        lists would complicate checkbox removal and hide-done filtering.
//     3. Every li starts with a checkbox (<input type=checkbox>).  No mixing
//        of checked and plain items — mixed lists render as plain lists.
//
//   When the list IS a task list:
//     - Progress bar + show/hide completed toggle appear above the list.
//     - Each li renders a custom checkbox button that toggles via API.
//     - pl-0 removes the left padding (no nesting needed, use full width).
//     - hideDone state lives in ListComponent; each li checks it via context
//       and returns null when its item is checked and hiding is active.
//     - Progress bar always counts all tasks, not just visible ones.
//
//   When the list is NOT a task list (nested, loose, mixed, or no checkboxes):
//     - ul/ol renders normally with default prose padding (indenting for
//       nested lists).
//     - li falls back to a plain <li>.  Checkboxes are still rendered
//       (they exist in the HAST tree and appear as native <input> elements),
//       but they are not interactive — they won't toggle via the API.
//       This is a known limitation.
//
//   Why context: react-markdown registers ul/ol and li as separate custom
//   components.  There is no direct way for a list to tell its children how
//   to render — the parent-child relationship exists in the HAST tree but
//   not in the React component tree.  Wrapping children in a Provider is the
//   simplest way to communicate the decision.
//
//   Contexts (merged into ListContext to avoid a separate depth context):
//     - isTaskList  Whether this list qualifies as an interactive task list.
//     - hideDone    User toggle; when true, completed items render as null.
//     - listDepth   Nesting depth (0 = top-level list, 1+ = nested).
//                   Nested lists are never task lists.
//     - line        The source line number of the li's checkbox (set per li).
//                   Used by Input to tell the backend which line to toggle.
//
//   InputContext carries file-level metadata that the checkbox toggle handler
//   needs (file path, mtime for version-conflict detection, loading flag).
//   This avoids threading those props through every intermediate component
//   in the ReactMarkdown custom-components tree.

import { createContext, useContext, useState } from "react";
import { useSWRConfig } from "swr";
import { fetcher } from "../../../utils/fetcher";
import { showErrorToast } from "../../../utils/toast";
import { CheckIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

// Single context for all list-related state (merged from former
// TaskListContext + ListDepthContext).  LiComponent enriches it with
// per-item line number so Input can find the right line to toggle.
export const ListContext = createContext({
  isTaskList: false,
  hideDone: false,
  listDepth: 0,
  line: null,
});

// Carries file-level data needed by the checkbox toggle handler.
// Provided by MarkdownViewer; consumed only by Input in this file.
export const InputContext = createContext({
  file: null,
  mtime: null,
  loading: false,
  setLoading: () => { },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Checks whether an li HAST node starts with a checkbox.  Skips whitespace
// text nodes.  Since only tight flat lists can become task lists, we don't
// need to handle loose (<p> wrapper) here — loose lists are rejected
// upstream by hasLoose in ListComponent.
// Returns { task: boolean, checked: boolean }.
function getCheckboxInfo(liNode) {
  const first = liNode.children.find((child) => {
    if (child.type === "text") {
      return child.value.trim() !== "";
    }
    return true;
  });

  const task = first?.properties?.type === "checkbox";
  const checked = task && first.properties.checked;

  return { task, checked };
}

// ---------------------------------------------------------------------------
// LiComponent — renders individual list items
// ---------------------------------------------------------------------------

// When inside a task list: renders a custom-styled li with no bullet, flex
// layout for the checkbox + content, and provides the line number to children
// via ListContext (replaces the former HAST node mutation approach).
//
// When NOT in a task list: renders a plain <li> letting prose styles handle
// the bullet indentation.
//
// hideDone + checked === true → returns null to hide completed items.
function LiComponent({ node, children }) {
  const ctx = useContext(ListContext);
  const { checked } = getCheckboxInfo(node);

  if (ctx.hideDone && checked) {
    return null;
  }

  if (ctx.isTaskList) {
    return (
      // Enrich the context with this li's source line number so Input can
      // identify which checkbox line to toggle in the backend.
      <ListContext.Provider value={{ ...ctx, line: node.position.start.line }}>
        <li className="list-none flex items-start gap-2 hover:bg-white/5 rounded pl-0 py-0.5">
          {children}
        </li>
      </ListContext.Provider>
    );
  }

  return <li>{children}</li>;
}

// ---------------------------------------------------------------------------
// ListComponent — decides whether a ul/ol is a task list
// ---------------------------------------------------------------------------

// Inspects the HAST node to answer:
//   - Are we nested?               (listDepth > 0 → parent is also a list)
//   - Does any li contain a ul/ol? (hasNestedChildren → not flat)
//   - Does any li wrap content in  (hasLoose → not tight)
//     a <p>?
//   - Does every li start with a   (areAllTasks → all-or-nothing)
//     checkbox?
//
// If all checks pass, the list becomes a task list with a progress bar,
// hide-done toggle, and interactive checkboxes.
function ListComponent({ node, children }) {
  const ctx = useContext(ListContext);

  // Filter to actual <li> elements (ignore whitespace/comment nodes).
  const liNodes = node.children.filter(
    (x) => x.type === "element" && x.tagName === "li"
  );

  // Nesting detection: walk each li's children looking for nested ul/ol.
  // A nested sublist means this list can't be a flat task list — progress
  // bars and show/hide would be ambiguous (which sublist do they apply to?).
  const hasNestedChildren = liNodes.some((li) =>
    li.children.some(
      (child) =>
        child.type === "element" &&
        (child.tagName === "ul" || child.tagName === "ol")
    )
  );

  // Loose detection: if any li wraps its content in a <p>, the list is
  // loose and can't be a task list.  Only tight lists get checkbox widgets.
  const hasLoose = liNodes.some((li) =>
    li.children.some(
      (child) => child.type === "element" && child.tagName === "p"
    )
  );

  // Checkbox presence: all-or-nothing.  Mixed lists (some checkboxes, some
  // plain items) render as plain lists — no interactivity.
  const infos = liNodes.map(getCheckboxInfo);
  const areAllTasks = infos.every((i) => i.task);
  const isTaskList =
    !hasNestedChildren && ctx.listDepth === 0 && !hasLoose && areAllTasks && infos.length > 0;

  // Progress bar stats (always count all tasks, even when hideDone hides some).
  const tasks = infos.filter((i) => i.task);
  const completed = infos.filter((i) => i.checked).length;
  const total = tasks.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const [hideDone, setHideDone] = useState(false);

  const Tag = node.tagName; // "ul" or "ol"

  return (
    <ListContext.Provider
      value={{ isTaskList, hideDone, listDepth: ctx.listDepth + 1, line: null }}
    >
      {isTaskList && total > 0 && (
        <div className="mb-3 group">
          <div className="flex items-center gap-3">
            {/* Progress bar: emerald when complete, indigo while in-progress */}
            <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${completed === total ? "bg-emerald-500" : "bg-indigo-500"
                  }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500 tabular-nums">
              {completed}/{total}
            </span>
          </div>
          {/* Show/hide toggle: eye icon flips, label changes */}
          <div className="flex justify-center mt-2">
            <button
              onClick={() => setHideDone((h) => !h)}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
            >
              {hideDone ? (
                <EyeIcon className="size-3.5" />
              ) : (
                <EyeSlashIcon className="size-3.5" />
              )}
              <span>{hideDone ? "Show completed" : "Hide completed"}</span>
            </button>
          </div>
        </div>
      )}
      <Tag className={isTaskList ? "pl-0" : ""}>{children}</Tag>
    </ListContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Input — renders checkbox nodes from the markdown AST
// ---------------------------------------------------------------------------

// Three rendering modes based on context and node type:
//   1. interactiveCheckbox: inside a task list + type=checkbox → custom styled
//      <button> that toggles via the /api/files/checkbox endpoint.
//   2. nonInteractiveCheckbox: not in a task list but type=checkbox → plain
//      text "[ ] " marker (no interactivity — known limitation).
//   3. fallback: any other <input> type (e.g. non-checkbox inputs in raw HTML)
//      → standard <input> element.
//
// File-level data (file, mtime, loading, setLoading) comes from InputContext
// provided by MarkdownViewer.  The line number comes from ListContext set by
// LiComponent.  This avoids both prop-drilling and HAST node mutation.
function Input({ node, type, checked }) {
  const { file, mtime, loading, setLoading } = useContext(InputContext);
  const { isTaskList, line } = useContext(ListContext);
  const { mutate } = useSWRConfig();

  const interactiveCheckbox = isTaskList && type === "checkbox";
  const nonInteractiveCheckbox = !interactiveCheckbox && type === "checkbox";

  // Cache key for the /api/files/info SWR entry (used for version-conflict
  // detection on the next file read).
  const infoKey = `/api/files/info?file=${encodeURIComponent(file)}`;

  const handleClick = async () => {
    setLoading(true);
    try {
      await mutate(
        infoKey,
        fetcher("/api/files/checkbox", {
          method: "PUT",
          body: {
            checked: !checked,
            line,
            mtime,
            file,
          },
        }),
        { revalidate: false }
      );
    } catch (e) {
      if (e.code === "VERSION_CONFLICT") {
        showErrorToast("There was a version conflict");
      } else {
        showErrorToast(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (interactiveCheckbox) {
    return (
      <button
        disabled={loading}
        onClick={handleClick}
        className={`disabled:opacity-50 inline-flex items-center justify-center size-4 rounded border-2 mt-[5px] shrink-0 transition-colors ${checked ? "bg-emerald-600 border-emerald-700" : "border-gray-500"
          }`}
      >
        {checked && (
          <CheckIcon className="size-3 text-white" strokeWidth={3} />
        )}
      </button>
    );
  }

  if (nonInteractiveCheckbox) {
    return "[ ] ";
  }

  return <input />;
}

export { ListComponent, LiComponent, Input };
