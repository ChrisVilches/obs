import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import MarkdownImage from "./markdown/MarkdownImage";
import Table from "./markdown/Table";
import { Code } from "./markdown/Code";
import { ListComponent, CheckboxListItem } from "./markdown/List";

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
          ul: ListComponent,
          ol: ListComponent,
          table: Table,
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
          code: Code,
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
