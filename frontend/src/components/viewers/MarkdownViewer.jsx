import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { fetcher } from "../../utils/fetcher";
import { useSWRConfig } from "swr";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { CheckIcon, XCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

function isExternalURL(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function TaskCheckbox({ checked, file, id }) {
  const handleClick = () => {
    console.log(file, checked, id)
  }

  return (
    <span className="inline-flex items-center select-none" >
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center size-4 rounded border-2 mr-2 transition-colors ${checked
          ? "bg-emerald-600 border-emerald-700"
          : "border-gray-500"
          }`}
      >
        {checked && <CheckIcon className="size-3 text-white" strokeWidth={3} />}
      </button>
    </span>
  );
}


function showErrorToast(msg) {
  toast.custom((t) => (
    <div
      className={`${t.visible ? "animate-enter" : "animate-leave"
        } max-w-sm w-full bg-red-900/90 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-red-500/50`}
    >
      <div className="flex-1 w-0 p-3">
        <div className="flex items-center">
          <XCircleIcon className="h-5 w-5 text-red-400" />
          <p className="ml-2 text-sm font-medium text-red-200">
            {msg}
          </p>
        </div>
      </div>
    </div>
  ));
}

export default function MarkdownViewer({ file, content, mtime }) {
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false)
  const infoKey = `/api/files/info?file=${encodeURIComponent(file)}`;

  return (
    <div className="p-6 prose prose-invert max-w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img({ node, ...props }) {
            const newSrc = isExternalURL(props.src)
              ? props.src
              : `api/files/raw?file=${props.src}&current=${file}`;
            return (
              <img
                {...props}
                src={newSrc}
                alt={props.alt || ""}
                className="rounded-lg shadow-md my-4"
              />
            );
          },
          li({ node, type, children }) {
            const copy = [...children]

            if (node.children.length && node.children[0]?.properties?.type === "checkbox") {
              copy.shift()
              const line = node.position.start.line
              const checked = node.children[0].properties.checked

              const handleClick = async () => {
                console.log(line)
                try {
                  setLoading(true)
                  await mutate(infoKey, fetcher("/api/files/checkbox", {
                    method: 'PUT',
                    body: {
                      checked: !checked,
                      line: line,
                      mtime,
                      file,
                    }
                  }), { revalidate: false });
                } catch (e) {
                  showErrorToast("There was a version conflict")
                } finally {
                  setLoading(false)
                }
              }

              return (
                <li className="list-none !ml-0">
                  <button
                    disabled={loading}
                    onClick={handleClick}
                    className={`inline-flex items-center justify-center size-4 rounded border-2 mr-2 transition-colors ${checked
                      ? "bg-emerald-600 border-emerald-700"
                      : "border-gray-500"
                      }`}
                  >
                    {checked && <CheckIcon className="size-3 text-white" strokeWidth={3} />}
                  </button>
                  {copy}
                </li>
              )
            }

            return <li>{copy}</li>
          },
          // input({ type, checked, node, ...props }) {
          //   if (type === "checkbox") {
          //     const position = node?.properties?.dataPosition
          //       ? JSON.parse(node.properties.dataPosition)
          //       : null;
          //     // console.log(position); // { start: { line, column, offset }, end: ... }
          //     return <TaskCheckbox file={file} checked={checked || false} />;
          //   }
          //   return <input type={type} {...props} />;
          // },
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div >
  );
}
