// TASK LIST RENDERING
//   Two-pass approach: the ul/ol component (ListComponent) inspects the HAST
//   node to decide whether the list qualifies as a "task list", then passes
//   the decision down to each li via React context (TaskListContext).
//
//   A list only becomes a task list when ALL of these hold:
//     1. Flat — no nested ul/ol inside any li (hasNestedChildren), AND not
//        nested inside another list (isNestedList via ListDepthContext).
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

import { createContext, useContext, useState } from "react";
import { useSWRConfig } from "swr";
import { fetcher } from "../../../utils/fetcher";
import { showErrorToast } from "../../../utils/toast";
import { CheckIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const TaskListContext = createContext({ isTaskList: false, hideDone: false });
const ListDepthContext = createContext(0);

// Checks whether an li node starts with a checkbox.
// Skips whitespace text nodes.  Since only tight flat lists can become task
// lists, we don't need to handle loose (<p> wrapper) here — loose lists are
// rejected upstream by hasLoose in ListComponent.
// Returns { task, checked }.
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

function CheckboxListItem({
  node,
  children,
  file,
  mtime,
  loading,
  setLoading,
}) {
  const { mutate } = useSWRConfig();
  const infoKey = `/api/files/info?file=${encodeURIComponent(file)}`;

  const { isTaskList, hideDone } = useContext(TaskListContext);

  // Not a task list: render as plain <li>.  Even if this item happens to
  // have a checkbox in the markdown, the parent list didn't qualify
  // (nesting / loose / mixed) so we skip checkbox rendering entirely.
  if (!isTaskList) {
    return <li className="list-inside">{children}</li>;
  }

  const { checked } = getCheckboxInfo(node);

  // Hide-done: the parent ListComponent owns the hideDone state and puts it
  // in context.  We return null so the item disappears from the DOM without
  // affecting the progress bar (which still counts all tasks).
  if (hideDone && checked) {
    return null;
  }

  // Strip the original <input type=checkbox> from children.  In a tight
  // list the checkbox is always the first child, so slice(1) is enough.
  const copy = children.slice(1);
  const line = node.position.start.line;

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
        { revalidate: false },
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

  return (
    <li className="list-none flex items-start gap-2 hover:bg-white/5 rounded pl-0 py-0.5">
      <button
        disabled={loading}
        onClick={handleClick}
        className={`disabled:opacity-50 inline-flex items-center justify-center size-4 rounded border-2 mt-[5px] shrink-0 transition-colors ${checked ? "bg-emerald-600 border-emerald-700" : "border-gray-500"
          }`}
      >
        {checked && <CheckIcon className="size-3 text-white" strokeWidth={3} />}
      </button>
      <span className="flex-1">{copy}</span>
    </li>
  );
}

function ListComponent({ node, children }) {
  const listDepth = useContext(ListDepthContext);
  const isNestedList = listDepth > 0;

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

  const infos = liNodes.map(getCheckboxInfo);
  const areAllTasks = infos.every((i) => i.task);
  const isTaskList =
    !hasNestedChildren && !isNestedList && !hasLoose && areAllTasks && infos.length > 0;

  const tasks = infos.filter((i) => i.task);
  const completed = infos.filter((i) => i.checked).length;
  const total = tasks.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const [hideDone, setHideDone] = useState(false);

  const Tag = node.tagName; // "ul" or "ol"

  return (
    <ListDepthContext.Provider value={listDepth + 1}>
      <TaskListContext.Provider value={{ isTaskList, hideDone }}>
        {isTaskList && total > 0 && (
        <div className="mb-3 group">
          <div className="flex items-center gap-3">
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
      </TaskListContext.Provider>
    </ListDepthContext.Provider>
  );
}

// ul/ol must be declared at module level, not inline in the components map.
// React treats each function reference as a distinct component type; inline
// definitions would re-create on every render, discarding useState state.
// Both share the same ListComponent — it reads node.tagName to pick the tag.
const ul = ListComponent;
const ol = ListComponent;

export { ul, ol, CheckboxListItem };
