# Qeema AI contract

Qeema needs **four AI jobs**. Everything else (ICV eligibility, the review and approval
workflow, the export gate, the bid pack) is rules and people, and already works in the app.

Until a backend exists, the app uses a built-in mock (`lib/ai/mock.ts`). To use a real one,
open **AI connection** in the app sidebar, enter your server's base address, and save. Every
upload, read and draft then goes to your server. The setting is per browser.

| # | Job | Endpoint | When the app calls it |
|---|---|---|---|
| 1 | Read the tender | `POST /v1/read-tender` | A user uploads a tender on **New tender** |
| 2 | Draft an answer | `POST /v1/draft-answer` | After job 1, for every answerable question; and **Draft with AI** on any question |
| 3 | Classify a document | `POST /v1/classify-document` | A user uploads to the **Company library**, or attaches a missing document |
| 4 | Read the CR | `POST /v1/read-cr` | First-run setup, step 1 |
| – | Health | `GET /v1/health` | The **Test** button in AI connection. Return 200. |

TypeScript types for every request and response: [`lib/ai/contract.ts`](lib/ai/contract.ts).
The HTTP client: [`lib/ai/http.ts`](lib/ai/http.ts). A runnable example server that returns
canned answers: [`examples/mock-server.mjs`](examples/mock-server.mjs).

## Transport

- Base address, e.g. `https://ai.example.com`. The app appends `/v1/...`.
- Files are sent as `multipart/form-data`; everything else is JSON.
- Optional token from the settings page, sent as `Authorization: Bearer <token>`.
- The app runs in the browser, so the server **must allow CORS** from the app's origin
  (`https://vibecoder223.github.io`, and `http://localhost:3100` for development).
- Non-2xx responses are shown to the user as an error; the app keeps working without the result.

## Rules the backend must follow

These are product rules, not suggestions. The app is designed around them.

1. **Never invent.** If the library does not support an answer, return `no_source`. An empty
   answer is correct; a fluent unsupported one is a bid-losing bug.
2. **Always cite.** A drafted answer carries the document it came from, the page, and the exact
   quote. Reviewers check the quote, not the answer.
3. **Never draft commercial judgement.** Prices, rates, key staff, mobilisation plans and
   programmes are `human`. A person writes them.
4. **Say where every tender fact came from.** Every field from job 1 carries its page and section,
   or `null` if the tender does not state it. People confirm these before anything else happens.
5. **Keep document ids.** Job 3 receives an `id`. Store the document's text under it. Job 2 sends
   only ids (`library[].id`); retrieve the text from your own index.

## 1 · Read the tender

`POST /v1/read-tender`, multipart field `file`.

```json
{
  "details": {
    "reference":             { "value": "QP-2026-0418", "source": { "page": 1, "section": null } },
    "buyer":                 { "value": "QatarEnergy", "source": { "page": 1, "section": null } },
    "title":                 { "value": "Facilities management, Ras Laffan", "source": { "page": 1, "section": null } },
    "deadline":              { "value": "2026-10-12", "source": { "page": 3, "section": "§1.4" } },
    "deadlineTime":          { "value": "12:00", "source": { "page": 3, "section": "§1.4" } },
    "energySector":          { "value": true, "source": { "page": 2, "section": "§1.2" } },
    "minIcvScore":           { "value": 35, "source": { "page": 14, "section": "§7.2" } },
    "clarificationDeadline": { "value": "2026-10-01", "source": { "page": 3, "section": "§1.5" } },
    "siteVisit":             { "value": "30 Sep 2026 · Ras Laffan site office", "source": { "page": 4, "section": "§1.7" } },
    "bidBond":               { "value": "QR 84,000 · 2% of bid value", "source": { "page": 9, "section": "§4.1" } },
    "bidValidity":           { "value": "120 days", "source": { "page": 9, "section": "§4.3" } },
    "submissionFormat":      { "value": "Two sealed envelopes, technical and commercial, by hand", "source": { "page": 5, "section": "§2.1" } },
    "language":              { "value": "Arabic + English", "source": { "page": 2, "section": "§1.3" } },
    "pages": 42
  },
  "questions": [
    { "section": "Company and legal", "text": "State your commercial registration number and date of incorporation.", "ref": "Schedule B, 2.1", "kind": "answer" },
    { "section": "Technical", "text": "Attach your business continuity and disaster-recovery plan.", "ref": "Scope of Work, 4.7", "kind": "attach" },
    { "section": "Commercial", "text": "Provide your mobilisation plan and programme from award.", "ref": "Scope of Work, 6.4", "kind": "human" }
  ]
}
```

- A field the tender does not state: `{ "value": null, "source": null }`.
- `energySector` decides whether an ICV certificate is mandatory. Get it right; a person confirms it.
- `kind`: `answer` (write text), `attach` (a document is the answer), `human` (never drafted).
- Rephrase requirements as questions where needed, but keep `ref` pointing at the original clause.

## 2 · Draft an answer

`POST /v1/draft-answer`, JSON.

```json
{
  "question": { "text": "Describe your HSE management system.", "section": "HSE", "ref": "Schedule D, 1" },
  "tender":   { "reference": "QP-2026-0418", "buyer": "QatarEnergy", "title": "Facilities management, Ras Laffan" },
  "company":  { "name": "Al Rayyan Facilities Management W.L.L.", "cr": "118432", "established": "2016-03-14", "icvScore": 48.2, "icvCertified": true },
  "library":  [
    { "id": "d3f9a1c2", "name": "HSE policy and statistics", "category": "Quality and HSE", "expires": null },
    { "id": "d71b0e44", "name": "ISO 45001", "category": "Quality and HSE", "expires": "2026-10-13" }
  ]
}
```

Response, one of:

```json
{ "status": "drafted",
  "answer": "Al Rayyan operates an ISO 45001-certified HSE system, audited annually since 2022…",
  "citation": { "docId": "d3f9a1c2", "docName": "HSE Policy 2024.pdf", "page": 12,
                "quote": "The Company maintains an HSE management system certified to ISO 45001:2018…" },
  "fromRecords": false }
```
```json
{ "status": "no_source", "missing": "Business continuity plan" }
```
```json
{ "status": "human" }
```

- `fromRecords: true` when the answer is a fact lifted from a record (CR number, a score, a date)
  rather than prose adapted from a past proposal. The app labels them differently.
- `missing`: the document that would answer it, if you can tell. The app asks the user to upload it.
- Past proposals are in the library too. When a bid is marked **Won**, its approved answers become
  a past proposal; prefer them.

## 3 · Classify a document

`POST /v1/classify-document`, multipart fields `id` and `file`.

```json
{
  "name": "ISO 45001 certificate",
  "category": "Quality and HSE",
  "expires": "2027-08-09",
  "attachToResponses": true,
  "fields": { "standard": "ISO 45001:2018", "certifier": "Bureau Veritas" }
}
```

`category` is one of `Identity`, `Financial`, `Local content`, `Quality and HSE`, `Capability`,
`Library`, `Other`. The expiry date drives the warnings that stop bids being rejected for a lapsed
certificate, so extract it whenever the document has one.

## 4 · Read the commercial registration

`POST /v1/read-cr`, multipart field `file`. Arabic or English.

```json
{
  "companyName": "Al Rayyan Facilities Management W.L.L.",
  "crNumber": "118432",
  "established": "2016-03-14",
  "classification": "Grade 3 · Central Tenders Committee",
  "address": "Building 14, Al Wakrah Road, Al Wakrah",
  "employees": "22"
}
```

Any field you cannot read: `null`. The user edits before saving.

## Where the results land in the app

| Result | Shown on |
|---|---|
| Job 1 details | **Details** tab: each field with its source page, editable, confirmed by a person |
| Job 1 questions | **Questions** tab, grouped by section |
| Job 2 | The answer panel: answer, source quote, status (From records / Needs review / No source / Yours to write) |
| Job 3 | **Company profile → Company library**: category, expiry, attach-to-responses |
| Job 4 | **Setup**, step 1 |

Code: `lib/ai/run.ts` calls the jobs and applies results through store actions
(`applyRead`, `applyDraft`, `addDoc`, `orgField`).

## Try it

```bash
node examples/mock-server.mjs     # listens on http://localhost:8787
```

Then in the app: **AI connection** → `http://localhost:8787` → Test → Save. Upload any tender:
it comes back with canned details and questions from the example server, not the built-in mock.
Replace the handlers in that file with real model calls and you have a backend.
