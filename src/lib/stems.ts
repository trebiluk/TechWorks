/** Observable 1–4 evidence stems. One sentence the teacher can see in the room. */
export const STEM_LETTERS = ["S", "T", "E", "M"] as const;
export type StemLetter = (typeof STEM_LETTERS)[number];

export const STEM_LABEL: Record<StemLetter, string> = {
  S: "Science",
  T: "Technology",
  E: "Engineering",
  M: "Math",
};

/** Workshop meaning — not a second MST score. */
export const STEM_WHY: Record<StemLetter, string> = {
  S: "Materials, force, speed, and what the test showed.",
  T: "Tools, files, and the process that made the part.",
  E: "The design: constraints, ideas, and the next change.",
  M: "Measure, size, scale, and whether the numbers hold.",
};

const LETTERS: Record<string, StemLetter[]> = {
  safety: ["T", "E"],
  measure: ["M", "T"],
  draw: ["E", "M"],
  model: ["E", "S"],
  material: ["S", "T"],
  tools: ["T", "E"],
  finish: ["T", "S"],
  present: ["E"],
  digital: ["T", "M"],
  team: ["E"],
  listen: ["E"],
  share: ["E"],
  grit: ["E"],
  care: ["T", "S"],
  time: ["E"],
  leadsoft: ["E"],
};

type Ladder = [string, string, string, string];

const LADDER: Record<string, Ladder> = {
  safety: [
    "Needs a reminder for glasses or stance.",
    "Puts PPE on after a check-in.",
    "PPE on, stance set, asks before a new tool.",
    "Stops a crewmate who skipped PPE.",
  ],
  "safety:ppe": [
    "Glasses off or on the forehead.",
    "Glasses on after a prompt.",
    "Glasses on before the tool starts.",
    "Checks a crewmate’s PPE first.",
  ],
  "safety:ask": [
    "Grabs a tool without asking.",
    "Asks after picking it up.",
    "Asks, then waits for the nod.",
    "Tells the crew which tool is licensed today.",
  ],
  "safety:zone": [
    "Stands in the swing or offcut path.",
    "Moves after a warning.",
    "Stands clear before the cut.",
    "Clears the zone for someone else.",
  ],
  measure: [
    "Mark is a guess. Needs a demo.",
    "Mark is close with a check-in.",
    "Mark is true within a blade width.",
    "Catches a bad mark before the cut.",
  ],
  "measure:rule": [
    "Does not hook the rule.",
    "Hooks the rule after a prompt.",
    "Hooks, reads, marks once.",
    "Reads 1/8 without counting hash marks aloud.",
  ],
  "measure:square": [
    "Ignores square. Edge is off.",
    "Uses square after a prompt.",
    "Squares the end before length.",
    "Shows light under a false edge.",
  ],
  "measure:layout": [
    "Lines wander. Waste side unclear.",
    "Layout works with a check-in.",
    "Keep vs waste is marked. Cut to the line.",
    "Transfers a measurement to a second part.",
  ],
  draw: [
    "No sketch, or it cannot be followed.",
    "Sketch exists with a check-in.",
    "A drawing someone else can follow.",
    "Drawing has sizes another crew could build.",
  ],
  "draw:sketch": [
    "Blank page or doodle only.",
    "Rough boxes after a prompt.",
    "Part shape is readable.",
    "Shows hidden edges or a second view.",
  ],
  "draw:dimension": [
    "No sizes on the page.",
    "One size, others missing.",
    "Key sizes are on the drawing.",
    "Sizes match the stock they picked.",
  ],
  model: [
    "Part does not match the idea.",
    "Part stands with help.",
    "Prototype stands and matches the plan.",
    "Tests, then revises without being told.",
  ],
  "model:fit": [
    "Parts do not meet.",
    "Fit after a teacher tweak.",
    "Joints close without a gap you can see.",
    "Names why a joint is loose and fixes it.",
  ],
  "model:test": [
    "Does not try the part.",
    "Tries once if asked.",
    "Tests the move the design promised.",
    "Changes the part because the test failed.",
  ],
  material: [
    "Grabs any scrap.",
    "Picks stock after a prompt.",
    "Chooses stock without extra offcuts.",
    "Names grain or waste before cutting.",
  ],
  tools: [
    "Wrong tool, or cannot name the risk.",
    "Right tool after a check-in.",
    "Sets the tool, names the risk, puts it back.",
    "Coaches a crewmate on setup.",
  ],
  "tools:hand": [
    "Holds a hand tool backwards or loose.",
    "Grip is ok after a prompt.",
    "Control is steady. Cut stays on waste.",
    "Shows a safer grip without being asked.",
  ],
  "tools:power": [
    "Not licensed, or starts before ready.",
    "Waits, then needs a stance fix.",
    "Licensed, stance set, offcut clear.",
    "Shuts down and waits for the blade.",
  ],
  "tools:return": [
    "Tool left on the bench.",
    "Puts it back after a reminder.",
    "Tool and bit go home before the bell.",
    "Resets the station for the next crew.",
  ],
  finish: [
    "Skips grit or leaves runs.",
    "Sand or paint with a check-in.",
    "Surface is even. No runs.",
    "Can teach grit order or a clean coat.",
  ],
  "finish:sand": [
    "One grit, or circles that show.",
    "Grit order with a prompt.",
    "Grit order, flat, edges eased.",
    "No scratch from a skipped grit.",
  ],
  "finish:paint": [
    "Runs, dry spots, or wet-on-wet.",
    "Coat is ok after a check-in.",
    "Even coat. Waits for dry.",
    "Stops a crewmate from painting wet.",
  ],
  "finish:stain": [
    "Lap marks or puddles.",
    "Wipe with a prompt.",
    "Wipe even. No lap marks.",
    "Tests a scrap before the part.",
  ],
  present: [
    "Cannot say what they built.",
    "Needs prompts for what and why.",
    "A 30-second share: what and why.",
    "Answers a how-it-works question.",
  ],
  digital: [
    "No file, or it does not match the part.",
    "File exists with help.",
    "A file the crew can follow.",
    "File sizes match the built part.",
  ],
  "digital:cad": [
    "Empty or unreadable file.",
    "Shape with a check-in.",
    "Simple CAD the crew can print or trace.",
    "Edits the file after a test fit.",
  ],
  team: [
    "Solo job. Others idle.",
    "Helps when asked.",
    "Jobs split. Crew finishes a step together.",
    "Names the next job without you.",
  ],
  listen: [
    "Hands move during the demo.",
    "Watches after a reminder.",
    "Starts after the demo, not during.",
    "Repeats the step for a crewmate.",
  ],
  "listen:demo": [
    "Hands move during the demo.",
    "Eyes on after a reminder.",
    "Eyes on until the demo ends.",
    "Repeats the demo step for a crewmate.",
  ],
  share: [
    "Hogs the station or the talk.",
    "Passes after a prompt.",
    "Does not hoard a station.",
    "Invites a quiet crewmate in.",
  ],
  grit: [
    "Stops at the first stuck.",
    "Tries again if you stand there.",
    "One honest try, then asks.",
    "Names two ways before asking.",
  ],
  care: [
    "Leaves chips, bits, or wet brushes.",
    "Cleans after a second ask.",
    "Cleanup without a second ask.",
    "Leaves the bench better than they found it.",
  ],
  time: [
    "Still cutting at the cleanup bell.",
    "Rushes the last step.",
    "Leaves time for cleanup.",
    "Packs with five minutes left.",
  ],
  leadsoft: [
    "Waits for you to move the crew.",
    "Leads with a script from you.",
    "Runs a 2×2. Names the next step.",
    "Crew moves while you watch another.",
  ],
};

export function stemLettersOf(skillId: string): StemLetter[] {
  const root = skillId.split(":")[0] ?? skillId;
  return LETTERS[skillId] ?? LETTERS[root] ?? ["E"];
}

export function stemOf(skillId: string, n: number): string {
  const i = Math.min(4, Math.max(1, Math.round(n))) - 1;
  const row = LADDER[skillId] ?? LADDER[skillId.split(":")[0] ?? skillId];
  return row?.[i] ?? "";
}

export function stemsOf(skillId: string): { n: 1 | 2 | 3 | 4; text: string }[] {
  return ([1, 2, 3, 4] as const).map((n) => ({ n, text: stemOf(skillId, n) }));
}

export function stemTag(letters: StemLetter[] | undefined): string {
  if (!letters?.length) return "";
  return letters.map((L) => STEM_LABEL[L]).join(" · ");
}
