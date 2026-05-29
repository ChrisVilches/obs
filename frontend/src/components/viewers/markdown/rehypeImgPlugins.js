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

      // The src and file variables are expected to be already URL-encoded before
      // reaching this plugin (e.g. at parse time). They are interpolated directly
      // into a query string with no additional escaping. If either value contains
      // reserved characters like "?", "&", or "#", the resulting URL can become
      // malformed — the fragment or additional query params will leak into the
      // top-level URL structure rather than staying inside the intended parameter.
      node.properties.src = isExternalURL(src)
        ? src
        : `/api/files/raw?file=${src}&current=${file ?? ""}`;
    });
  };
}

function isWhitespaceText(node) {
  return node.type === "text" && node.value.trim() === "";
}

function significantChildren(children) {
  return children.filter((n) => !isWhitespaceText(n));
}

function figcaptionNode(alt) {
  return {
    type: "element",
    tagName: "figcaption",
    properties: {},
    children: [{ type: "text", value: alt }],
  };
}

function figureWrapper(p, { children, className }) {
  Object.assign(p, {
    tagName: "figure",
    properties: { className: [className] },
    children,
  });
}

/**
 * Try to extract a standalone image from a node.
 * Handles both `img` directly and `a > img` (linked images).
 * Returns `{ imgNode, wrapperChildren }` or `null` if this isn't a
 * standalone image.
 */
function tryExtractImage(node) {
  if (node.tagName === "img") {
    return { imgNode: node, wrapperChildren: [node] };
  }

  if (node.tagName === "a") {
    const kids = significantChildren(node.children);
    if (kids.length === 1 && kids[0].tagName === "img") {
      return { imgNode: kids[0], wrapperChildren: [node] };
    }
  }

  return null;
}

export function rehypeStandaloneImages(options = {}) {
  const { className = "standalone-image" } = options;

  return (tree) => {
    for (const p of tree.children) {
      if (p.type !== "element" || p.tagName !== "p") continue;

      const kids = significantChildren(p.children);
      if (kids.length !== 1 || kids[0].type !== "element") continue;

      const extracted = tryExtractImage(kids[0]);
      if (!extracted) continue;

      const children = [...extracted.wrapperChildren];
      const alt = extracted.imgNode.properties?.alt;
      if (alt) children.push(figcaptionNode(alt));

      figureWrapper(p, { children, className });
    }
  };
}
