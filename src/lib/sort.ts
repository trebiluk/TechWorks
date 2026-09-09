/** Pure list move. No DOM. Used by the wall (and later other boards). */
export function moveId<T>(order: readonly T[], grab: T, onto: T): T[] {
  if (grab === onto) return order as T[];
  const from = order.indexOf(grab);
  const to = order.indexOf(onto);
  if (from < 0 || to < 0 || from === to) return order as T[];
  const next = order.slice();
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row as T);
  return next;
}
