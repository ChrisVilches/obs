function isExternalURL(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

export default function MarkdownImage({ node, src, alt, file, ...props }) {
  const newSrc = isExternalURL(src)
    ? src
    : `api/files/raw?file=${src}&current=${file}`;

  // TODO: This semantic HTML is wrong. The image becomes a child of a <p>,
  // and I can't use figure and figcaption. Using span is wrong.
  return (
    <span className="flex flex-col items-center my-4">
      <img
        {...props}
        src={newSrc}
        alt={alt || ""}
        className="rounded-lg shadow-md"
      />
    </span>
  );
}
