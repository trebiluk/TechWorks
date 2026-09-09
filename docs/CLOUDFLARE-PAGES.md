# Cloudflare Pages (GitHub → tw.kulibert.net)

Classroom scores still live **on the workstation browser** until the live pipe is built. This only hosts the app.

## Connect GitHub

Repo: `trebiluk/TechWorks` (not TechWorkz). Prefer **private**.

Cloudflare → Workers & Pages → Continue with GitHub:

| Setting | Value |
|---|---|
| Project name | `kulibert-desk` |
| Branch | `main` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `.output/public` |
| Node | `22` |

`CF_PAGES` is set automatically. Nitro then uses the `cloudflare_pages` preset (not Vercel). `db:migrate` no-ops without `DATABASE_URL`.

Local check: `npm run build:pages`

After Success, copy **your** `*.pages.dev` URL. Name.com CNAME `tw` → that host. Pages → Custom domains → `tw.kulibert.net`.

Do not point `tw` at `techworks.pages.dev` (someone else’s blog).
