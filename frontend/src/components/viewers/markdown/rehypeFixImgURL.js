import { visit } from "unist-util-visit";

function isExternalURL(url) {
  return url && (url.startsWith("http://") || url.startsWith("https://"));
}

export function rehypeFixImgURL(file) {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "img") return;

      const src = node.properties?.src;
      if (!src) return;

      node.properties.src = isExternalURL(src)
        ? src
        : `/api/files/raw?file=${src}&current=${file ?? ""}`;
    });
  };
}
