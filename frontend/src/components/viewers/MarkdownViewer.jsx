import ReactMarkdown from "react-markdown";

function isExternalURL(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

export default function MarkdownViewer({ file, content }) {
  return (
    <div className="p-6 prose prose-invert max-w-full">
      <ReactMarkdown
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
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
