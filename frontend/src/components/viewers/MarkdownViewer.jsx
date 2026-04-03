import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { useSWRConfig } from "swr";
import { fetcher } from "../../utils/fetcher";
import { showErrorToast } from "../../utils/toast";
import "katex/dist/katex.min.css";
import { CheckIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

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

  const { isLoose, firstP, task, checked } = listNodeInfo(node);

  if (!task) {
    return <li className="list-inside">{children}</li>;
  }

  // TODO: very annoying code. Simplify somehow.
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
        className={`disabled:opacity-50 inline-flex items-center justify-center size-4 rounded border-2 mt-[5px] shrink-0 transition-colors ${
          checked ? "bg-emerald-600 border-emerald-700" : "border-gray-500"
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

// TODO: removing the left padding will render nested lists badly
function listComponent(ul) {
  return ({ node, children }) => {
    const infos = node.children
      .filter((x) => x.type === "element")
      .map(listNodeInfo);
    const tasks = infos.filter((i) => i.task);
    const completed = infos.filter((i) => i.checked).length;
    const total = tasks.length;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    return (
      <>
        {total > 0 && (
          <div className="mb-3 group">
            <div className="flex items-center gap-3">
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
          </div>
        )}
        {ul ? (
          <ul className="">{children}</ul>
        ) : (
          <ol className="">{children}</ol>
        )}
      </>
    );
  };
}

// If you don't put them here, a glitch will prevent
// the progress bar from changing smoothly.
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
          ul,
          // TODO: test with ol (needs to fix server)
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
