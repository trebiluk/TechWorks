/** In-flight + TTL cache. One Yahoo / NWS fetch per window, even if many clients hit /api. */

type Box<T> = { at: number; value?: T; wait?: Promise<T> };

const boxes = new Map<string, Box<unknown>>();

export function ttlGet<T>(key: string, ttlMs: number, run: () => Promise<T>): Promise<T> {
  let box = boxes.get(key) as Box<T> | undefined;
  if (!box) {
    box = { at: 0 };
    boxes.set(key, box as Box<unknown>);
  }
  const now = Date.now();
  if (box.value !== undefined && now - box.at < ttlMs) return Promise.resolve(box.value);
  if (box.wait) return box.wait;
  box.wait = run()
    .then((value) => {
      box!.value = value;
      box!.at = Date.now();
      box!.wait = undefined;
      return value;
    })
    .catch((err) => {
      box!.wait = undefined;
      throw err;
    });
  return box.wait;
}
