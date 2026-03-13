import ReactMarkdown from "react-markdown";
import { useRef } from "react";
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

function CheckboxListItem({ node, children, file, mtime, mutate, infoKey }) {
  const processingRef = useRef(false);

  if (!node.children.length || node.children[0]?.properties?.type !== "checkbox") {
    return <li>{children}</li>;
  }

  const copy = children.slice(1);
  const line = node.position.start.line;
  const checked = node.children[0].properties.checked;

  const handleClick = async () => {
    if (processingRef.current) return;
    try {
      processingRef.current = true;
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
      processingRef.current = false;
    }
  };

  // TODO: so-so... when clicking on the checkbox, the hover color blinks a bit (fix this glitch).
  return (
    <li className="list-none !ml-0 flex items-start gap-2 hover:bg-white/5 rounded px-1 py-0.5 transition-colors">
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center size-4 rounded border-2 mt-[5px] shrink-0 transition-colors ${checked
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
  const { mutate } = useSWRConfig();
  const infoKey = `/api/files/info?file=${encodeURIComponent(file)}`;

  return (
    <div className="p-6 prose prose-invert max-w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img(props) {
            return <MarkdownImage {...props} file={file} />;
          },
          li(props) {
            return (
              <CheckboxListItem
                {...props}
                file={file}
                mtime={mtime}
                mutate={mutate}
                infoKey={infoKey}
              />
            );
          },
          code({ children, inline, node, ...props }) {
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
