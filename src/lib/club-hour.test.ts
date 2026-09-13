import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultClubLine, layClubSlots, patchMeeting, type ClubFile, type ClubSlot } from "./club.ts";

const slot = (kind: ClubSlot["kind"], line: string): ClubSlot => ({ id: kind, title: kind.toUpperCase(), line, kind });

function club(): ClubFile {
  return {
    v: 1,
    weekdays: [3],
    skip: [],
    extra: [],
    weekOverlay: {},
    weekNote: {},
    meetings: {},
    members: [],
    events: [],
    activity: { title: "", mins: 10 },
    wallOn: [],
  };
}

describe("club hour from agenda", () => {
  it("brief and work read the one agenda line", () => {
    const file = patchMeeting(club(), "2026-09-16", { agenda: "Choice stations · late bus names" });
    const slots = layClubSlots(file, "2026-09-16");
    const brief = slots.find((s) => s.kind === "brief");
    const work = slots.find((s) => s.kind === "work");
    assert.equal(brief?.line, "Choice stations · late bus names");
    assert.equal(work?.line, "Choice stations · late bus names");
    assert.equal(defaultClubLine(slot("sign", "Name, station, late bus."), "Choice stations"), "Name, station, late bus.");
  });
});
