import { describe, expect, it } from "vitest";
import rehypeUnwrapSingleParagraphListItems from "../components/viewers/markdown/rehypeUnwrapSingleParagraphListItems";

function makeP(children) {
  return { type: "element", tagName: "p", properties: {}, children };
}

function makeLi(children) {
  return { type: "element", tagName: "li", properties: {}, children };
}

function makeUl(children) {
  return { type: "element", tagName: "ul", properties: {}, children };
}

function makeText(value) {
  return { type: "text", value };
}

function makeStrong(children) {
  return { type: "element", tagName: "strong", properties: {}, children };
}

function makeEm(children) {
  return { type: "element", tagName: "em", properties: {}, children };
}

// ── rehypeUnwrapSingleParagraphListItems ──────────────────────────────────────

describe("rehypeUnwrapSingleParagraphListItems", () => {
  it("unwraps <p> from <li> when it's the only meaningful child", () => {
    const text = makeText("Hello");
    const li = makeLi([makeP([text])]);
    const tree = { type: "root", children: [makeUl([li])] };
    const plugin = rehypeUnwrapSingleParagraphListItems();
    plugin(tree);

    expect(li.children).toEqual([text]);
  });

  it("leaves <li> alone when it has multiple non-whitespace children", () => {
    const text1 = makeText("Hello");
    const text2 = makeText("World");
    const li = makeLi([makeP([text1]), text2]);
    const tree = { type: "root", children: [makeUl([li])] };
    const plugin = rehypeUnwrapSingleParagraphListItems();
    plugin(tree);

    expect(li.children).toHaveLength(2);
    expect(li.children[0].tagName).toBe("p");
    expect(li.children[1].value).toBe("World");
  });

  it("leaves <li> alone when the single child is not a <p>", () => {
    const text = makeText("Hello");
    const li = makeLi([text]);
    const tree = { type: "root", children: [makeUl([li])] };
    const plugin = rehypeUnwrapSingleParagraphListItems();
    plugin(tree);

    expect(li.children).toEqual([text]);
  });

  it("leaves <li> alone when the single child is a non-p element (e.g. <strong>)", () => {
    const strong = makeStrong([makeText("Bold")]);
    const li = makeLi([strong]);
    const tree = { type: "root", children: [makeUl([li])] };
    const plugin = rehypeUnwrapSingleParagraphListItems();
    plugin(tree);

    expect(li.children).toEqual([strong]);
  });

  it("ignores whitespace-only text nodes when counting children", () => {
    const text = makeText("Hello");
    const space = makeText("  ");
    const li = makeLi([space, makeP([text]), space]);
    const tree = { type: "root", children: [makeUl([li])] };
    const plugin = rehypeUnwrapSingleParagraphListItems();
    plugin(tree);

    expect(li.children).toEqual([text]);
  });

  it("leaves <li> alone when p and non-whitespace text are both present", () => {
    const text = makeText("Hello");
    const li = makeLi([makeP([text]), makeText(" extra")]);
    const tree = { type: "root", children: [makeUl([li])] };
    const plugin = rehypeUnwrapSingleParagraphListItems();
    plugin(tree);

    expect(li.children).toHaveLength(2);
    expect(li.children[0].tagName).toBe("p");
  });

  it("unwraps <p> preserving nested inline elements (strong, em, etc.)", () => {
    const strong = makeStrong([makeText("bold")]);
    const text = makeText(" and ");
    const em = makeEm([makeText("italic")]);
    const li = makeLi([makeP([strong, text, em])]);
    const tree = { type: "root", children: [makeUl([li])] };
    const plugin = rehypeUnwrapSingleParagraphListItems();
    plugin(tree);

    expect(li.children).toEqual([strong, text, em]);
  });

  it("unwraps <p> from multiple <li> elements in the same tree", () => {
    const a = makeText("a");
    const b = makeText("b");
    const li1 = makeLi([makeP([a])]);
    const li2 = makeLi([makeP([b])]);
    const tree = { type: "root", children: [makeUl([li1, li2])] };
    const plugin = rehypeUnwrapSingleParagraphListItems();
    plugin(tree);

    expect(li1.children).toEqual([a]);
    expect(li2.children).toEqual([b]);
  });

  it("leaves <li> alone when it has an <a> tag wrapping the <p>", () => {
    const text = makeText("link text");
    const anchor = {
      type: "element",
      tagName: "a",
      properties: { href: "http://example.com" },
      children: [makeP([text])],
    };
    const li = makeLi([anchor]);
    const tree = { type: "root", children: [makeUl([li])] };
    const plugin = rehypeUnwrapSingleParagraphListItems();
    plugin(tree);

    expect(li.children).toEqual([anchor]);
  });

  it("handles empty <p> inside <li> — unwraps to empty children", () => {
    const li = makeLi([makeP([])]);
    const tree = { type: "root", children: [makeUl([li])] };
    const plugin = rehypeUnwrapSingleParagraphListItems();
    plugin(tree);

    expect(li.children).toEqual([]);
  });

  it("works on <li> nested deeper in the tree (not only top-level)", () => {
    const text = makeText("nested");
    const li = makeLi([makeP([text])]);
    const div = {
      type: "element",
      tagName: "div",
      properties: {},
      children: [makeUl([li])],
    };
    const tree = { type: "root", children: [div] };
    const plugin = rehypeUnwrapSingleParagraphListItems();
    plugin(tree);

    expect(li.children).toEqual([text]);
  });

  it("handles empty <li> with no children", () => {
    const li = makeLi([]);
    const tree = { type: "root", children: [makeUl([li])] };
    const plugin = rehypeUnwrapSingleParagraphListItems();
    plugin(tree);

    expect(li.children).toEqual([]);
  });

  it("does not unwrap <p> inside non-<li> elements", () => {
    const text = makeText("not a list item");
    const p = makeP([text]);
    const div = {
      type: "element",
      tagName: "div",
      properties: {},
      children: [p],
    };
    const tree = { type: "root", children: [div] };
    const plugin = rehypeUnwrapSingleParagraphListItems();
    plugin(tree);

    expect(div.children).toEqual([p]);
  });
});
