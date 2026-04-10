import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import MarkdownImage from "./markdown/MarkdownImage";
import Table from "./markdown/Table";
import { Code } from "./markdown/Code";
import { ListComponent, LiComponent, Input } from "./markdown/List";

export default function MarkdownViewer({ file, content, mtime }) {
  const [loading, setLoading] = useState(false);
  // TODO: Maybe we can pass a context down to all elements so they can trigger
  // saving checkboxes and things like that so I don't have to pollute the Checkbox / Input element
  // We can do it by passing a context provider to Input elements only (other elements don't need it)

  return (
    <div className="p-6 prose prose-invert max-w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img(props) {
            return <MarkdownImage {...props} file={file} />;
          },
          ul: ListComponent,
          ol: ListComponent,
          table: Table,
          input(props) {
            return (
              <Input
                {...props}
                file={file}
                mtime={mtime}
                loading={loading}
                setLoading={setLoading}
              />
            );
          },
          li(props) {
            return (<LiComponent {...props} file={file} />
            );
          },
          code: Code,
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
