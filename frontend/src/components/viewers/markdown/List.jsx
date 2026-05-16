import { CheckIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { createContext, useContext, useState } from "react";
import { useSWRConfig } from "swr";
import { visit } from "unist-util-visit";
import { fetcher } from "../../../utils/fetcher";
import { showErrorToast } from "../../../utils/toast";

export const TasksContext = createContext({ hide: false, setHide: () => {} });
export const InteractiveCheckboxContext = createContext({
  file: null,
  mtime: null,
  loading: false,
  setLoading: () => {},
});

/**
 * In "loose" Markdown lists, item content is wrapped in a `<p>`.
 * Skips leading whitespace-only text nodes (AST artifacts) to find
 * the first meaningful child, returning it if it's a `<p>`.
 */
function ifLooseGetParagraph(node) {
  const child = node.children.find(
    (c) => !(c.type === "text" && c.value.trim() === ""),
  );
  return child?.tagName === "p" ? child : null;
}

function firstChildIfIsCheckbox(node) {
  return node?.children[0]?.properties?.type === "checkbox"
    ? node.children[0]
    : null;
}

// Li elements can have a checkbox if they have a "- [ ]" (or numbered)
// and lists can be loose or tight, so this function gets the checkbox considering both cases.
// tight: checkbox directly in <li>  |  loose: checkbox inside <p> inside <li>
function tryGetLiCheckbox(node) {
  return (
    firstChildIfIsCheckbox(node) ||
    firstChildIfIsCheckbox(ifLooseGetParagraph(node))
  );
}

export function rehypeDebugLists() {
  return (tree) => {
    const output = [];
    function dfs(u, depth) {
      const indent = " ".repeat(depth * 2);
      if (u.type === "text") {
        if (u.value.trim().length) output.push(indent + `"${u.value}"`);
        return;
      }
      const liHasParagraph = u.tagName === "li" && ifLooseGetParagraph(u);
      output.push(
        `${indent}${u.tagName}${liHasParagraph ? " (HAS PARAGRAPH**)" : ""}`,
      );

      for (const v of u.children ?? []) {
        dfs(v, depth + 1);
      }
    }

    for (const child of tree.children) {
      dfs(child, 0);
    }
    console.log(output.join("\n"));
  };
}

/**
 * Rehype plugin that enriches the HAST tree with checklist metadata.
 *
 * Traverses every top-level `<ul>` or `<ol>` element, counting all descendant
 * `<input type="checkbox">` nodes (total + checked). The counts are
 * stored on the list node as `checkboxInfo: { total, complete }`.
 *
 * Nested lists are marked with `hasParentList: true` so `ListComponent`
 * can skip re-rendering them as standalone task lists.
 *
 * Uses a manual DFS instead of a second `visit` pass so that parent-child
 * relationships are preserved for correctly marking nested lists.
 */
export function rehypeListMetadata() {
  const isList = (node) => node.tagName === "ul" || node.tagName === "ol";

  return (tree) => {
    visit(tree, "element", (node) => {
      if (!isList(node)) return;
      if (node.hasParentList) return;

      let total = 0;
      let complete = 0;

      function dfs(u) {
        if (u !== node && isList(u)) {
          u.hasParentList = true;
        }

        if (u.tagName === "input" && u.properties?.type === "checkbox") {
          total++;
          if (u.properties?.checked) complete++;
        }

        for (const child of u.children ?? []) {
          dfs(child);
        }
      }

      dfs(node);

      node.checkboxInfo = {
        total,
        complete,
      };
    });
  };
}

/**
 * Wraps a list with a task-completion progress bar and a show/hide toggle
 * for completed items. The toggle state is scoped via `TasksContext` so
 * that only the `<li>` checkbox items inside this list react to it.
 *
 * Only invoked when `total > 0` (guaranteed by the caller, `ListComponent`).
 */
function TaskListComponent({ Tag, total, complete, children }) {
  const [hide, setHide] = useState(false);
  const pct = total ? Math.round((complete / total) * 100) : 0;

  return (
    <TasksContext.Provider value={{ hide, setHide }}>
      <div className="mb-3 group">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${complete === total ? "bg-emerald-500" : "bg-indigo-500"
                }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500 tabular-nums">
            {complete} / {total}
          </span>
        </div>
        <div className="flex justify-center mt-2">
          <button
            type="button"
            onClick={() => setHide((h) => !h)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
          >
            {hide ? (
              <EyeSlashIcon className="size-3.5" />
            ) : (
              <EyeIcon className="size-3.5" />
            )}
            <span>{hide ? "Show completed" : "Hide completed"}</span>
          </button>
        </div>
      </div>
      <Tag className="pl-5 [&_input[type='checkbox']]:hidden">{children}</Tag>
    </TasksContext.Provider>
  );
}

export function ListComponent({ node, children }) {
  const isNested = Boolean(node.hasParentList);
  const Tag = node.tagName; // "ul" or "ol"

  // `checkboxInfo` is guaranteed to exist on any list element that passes
  // through `rehypeListMetadata` — this component is only used in that pipeline.
  if (!isNested && node.checkboxInfo.total > 0) {
    return (
      <TaskListComponent
        Tag={Tag}
        complete={node.checkboxInfo.complete}
        total={node.checkboxInfo.total}
      >
        {children}
      </TaskListComponent>
    );
  }


  return <Tag className={isNested ? "" : "pl-5"}> {children}</Tag >;
}

function TaskLiComponent({ node, children, checkbox }) {
  const ctx = useContext(TasksContext);
  const { file, mtime, loading, setLoading } = useContext(
    InteractiveCheckboxContext,
  );

  if (!checkbox) throw new Error("checkbox should be defined!");
  const checked = checkbox.properties.checked;

  if (checked && ctx.hide) return null;
  const { mutate } = useSWRConfig();

  const handleClick = async () => {
    setLoading(true);
    try {
      const infoKey = `/api/files/info?file=${encodeURIComponent(file)}`;
      await mutate(
        infoKey,
        fetcher("/api/files/checkbox", {
          method: "PUT",
          body: {
            checked: !checked,
            // Relies on remark's standard position info — every HAST
            // element parsed by remark should carry a `position` block.
            line: node.position?.start?.line,
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
    <li className="list-none relative hover:bg-[#10131E]">
      <div className="flex items-start rounded">
        <button
          type="button"
          disabled={loading}
          onClick={handleClick}
          className={`absolute -left-5 disabled:opacity-50 inline-flex items-center justify-center size-4 rounded border-2 mt-[5px] shrink-0 transition-colors ${checked ? "bg-emerald-600 border-emerald-700" : "border-gray-500"
            }`}
        >
          {checked && (
            <CheckIcon className="size-3 text-white" strokeWidth={3} />
          )}
        </button>
        <span className="[&>*:first-child]:mt-0">{children}</span>
      </div>
    </li>
  );
}

export function LiComponent({ node, children }) {
  const checkbox = tryGetLiCheckbox(node);

  if (checkbox) {
    return (
      <TaskLiComponent checkbox={checkbox} node={node}>
        {children}
      </TaskLiComponent>
    );
  }

  return <li className="[&>*:first-child]:mt-0">{children}</li>;
}
