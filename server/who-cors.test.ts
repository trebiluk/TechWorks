import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { whoAllowOrigin } from "./who-cors.ts";

describe("who-cors origins (/api/who and the Bertopia world APIs)", () => {
  it("allows the school doors over https", () => {
    for (const o of ["https://apps.kulibert.net", "https://tw.kulibert.net", "https://kulibert.net"]) assert.equal(whoAllowOrigin(o), o);
    assert.equal(whoAllowOrigin("http://apps.kulibert.net"), null);
  });

  it("allows the apps-kulibert Vercel preview origins, https only", () => {
    const ok = [
      "https://apps-kulibert-git-feat-topia-throughput-caps-cnyguy815-8651.vercel.app",
      "https://apps-kulibert-abc123xyz-cnyguy815-8651.vercel.app",
      "https://apps-kulibert-a-cnyguy815-8651.vercel.app",
    ];
    for (const o of ok) assert.equal(whoAllowOrigin(o), o, o);
    assert.equal(whoAllowOrigin("http://apps-kulibert-abc123-cnyguy815-8651.vercel.app"), null, "http preview");
  });

  it("allows no other vercel.app origin and never a wildcard", () => {
    const no = [
      "https://apps-kulibert-cnyguy815-8651.vercel.app",           // no branch part
      "https://apps-kulibert-abc-someoneelse-1234.vercel.app",     // another account
      "https://evil-apps-kulibert-abc-cnyguy815-8651.vercel.app",  // prefix
      "https://apps-kulibert-abc-cnyguy815-8651.vercel.app.evil.com",
      "https://vercel.app",
      "https://apps-kulibert.vercel.app",
      "*",
      "null",
      "",
    ];
    for (const o of no) assert.equal(whoAllowOrigin(o), null, o);
  });

  it("keeps the local preview", () => {
    assert.equal(whoAllowOrigin("http://localhost:8080"), "http://localhost:8080");
    assert.equal(whoAllowOrigin("https://127.0.0.1"), "https://127.0.0.1");
  });
});
