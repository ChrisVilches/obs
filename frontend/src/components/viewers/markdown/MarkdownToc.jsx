import { useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
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
      node.data.hProperties["data-heading"] = String(node.depth);
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

export default function MarkdownToc({ containerRef }) {
  const [open, setOpen] = useState(false);
  const prevHeaders = useRef(null);

  const headers = useMemo(() => {
    if (!open || !containerRef.current) return prevHeaders.current;
    const elements = containerRef.current.querySelectorAll("[data-heading]");
    const result = Array.from(elements).map((el) => ({
      level: parseInt(el.dataset.heading, 10),
      text: el.textContent,
      slug: el.id,
    }));
    prevHeaders.current = result;
    return result;
  }, [open]);

  if (headers !== null && headers.length === 0 && !open) return null;

  return (
    <>
      <button
        className="flex fixed right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 items-center justify-center rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Table of contents"
      >
        <ListBulletIcon className="w-5 h-5" />
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 data-[state=open]:animate-dialog-overlay-show data-[state=closed]:animate-dialog-overlay-hide" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed top-0 right-0 z-50 h-full w-5/6 md:w-72 bg-gray-900/90 border-l border-gray-800 flex flex-col outline-none data-[state=open]:animate-right-drawer-show data-[state=closed]:animate-right-drawer-hide"
          >
            <Dialog.Title className="sr-only">Table of contents</Dialog.Title>
            <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
              <h2 className="text-sm font-semibold text-gray-300">Contents</h2>
              <Dialog.Close asChild>
                <button
                  className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                  aria-label="Close table of contents"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
            <nav className="p-4 overflow-y-auto flex-1 min-h-0">
              <ul className="space-y-0.5">
                {headers && headers.map((h, i) => (
                  <li key={i} style={{ paddingLeft: `${(h.level - 1) * 0.75}rem` }}>
                    <a
                      href={`#${h.slug}`}
                      className={`block py-1 px-2 text-sm rounded hover:bg-gray-800 active:bg-gray-700 transition-colors wrap-anywhere ${h.level === 1
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
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
