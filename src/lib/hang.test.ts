import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hangSrc, parseHang } from "./hang.ts";
import { addTeachHang, dropTeachHang, hangOf } from "./teach.ts";
import type { EconomyFile } from "./economy.ts";

function file(): EconomyFile {
  return {
    meta: {
      title: "Test",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25 },
      config: { authoredPlans: true },
    },
    crews: [],
    students: [],
  };
}

describe("hang", () => {
  it("parses Drive file, Docs, Slides, YouTube", () => {
    const drive = parseHang("https://drive.google.com/file/d/abc123XYZ/view?usp=sharing");
    assert.equal(drive?.kind, "drive");
    assert.equal(hangSrc(drive!), "https://drive.google.com/file/d/abc123XYZ/preview");
    const doc = parseHang("https://docs.google.com/document/d/doc99/edit");
    assert.equal(doc?.kind, "doc");
    const slides = parseHang("https://docs.google.com/presentation/d/slide99/edit#slide=id.p");
    assert.equal(slides?.kind, "slides");
    assert.match(hangSrc(slides!) ?? "", /\/embed/);
    const yt = parseHang("https://youtu.be/dQw4w9wgGcQ");
    assert.equal(yt?.kind, "youtube");
    assert.equal(hangSrc(yt!), "https://www.youtube-nocookie.com/embed/dQw4w9wgGcQ");
  });

  it("rejects http and empty, keeps a https link as open-not-iframe", () => {
    assert.equal(parseHang("http://evil.example/x"), null);
    assert.equal(parseHang("not a url"), null);
    const link = parseHang("https://example.com/handout.pdf");
    assert.equal(link?.kind, "link");
    assert.equal(hangSrc(link!), null);
    const shop = parseHang("https://apps.kulibert.net/bertybots/?course=forces");
    assert.equal(shop?.kind, "bertybots");
    assert.match(hangSrc(shop!) ?? "", /embed=1/);
    assert.match(hangSrc(shop!) ?? "", /tw=1/);
    assert.match(hangSrc(shop!) ?? "", /course=forces/);
  });

  it("stores on the Teach hour and will not double-hang", () => {
    const url = "https://drive.google.com/file/d/abc123XYZ/view";
    let next = addTeachHang(file(), "2026-09-14", 1, url);
    assert.equal(hangOf(next, "2026-09-14", 1).length, 1);
    next = addTeachHang(next, "2026-09-14", 1, url);
    assert.equal(hangOf(next, "2026-09-14", 1).length, 1);
    next = dropTeachHang(next, "2026-09-14", 1, hangOf(next, "2026-09-14", 1)[0].id);
    assert.equal(hangOf(next, "2026-09-14", 1).length, 0);
  });
});
