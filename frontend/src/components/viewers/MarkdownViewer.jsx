import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckIcon } from "@heroicons/react/24/outline";

function isExternalURL(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function TaskCheckbox({ checked }) {
  return (
    <span className="inline-flex items-center select-none" >
      <span
        className={`inline-flex items-center justify-center size-4 rounded border-2 mr-2 transition-colors ${checked
          ? "bg-emerald-600 border-emerald-700"
          : "border-gray-500"
          }`}
      >
        {checked && <CheckIcon className="size-3 text-white" strokeWidth={3} />}
      </span>
    </span>
  );
}

export default function MarkdownViewer({ file, content }) {
  return (
    <div className="p-6 prose prose-invert max-w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
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
          input({ type, checked, ...props }) {
            if (type === "checkbox") {
              return <TaskCheckbox checked={checked || false} />;
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
