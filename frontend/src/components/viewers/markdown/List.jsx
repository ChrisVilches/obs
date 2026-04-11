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
//     - li falls back to a plain <li>.  Checkboxes render as text
//       ("[x]" or "[ ]") instead of native <input> elements so the list
//       stays consistent in non-task-list contexts.
//       They are not interactive — they won't toggle via the API.
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

import { CheckIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { createContext, useContext, useState } from "react";
import { useSWRConfig } from "swr";
import { fetcher } from "../../../utils/fetcher";
import { showErrorToast } from "../../../utils/toast";

export const ListContext = createContext({
  isTaskList: false,
  hideDone: false,
  listDepth: 0,
  line: null,
});

export const InputContext = createContext({
  file: null,
  mtime: null,
  loading: false,
  setLoading: () => {},
});

/** Returns {task, checked} from a li HAST node by inspecting its first meaningful child. */
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

/**
 * Custom li renderer registered with react-markdown.
 * - Task list: renders a styled li with ListContext (line number) for the checkbox.
 * - Non-task list: renders a plain <li>, hiding nothing.
 * - When hideDone is active and the item is checked, returns null.
 */
function LiComponent({ node, children }) {
  const ctx = useContext(ListContext);
  const { checked } = getCheckboxInfo(node);

  if (ctx.hideDone && checked) {
    return null;
  }

  if (ctx.isTaskList) {
    return (
      <ListContext.Provider value={{ ...ctx, line: node.position.start.line }}>
        <li className="list-none flex items-start gap-2 hover:bg-white/5 rounded pl-0 py-0.5">
          {children}
        </li>
      </ListContext.Provider>
    );
  }

  return <li>{children}</li>;
}

/**
 * Custom ul/ol renderer registered with react-markdown.
 * Inspects child li HAST nodes to decide if the list qualifies as a task list
 * (flat, tight, all-checkbox, top-level). If so, renders a progress bar and
 * show/hide toggle above the list. Passes the decision down via ListContext.
 */
function ListComponent({ node, children }) {
  const ctx = useContext(ListContext);

  const liNodes = node.children.filter(
    (x) => x.type === "element" && x.tagName === "li",
  );

  const hasNestedChildren = liNodes.some((li) =>
    li.children.some(
      (child) =>
        child.type === "element" &&
        (child.tagName === "ul" || child.tagName === "ol"),
    ),
  );

  const hasLoose = liNodes.some((li) =>
    li.children.some(
      (child) => child.type === "element" && child.tagName === "p",
    ),
  );

  const infos = liNodes.map(getCheckboxInfo);
  const areAllTasks = infos.every((i) => i.task);
  const isTaskList =
    !hasNestedChildren &&
    ctx.listDepth === 0 &&
    !hasLoose &&
    areAllTasks &&
    infos.length > 0;

  const completed = infos.filter((i) => i.checked).length;
  const total = infos.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const [hideDone, setHideDone] = useState(false);

  const Tag = node.tagName; // "ul" or "ol"

  return (
    <ListContext.Provider
      value={{ isTaskList, hideDone, listDepth: ctx.listDepth + 1, line: null }}
    >
      {isTaskList && (
        <div className="mb-3 group">
          <div className="flex items-center gap-3">
            {/* Progress bar: emerald when complete, indigo while in-progress */}
            <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                  completed === total ? "bg-emerald-500" : "bg-indigo-500"
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
              type="button"
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

/**
 * Custom input renderer registered with react-markdown (handles <input type="checkbox">).
 * - Task-list checkbox: clickable button that toggles via PUT /api/files/checkbox and
 *   mutates the info SWR cache with the updated file data.
 * - Non-task-list checkbox: renders "[x]" or "[ ]" as plain text.
 * - Other input types: falls through to a plain <input> with the original type.
 */
function Input({ type, checked }) {
  const { file, mtime, loading, setLoading } = useContext(InputContext);
  const { isTaskList, line } = useContext(ListContext);
  const { mutate } = useSWRConfig();

  const interactiveCheckbox = isTaskList && type === "checkbox";
  const nonInteractiveCheckbox = !interactiveCheckbox && type === "checkbox";

  if (interactiveCheckbox) {
    const handleClick = async () => {
      const infoKey = `/api/files/info?file=${encodeURIComponent(file)}`;
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
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className={`disabled:opacity-50 inline-flex items-center justify-center size-4 rounded border-2 mt-[5px] shrink-0 transition-colors ${
          checked ? "bg-emerald-600 border-emerald-700" : "border-gray-500"
        }`}
      >
        {checked && <CheckIcon className="size-3 text-white" strokeWidth={3} />}
      </button>
    );
  }

  if (nonInteractiveCheckbox) {
    // NOTE: We are assuming that the content was [ ] or [x], but actually we don't know
    // the original text. We COULD get the original content from the file content.
    return `[${checked ? "x" : " "}]`;
  }

  return <input type={type} />;
}

export { Input, LiComponent, ListComponent };
