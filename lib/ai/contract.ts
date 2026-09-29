/* ═══════════════════════════════════════════════════════════════════════════
   THE AI CONTRACT. The four jobs the backend does, and nothing else.
   Everything else in Qeema (eligibility, review, approval, export) is rules
   and people, and already works. See AI-CONTRACT.md for the HTTP version.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Where a fact came from in a document, so a person can check it in one click. */
export interface SourceRef {
  page: number | null;      // 1-based page, null if unknown
  section?: string | null;  // e.g. "§1.4" or "Schedule B, 2.1"
}

/** A value read from a document, with where it was found. `value: null` means the document does not state it. */
export interface Found<T> {
  value: T | null;
  source: SourceRef | null;
}

/* ── Job 1 · Read the tender ─────────────────────────────────────────────── */
export interface ReadTenderRequest {
  file: File;                 // the tender document (PDF or Word)
}
export interface ReadTenderResult {
  details: {
    reference: Found<string>;          // buyer's tender number, e.g. "QP-2026-0418"
    buyer: Found<string>;
    title: Found<string>;
    deadline: Found<string>;           // ISO date, "2026-10-12"
    deadlineTime: Found<string>;       // "12:00"
    energySector: Found<boolean>;      // true → ICV certificate mandatory
    minIcvScore: Found<number>;        // percent, only when energySector
    clarificationDeadline: Found<string>;
    siteVisit: Found<string>;
    bidBond: Found<string>;
    bidValidity: Found<string>;
    submissionFormat: Found<string>;
    language: Found<string>;
    pages: number;
  };
  questions: {
    section: string;                   // "Technical", "HSE", "Commercial"...
    text: string;                      // the requirement, phrased as a question
    ref: string;                       // where it is in the tender: "Scope of Work, 4.1"
    kind: "answer" | "attach" | "human";  // human = prices, plans, staffing: Qeema never drafts these
  }[];
}

/* ── Job 2 · Draft an answer ─────────────────────────────────────────────── */
export interface LibraryDocRef {
  id: string;                 // the id Qeema gave the document when it was classified (job 3)
  name: string;
  category: string;
  expires: string | null;
}
export interface DraftAnswerRequest {
  question: { text: string; section: string; ref: string };
  tender: { reference: string; buyer: string; title: string };
  company: { name: string; cr: string; established: string; icvScore: number | null; icvCertified: boolean };
  library: LibraryDocRef[];   // what the company has; the backend retrieves text by id from its own index
}
export type DraftAnswerResult =
  | { status: "drafted"; answer: string; citation: { docId: string; docName: string; page: number | null; quote: string }; fromRecords: boolean }
  | { status: "no_source"; missing: string | null }   // say so; never invent. `missing`: the document that would answer it
  | { status: "human" };                              // prices, plans, staffing: a person writes it

/* ── Job 3 · Classify a library document ─────────────────────────────────── */
export interface ClassifyDocumentRequest {
  id: string;                 // keep this id: draft-answer will reference the document by it
  file: File;
}
export interface ClassifyDocumentResult {
  name: string;               // "ISO 45001 certificate"
  category: "Identity" | "Financial" | "Local content" | "Quality and HSE" | "Capability" | "Library" | "Other";
  expires: string | null;     // ISO date, if the document has one
  attachToResponses: boolean; // certificates usually are; policies usually are not
  fields: Record<string, string>;  // anything useful: { score: "48.2", certifier: "..." }
}

/* ── Job 4 · Read the commercial registration (first-run setup) ─────────── */
export interface ReadCrRequest { file: File }
export interface ReadCrResult {
  companyName: string | null;
  crNumber: string | null;
  established: string | null;       // ISO date
  classification: string | null;
  address: string | null;
  employees: string | null;
}

/** An AI backend implements these four. `lib/ai/mock.ts` is the stand-in; `lib/ai/http.ts` calls a server. */
export interface QeemaAI {
  readTender(req: ReadTenderRequest): Promise<ReadTenderResult>;
  draftAnswer(req: DraftAnswerRequest): Promise<DraftAnswerResult>;
  classifyDocument(req: ClassifyDocumentRequest): Promise<ClassifyDocumentResult>;
  readCr(req: ReadCrRequest): Promise<ReadCrResult>;
}
