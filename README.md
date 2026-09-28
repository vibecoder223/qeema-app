# Qeema app

Qatar tender responses, drafted from a company's own records and reviewed by its team.
Next.js 15 (App Router), TypeScript, Zustand. Demo data is fictional; nothing talks to a server yet.

```bash
npm install
npm run dev        # http://localhost:3100
```

## The flow

| Route | What happens |
|---|---|
| `/setup` | First run: commercial registration, ICV status, company document library |
| `/home` | What needs you: answers to write, mentions, approvals, documents that could get a bid rejected |
| `/tenders/new` | Drop a tender, choose sources (company library, tender-only files) |
| `/tenders/[id]/details` | Qeema reads the tender, then a person confirms the key fields, each with its source page |
| `/tenders/[id]/verdict` | ICV position (certified, exempt, advantaged, excluded), then an explicit bid / no-bid decision with a named lead |
| `/tenders/[id]/questions` | Every answer reviewed and approved by someone other than its owner. Threads, @mentions, focus mode (`F`, `J`/`K`, `A`, `E`, `Esc`) |
| `/tenders/[id]/export` | The gate, the bid pack, the response document. Download only. Record won or lost afterwards |
| `/profile` | The company library: upload once, reused in every tender |
| `/icv` | ICV score, and what would move it |

A tab you cannot open yet redirects to the furthest one you can.

## Code

```
lib/types.ts      the domain
lib/data.ts       fixtures: the company, three tenders, the questions each produces
lib/logic.ts      derived state: position, progress, the export gate, what needs you
lib/store.ts      one Zustand store, every action, persisted to localStorage
components/       screens and shared UI; class names from app/globals.css
app/              routes
```

Rules the code enforces: ICV position is derived, never chosen. The approver is never the owner.
Editing an approved answer clears the approval. Qeema never drafts prices, plans or staffing,
never submits, never signs.

## Demo links

Any screen in a known state, independent of your session (nothing is saved):
`/?demo=home`, `/?demo=details`, `/?demo=verdict-excluded&s=none`, `/?demo=review-panel`,
`/?demo=review-focus&as=u3`, `/?demo=export-blocked`, `/?demo=exported`, `/?demo=icv-certified`.
Full list: `SCREENS` in `lib/store.ts`. Options: `s` (cert, score, none, young), `as` (u1–u5), `theme=dark`.

The sidebar's demo panel switches company scenario and who you are acting as. "Jump in" resets.

## Next steps

Replace the store's localStorage persistence with a database and auth, then the fixture
reader with real document parsing. Screens read state through `useStore` and derive
everything through `lib/logic.ts`, so neither step changes them.
