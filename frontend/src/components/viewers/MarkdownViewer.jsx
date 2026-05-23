import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import remarkBreaks from "remark-breaks";
import { useAppConfig } from "../../contexts/AppConfigContext";
import { Code } from "./markdown/Code";
import {
  InteractiveCheckboxContext,
  LiComponent,
  ListComponent,
  rehypeDebugLists,
  rehypeListMetadata,
} from "./markdown/List";
import {
  rehypeStandaloneImages,
  rehypeFixImgURL,
} from "./markdown/rehypeImgPlugins";
import rehypeUnwrapSingleParagraphListItems from "./markdown/rehypeUnwrapSingleParagraphListItems";
import Table from "./markdown/Table";

export default function MarkdownViewer({ file, content, mtime }) {
  const [loading, setLoading] = useState(false);
  const { config } = useAppConfig();

  return (
    <InteractiveCheckboxContext.Provider
      value={{ file, mtime, loading, setLoading }}
    >
      <div className="p-6 prose prose-invert max-w-full markdown-container">
        <ReactMarkdown
          key={file}
          remarkPlugins={[
            remarkGfm,
            remarkMath,
            !config.strictLineBreaks ? remarkBreaks : null,
          ].filter((x) => x)}
          rehypePlugins={[
            rehypeUnwrapSingleParagraphListItems,
            rehypeStandaloneImages,
            [rehypeFixImgURL, file],
            rehypeKatex,
            rehypeListMetadata,
            process.env.NODE_ENV !== "production" ? rehypeDebugLists : null,
          ].filter((x) => x)}
          components={{
            ul: ListComponent,
            ol: ListComponent,
            li: LiComponent,
            table: Table,
            code: Code,
          }}
        >
          {content || ""}
        </ReactMarkdown>
      </div>
    </InteractiveCheckboxContext.Provider>
  );
}
