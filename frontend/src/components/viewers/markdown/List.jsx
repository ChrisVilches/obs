import { CheckIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { createContext, useContext, useState } from "react";
import { useSWRConfig } from "swr";
import { fetcher } from "../../../utils/fetcher";
import { showErrorToast } from "../../../utils/toast";
import { visit } from "unist-util-visit";

export const TasksContext = createContext({ hide: false, setHide: () => { } });
export const InteractiveCheckboxContext = createContext({
  file: null,
  mtime: null,
  loading: false,
  setLoading: () => { },
});

/**
 * Rehype plugin that enriches the HAST tree with checklist metadata.
 *
 * Traverses every top-level `<ul>` element, counting all descendant
 * `<input type="checkbox">` nodes (total + checked). The counts are
 * stored on the `<ul>` node as `checkboxInfo: { total, complete }`.
 *
 * Nested `<ul>` elements are marked with `hasParentList: true` so
 * `ListComponent` can skip re-rendering them as standalone task lists.
 */
export function rehypeListMetadata() {
  const isList = (node) => node.tagName === "ul" || node.tagName === "ol"

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

function TaskListComponent({ Tag, total, complete, children }) {
  const [hide, setHide] = useState(false);
  const pct = total ? Math.round((complete / total) * 100) : 0;

  return (
    <TasksContext.Provider value={{ hide, setHide }}>
      <Tag className="pl-0 [&_input[type='checkbox']]:hidden">
        <div className="mb-3 group">
          <div className="flex items-center gap-3">
            {/* Progress bar: emerald when complete, indigo while in-progress */}
            <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${complete === total
                  ? "bg-emerald-500"
                  : "bg-indigo-500"
                  }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500 tabular-nums">
              {complete} / {total}
            </span>
          </div>
          {/* Show/hide toggle: eye icon flips, label changes */}
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={() => setHide((h) => !h)}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
            >
              {hide ? (
                <EyeIcon className="size-3.5" />
              ) : (
                <EyeSlashIcon className="size-3.5" />
              )}
              <span>{hide ? "Show completed" : "Hide completed"}</span>
            </button>
          </div>
        </div>
        {children}
      </Tag>
    </TasksContext.Provider>
  );
}

export function ListComponent({ node, children }) {
  const isNested = Boolean(node.hasParentList);
  const Tag = node.tagName; // "ul" or "ol"

  // `checkboxInfo` is guaranteed to exist on any <ul> that passes
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

  return <Tag className={!isNested ? "pl-0" : ""}>{children}</Tag>;
}

function TaskLiComponent({ node, children }) {
  const ctx = useContext(TasksContext);
  const { file, mtime, loading, setLoading } = useContext(
    InteractiveCheckboxContext,
  );
  // Makes the same AST shape assumptions as LiComponent (tight vs loose checkbox).
  // TODO: the detection pattern here diverges from LiComponent — this branch
  // blindly reaches into children[1].children[0] without verifying the
  // intermediate node is a <p>, so a non-<p> wrapper between <li> and checkbox
  // (e.g. a <div> injected by a remark plugin) would cause checked to read
  // from an unrelated node rather than falling through to children[0].
  const checked =
    node.children?.[1]?.children?.[0]?.properties?.checked ||
    node.children?.[0]?.properties?.checked;

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
            line: node.position.start.line,
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

  // TODO: why are some "loose" but they don't have a paragraph as first element? analyze
  // (i think it's because of how I changed things.)
  return (
    <li className="list-none flex items-start gap-2 hover:bg-[#10131E] rounded pl-0 py-0.5">
      <div className="flex items-center h-6">
        <button
          type="button"
          disabled={loading}
          onClick={handleClick}
          className={`disabled:opacity-50 inline-flex items-center justify-center size-4 rounded border-2 mt-[5px] shrink-0 transition-colors ${checked ? "bg-emerald-600 border-emerald-700" : "border-gray-500"
            }`}
        >
          {checked && (
            <CheckIcon className="size-3 text-white" strokeWidth={3} />
          )}
        </button>
      </div>
      <span className="[&>*:first-child]:mt-0 w-full">{children}</span>
    </li>
  );
}

export function LiComponent({ node, children }) {
  // tight: checkbox directly in <li>  |  loose: checkbox inside <p> inside <li>
  // TODO: fragile child-index assumptions; prefer find operations.
  const tightCheckbox = node.children[0]?.properties?.type === "checkbox";
  const looseCheckbox =
    node.children.length >= 2 &&
    node.children[1].tagName === "p" &&
    node.children[1].children[0]?.properties?.type === "checkbox";

  if (looseCheckbox || tightCheckbox) {
    return <TaskLiComponent node={node}>{children}</TaskLiComponent>;
  }

  // TODO: ordered lists (<ol>) are rendered with bullet markers instead
  // of numbers — the parent CSS intervention isn't working.
  return (
    <li className="flex items-start gap-3 pl-0">
      <span className="mt-1 h-4 w-4 shrink-0 flex items-center justify-center">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      <span className="[&>*:first-child]:mt-0 w-full">{children}</span>
    </li>
  );
}
