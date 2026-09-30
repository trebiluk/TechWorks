/** This Chromebook only. No name, no account. A bench color, a sticker, a build. */

export const KID_BENCHES = [
  { id: "cyan", label: "Cyan" },
  { id: "brass", label: "Brass" },
  { id: "violet", label: "Violet" },
  { id: "green", label: "Green" },
] as const;

export const KID_STICKERS = [
  { id: "gear", label: "Gear" },
  { id: "bolt", label: "Bolt" },
  { id: "star", label: "Star" },
  { id: "shield", label: "Shield" },
] as const;

export const KID_BUILDS = ["Catapult", "Racer", "Lamp", "Bridge", "Launcher"] as const;

export type KidStyle = {
  bench: (typeof KID_BENCHES)[number]["id"];
  sticker: (typeof KID_STICKERS)[number]["id"];
  build: (typeof KID_BUILDS)[number];
  sound: boolean;
};

const KEY = "tw-kid-style";

export const DEFAULT_KID_STYLE: KidStyle = {
  bench: "cyan",
  sticker: "gear",
  build: "Catapult",
  sound: false,
};

export function loadKidStyle(): KidStyle {
  if (typeof window === "undefined") return DEFAULT_KID_STYLE;
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) || "") as Partial<KidStyle>;
    const bench = KID_BENCHES.some((b) => b.id === raw.bench) ? raw.bench! : DEFAULT_KID_STYLE.bench;
    const sticker = KID_STICKERS.some((s) => s.id === raw.sticker) ? raw.sticker! : DEFAULT_KID_STYLE.sticker;
    const build = KID_BUILDS.some((b) => b === raw.build) ? raw.build! : DEFAULT_KID_STYLE.build;
    return { bench, sticker, build, sound: Boolean(raw.sound) };
  } catch {
    return DEFAULT_KID_STYLE;
  }
}

export function saveKidStyle(next: KidStyle): KidStyle {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function nextBuild(current: string): KidStyle["build"] {
  const i = KID_BUILDS.indexOf(current as KidStyle["build"]);
  return KID_BUILDS[(i + 1) % KID_BUILDS.length] ?? "Catapult";
}

/** One short shop click. Off unless they turn sound on. */
export function kidBlip() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 660;
    osc.type = "triangle";
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.stop(ctx.currentTime + 0.13);
    window.setTimeout(() => void ctx.close(), 200);
  } catch {
    /* no sound on this desk */
  }
}
