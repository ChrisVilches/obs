import { useMemo, useState } from "react";
import { ListBulletIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { visit } from "unist-util-visit";

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getTextContent(node) {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(getTextContent).join("");
  if (node?.props?.children) return getTextContent(node.props.children);
  return "";
}

function extractMdastText(node) {
  if (node.type === "text" || node.type === "inlineCode") {
    return node.value;
  }
  if (node.children) {
    return node.children.map(extractMdastText).join("");
  }
  return "";
}

export function remarkHeadingIds() {
  return (tree) => {
    const counts = new Map();
    visit(tree, "heading", (node) => {
      const text = extractMdastText(node);
      let slug = slugify(text);
      const count = counts.get(slug) || 0;
      counts.set(slug, count + 1);
      if (count > 0) slug = `${slug}-${count + 1}`;
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.id = slug;
    });
  };
}

export function createHeadingComponent(level) {
  const Tag = `h${level}`;
  function Heading({ children, node: _node, ...props }) {
    return <Tag className="scroll-mt-34" {...props}>{children}</Tag>;
  }
  return Heading;
}

function extractHeaders(content) {
  if (!content) return [];
  const counts = new Map();
  const headers = [];
  for (const line of content.split("\n")) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (!match) continue;
    const text = match[2].trim();
    let slug = slugify(text);
    const count = counts.get(slug) || 0;
    counts.set(slug, count + 1);
    if (count > 0) slug = `${slug}-${count + 1}`;
    headers.push({ level: match[1].length, text, slug });
  }
  return headers;
}

export default function MarkdownToc({ content }) {
  const [open, setOpen] = useState(false);

  const headers = useMemo(() => extractHeaders(content), [content]);

  if (headers.length === 0) return null;

  return (
    <>
      <button
        className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 items-center justify-center rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Table of contents"
      >
        <ListBulletIcon className="w-5 h-5" />
      </button>

      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setOpen(false)}
      />

      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-gray-900 border-l border-gray-800 shadow-xl transform transition-transform duration-200 ${open
          ? "translate-x-0"
          : "translate-x-full pointer-events-none"
          }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
          <h2 className="text-sm font-semibold text-gray-300">Contents</h2>
          <button
            className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
            onClick={() => setOpen(false)}
            aria-label="Close table of contents"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 overflow-y-auto h-[calc(100%-3.5rem)]">
          <ul className="space-y-0.5">
            {headers.map((h, i) => (
              <li key={i} style={{ paddingLeft: `${(h.level - 1) * 0.75}rem` }}>
                <a
                  href={`#${h.slug}`}
                  className={`block py-1 px-2 text-sm rounded hover:bg-gray-800 transition-colors truncate ${h.level === 1
                    ? "text-gray-200 font-medium"
                    : h.level === 2
                      ? "text-gray-300"
                      : "text-gray-400"
                    }`}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
