//
// TASK LIST RENDERING
//   Two-pass approach: the ul/ol component (listComponent) inspects the HAST
//   node to decide whether the list qualifies as a "task list", then passes
//   the decision down to each li via React context (TaskListContext).
//
//   A list only becomes a task list when ALL of these hold:
//     1. Flat — no nested ul/ol inside any li (detecting nesting is simple:
//        walk each li's children looking for element nodes with tagName ul/ol).
//     2. Tight — no <p> wrapper around item content (loose lists).  Loose
//        lists would complicate checkbox removal and hide-done filtering.
//     3. Every li starts with a checkbox (<input type=checkbox>).  No mixing
//        of checked and plain items — mixed lists render as plain lists.
//
//   When the list IS a task list:
//     - Progress bar + show/hide completed toggle appear above the list.
//     - Each li renders a custom checkbox button that toggles via API.
//     - pl-0 removes the left padding (no nesting needed, use full width).
//     - hideDone state lives in listComponent; each li checks it and returns
//       null when its item is checked and hiding is active.
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
//   Potential issues:
//     - listNodeInfo skips whitespace text nodes to find the checkbox, but
//       unusual whitespace patterns in the HAST output could still hide it.
//     - The HAST tree shape depends on remark-gfm's output; a version bump
//       could change node structure and break checkbox detection or nesting
//       detection.
//     - If the same li node appears inside two different context providers
//       (shouldn't happen with react-markdown's single-pass rendering), the
//       innermost provider's value wins.

import { createContext, useContext, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { useSWRConfig } from "swr";
import { fetcher } from "../../utils/fetcher";
import { showErrorToast } from "../../utils/toast";
import "katex/dist/katex.min.css";
import { CheckIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const TaskListContext = createContext({ isTaskList: false, hideDone: false });

function isExternalURL(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function MarkdownImage({ node, src, alt, file, ...props }) {
  const newSrc = isExternalURL(src)
    ? src
    : `api/files/raw?file=${src}&current=${file}`;

  // TODO: This semantic HTML is wrong. The image becomes a child of a <p>,
  // and I can't use figure and figcaption. Using span is wrong.
  return (
    <span className="flex flex-col items-center my-4">
      <img
        {...props}
        src={newSrc}
        alt={alt || ""}
        className="rounded-lg shadow-md"
      />
    </span>
  );
}

// Examines a single li HAST node and answers three questions:
//   isLoose — does the li contain a <p> wrapper? (loose list, items are separated)
//   task    — does the first meaningful child have type=checkbox?
//   checked — if task, is the checkbox checked?
// Skips whitespace text nodes when looking for the checkbox so that leading
// whitespace in the markdown source doesn't hide it.
function listNodeInfo(node) {
  const firstP = node.children.findIndex((e) => e.tagName === "p");
  const isLoose = firstP !== -1;

  const children = isLoose ? node.children[firstP].children : node.children;

  const firstMeaningfulNode = children.find((child) => {
    // Skip whitespace text nodes
    if (child.type === "text") {
      return child.value.trim() !== "";
    }

    return true;
  });

  const startsWithCheckbox =
    firstMeaningfulNode?.properties?.type === "checkbox";

  const checked = startsWithCheckbox && firstMeaningfulNode.properties.checked;

  return {
    isLoose,
    task: startsWithCheckbox,
    checked,
    firstP,
  };
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

  const { isLoose, firstP, task, checked } = listNodeInfo(node);

  // Defensive: even though the parent determined this is a task list
  // (areAllTasks), bail out if this particular li has no checkbox.
  if (!task) {
    return <li className="list-inside">{children}</li>;
  }

  // Hide-done: the parent listComponent owns the hideDone state and puts it
  // in context.  We return null so the item disappears from the DOM without
  // affecting the progress bar (which still counts all tasks).
  if (hideDone && checked) {
    return null;
  }

  // The HAST tree already includes the <input type=checkbox> as a rendered
  // child, but we render our own custom checkbox button.  We need to strip
  // the original checkbox from the children so it doesn't appear twice.
  // Loose lists: the checkbox is inside a <p> wrapper, so we clone the <p>
  // element and slice off its first child.
  // Tight lists: the checkbox is the first child of the li, splice it out.
  function removeLooseCheckbox(originalChildren) {
    const cpy = [...originalChildren];
    cpy[firstP] = { ...originalChildren[firstP] };
    cpy[firstP].props = { ...originalChildren[firstP].props };
    cpy[firstP].props.children =
      originalChildren[firstP].props.children.slice(1);
    return cpy;
  }

  function removeTightCheckbox(originalChildren) {
    return originalChildren.slice(1);
  }

  const copy = isLoose
    ? removeLooseCheckbox(children)
    : removeTightCheckbox(children);
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

function tableComponent({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">{children}</table>
    </div>
  );
}

function listComponent(ul) {
  return ({ node, children }) => {
    const liNodes = node.children.filter(
      (x) => x.type === "element" && x.tagName === "li"
    );

    // Nesting detection: walk each li's children looking for nested ul/ol.
    // A nested sublist means this list can't be a flat task list — progress
    // bars and show/hide would be ambiguous (which sublist do they apply to?).
    const hasNesting = liNodes.some((li) =>
      li.children.some(
        (child) =>
          child.type === "element" &&
          (child.tagName === "ul" || child.tagName === "ol")
      )
    );

    const infos = liNodes.map(listNodeInfo);
    const areAllTasks = infos.every((i) => i.task);
    const isAnyLoose = infos.some((i) => i.isLoose);
    const isTaskList =
      !hasNesting && !isAnyLoose && areAllTasks && infos.length > 0;

    const tasks = infos.filter((i) => i.task);
    const completed = infos.filter((i) => i.checked).length;
    const total = tasks.length;
    const pct = total ? Math.round((completed / total) * 100) : 0;
    const [hideDone, setHideDone] = useState(false);

    const Tag = ul ? "ul" : "ol";

    return (
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
    );
  };
}

// ul/ol must be declared at module level, not inline in the components map.
// The components map is an object literal recreated on every render of
// MarkdownViewer.  If listComponent(true) were called there, it would
// return a new function reference on each render — React would treat it as
// a different component type, unmounting and remounting the entire list
// tree.  That discards the useState for hideDone and kills the progress
// bar's CSS transition.
const ul = listComponent(true);
const ol = listComponent(false);

export default function MarkdownViewer({ file, content, mtime }) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-6 prose prose-invert max-w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img(props) {
            return <MarkdownImage {...props} file={file} />;
          },
          // TODO: Loose lists are rendered very poorly.
          ul,
          ol,
          table: tableComponent,
          li(props) {
            return (
              <CheckboxListItem
                {...props}
                file={file}
                mtime={mtime}
                loading={loading}
                setLoading={setLoading}
              />
            );
          },
          code({ children, node }) {
            const { start, end } = node.position;
            if (start.line === end.line) {
              return (
                <code className="bg-[#2d2d2d] before:content-none after:content-none text-[#ffb454] font-mono text-[0.9em] px-1.5 py-0.5 rounded">
                  {children}
                </code>
              );
            }
            return <code>{children}</code>;
          },
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
