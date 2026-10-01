/** One durable book for marks, prefs, and the alias list. Not the cache. */

type BookState = {
  storage: {
    get(key: string): Promise<string | undefined>;
    put(key: string, value: string): Promise<void>;
  };
};

export class DeskBook {
  constructor(private readonly state: BookState) {}

  async fetch(req: Request): Promise<Response> {
    const key = decodeURIComponent(new URL(req.url).pathname.replace(/^\//, ""));
    if (!key || key.length > 80) return new Response("bad", { status: 400 });
    if (req.method === "GET") {
      const value = await this.state.storage.get(key);
      if (value == null) return new Response("", { status: 404 });
      return new Response(value);
    }
    if (req.method === "PUT") {
      const text = await req.text();
      if (text.length > 1_000_000) return new Response("big", { status: 413 });
      await this.state.storage.put(key, text);
      return new Response("ok");
    }
    return new Response("no", { status: 405 });
  }
}
