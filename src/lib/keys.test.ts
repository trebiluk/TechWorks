import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isTypingNode, isTypingTarget, TYPING_SELECTOR } from "./keys.ts";

type Fake = {
  tagName?: string;
  isContentEditable?: boolean;
  attrs?: Record<string, string>;
  parent?: Fake | null;
  getAttribute: (name: string) => string | null;
  closest: (sel: string) => Fake | null;
  parentElement: Fake | null;
};

function fake(partial: { tagName?: string; isContentEditable?: boolean; attrs?: Record<string, string>; parent?: Fake | null }): Fake {
  const node: Fake = {
    tagName: partial.tagName,
    isContentEditable: partial.isContentEditable,
    attrs: partial.attrs,
    parent: partial.parent ?? null,
    getAttribute(name) {
      return node.attrs?.[name] ?? null;
    },
    get parentElement() {
      return node.parent ?? null;
    },
    closest(sel) {
      let walk: Fake | null = node;
      while (walk) {
        if (sel === TYPING_SELECTOR && isTypingNode(walk)) return walk;
        const tag = String(walk.tagName || "").toUpperCase();
        if (sel.includes("input") && tag === "INPUT") return walk;
        if (sel.includes("textarea") && tag === "TEXTAREA") return walk;
        if (sel.includes("[role='textbox']") && walk.attrs?.role === "textbox") return walk;
        if (
          sel.includes("[contenteditable") &&
          (walk.isContentEditable || walk.attrs?.contenteditable === "" || walk.attrs?.contenteditable === "true")
        ) {
          return walk;
        }
        walk = walk.parent ?? null;
      }
      return null;
    },
  };
  return node;
}

describe("isTypingTarget", () => {
  it("treats input, textarea, select, contenteditable, and role=textbox as typing", () => {
    assert.equal(isTypingNode(fake({ tagName: "INPUT" })), true);
    assert.equal(isTypingNode(fake({ tagName: "TEXTAREA" })), true);
    assert.equal(isTypingNode(fake({ tagName: "SELECT" })), true);
    assert.equal(isTypingNode(fake({ tagName: "DIV", attrs: { role: "textbox" } })), true);
    assert.equal(isTypingNode(fake({ tagName: "DIV", isContentEditable: true })), true);
    assert.equal(isTypingNode(fake({ tagName: "BUTTON" })), false);
    assert.equal(isTypingNode(fake({ tagName: "BODY" })), false);
  });

  it("matches a child inside role=textbox (closest)", () => {
    const box = fake({ tagName: "DIV", attrs: { role: "textbox" } });
    const child = fake({ tagName: "SPAN", parent: box });
    assert.equal(isTypingTarget({ target: child as unknown as EventTarget }), true);
  });

  it("Space hotkey must not preventDefault in Write the job → Rules", () => {
    const rules = fake({ tagName: "INPUT" });
    let prevented = false;
    const typing = {
      key: " ",
      code: "Space",
      target: rules as unknown as EventTarget,
      preventDefault() {
        prevented = true;
      },
    };
    if (!isTypingTarget(typing)) typing.preventDefault();
    assert.equal(prevented, false);

    const wall = fake({ tagName: "BODY" });
    const slide = {
      key: " ",
      code: "Space",
      target: wall as unknown as EventTarget,
      preventDefault() {
        prevented = true;
      },
    };
    if (!isTypingTarget(slide)) slide.preventDefault();
    assert.equal(prevented, true);
  });
});
