export const GLOSSARY_CATS = [
  "Safety",
  "Measure",
  "Tools",
  "Materials",
  "Process",
  "Design",
  "Crew",
  "Grades",
  "Class",
] as const;

export type GlossaryCat = (typeof GLOSSARY_CATS)[number];

export type GlossaryEntry = {
  id: string;
  term: string;
  say?: string;
  cat: GlossaryCat;
  def: string;
  use: string;
  skill?: string;
};

export const GLOSSARY: GlossaryEntry[] = [
  { id: "ppe", term: "PPE", say: "P-P-E", cat: "Safety", def: "Personal protective equipment — what you wear so a tool cannot hurt you.", use: "Goggles are PPE. No PPE, no tool.", skill: "safety" },
  { id: "goggles", term: "Safety glasses", cat: "Safety", def: "Clear lenses that cover your eyes from chips and dust.", use: "Glasses on before the sander starts.", skill: "safety" },
  { id: "stance", term: "Stance", cat: "Safety", def: "How you plant your feet so the tool does not pull you.", use: "Two feet, off-cut side clear.", skill: "safety" },
  { id: "pinch", term: "Pinch point", cat: "Safety", def: "A place two parts can close on a finger.", use: "Keep thumbs off the hinge pinch point.", skill: "safety" },
  { id: "kerf", term: "Kerf", say: "curf", cat: "Safety", def: "The slot the blade removes. The cut is wider than a pencil line.", use: "Leave the line — the kerf eats wood.", skill: "tools" },
  { id: "offcut", term: "Offcut", cat: "Safety", def: "The leftover piece after a cut. It can kick.", use: "Hold the keep side, not the offcut.", skill: "safety" },
  { id: "clamp", term: "Clamp", cat: "Safety", def: "Holds the work so your hands are not the vise.", use: "Clamp before a cut if the part can spin.", skill: "safety" },
  { id: "pass", term: "Pass", cat: "Safety", def: "Hand a tool handle-first. Never toss.", use: "Pass the square handle-first.", skill: "share" },
  { id: "license", term: "Tool license", cat: "Safety", def: "Teacher says you may use that tool today.", use: "No license, stay at the bench.", skill: "safety" },

  { id: "rule", term: "Rule", cat: "Measure", def: "A straight stick with inches or millimeters. Not a “ruler” in this shop — we say rule.", use: "Hook the rule on the end, then mark.", skill: "measure" },
  { id: "square", term: "Square", cat: "Measure", def: "A tool that checks or marks a 90° corner.", use: "Square the end before you measure length.", skill: "measure" },
  { id: "try-square", term: "Try square", cat: "Measure", def: "A small square for checking if an edge is true.", use: "Hold the stock to the blade. Light under it means not square.", skill: "measure" },
  { id: "true", term: "True", cat: "Measure", def: "Straight, square, or flat enough for the next step.", use: "The edge is true — we can glue.", skill: "measure" },
  { id: "mark", term: "Mark", cat: "Measure", def: "A pencil or knife line you will cut to.", use: "Mark once. Cut on the waste side.", skill: "measure" },
  { id: "waste", term: "Waste side", cat: "Measure", def: "The part of the line the saw is allowed to eat.", use: "Blade on the waste side of the mark.", skill: "measure" },
  { id: "tolerance", term: "Tolerance", cat: "Measure", def: "How far off you may be and still fit.", use: "Our tolerance is a blade width.", skill: "measure" },
  { id: "dimension", term: "Dimension", cat: "Measure", def: "A measured size: length, width, thickness.", use: "Write the three dimensions on the drawing.", skill: "draw" },
  { id: "scale", term: "Scale", cat: "Measure", def: "Drawing smaller or larger than life, in a ratio.", use: "This sketch is 1:2 — half size.", skill: "draw" },
  { id: "caliper", term: "Caliper", say: "CAL-ih-per", cat: "Measure", def: "Tool that reads inside, outside, or depth size.", use: "Caliper the dowel before you drill.", skill: "measure" },

  { id: "saw", term: "Saw", cat: "Tools", def: "Cuts with teeth. Name the kind: backsaw, coping, band.", use: "Backsaw for a straight bench cut.", skill: "tools" },
  { id: "rip", term: "Rip cut", cat: "Tools", def: "Cut along the grain, with the length of the board.", use: "Rip first, then crosscut to length.", skill: "tools" },
  { id: "crosscut", term: "Crosscut", cat: "Tools", def: "Cut across the grain.", use: "Crosscut on the mark, waste side.", skill: "tools" },
  { id: "drill", term: "Drill", cat: "Tools", def: "Makes a round hole. Speed and bit size matter.", use: "Center-punch, then drill.", skill: "tools" },
  { id: "bit", term: "Bit", cat: "Tools", def: "The cutting part that goes in a drill or router.", use: "Chuck the bit all the way in, then back a hair.", skill: "tools" },
  { id: "chuck", term: "Chuck", cat: "Tools", def: "The jaws that hold a bit.", use: "Key out of the chuck before you spin.", skill: "tools" },
  { id: "file", term: "File", cat: "Tools", def: "Hard teeth that shave metal or plastic. Push, don’t saw.", use: "File forward. Lift on the return.", skill: "tools" },
  { id: "rasp", term: "Rasp", cat: "Tools", def: "Coarse teeth for shaping wood fast.", use: "Rasp the curve, then sand.", skill: "tools" },
  { id: "chisel", term: "Chisel", say: "CHIZ-el", cat: "Tools", def: "Sharp edge for paring wood. Hands behind the edge.", use: "Clamp, both hands on the chisel.", skill: "tools" },
  { id: "mallet", term: "Mallet", cat: "Tools", def: "Soft-face hammer for chisels or assembly.", use: "Mallet, not a steel hammer, on a chisel.", skill: "tools" },
  { id: "sander", term: "Sander", cat: "Tools", def: "Moves abrasive to flatten or smooth.", use: "Keep the sander moving. Don’t dig a dish.", skill: "finish" },
  { id: "hotglue", term: "Hot glue", cat: "Tools", def: "Fast hold. Not structural. Burns.", use: "Hot glue for a mock-up, wood glue for keepers.", skill: "model" },
  { id: "vise", term: "Vise", say: "vice", cat: "Tools", def: "Bench jaws that hold work.", use: "Pad the vise so you don’t dent the face.", skill: "tools" },

  { id: "grain", term: "Grain", cat: "Materials", def: "The direction wood fibers run.", use: "Sand with the grain, not across.", skill: "material" },
  { id: "stock", term: "Stock", cat: "Materials", def: "The piece you start with, before cuts.", use: "Pick stock a little over size.", skill: "material" },
  { id: "plywood", term: "Plywood", cat: "Materials", def: "Thin layers glued with grain crossed.", use: "Plywood edge needs edge-band or paint.", skill: "material" },
  { id: "mdf", term: "MDF", say: "M-D-F", cat: "Materials", def: "Fine wood dust pressed flat. Heavy. Dusty. No grain.", use: "MDF paints well. Don’t get it wet.", skill: "material" },
  { id: "dowel", term: "Dowel", cat: "Materials", def: "Round rod, usually wood.", use: "Drill the same size as the dowel, or a hair under.", skill: "material" },
  { id: "acrylic", term: "Acrylic", say: "uh-KRILL-ik", cat: "Materials", def: "Clear plastic that can crack if clamped too hard.", use: "Peel the film after the cut.", skill: "material" },
  { id: "filament", term: "Filament", cat: "Materials", def: "Plastic string a 3-D printer melts.", use: "PLA is our default filament.", skill: "digital" },
  { id: "scrap", term: "Scrap", cat: "Materials", def: "Too small for the job, still useful for a test.", use: "Test the stain on scrap first.", skill: "material" },
  { id: "fastener", term: "Fastener", cat: "Materials", def: "Screw, nail, bolt — anything that holds parts.", use: "Pilot hole before the fastener.", skill: "model" },
  { id: "pilot", term: "Pilot hole", cat: "Materials", def: "A small hole that guides a screw so the wood does not split.", use: "Pilot, then drive.", skill: "model" },

  { id: "layout", term: "Layout", cat: "Process", def: "Marking all cuts and holes before you make them.", use: "Layout the whole face, then cut.", skill: "measure" },
  { id: "prototype", term: "Prototype", say: "PRO-toh-type", cat: "Process", def: "A first version made to test the idea.", use: "Cardboard prototype before wood.", skill: "model" },
  { id: "iterate", term: "Iterate", say: "IT-uh-rate", cat: "Process", def: "Change the design after a test.", use: "We iterate after the first glue-up fails.", skill: "grit" },
  { id: "dryfit", term: "Dry fit", cat: "Process", def: "Assemble without glue to check the fit.", use: "Dry fit every joint.", skill: "model" },
  { id: "glueup", term: "Glue-up", cat: "Process", def: "The step where glue and clamps lock the parts.", use: "Have clamps ready before the glue-up.", skill: "model" },
  { id: "sanding", term: "Sand", cat: "Process", def: "Abrasive grit that levels a surface. Low number = coarse.", use: "80, then 120, then 180. Don’t skip grit.", skill: "finish" },
  { id: "grit", term: "Grit", cat: "Process", def: "How coarse the sandpaper is. 80 is rough, 220 is fine.", use: "Start coarse only if the surface is rough.", skill: "finish" },
  { id: "coat", term: "Coat", cat: "Process", def: "One layer of paint, stain, or finish.", use: "Thin coats. Dry between.", skill: "finish" },
  { id: "tack", term: "Tack cloth", cat: "Process", def: "Sticky rag that picks dust before a coat.", use: "Tack before paint.", skill: "finish" },
  { id: "cure", term: "Cure", cat: "Process", def: "Finish getting hard, not just dry to the touch.", use: "Cure overnight before you handle it.", skill: "finish" },
  { id: "stain", term: "Stain", cat: "Process", def: "Color that soaks in. Wipe the extra.", use: "Wipe stain with the grain.", skill: "finish" },
  { id: "run", term: "Run", cat: "Process", def: "Paint that dripped and dried as a bump.", use: "Sand the run, then a thin coat.", skill: "finish" },

  { id: "brief", term: "Brief", cat: "Design", def: "The job in one sentence: who, what, constraints.", use: "Read the brief before you sketch.", skill: "draw" },
  { id: "constraint", term: "Constraint", cat: "Design", def: "A limit you must obey — size, time, material.", use: "Six inches is a constraint, not a suggestion.", skill: "draw" },
  { id: "criteria", term: "Criteria", say: "cry-TEER-ee-uh", cat: "Design", def: "How we will judge if it works.", use: "Criteria: stands, fits, looks finished.", skill: "draw" },
  { id: "isometric", term: "Isometric", say: "eye-so-MET-rik", cat: "Design", def: "A 3-D drawing with 30° angles, no vanishing point.", use: "Isometric sketch of the box.", skill: "draw" },
  { id: "orthographic", term: "Orthographic", say: "or-tho-GRAF-ik", cat: "Design", def: "Front, top, side views. True size, no perspective.", use: "Three orthographic views before CAD.", skill: "draw" },
  { id: "cad", term: "CAD", say: "cad", cat: "Design", def: "Computer-aided design — a drawing the machine or crew can follow.", use: "Export the CAD before you cut.", skill: "digital" },
  { id: "exploded", term: "Exploded view", cat: "Design", def: "Parts drawn apart so you can see the order.", use: "Exploded view for the assembly.", skill: "draw" },
  { id: "prototype2", term: "Mock-up", cat: "Design", def: "Cheap stand-in for size and feel.", use: "Paper mock-up of the handle.", skill: "model" },

  { id: "crew", term: "Crew", cat: "Crew", def: "Your 3–4 person team for the cycle.", use: "Sit with your crew.", skill: "team" },
  { id: "lead", term: "Crew lead", cat: "Crew", def: "The person who scores 3 / 2 / 1 and keeps the crew moving.", use: "Lead names the next step.", skill: "leadsoft" },
  { id: "station", term: "Station", cat: "Crew", def: "A set place to work: saw, sand, glue, CAD.", use: "One crew at a station.", skill: "team" },
  { id: "handoff", term: "Handoff", cat: "Crew", def: "Passing the job to the next person, ready.", use: "Handoff: parts labeled, tools back.", skill: "share" },
  { id: "cleanup", term: "Cleanup", cat: "Crew", def: "Last minutes: tools, scraps, floor, seats.", use: "Cleanup is a job, not a suggestion.", skill: "care" },
  { id: "demo", term: "Demo", cat: "Crew", def: "Teacher shows once. Eyes on, then you try.", use: "Demo first. Hands after.", skill: "listen" },

  { id: "beginning", term: "Beginning", cat: "Grades", def: "Skill 1. Needs a demo. Not independent.", use: "Beginning on the saw — watch first.", skill: "tools" },
  { id: "developing", term: "Developing", cat: "Grades", def: "Skill 2. Can do it with a check-in.", use: "Developing — I’ll look after your first cut.", skill: "tools" },
  { id: "proficient", term: "Proficient", say: "pruh-FISH-ent", cat: "Grades", def: "Skill 3. Independent. Meets the standard.", use: "Proficient means I can leave you on it.", skill: "tools" },
  { id: "distinguished", term: "Distinguished", cat: "Grades", def: "Skill 4. You can teach a crewmate.", use: "Distinguished: you demo the sander.", skill: "leadsoft" },
  { id: "blank", term: "Blank mark", cat: "Grades", def: "Not scored yet. Not a zero.", use: "Blank means I have not seen it.", skill: "present" },
  { id: "effort", term: "Effort", cat: "Grades", def: "Daily 3 / 2 / 1 from the crew lead. Not the skill grade.", use: "Effort is today. Skills are the year.", skill: "time" },
  { id: "evidence", term: "Evidence", cat: "Grades", def: "What I can see: a part, a photo, a sentence.", use: "Evidence is the finished edge, not “I tried.”", skill: "present" },
  { id: "evstem", term: "Evidence stem", cat: "Grades", def: "The sentence that matches a 1, 2, 3, or 4 — what I can see in the room.", use: "A 3 on Measure: Mark is true within a blade width.", skill: "present" },

  { id: "stem", term: "STEM", cat: "Design", def: "Science, Technology, Engineering, Math — the four letters on a unit.", use: "Simple machines is STEM because we measure force and build a machine.", skill: "draw" },
  { id: "driveq", term: "Driving question", cat: "Design", def: "The one question the unit tries to answer. Not a worksheet title.", use: "How can a small force move a bigger load?", skill: "draw" },
  { id: "science", term: "Science", cat: "Design", def: "What the material, force, or test does. Not a separate science grade.", use: "Science on the dragster: how shape changes speed.", skill: "model" },
  { id: "technology", term: "Technology", cat: "Design", def: "The tools, files, and process that make the part.", use: "Technology: the saw, the CAD file, the grit order.", skill: "tools" },
  { id: "engineering", term: "Engineering", cat: "Design", def: "Design, constraints, test, change. The loop.", use: "Engineering: we dropped the extra axle after the test.", skill: "model" },
  { id: "math", term: "Math", cat: "Design", def: "Measure, size, scale, and whether the numbers hold.", use: "Math: the mark is true within a blade width.", skill: "measure" },
  { id: "unit", term: "Unit", cat: "Class", def: "A project with a driving question and STEM letters. Skills stay 1–4.", use: "This unit is Simple machines. Watch Measure today.", skill: "draw" },

  { id: "alias", term: "Alias", say: "AY-lee-us", cat: "Class", def: "Shop first name on the wall. Not your legal name.", use: "The board shows aliases.", skill: "present" },
  { id: "xp", term: "XP", cat: "Class", def: "Skill points. They make your level. Not dollars.", use: "XP comes from skills, not the store.", skill: "present" },
  { id: "perks", term: "Perks", cat: "Class", def: "Class cash for showing up and doing the job. A game.", use: "Perks buy store items. They are not the grade.", skill: "time" },
  { id: "stock$", term: "Stock", cat: "Class", def: "Optional money you invest in the market minigame.", use: "Stock is a separate game from XP.", skill: "digital" },
  { id: "cycle", term: "Cycle", cat: "Class", def: "A block of days on one project, usually four class meetings.", use: "Cycle 1, day 2 is design.", skill: "time" },
  { id: "phase", term: "Phase", cat: "Class", def: "Where the project is: idea, design, model, finish, present.", use: "We are in the model phase.", skill: "draw" },
];

export function searchGlossary(q: string, cat?: GlossaryCat | "All"): GlossaryEntry[] {
  const n = q.trim().toLowerCase();
  return GLOSSARY.filter((e) => {
    if (cat && cat !== "All" && e.cat !== cat) return false;
    if (!n) return true;
    const blob = `${e.term} ${e.say ?? ""} ${e.def} ${e.use} ${e.cat}`.toLowerCase();
    return n.split(/\s+/).every((w) => blob.includes(w));
  });
}

export function glossaryLetters(): string[] {
  return [...new Set(GLOSSARY.map((e) => e.term[0]!.toUpperCase()))].sort();
}
