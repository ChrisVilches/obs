import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { fetcher } from "../../utils/fetcher";
import { showErrorToast } from "../../utils/toast";
import { useSWRConfig } from "swr";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { CheckIcon } from "@heroicons/react/24/outline";

function isExternalURL(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function MarkdownImage({ node, src, alt, file, ...props }) {
  const newSrc = isExternalURL(src)
    ? src
    : `api/files/raw?file=${src}&current=${file}`;

  return (
    <img
      {...props}
      src={newSrc}
      alt={alt || ""}
      className="rounded-lg shadow-md my-4"
    />
  );
}

function CheckboxListItem({ node, children, file, mtime, loading, setLoading }) {
  const { mutate } = useSWRConfig();
  const infoKey = `/api/files/info?file=${encodeURIComponent(file)}`;

  if (!node.children.length || node.children[0]?.properties?.type !== "checkbox") {
    return <li className="list-inside">{children}</li>;
  }

  const copy = children.slice(1);
  const line = node.position.start.line;
  const checked = node.children[0].properties.checked;

  const handleClick = async () => {
    setLoading(true)
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
      showErrorToast("There was a version conflict");
    } finally {
      setLoading(false)
    }
  };

  return (
    <li className="list-none flex items-start gap-2 hover:bg-white/5 rounded pl-0 py-0.5">
      <button
        disabled={loading}
        onClick={handleClick}
        className={`disabled:opacity-50 inline-flex items-center justify-center size-4 rounded border-2 mt-[5px] shrink-0 transition-colors ${checked
          ? "bg-emerald-600 border-emerald-700"
          : "border-gray-500"
          }`}
      >
        {checked && <CheckIcon className="size-3 text-white" strokeWidth={3} />}
      </button>
      <span className="flex-1">{copy}</span>
    </li>
  );
}

export default function MarkdownViewer({ file, content, mtime }) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="p-6 prose prose-invert max-w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img(props) {
            return <MarkdownImage {...props} file={file} />;
          },
          ul({ children }) {
            const tasks = children.map(c => c.props).filter(x => x && x.className === 'task-list-item')
            const completed = tasks.map(t => t.node.children[0].properties.checked).filter(Boolean).length
            const total = tasks.length
            const pct = total ? Math.round((completed / total) * 100) : 0

            return (
              <>
                {total > 0 && (
                  <div className="flex items-center gap-3 mb-3 group">
                    <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${completed === total ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 tabular-nums">
                      {completed}/{total}
                    </span>
                  </div>
                )}
                <ul className="pl-0">{children}</ul>
              </>
            )
          },
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
            const { start, end } = node.position
            if (start.line === end.line) {
              return (
                <code className="bg-[#2d2d2d] before:content-none after:content-none text-[#ffb454] font-mono text-[0.9em] px-1.5 py-0.5 rounded">
                  {children}
                </code>
              )
            }
            return <code>{children}</code>
          }
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
