/** Shop-safe set. Index 0 is the house default (bearcat paw). */
export const AVATARS = [
  "🐾", "🐻", "🦊", "🐺", "🦉", "🐱", "🐶", "🐸", "🐝", "🐢",
  "🌲", "⭐", "⚡", "🔥", "❄️", "🌙", "☀️", "🌊", "🍀", "🎯",
  "🔧", "🪚", "📐", "🪵", "🚀", "🎵", "🎲", "💎", "👑", "🧩",
] as const;

export type AvatarId = (typeof AVATARS)[number];

export function defaultAvatar(id: string): AvatarId {
  if (!id) return AVATARS[0];
  const n = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATARS[n % 8];
}

export function avatarOf(icon: string | undefined, id: string): AvatarId {
  if (icon && (AVATARS as readonly string[]).includes(icon)) return icon as AvatarId;
  return defaultAvatar(id);
}
