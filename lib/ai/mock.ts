/* The stand-in AI. Returns realistic results for the three sample tenders and honest
   empties for anything else, so the app works end to end before a backend exists. */
import { DET, TENDERS, buildQuestions } from "../data";
import type { ClassifyDocumentResult, DraftAnswerRequest, DraftAnswerResult, Found, QeemaAI, ReadTenderResult } from "./contract";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const none = <T,>(): Found<T> => ({ value: null, source: null });
/* "p.3 · §1.4" → { page: 3, section: "§1.4" } */
function src(s?: string) {
  if (!s) return null;
  const m = s.match(/p\.(\d+)/), sec = s.split("·")[1]?.trim() ?? null;
  return { page: m ? +m[1] : null, section: sec };
}
const found = <T,>(value: T | null | undefined, s?: string): Found<T> => (value == null || value === "" ? none<T>() : { value, source: src(s) });

/* Which sample, if any, is this file? Matched on the file name, e.g. "QP-2026-0418-Tender.pdf". */
const sampleOf = (name: string) => Object.keys(TENDERS).find((id) => name.includes(id));

export const mockAI: QeemaAI = {
  async readTender({ file }) {
    await wait(400);
    const id = sampleOf(file.name);
    if (!id) {
      return {
        details: { reference: none(), buyer: none(), title: { value: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "), source: null },
          deadline: none(), deadlineTime: none(), energySector: none(), minIcvScore: none(), clarificationDeadline: none(), siteVisit: none(),
          bidBond: none(), bidValidity: none(), submissionFormat: none(), language: none(), pages: 0 },
        questions: [],
      };
    }
    const m = TENDERS[id], d = DET[id], s = d.src;
    const qs = buildQuestions(m, { name: "", short: "", cr: "", est: "2016-03-14", addr: "", cls: "", staff: "", cert: null, self: null, vaultOn: true }, true);
    const result: ReadTenderResult = {
      details: {
        reference: found(m.id, s.buyer), buyer: found(m.buyer, s.buyer), title: found(m.title, s.title),
        deadline: found(m.deadline, s.deadline), deadlineTime: found(d.time, s.deadline),
        energySector: found(m.gated, s.energy), minIcvScore: found(m.minIcv, s.minIcv),
        clarificationDeadline: found(d.clar, s.clar), siteVisit: found(d.site, s.site), bidBond: found(d.bond, s.bond),
        bidValidity: found(d.valid, s.valid), submissionFormat: found(d.fmt, s.fmt), language: found(m.lang, s.lang), pages: m.pages,
      },
      questions: qs.map((q) => ({ section: q.sec, text: q.text, ref: q.ref, kind: q.reuse === "human" && !q.a && q.sec === "Commercial" ? "human" : q.gapDoc ? "attach" : "answer" })),
    };
    return result;
  },

  async draftAnswer(req: DraftAnswerRequest): Promise<DraftAnswerResult> {
    await wait(500);
    /* Qeema never drafts commercial judgement: prices, plans, staffing. */
    if (/\bpric(e|es|ing)\b|schedule of rates|rate schedule|key staff|mobilisation|programme|staffing/i.test(req.question.text)) return { status: "human" };
    /* The mock only "knows" the sample answers. A real backend retrieves from the library. */
    const q = buildQuestions({ ...Object.values(TENDERS)[0], gated: true }, { name: req.company.name, short: "", cr: req.company.cr, est: req.company.established,
      addr: "", cls: "", staff: "", cert: req.company.icvCertified && req.company.icvScore != null ? { score: req.company.icvScore, validTo: "2027-06-30", fy: "FY2025" } : null, self: null, vaultOn: true }, true)
      .find((x) => x.text.trim().toLowerCase() === req.question.text.trim().toLowerCase());
    if (q?.a && q.cite) {
      const [docName, page] = q.cite.split(" · ");
      const doc = req.library.find((d) => d.name.toLowerCase().includes(docName.split(" ")[0].toLowerCase()));
      return { status: "drafted", answer: q.a, citation: { docId: doc?.id ?? "", docName, page: page?.startsWith("p.") ? +page.slice(2) : null, quote: q.quote ?? "" }, fromRecords: q.reuse === "vault" };
    }
    return { status: "no_source", missing: null };
  },

  async classifyDocument({ file }): Promise<ClassifyDocumentResult> {
    await wait(250);
    const n = file.name.toLowerCase(), base = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
    const rule: [RegExp, ClassifyDocumentResult["category"], boolean][] = [
      [/\bcr\b|commercial reg|trade licen|tax card|classification/, "Identity", true],
      [/audit|financial|bank|accounts/, "Financial", true],
      [/icv|in-country|tawteen/, "Local content", true],
      [/iso|hse|safety|quality|policy|continuity|security/, "Quality and HSE", /iso/.test(n)],
      [/\bcv\b|resume|reference|project/, "Capability", /\bcv\b/.test(n)],
      [/proposal|submission|response/, "Library", false],
    ];
    const hit = rule.find(([re]) => re.test(n));
    return { name: base, category: hit?.[1] ?? "Other", expires: null, attachToResponses: hit?.[2] ?? false, fields: {} };
  },

  async readCr() {
    await wait(400);
    return { companyName: "Al Rayyan Facilities Management W.L.L.", crNumber: "118432", established: "2016-03-14",
      classification: "Grade 3 · Central Tenders Committee", address: "Building 14, Al Wakrah Road, Al Wakrah", employees: "22" };
  },
};
