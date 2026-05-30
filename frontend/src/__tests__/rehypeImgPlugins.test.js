import { describe, expect, it } from "vitest";
import {
  rehypeFixImgURL,
  rehypeStandaloneImages,
} from "../components/viewers/markdown/rehypeImgPlugins";

function makeImg(src) {
  return { type: "element", tagName: "img", properties: { src }, children: [] };
}

function makeP(children) {
  return { type: "element", tagName: "p", properties: {}, children };
}

function makeA(href, children) {
  return { type: "element", tagName: "a", properties: { href }, children };
}

function makeText(value) {
  return { type: "text", value };
}

// ── rehypeFixImgURL ──────────────────────────────────────────────────────────

describe("rehypeFixImgURL", () => {
  it("rewrites relative URLs through /api/files/raw", () => {
    const img = makeImg("images/photo.png");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("notes/my-note.md");
    plugin(tree);

    expect(img.properties.src).toBe(
      "/api/files/raw?file=images/photo.png&current=notes/my-note.md",
    );
  });

  it("does not rewrite external http URLs", () => {
    const img = makeImg("http://example.com/photo.png");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("/");
    plugin(tree);

    expect(img.properties.src).toBe("http://example.com/photo.png");
  });

  it("does not rewrite external https URLs", () => {
    const img = makeImg("https://example.com/photo.png");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("/");
    plugin(tree);

    expect(img.properties.src).toBe("https://example.com/photo.png");
  });

  it("preserves query params on external http URLs", () => {
    const img = makeImg("http://example.com/photo.png?w=200&h=100");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("notes/my-note.md");
    plugin(tree);

    expect(img.properties.src).toBe(
      "http://example.com/photo.png?w=200&h=100",
    );
  });

  it("preserves query params on external https URLs", () => {
    const img = makeImg("https://cdn.example.com/img.svg?token=abc&v=2");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("notes/my-note.md");
    plugin(tree);

    expect(img.properties.src).toBe(
      "https://cdn.example.com/img.svg?token=abc&v=2",
    );
  });

  it("preserves fragments on external https URLs", () => {
    const img = makeImg("https://example.com/diagram.svg#layer-3");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("notes/my-note.md");
    plugin(tree);

    expect(img.properties.src).toBe(
      "https://example.com/diagram.svg#layer-3",
    );
  });

  it("skips non-img elements", () => {
    const anchor = makeA("page.md", [makeText("link")]);
    const tree = { type: "root", children: [makeP([anchor])] };
    const plugin = rehypeFixImgURL("notes/my-note.md");
    plugin(tree);

    expect(anchor.properties.href).toBe("page.md");
  });

  it("skips img elements without a src property", () => {
    const img = {
      type: "element",
      tagName: "img",
      properties: {},
      children: [],
    };
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("/");
    plugin(tree);

    expect(img.properties.src).toBeUndefined();
  });

  it("handles empty string file parameter", () => {
    const img = makeImg("images/photo.png");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("");
    plugin(tree);

    expect(img.properties.src).toBe(
      "/api/files/raw?file=images/photo.png&current=",
    );
  });

  it("strips query params from relative image src", () => {
    const img = makeImg("images/my%20photo.png?w=200&h=100");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("notes/my-note.md");
    plugin(tree);

    expect(img.properties.src).toBe(
      "/api/files/raw?file=images/my%20photo.png&current=notes/my-note.md",
    );
  });

  it("preserves already-encoded src as-is", () => {
    const img = makeImg("notes/foo%20%26%20bar.png");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("notes/my-note.md");
    plugin(tree);

    expect(img.properties.src).toBe(
      "/api/files/raw?file=notes/foo%20%26%20bar.png&current=notes/my-note.md",
    );
  });

  it("handles undefined file parameter gracefully", () => {
    const img = makeImg("images/photo.png");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL(undefined);
    plugin(tree);

    expect(img.properties.src).toBe(
      "/api/files/raw?file=images/photo.png&current=",
    );
  });

  it("strips fragment identifier from the current file param", () => {
    const img = makeImg("diagram.svg");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("notes/guide.md#section-3");
    plugin(tree);

    expect(img.properties.src).toBe(
      "/api/files/raw?file=diagram.svg&current=notes/guide.md",
    );
  });

  it("preserves SVG fragment identifier at end of URL", () => {
    const img = makeImg("diagram.svg#layer-3");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("notes/my-note.md");
    plugin(tree);

    expect(img.properties.src).toBe(
      "/api/files/raw?file=diagram.svg&current=notes/my-note.md#layer-3",
    );
  });

  it("strips query params but preserves fragment on src", () => {
    const img = makeImg("diagram.svg?w=200&h=100#layer-3");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("notes/my-note.md");
    plugin(tree);

    expect(img.properties.src).toBe(
      "/api/files/raw?file=diagram.svg&current=notes/my-note.md#layer-3",
    );
  });

  it("preserves ../ prefix on relative src", () => {
    const img = makeImg("../images/photo.png");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("notes/my-note.md");
    plugin(tree);

    expect(img.properties.src).toBe(
      "/api/files/raw?file=../images/photo.png&current=notes/my-note.md",
    );
  });

  it("only the src fragment survives in the final URL", () => {
    const img = makeImg("diagram.svg?w=200#layer-3");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("notes/guide.md?v=1#section-3");
    plugin(tree);

    expect(img.properties.src).toBe(
      "/api/files/raw?file=diagram.svg&current=notes/guide.md#layer-3",
    );
  });

  it("preserves ../../ prefix on relative src", () => {
    const img = makeImg("../../images/photo.png");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeFixImgURL("notes/my-note.md");
    plugin(tree);

    expect(img.properties.src).toBe(
      "/api/files/raw?file=../../images/photo.png&current=notes/my-note.md",
    );
  });

  it("does not mutate non-img elements when src is present", () => {
    const video = {
      type: "element",
      tagName: "video",
      properties: { src: "video.mp4" },
      children: [],
    };
    const tree = { type: "root", children: [video] };
    const plugin = rehypeFixImgURL("notes/my-note.md");
    plugin(tree);

    // video src should be untouched since only img elements are modified
    expect(video.properties.src).toBe("video.mp4");
  });
});

// ── rehypeStandaloneImages ───────────────────────────────────────────────────

describe("rehypeStandaloneImages", () => {
  it("wraps a standalone img in a <figure> with the given className", () => {
    const img = makeImg("photo.png");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    expect(tree.children[0].tagName).toBe("figure");
    expect(tree.children[0].properties.className).toEqual(["standalone-image"]);
    expect(tree.children[0].children).toEqual([img]);
  });

  it("uses custom className via options", () => {
    const img = makeImg("photo.png");
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeStandaloneImages({ className: "my-custom" });
    plugin(tree);

    expect(tree.children[0].properties.className).toEqual(["my-custom"]);
  });

  it("adds figcaption from img alt text", () => {
    const img = {
      type: "element",
      tagName: "img",
      properties: { src: "photo.png", alt: "A nice photo" },
      children: [],
    };
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    const figure = tree.children[0];
    expect(figure.tagName).toBe("figure");
    expect(figure.children).toHaveLength(2);
    expect(figure.children[1]).toEqual({
      type: "element",
      tagName: "figcaption",
      properties: {},
      children: [{ type: "text", value: "A nice photo" }],
    });
  });

  it("does not add figcaption when alt is missing", () => {
    const img = makeImg("photo.png"); // no alt
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    expect(tree.children[0].children).toHaveLength(1);
    expect(tree.children[0].children[0].tagName).toBe("img");
  });

  it("does not add figcaption when alt is an empty string", () => {
    const img = {
      type: "element",
      tagName: "img",
      properties: { src: "photo.png", alt: "" },
      children: [],
    };
    const tree = { type: "root", children: [makeP([img])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    expect(tree.children[0].children).toHaveLength(1);
  });

  it("handles img wrapped in an <a> tag (root -> p -> a -> img)", () => {
    const img = makeImg("photo.png");
    const anchor = makeA("http://example.com", [img]);
    const tree = { type: "root", children: [makeP([anchor])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    const figure = tree.children[0];
    expect(figure.tagName).toBe("figure");
    expect(figure.children).toHaveLength(1);
    expect(figure.children[0].tagName).toBe("a");
    expect(figure.children[0].children[0].tagName).toBe("img");
  });

  it("handles img wrapped in <a> with alt as figcaption", () => {
    const img = {
      type: "element",
      tagName: "img",
      properties: { src: "photo.png", alt: "Clickable" },
      children: [],
    };
    const anchor = makeA("http://example.com", [img]);
    const tree = { type: "root", children: [makeP([anchor])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    const figure = tree.children[0];
    expect(figure.children).toHaveLength(2);
    expect(figure.children[0].tagName).toBe("a");
    expect(figure.children[1].tagName).toBe("figcaption");
    expect(figure.children[1].children[0].value).toBe("Clickable");
  });

  it("skips paragraphs with multiple significant children", () => {
    const img1 = makeImg("a.png");
    const img2 = makeImg("b.png");
    const tree = { type: "root", children: [makeP([img1, img2])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    expect(tree.children[0].tagName).toBe("p"); // unchanged
  });

  it("skips paragraphs that have text alongside an image", () => {
    const img = makeImg("photo.png");
    const text = makeText("Look at this!");
    const tree = { type: "root", children: [makeP([text, img])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    expect(tree.children[0].tagName).toBe("p"); // unchanged
  });

  it("skips paragraphs whose only significant child is not an img or a", () => {
    const span = {
      type: "element",
      tagName: "span",
      properties: {},
      children: [makeText("text")],
    };
    const tree = { type: "root", children: [makeP([span])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    expect(tree.children[0].tagName).toBe("p"); // unchanged
  });

  it("skips empty paragraphs", () => {
    const tree = { type: "root", children: [makeP([])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    // stays as p (no significant children -> length 0 !== 1)
    expect(tree.children[0].tagName).toBe("p");
  });

  it("skips <a> wrapping with multiple significant children", () => {
    const img = makeImg("a.png");
    const span = {
      type: "element",
      tagName: "span",
      properties: {},
      children: [makeText("x")],
    };
    const anchor = makeA("http://example.com", [img, span]);
    const tree = { type: "root", children: [makeP([anchor])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    expect(tree.children[0].tagName).toBe("p"); // unchanged
  });

  it("skips <a> wrapping where the single child is not an img", () => {
    const span = {
      type: "element",
      tagName: "span",
      properties: {},
      children: [makeText("text")],
    };
    const anchor = makeA("http://example.com", [span]);
    const tree = { type: "root", children: [makeP([anchor])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    expect(tree.children[0].tagName).toBe("p"); // unchanged
  });

  it("ignores whitespace-only text nodes when counting children", () => {
    const img = makeImg("photo.png");
    const space = makeText("  ");
    const tree = { type: "root", children: [makeP([space, img, space])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    expect(tree.children[0].tagName).toBe("figure");
  });

  it("ignores whitespace text nodes inside <a> wrapper", () => {
    const img = makeImg("photo.png");
    const space = makeText("\n");
    const anchor = makeA("http://example.com", [space, img, space]);
    const tree = { type: "root", children: [makeP([space, anchor, space])] };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    expect(tree.children[0].tagName).toBe("figure");
    expect(tree.children[0].children[0].tagName).toBe("a");
  });

  it("does not mutate non-paragraph children", () => {
    const img = makeImg("photo.png");
    const tree = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "div",
          properties: {},
          children: [makeP([img])],
        },
      ],
    };
    const plugin = rehypeStandaloneImages();
    plugin(tree);

    // the plugin only checks top-level children, so the nested p is ignored
    expect(tree.children[0].tagName).toBe("div");
    expect(tree.children[0].children[0].tagName).toBe("p");
  });
});
