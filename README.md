# Qeema

Qatar tender responses, drafted from a company's own records and reviewed by its team.

**Live demo:** https://vibecoder223.github.io/qeema-app/, with no sign-up. Everything you create stays in
your own browser; **AI connection → Reset demo data** starts over.

**Building the AI backend?** Read [AI-CONTRACT.md](AI-CONTRACT.md). Qeema needs four AI jobs; the app
runs today on a built-in mock and switches to your server when you enter its address under
**AI connection**.

```bash
npm install
npm run dev                       # http://localhost:3100
node examples/mock-server.mjs     # optional: an example AI backend on :8787
```

## What you can do in it

| Where | What |
|---|---|
| **Setup** | Company profile from the commercial registration, ICV status, document library |
| **Home** | What needs you: answers to write, mentions, approvals, documents that could get a bid rejected |
| **New tender** | Upload your own tender (PDF or Word), or try one of three samples. Add tender-only files |
| **Details** | What the reader found, each fact with its source page. Edit, then confirm |
| **Verdict** | ICV position (certified, exempt, advantaged, excluded), then bid / no bid with a named lead |
| **Questions** | Add questions (paste a list), draft with AI, edit, assign, comment with @mentions, approve. The approver is never the owner. Focus mode: `F`, `J`/`K`, `A`, `E`, `Esc` |
| **Export** | The gate, then one zip: response document, submission checklist, manifest, annex files. Record won or lost after |
| **Company profile** | Edit the company, upload and manage the library (open, replace, expiry dates, delete), manage the team |
| **ICV** | The score and what would move it |
| **AI connection** | Mock or your backend. Test, save, reset the demo |

The sidebar's demo panel switches company scenario and who you are acting as, so one person can
play the whole team (the owner writes, someone else approves).

## Code

```
lib/ai/contract.ts   the four AI jobs, typed          ← start here if you are building the backend
lib/ai/mock.ts       the stand-in
lib/ai/http.ts       calls your backend
lib/ai/run.ts        runs the jobs, applies results to the store
lib/types.ts         the domain
lib/logic.ts         derived state: ICV position, progress, the export gate, what needs you
lib/store.ts         one Zustand store, every action; the demo persists to localStorage
lib/files.ts         uploaded files, kept in the browser (IndexedDB)
lib/pack.ts          the bid-pack zip
components/          screens and shared UI; class names from app/globals.css
app/                 routes (static export)
supabase/schema.sql  shared multi-user database, for later
```

Rules the code enforces: ICV position is derived, never chosen. The approver is never the owner.
Editing an approved answer clears the approval. Qeema never drafts prices, plans or staffing,
never submits, never signs.

## Demo links

Any screen in a known state, independent of your session (nothing is saved):
`?demo=home`, `?demo=details`, `?demo=verdict-excluded&s=none`, `?demo=review-panel`,
`?demo=review-focus&as=u3`, `?demo=export-blocked`, `?demo=exported`, `?demo=icv-certified`.
Full list: `SCREENS` in `lib/store.ts`. Options: `s` (cert, score, none, young), `as` (u1–u5), `theme=dark`.

## Deploy

`npm run deploy` builds the static site and publishes it to the `gh-pages` branch, which GitHub Pages
serves. Any static host works: `npm run build` writes `out/`.

To deploy on every push instead, move `scripts/pages-workflow.yml` to `.github/workflows/` (pushing
workflow files needs `gh auth refresh -s workflow`) and switch Pages to "GitHub Actions".

## Later

Shared workspaces (several people in one company, live) need a database and sign-in.
`supabase/schema.sql` has the schema with row-level security; the store is the only thing
that changes to use it.
