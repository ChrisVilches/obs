import { visit } from "unist-util-visit";

function isElement(node, tagName) {
  return node.type === 'element' && node.tagName === tagName
}

// Purely a UI improvement to remove unnecessary vertical spacing:
// when an <li> contains only a single meaningful child and it's a <p>,
// unwrap the <p> so the typography plugin doesn't add paragraph margins
// where they aren't needed. This makes lists render tighter.
// Multi-paragraph list items are intentionally left alone — those
// genuinely need the paragraph separation.
export default function rehypeTightLists() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (!isElement(node, 'li')) return

      const nonWhitespaceChildren = node.children.filter((child) => {
        if (child.type === 'text') return child.value.trim() !== ''
        return true
      })

      if (nonWhitespaceChildren.length !== 1 || !isElement(nonWhitespaceChildren[0], 'p')) return

      node.children = nonWhitespaceChildren[0].children
    })
  }
}
