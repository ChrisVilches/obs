import { useRef, useState } from "react";
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
import MarkdownToc, {
  createHeadingComponent,
  remarkHeadingIds,
} from "./markdown/MarkdownToc";
import {
  rehypeFixImgURL,
  rehypeStandaloneImages,
} from "./markdown/rehypeImgPlugins";
import rehypeUnwrapSingleParagraphListItems from "./markdown/rehypeUnwrapSingleParagraphListItems";
import Table from "./markdown/Table";

const markdownComponents = {
  h1: createHeadingComponent(1),
  h2: createHeadingComponent(2),
  h3: createHeadingComponent(3),
  ul: ListComponent,
  ol: ListComponent,
  li: LiComponent,
  table: Table,
  code: Code,
};

export default function MarkdownViewer({ file, content, mtime }) {
  const [loading, setLoading] = useState(false);
  const { config } = useAppConfig();
  const containerRef = useRef(null);

  return (
    <InteractiveCheckboxContext.Provider
      value={{ file, mtime, loading, setLoading }}
    >
      <div
        ref={containerRef}
        className="p-6 prose prose-invert max-w-full markdown-container"
      >
        <ReactMarkdown
          key={file}
          remarkPlugins={[
            remarkGfm,
            remarkMath,
            remarkHeadingIds,
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
          components={markdownComponents}
        >
          {content || ""}
        </ReactMarkdown>
      </div>
      <MarkdownToc containerRef={containerRef} key={`${file}-${mtime}`} />
    </InteractiveCheckboxContext.Provider>
  );
}
