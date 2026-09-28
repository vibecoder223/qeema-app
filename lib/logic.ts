/* Derived state. Pure functions of State: nothing here is stored, so nothing can drift. */
import { LEVERS, TODAY } from "./data";
import { days, fmtDate, pad, person, short } from "./format";
import type { Doc, Entitlement, Filter, Org, PersonId, Position, Question, Stage, State, Tender } from "./types";

export const READ_STEPS = 6;

/* ── documents ── */
export function docState(d: Doc): "ok" | "exp" | "soon" | "self" | "miss" {
  if (d.st === "miss" || d.st === "self") return d.st;
  if (!d.exp) return "ok";
  const n = days(d.exp);
  if (n < 0) return "exp";
  if (n <= 30) return "soon";
  return "ok";
}
export function docLabel(d: Doc): [ReturnType<typeof docState>, string] {
  const s = docState(d);
  if (s === "miss") return ["miss", "Missing"];
  if (s === "self") return ["self", "Self-reported"];
  if (s === "exp") return ["exp", `Expired ${-days(d.exp!)}d ago`];
  if (s === "soon") return ["soon", `Expires in ${days(d.exp!)}d`];
  return ["ok", d.exp ? "Valid to " + short(d.exp) : "On file"];
}
export const docById = (s: State, id: string) => s.docs.find((d) => d.id === id) ?? null;

/* ── ICV position: derived, never selected. Certificate × tender gating × company age. ── */
export function isExempt(org: Pick<Org, "est">): boolean {
  const end = new Date(org.est + "T12:00:00");
  end.setFullYear(end.getFullYear() + 2);
  return end > TODAY;
}
export function exemptEnd(org: Pick<Org, "est">): string {
  const e = new Date(org.est + "T12:00:00");
  e.setFullYear(e.getFullYear() + 2);
  return e.toISOString().slice(0, 10);
}
export function position(s: State, t: Tender): Position {
  const gated = t.gatedOverride === false ? false : t.meta.gated;
  if (s.org.cert) return "certified";
  if (!gated) return "advantaged";
  if (isExempt(s.org)) return "exempt";
  return "excluded";
}
export const POSN: Record<Position, string> = { certified: "Certified", exempt: "Exempt", advantaged: "Advantaged", excluded: "Excluded" };
export const stepsFor = (s: State, t: Tender) =>
  position(s, t) === "excluded" ? ["Upload", "Read", "Verdict", "Advisory", "Redirect"] : ["Upload", "Read", "Verdict", "Review", "Export"];

/* ── questions ── */
export type BadgeKey = "rec" | "drf" | "gap" | "hum" | "apr" | "chg";
export function badge(q: Question): [BadgeKey, string] {
  if (q.changed) return ["chg", "Changed · re-review"];
  if (q.status === "approved") return ["apr", "Approved"];
  if (!q.a && q.reuse === "gap") return ["gap", "No source"];
  if (!q.a && q.reuse === "human") return ["hum", "Yours to write"];
  if (q.reuse === "vault") return ["rec", "From records"];
  return ["drf", "Drafted · review"];
}
export const STCLS: Record<BadgeKey, string> = { rec: "ok", drf: "drf", gap: "soon", hum: "soon", apr: "apr", chg: "exp" };
export const ROWLABEL: Record<BadgeKey, string> = { chg: "Changed, re-review", apr: "Approved", gap: "No source", hum: "Yours to write", rec: "From records", drf: "Needs review" };

export function prog(t: Tender) {
  const p = { total: 0, approved: 0, todo: 0, records: 0, write: 0, review: 0 };
  t.qs.forEach((q) => {
    p.total++;
    const b = badge(q)[0];
    if (b === "apr") p.approved++;
    else { p.todo++; if (b === "rec") p.records++; else if (b === "gap" || b === "hum") p.write++; else p.review++; }
  });
  return p;
}
export const openThread = (q: Question) => q.thread.some((m) => !m.res);
export const qById = (t: Tender, id: string | null) => t.qs.find((q) => q.id === id) ?? null;
export const todo = (t: Tender) => t.qs.filter((q) => q.status !== "approved" || q.changed);

export const FILTERS: [Filter, string][] = [["todo", "To do"], ["rec", "From records"], ["write", "Needs writing"], ["review", "Needs review"], ["apr", "Approved"], ["all", "All"]];
export function inFilter(q: Question, f: Filter): boolean {
  const b = badge(q)[0];
  if (f === "all") return true;
  if (f === "apr") return b === "apr";
  if (f === "todo") return b !== "apr";
  if (f === "rec") return b === "rec";
  if (f === "write") return b === "gap" || b === "hum";
  if (f === "review") return b === "drf" || b === "chg";
  return true;
}
/* Who approves by default: the bid manager, except her own answers, which go to her deputy. */
export const approverFor = (q: Question): PersonId => (q.owner === "u1" ? "u3" : "u1");
export function canApprove(s: State, q: Question): [boolean, string] {
  if (!q.a) return [false, "Nothing to approve yet"];
  if (!q.owner) return [false, "Assign an owner first"];
  if (q.owner === s.me) return [false, "You own this one. The approver is never the owner."];
  if (q.status === "approved") return [false, "Already approved"];
  return [true, ""];
}

/* ── export gate ── */
export const annexes = (s: State, t: Tender) => s.docs.filter((d) => d.annex && (!d.energyOnly || t.meta.gated));

type Blocker =
  | { k: "q"; q: Question; t: string; d: string }
  | { k: "th"; q: Question; t: string; d: string }
  | { k: "doc"; doc: Doc; t: string; d: string }
  | { k: "ent"; e: Entitlement; t: string; d: string };
export function blockers(s: State, t: Tender): Blocker[] {
  const out: Blocker[] = [];
  t.qs.forEach((q) => { if (q.status !== "approved") out.push({ k: "q", q, t: "Question " + pad(q.no), d: q.a ? "not approved" : "not answered" }); });
  t.qs.forEach((q) => { if (openThread(q)) out.push({ k: "th", q, t: "Question " + pad(q.no), d: "open comment thread" }); });
  if (s.org.vaultOn || t.settings.vault)
    annexes(s, t).forEach((d) => { if (docState(d) === "exp") out.push({ k: "doc", doc: d, t: d.n, d: `expired ${-days(d.exp!)} days ago · replace in Company profile` }); });
  t.ent.forEach((e) => { if (e.sig && !e.done) out.push({ k: "ent", e, t: e.n, d: "needs your signature" }); });
  return out;
}
export type GateRow =
  | { kind: "profile"; t: string; d: string; go: string }
  | { kind: "sign"; id: string; t: string; d: string; go: string }
  | { kind: "question"; q: string; t: string; d: string; go: string }
  | { kind: "review"; t: string; d: string; go: string };
/* Ordered by what gets a bid rejected fastest: stale certificates, missing signatures,
   open arguments, then unapproved answers collapsed into one row. */
export function gateRows(s: State, t: Tender): GateRow[] {
  const b = blockers(s, t), rows: GateRow[] = [];
  b.forEach((x) => { if (x.k === "doc") rows.push({ kind: "profile", t: x.t, d: x.d, go: "Replace" }); });
  b.forEach((x) => { if (x.k === "ent") rows.push({ kind: "sign", id: x.e.id, t: x.t, d: x.d, go: "Sign" }); });
  b.forEach((x) => { if (x.k === "th") rows.push({ kind: "question", q: x.q.id, t: x.t, d: x.d, go: "Open" }); });
  const qs = b.filter((x): x is Extract<Blocker, { k: "q" }> => x.k === "q");
  if (qs.length) {
    const nw = qs.filter((x) => !x.q.a).length;
    rows.push({ kind: "review", t: `${qs.length} question${qs.length > 1 ? "s" : ""} not approved`,
      d: (nw ? nw + " still need writing · " : "") + "Q" + qs.slice(0, 6).map((x) => pad(x.q.no)).join(", Q") + (qs.length > 6 ? "…" : ""), go: "Review" });
  }
  return rows;
}
export function entitlementsFor(s: State, t: Tender): Entitlement[] {
  if (position(s, t) !== "advantaged") return [];
  return [
    { id: "e1", n: "SME set-aside declaration", w: "Tender under QR 5m, reserved for local SMEs", done: true, sig: false },
    { id: "e2", n: "Qatari-content price preference", w: "10% preference, asserted in the cover letter", done: true, sig: false },
    { id: "e3", n: "Performance-guarantee exemption", w: "Requires an authorised signature", done: false, sig: true },
  ];
}
export function letterClaims(s: State, t: Tender): string {
  const pos = position(s, t);
  if (pos === "advantaged") return "We confirm that we are a Qatari-registered SME and claim the set-aside applicable to tenders below QR 5,000,000, the Qatari-content price preference, and exemption from the performance guarantee, under Cabinet Decision No. 11 of 2022.";
  if (pos === "exempt") return `We confirm that we were established in the State of Qatar on ${fmtDate(s.org.est)} and are exempt from mandatory In-Country Value under the Tawteen two-year provision.`;
  if (pos === "certified" && s.org.cert) return `We hold a certified In-Country Value score of ${s.org.cert.score}%, valid to ${fmtDate(s.org.cert.validTo)}. The certificate is attached.`;
  return "";
}

/* ── tender lifecycle ── */
export type Tone = "drf" | "soon" | "miss" | "apr" | "ok";
export function tstatus(s: State, t: Tender): [Tone, string] {
  if (t.readN < READ_STEPS) return ["drf", "Reading"];
  if (!t.det.ok) return ["soon", "Confirm details"];
  if (position(s, t) === "excluded") return ["miss", "Not eligible"];
  if (t.go === "nogo") return ["miss", "No bid"];
  if (!t.go) return ["soon", "Go / no-go"];
  if (t.outcome === "won") return ["apr", "Won"];
  if (t.outcome === "lost") return ["miss", "Lost"];
  if (t.exported) return ["ok", "Submitted"];
  if (!gateRows(s, t).length) return ["ok", "Ready"];
  return prog(t).approved ? ["drf", "In review"] : ["drf", "Drafting"];
}
/* Can the user open this stage yet? Details must be confirmed; drafting needs a go decision. */
export function stageOpen(s: State, t: Tender, n: Stage): boolean {
  if (t.readN < READ_STEPS && n > 2) return false;
  if (n >= 3 && !t.det.ok) return false;
  if (n >= 4 && position(s, t) !== "excluded" && t.go !== "go") return false;
  return n <= t.reached + 1;
}
export const TAB: Record<Stage, string> = { 2: "details", 3: "verdict", 4: "questions", 5: "export" };
export const STAGE_OF: Record<string, Stage> = { details: 2, verdict: 3, questions: 4, export: 5 };
export const tenderPath = (id: string, n: Stage) => `/tenders/${encodeURIComponent(id)}/${TAB[n]}`;

export const libCount = (s: State) => ({
  docs: s.docs.filter((x) => x.id !== "pp" && (x.st === "ok" || x.st === "exp" || x.st === "self")).length,
  pp: s.ppN,
});
export const SRCNAME: Record<string, string> = { "~draft": "Drafted from past proposals", "~off": "Library off · answer by hand", "~gap": "Nothing in your library", "~hum": "Yours to write · prices, plans, staffing" };
export function srcMap(t: Tender) {
  const m: Record<string, number[]> = {}, order: string[] = [];
  t.qs.forEach((q) => {
    const k = q.cite ? q.cite.split(" ·")[0] : !q.a && q.reuse === "gap" ? "~gap" : !q.a && q.reuse === "human" ? "~hum" : q.vaultOff ? "~off" : "~draft";
    if (!m[k]) { m[k] = []; order.push(k); }
    m[k].push(q.no);
  });
  const rank = (k: string) => (k[0] === "~" ? ({ "~draft": 1, "~off": 2, "~gap": 3, "~hum": 4 } as Record<string, number>)[k] : 0);
  order.sort((a, b) => rank(a) - rank(b) || m[b].length - m[a].length);
  return order.map((k) => ({ k, n: m[k] }));
}

/* ── home ── */
export function queue(s: State) {
  const me = s.me, out = { approve: [] as { t: Tender; q: Question }[], write: [] as { t: Tender; q: Question }[], mention: [] as { t: Tender; q: Question; m: Question["thread"][number] }[] };
  const p = person(me)!;
  s.order.forEach((id) => {
    const t = s.tenders[id];
    if (t.readN < READ_STEPS || t.reached < 3 || position(s, t) === "excluded" || t.go !== "go" || t.exported) return;
    t.qs.forEach((q) => {
      if (q.a && q.status !== "approved" && q.owner && q.owner !== me && approverFor(q) === me) out.approve.push({ t, q });
      if (q.owner === me && !q.a) out.write.push({ t, q });
      q.thread.forEach((m) => {
        if (!m.res && m.by !== me && (m.tx.includes("@" + p.name) || m.tx.includes("@" + p.name.split(" ")[0]))) out.mention.push({ t, q, m });
      });
    });
  });
  return out;
}
export function risks(s: State) {
  const open = s.order.map((id) => s.tenders[id]).filter((t) => !t.exported && position(s, t) !== "excluded");
  const out: { d: Doc; st: "exp" | "soon"; tenders: Tender[] }[] = [];
  s.docs.forEach((d) => {
    const st = docState(d);
    if (st !== "exp" && st !== "soon") return;
    const hit = open.filter((t) => annexes(s, t).includes(d));
    const before = hit.filter((t) => st === "exp" || days(d.exp!) < days(t.meta.deadline));
    if (before.length) out.push({ d, st, tenders: before });
  });
  return out.sort((a, b) => (a.st === "exp" ? 0 : 1) - (b.st === "exp" ? 0 : 1));
}
export type Next = { txt: string; stage: Stage | "profile"; go: string; who?: PersonId | null };
export function nextAction(s: State, t: Tender): Next {
  const pos = position(s, t);
  if (t.readN < READ_STEPS) return { txt: "Reading", stage: 2, go: "Open" };
  if (!t.det.ok) return { txt: "Confirm tender details", stage: 2, go: "Confirm" };
  if (t.reached < 3) return { txt: "See the verdict", stage: 3, go: "Open" };
  if (pos === "excluded") return { txt: "Closed to you. See where to bid instead", stage: 5, go: "Open" };
  if (t.go === "nogo") return { txt: "Not bidding · " + (t.goWhy || "no reason given"), stage: 3, go: "Open" };
  if (!t.go) return { txt: "Decide go or no-go", stage: 3, go: "Decide" };
  if (t.outcome) return { txt: t.outcome === "won" ? "Won · answers saved to your library" : "Lost · answers kept for reference", stage: 5, go: "Open" };
  if (t.exported) return { txt: "Submitted. Record the result when it lands", stage: 5, go: "Open" };
  const w = t.qs.filter((q) => !q.a), ap = t.qs.filter((q) => q.a && q.status !== "approved");
  if (w.length) return { txt: w.length + " need writing", who: w.find((q) => q.owner)?.owner ?? null, stage: 4, go: "Review" };
  if (ap.length) return { txt: ap.length + " to approve", who: approverFor(ap[0]), stage: 4, go: "Review" };
  const th = t.qs.filter(openThread);
  if (th.length) return { txt: `${th.length} open thread${th.length > 1 ? "s" : ""}`, stage: 4, go: "Review" };
  const e = t.ent.find((x) => x.sig && !x.done);
  if (e) return { txt: "Sign " + e.n.toLowerCase(), who: "u1", stage: 5, go: "Sign" };
  const dx = annexes(s, t).find((d) => docState(d) === "exp");
  if (dx) return { txt: "Replace " + dx.n.toLowerCase(), stage: "profile", go: "Fix" };
  return { txt: "Ready to export", stage: 5, go: "Export" };
}

/* ── ICV simulator ── */
export function projected(s: State, base: number): number {
  let add = 0;
  LEVERS.forEach((l) => { add += (s.levers[l.id] / l.max) * l.gain; });
  return Math.min(100, base + add);
}
export const icvBase = (s: State) => (s.org.cert ? s.org.cert.score : s.org.self != null ? s.org.self : 41);
