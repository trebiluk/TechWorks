/** Same hash the who book stores. Not the PIN. */

export function hashStudentPin(id: string, pin: string) {
  let h1 = 2166136261;
  let h2 = 2166136261 ^ 0x9e3779b9;
  const s = `${id}|${pin}|tw-pin`;
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 ^ s.charCodeAt(s.length - 1 - i), 2246822519);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
}
