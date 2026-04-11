import { CheckIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { createContext, useContext, useState } from "react";
import { useSWRConfig } from "swr";
import { fetcher } from "../../../utils/fetcher";
import { showErrorToast } from "../../../utils/toast";

export const TasksContext = createContext({ hide: false, setHide: () => {} });
export const InteractiveCheckboxContext = createContext({
  file: null,
  mtime: null,
  loading: false,
  setLoading: () => {},
});

function TaskListComponent({ Tag, countTotal, countCompleted, children }) {
  const [hide, setHide] = useState(false);
  const pct = countTotal ? Math.round((countCompleted / countTotal) * 100) : 0;

  return (
    <TasksContext.Provider value={{ hide, setHide }}>
      <Tag className="pl-0">
        <div className="mb-3 group">
          <div className="flex items-center gap-3">
            {/* Progress bar: emerald when complete, indigo while in-progress */}
            <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                  countCompleted === countTotal
                    ? "bg-emerald-500"
                    : "bg-indigo-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500 tabular-nums">
              {countCompleted} / {countTotal}
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

// TODO: gets executed a bit too often, but there's no performance impact for small lists of course.
function markNodes(node) {
  if (node.hasParentList) {
    return { countTotal: 0 };
  }

  let countTotal = 0;
  let countCompleted = 0;

  const dfs = (u) => {
    if (u !== node) {
      u.hasParentList = true;
    }

    if (u.properties?.type === "checkbox") {
      countTotal++;
      if (u.properties?.checked) countCompleted++;
    }

    if (!u.children) return;
    for (const v of u.children) {
      dfs(v);
    }
  };

  dfs(node);
  return { countTotal, countCompleted };
}

export function ListComponent({ node, children }) {
  const isNested = Boolean(node.hasParentList);
  const { countTotal, countCompleted } = markNodes(node);
  const Tag = node.tagName; // "ul" or "ol"

  if (!isNested && countTotal > 0) {
    return (
      <TaskListComponent
        Tag={Tag}
        countCompleted={countCompleted}
        countTotal={countTotal}
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

  return (
    <li className="list-none flex items-start gap-2 hover:bg-[#050505] rounded pl-0 py-0.5 hide-checkbox">
      <div className="flex items-center h-6">
        <button
          type="button"
          disabled={loading}
          onClick={handleClick}
          className={`disabled:opacity-50 inline-flex items-center justify-center size-4 rounded border-2 mt-[5px] shrink-0 transition-colors ${
            checked ? "bg-emerald-600 border-emerald-700" : "border-gray-500"
          }`}
        >
          {checked && (
            <CheckIcon className="size-3 text-white" strokeWidth={3} />
          )}
        </button>
      </div>
      <span className="[&>*:first-child]:mt-0">{children}</span>
    </li>
  );
}

export function LiComponent({ node, children }) {
  // TODO: These dig operations are a bit loose. We can't be so sure about the positions 0, 1, 2, etc.
  // Can be fixed by using find operations.
  const tightCheckbox = node.children[0]?.properties?.type === "checkbox";
  const looseCheckbox =
    node.children.length >= 2 &&
    node.children[1].tagName === "p" &&
    node.children[1].children[0]?.properties?.type === "checkbox";

  if (looseCheckbox || tightCheckbox) {
    // TODO: fix the hover color. We can't use opacity because the elements are nested and the colors stack up,
    // getting progressively less transparent.
    return <TaskLiComponent node={node}>{children}</TaskLiComponent>;
  }

  // TODO: numbered lists are displayed with bullets lmfao
  return (
    <li className="flex items-start gap-3 pl-0">
      <span className="mt-1 h-4 w-4 shrink-0 flex items-center justify-center">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      <span className="[&>*:first-child]:mt-0">{children}</span>
    </li>
  );
}
