import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import remarkBreaks from "remark-breaks";
import { useAppConfig } from "../../contexts/AppConfigContext";
import { showErrorToast } from "../../utils/toast";
import Button from "../Button";
import { Code } from "./markdown/Code";
import {
  InteractiveCheckboxContext,
  LiComponent,
  ListComponent,
  rehypeListMetadata,
} from "./markdown/List";
import MarkdownImage from "./markdown/MarkdownImage";
import Table from "./markdown/Table";

function StrictLineBreaksToggle() {
  const { config, updateConfig } = useAppConfig();
  const [saving, setSaving] = useState(false);

  const handleToggle = useCallback(async () => {
    setSaving(true);
    try {
      await updateConfig({ strictLineBreaks: !config.strictLineBreaks });
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      setSaving(false);
    }
  }, [config.strictLineBreaks, updateConfig]);

  return (
    <Button variant="secondary" onClick={handleToggle} disabled={saving}>
      {saving
        ? "Saving..."
        : config.strictLineBreaks
          ? "Strict Line Breaks"
          : "Soft Line Breaks"}
    </Button>
  );
}

export default function MarkdownViewer({ file, content, mtime }) {
  const [loading, setLoading] = useState(false);
  const { config } = useAppConfig();

  return (
    <InteractiveCheckboxContext.Provider
      value={{ file, mtime, loading, setLoading }}
    >
      <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/50 flex items-center justify-end">
        <StrictLineBreaksToggle />
      </div>
      <div className="p-6 prose prose-invert max-w-full">
        <ReactMarkdown
          remarkPlugins={[
            remarkGfm,
            remarkMath,
            !config.strictLineBreaks ? remarkBreaks : null,
          ].filter((x) => x)}
          rehypePlugins={[rehypeKatex, rehypeListMetadata]}
          components={{
            img(props) {
              return <MarkdownImage {...props} file={file} />;
            },
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
