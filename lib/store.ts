"use client";
/* One store. Every mutation is an action below; screens read state and derive the rest (lib/logic.ts).
   Persisted to localStorage for the demo. Swapping this for a database is a change to this file, not the screens. */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { DET, GAPANS, PEOPLE, SCEN, TENDERS, TODAY, baseDocs, buildQuestions } from "./data";
import { fmtDate, now, pad, person } from "./format";
import {
  READ_STEPS, approverFor, blockers, canApprove, docById, entitlementsFor, position, POSN, qById, stageOpen, tenderPath, todo,
} from "./logic";
import type { Filter, PersonId, Question, ScenarioKey, Stage, State, Tender } from "./types";

/* ── state builders (plain mutations on a draft) ── */
export function fresh(sc: ScenarioKey): State {
  const s = SCEN[sc];
  return {
    scenario: sc, theme: "light", route: "onboard",
    ob: { step: 1, crDone: false, icvPick: null, certDone: false, self: s.self != null ? String(s.self) : "", docsDone: false },
    org: { name: "Al Rayyan Facilities Management W.L.L.", short: "Al Rayyan FM", cr: "118432", est: s.est,
      addr: "Building 14, Al Wakrah Road, Al Wakrah", cls: "Grade 3 · Central Tenders Committee", staff: "22",
      cert: null, self: null, vaultOn: true },
    docs: baseDocs(s), tenders: {}, order: [], cur: null,
    up: { pick: null, cover: true, vault: true, extra: [] },
    filter: "todo", sel: null, focus: false, fi: 0, edit: false, draft: null, cdraft: "", gwhy: "", leadPick: null,
    me: "u1", pop: null, toast: null, levers: { l1: 0, l2: 0, l3: 0 }, exclusions: [],
    quarter: { claimed: 0, submitted: 0, won: 0, lost: 0 }, ppN: 7,
  };
}
export function applyIcvChoice(S: State) {
  const o = S.ob;
  S.org.cert = null; S.org.self = null;
  if (o.icvPick === "cert") S.org.cert = { ...SCEN.cert.cert! };
  if (o.icvPick === "self") { const v = parseFloat(o.self); if (!isNaN(v)) S.org.self = v; }
  const d = docById(S, "icv")!;
  if (S.org.cert) { d.st = "ok"; d.exp = S.org.cert.validTo; d.note = `Score ${S.org.cert.score}% · ${S.org.cert.fy}`; d.annex = true; }
  else if (S.org.self != null) { d.st = "self"; d.exp = null; d.note = `Self-reported ${S.org.self}% · unaudited, not a certificate`; d.annex = false; }
  else { d.st = "miss"; d.exp = null; d.note = "Not held"; d.annex = false; }
}
export function makeTender(S: State, id: string): Tender {
  if (S.tenders[id]) return S.tenders[id];
  const meta = { ...TENDERS[id] };
  const t: Tender = {
    meta, det: { ok: false, okBy: null, value: meta.value, ...structuredClone(DET[id] ?? { src: {} }) },
    go: null, lead: null, goBy: null, goWhy: "", outcome: null, hideGap: {},
    stage: 2, reached: 2, readN: 0, extra: [...S.up.extra],
    settings: { cover: S.up.cover, vault: S.up.vault && S.org.vaultOn },
    gatedOverride: null, exported: false, ent: [], qs: [],
  };
  t.qs = buildQuestions(meta, S.org, t.settings.vault);
  S.tenders[id] = t; S.order.unshift(id);
  return S.tenders[id];
}
function stamp(S: State, q: Question, what: string) { q.log.push(`${what} by ${person(S.me)!.name} · ${now()}`); }
function fillGap(S: State, d: string): number {
  let n = 0;
  S.order.forEach((id) => {
    let k = 0;
    S.tenders[id].qs.forEach((q) => {
      if (q.gapDoc === d && !q.a) {
        const g = GAPANS[d][Math.min(k, GAPANS[d].length - 1)]; k++; n++;
        q.a = g.a; q.cite = g.cite; q.quote = g.quote; q.owner = q.owner || g.owner; q.status = "drafted";
        q.log.push("Drafted from " + g.cite.split(" ·")[0]);
      }
    });
  });
  return n;
}
function markExcluded(S: State, t: Tender) {
  if (position(S, t) === "excluded" && !S.exclusions.includes(t.meta.id)) S.exclusions.push(t.meta.id);
}
/* A realistic quarter: three tenders at different stages, work spread across the team. */
function seedQuarter(S: State) {
  S.quarter = { claimed: 185000, submitted: 2, won: 0, lost: 0 };
  const ready = (id: string, stage: Stage) => {
    const t = makeTender(S, id);
    Object.assign(t, { readN: READ_STEPS, reached: stage, stage, go: "go", lead: "u1", goBy: "u1" });
    t.ent = entitlementsFor(S, t); t.det.ok = true; t.det.okBy = "u1";
    markExcluded(S, t);
    return t;
  };
  const ok = (q: Question) => { q.status = "approved"; q.approver = approverFor(q); q.log.push(`Approved by ${person(q.approver)!.name} · 22 Sep`); };
  /* MOT: nearly done, a few answers waiting on Rand, exemption unsigned */
  const a = ready("QP-2026-0405", 4);
  a.qs.forEach((q) => { if (!q.a && q.reuse === "human") q.owner = "u4"; });
  a.qs.forEach((q, i) => { if (q.a && q.owner && i > 2) ok(q); });
  /* QatarEnergy: early, two human answers on Rand, Faisal mentions her */
  const b = ready("QP-2026-0418", 4);
  b.qs.forEach((q) => { if (!q.a && q.reuse === "human") q.owner = "u1"; });
  b.qs.slice(0, 2).forEach(ok);
  b.qs.forEach((q) => {
    if (q.thread.length) {
      q.thread.push({ id: "m3", by: "u2", at: "Yesterday", tx: "@Rand Al-Sada updated to five and re-cited. Can you approve?", res: false });
      q.a = q.a!.replace("Four Qatari", "Five Qatari").replace("18%", "23%");
    }
  });
  /* Al Wakrah: read, details not yet confirmed */
  const c = makeTender(S, "QP-2026-0392"); c.readN = READ_STEPS; c.reached = 2; c.stage = 2;
  S.cur = null;
}
export function loadScenario(sc: ScenarioKey): State {
  const S = fresh(sc), s = SCEN[sc];
  Object.assign(S.ob, { crDone: true, docsDone: true, icvPick: s.cert ? "cert" : s.self != null ? "self" : "none", certDone: !!s.cert });
  applyIcvChoice(S); seedQuarter(S); S.route = "home";
  return S;
}
function at(S: State, id: string, stage: Stage) {
  const t = S.tenders[id] ?? makeTender(S, id);
  t.readN = READ_STEPS; t.reached = Math.max(t.reached, stage); t.stage = stage;
  if (stage >= 3) { t.det.ok = true; t.det.okBy = t.det.okBy || "u1"; }
  if (stage >= 4 && !t.go) { t.go = "go"; t.lead = "u1"; t.goBy = "u1"; }
  if (!t.ent.length) t.ent = entitlementsFor(S, t);
  markExcluded(S, t);
  Object.assign(S, { cur: id, route: "tender", sel: null, focus: false, filter: "todo" });
  return t;
}
function approveAll(t: Tender) {
  t.qs.forEach((q) => {
    if (!q.a) { q.a = "Answered by the team for this tender, to be confirmed at kick-off."; q.owner = q.owner || "u4"; q.attest = q.owner; }
    if (!q.owner) q.owner = "u4";
    q.thread.forEach((m) => { m.res = true; });
    q.status = "approved"; q.approver = approverFor(q); q.changed = false;
  });
}
const ob = (sc: ScenarioKey, step: 1 | 2 | 3) => { const S = fresh(sc); S.route = "onboard"; S.ob.step = step; if (step > 1) S.ob.crDone = true; return S; };

/* ── demo deep links: /?demo=review-panel · every screen has its own URL ── */
type Screen = { s: ScenarioKey; run: (sc: ScenarioKey) => State };
const T0 = (S: State) => S.tenders[S.cur!];
export const SCREENS: Record<string, Screen> = {
  "setup": { s: "cert", run: (sc) => ob(sc, 1) },
  "setup-company": { s: "cert", run: (sc) => { const S = ob(sc, 1); S.ob.crDone = true; return S; } },
  "setup-icv": { s: "cert", run: (sc) => { const S = ob(sc, 2); S.ob.icvPick = "cert"; S.ob.certDone = true; return S; } },
  "setup-icv-self": { s: "score", run: (sc) => { const S = ob(sc, 2); S.ob.icvPick = "self"; S.ob.self = "44"; return S; } },
  "setup-icv-none": { s: "none", run: (sc) => { const S = ob(sc, 2); S.ob.icvPick = "none"; return S; } },
  "setup-icv-exempt": { s: "young", run: (sc) => { const S = ob(sc, 2); S.ob.icvPick = "none"; return S; } },
  "setup-docs": { s: "cert", run: (sc) => { const S = ob(sc, 3); S.ob.docsDone = true; return S; } },
  "home": { s: "cert", run: (sc) => loadScenario(sc) },
  "home-contributor": { s: "cert", run: (sc) => { const S = loadScenario(sc); S.me = "u3"; return S; } },
  "home-empty": { s: "cert", run: (sc) => { const S = fresh(sc); S.ob.icvPick = "cert"; applyIcvChoice(S); S.route = "home"; return S; } },
  "tenders": { s: "none", run: (sc) => { const S = loadScenario(sc); S.route = "tenders"; return S; } },
  "new": { s: "cert", run: (sc) => { const S = loadScenario(sc); S.route = "new"; S.up.pick = "QP-2026-0418"; return S; } },
  "read": { s: "cert", run: (sc) => { const S = loadScenario(sc); const t = S.tenders["QP-2026-0392"]; t.readN = 2; S.cur = t.meta.id; S.route = "tender"; return S; } },
  "details": { s: "cert", run: (sc) => { const S = loadScenario(sc); S.cur = "QP-2026-0392"; S.route = "tender"; T0(S).stage = 2; return S; } },
  "verdict-certified": { s: "cert", run: (sc) => { const S = loadScenario(sc); at(S, "QP-2026-0418", 3); return S; } },
  "verdict-exempt": { s: "young", run: (sc) => { const S = loadScenario(sc); at(S, "QP-2026-0418", 3); return S; } },
  "verdict-advantaged": { s: "none", run: (sc) => { const S = loadScenario(sc); at(S, "QP-2026-0405", 3); return S; } },
  "verdict-excluded": { s: "none", run: (sc) => { const S = loadScenario(sc); at(S, "QP-2026-0418", 3); return S; } },
  "advisory": { s: "none", run: (sc) => { const S = loadScenario(sc); at(S, "QP-2026-0418", 4); return S; } },
  "redirect": { s: "none", run: (sc) => { const S = loadScenario(sc); at(S, "QP-2026-0418", 5); return S; } },
  "review": { s: "cert", run: (sc) => { const S = loadScenario(sc); at(S, "QP-2026-0418", 4); return S; } },
  "review-panel": { s: "cert", run: (sc) => { const S = loadScenario(sc); const t = at(S, "QP-2026-0418", 4); S.filter = "all"; S.sel = (t.qs.find((q) => q.thread.length) ?? t.qs[3]).id; return S; } },
  "review-focus": { s: "cert", run: (sc) => { const S = loadScenario(sc); const t = at(S, "QP-2026-0418", 4); S.focus = true; S.fi = Math.max(0, todo(t).findIndex((q) => q.a && q.owner && q.owner !== S.me)); return S; } },
  "review-assign": { s: "cert", run: (sc) => { const S = loadScenario(sc); const t = at(S, "QP-2026-0418", 4); S.filter = "all"; const q = t.qs.find((x) => !x.owner) ?? t.qs[4]; S.sel = q.id; S.pop = { q: q.id, x: 1085, y: 318 }; return S; } },
  "review-comment": { s: "cert", run: (sc) => {
    const S = loadScenario(sc); const t = at(S, "QP-2026-0418", 4); S.filter = "all";
    const q = t.qs.find((x) => /injury/.test(x.text))!; S.sel = q.id;
    q.thread = [{ id: "c1", by: "u1", at: "10:02", tx: "@Noor Al-Kuwari is 0.19 the audited figure for 2025, or the internal one?", res: false },
      { id: "c2", by: "u3", at: "10:20", tx: "Audited. Surveillance audit letter, page 2. I'll add it as the source.", res: false }];
    S.cdraft = "Thanks. Approving once the source is swapped."; return S; } },
  "contributor-home": { s: "cert", run: (sc) => { const S = loadScenario(sc); S.me = "u4"; return S; } },
  "contributor-write": { s: "cert", run: (sc) => {
    const S = loadScenario(sc); S.me = "u4"; const t = at(S, "QP-2026-0405", 4); S.filter = "write";
    const q = t.qs.filter((x) => x.reuse === "human")[1] ?? t.qs[t.qs.length - 1]; S.sel = q.id; S.edit = true;
    S.draft = "Full mobilisation within 21 days of award. Week one: site survey and handover. Week two: staff onboarding and equipment delivery. Week three: service start with a supervisor on every site."; return S; } },
  "export-blocked": { s: "none", run: (sc) => { const S = loadScenario(sc); at(S, "QP-2026-0405", 5); return S; } },
  "export-ready": { s: "none", run: (sc) => { const S = loadScenario(sc); const t = at(S, "QP-2026-0405", 5); approveAll(t); t.ent.forEach((e) => { e.done = true; }); docById(S, "tx")!.exp = "2027-09-25"; return S; } },
  "exported": { s: "none", run: (sc) => {
    const S = loadScenario(sc); const t = at(S, "QP-2026-0405", 5); approveAll(t); t.ent.forEach((e) => { e.done = true; });
    docById(S, "tx")!.exp = "2027-09-25"; t.exported = true; S.quarter.submitted++; S.quarter.claimed += 100000; return S; } },
  "profile": { s: "cert", run: (sc) => { const S = loadScenario(sc); S.route = "profile"; return S; } },
  "icv-certified": { s: "cert", run: (sc) => { const S = loadScenario(sc); S.route = "icv"; S.levers = { l1: 1200, l2: 0, l3: 100 }; return S; } },
  "icv-exempt": { s: "young", run: (sc) => { const S = loadScenario(sc); S.route = "icv"; return S; } },
  "icv-self": { s: "score", run: (sc) => { const S = loadScenario(sc); S.route = "icv"; return S; } },
  "icv-none": { s: "none", run: (sc) => { const S = loadScenario(sc); S.route = "icv"; return S; } },
};
/* Where a state lives in the URL space. */
export function pathOf(S: State): string {
  if (S.route === "onboard") return "/setup";
  if (S.route === "tender" && S.cur && S.tenders[S.cur]) return tenderPath(S.cur, S.tenders[S.cur].stage);
  if (S.route === "new") return "/tenders/new";
  return "/" + (S.route === "tender" ? "tenders" : S.route);
}

/* ── persistence. A ?demo= link renders its own state in memory and never writes, so the
   storyboard's iframes stay independent of each other and of your working session. ── */
export const EMBED = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo");
const noop: StateStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

/* ── actions. Those that move the user return the path to go to. ── */
type Path = string | void;
export interface Actions {
  replace: (S: State) => void;
  say: (msg: string | null) => void;
  set: (fn: (S: State) => void) => void;
  jump: () => Path;
  restart: () => Path;
  scen: (k: ScenarioKey) => void;
  actas: (u: PersonId) => void;
  theme: () => void;
  // onboarding
  obcr: () => void; obpick: (k: "cert" | "self" | "none") => void; obcert: () => void; obdocs: () => void;
  obnext: () => void; obback: () => void; obdone: () => Path; obskip: () => Path; obfield: (k: string, v: string) => void; obself: (v: string) => void;
  // company
  togVault: () => void; upload: (id: string) => void; replaceDoc: (id: string) => void; addFiles: (names: string[]) => void;
  // new tender
  newTender: () => void; pick: (id: string | null) => void; togCover: () => void; togUpVault: () => void; addExtra: (n: string[]) => void; rmExtra: (i: number) => void;
  start: () => Path;
  tick: (id: string) => void;
  // tender
  open: (id: string, n?: Stage) => Path;
  stage: (n: Stage) => Path;
  detField: (o: "meta" | "det", k: string, v: string | number | null) => void;
  detok: () => Path; detedit: () => Path; energy: (on: boolean) => void;
  lead: (u: PersonId) => void; gwhy: (v: string) => void; godec: (v: "go" | "nogo") => Path; goreset: () => void;
  correct: () => void; reroute: (id: string) => Path; sign: (id: string) => void; outcome: (v: "won" | "lost" | null) => void;
  // questions
  filter: (f: Filter) => void; sel: (id: string | null) => void; step: (d: number) => void; gapx: (d: string) => void; gapup: (d: string) => void;
  assign: (q: string, x: number, y: number) => void; unpop: () => void; doassign: (u: PersonId) => void;
  write: () => void; edit: () => void; cancel: () => void; draft: (v: string) => void; cdraft: (v: string) => void; save: () => void;
  approve: () => void; sendback: () => void; send: () => void; resolve: () => void;
  focus: (on?: boolean) => void; fstep: (d: number) => void; openq: (id: string, q: string) => Path; approvals: (id: string) => Path;
  goq: (q: string) => Path; goreview: () => Path;
  levers: (id: string, v: number) => void;
  download: () => void;
}
export type Store = State & { hydrated: boolean; a: Actions };

const cur = (S: State) => (S.cur ? S.tenders[S.cur] : null);
const curQ = (S: State) => { const t = cur(S); return t && S.sel ? qById(t, S.sel) : null; };

export const useStore = create<Store>()(
  persist(
    immer((set, get) => {
      const mut = (fn: (S: State) => void) => set((d) => { fn(d as unknown as State); });
      const S = () => get() as State;
      const say = (m: string | null) => set((d) => { d.toast = m; });
      const toStage = (n: Stage): Path => {
        const t = cur(S()); if (!t || !stageOpen(S(), t, n)) return;
        mut((d) => {
          const x = cur(d)!; x.stage = n; x.reached = Math.max(x.reached, n); d.sel = null; d.focus = false; d.edit = false;
          if (n === 3) { if (!x.ent.length) x.ent = entitlementsFor(d, x); markExcluded(d, x); }
        });
        return tenderPath(t.meta.id, n);
      };
      const a: Actions = {
        replace: (next) => mut((d) => { Object.assign(d, next); }),
        say, set: mut,
        jump: () => {
          const sc = S().scenario; const next = loadScenario(sc); next.theme = S().theme;
          mut((d) => { Object.assign(d, next, { toast: "Profile loaded: " + SCEN[sc].label }); }); return "/home";
        },
        restart: () => { const sc = S().scenario, th = S().theme; mut((d) => { Object.assign(d, fresh(sc), { theme: th }); }); return "/setup"; },
        scen: (k) => mut((d) => { d.scenario = k; }),
        actas: (u) => { mut((d) => { d.me = u; d.pop = null; }); say("Acting as " + person(u)!.name); },
        theme: () => mut((d) => { d.theme = d.theme === "dark" ? "light" : "dark"; }),

        obcr: () => mut((d) => { d.ob.crDone = true; }),
        obpick: (k) => mut((d) => { d.ob.icvPick = k; }),
        obcert: () => mut((d) => { d.ob.certDone = true; }),
        obdocs: () => mut((d) => { d.ob.docsDone = true; }),
        obnext: () => mut((d) => { if (d.ob.step === 2) applyIcvChoice(d); d.ob.step = Math.min(3, d.ob.step + 1) as 1 | 2 | 3; }),
        obback: () => mut((d) => { d.ob.step = Math.max(1, d.ob.step - 1) as 1 | 2 | 3; }),
        obdone: () => { mut((d) => { applyIcvChoice(d); d.route = "home"; }); say("Profile saved. Drop your first tender."); return "/home"; },
        obskip: () => { mut((d) => { d.route = "home"; }); return "/home"; },
        obfield: (k, v) => mut((d) => { if (k !== "est") (d.org as unknown as Record<string, string>)[k] = v; }),
        obself: (v) => mut((d) => { d.ob.self = v; }),

        togVault: () => mut((d) => { d.org.vaultOn = !d.org.vaultOn; }),
        upload: (id) => a.gapup(id),
        replaceDoc: (id) => {
          mut((d) => { const x = docById(d, id)!; const e = new Date(TODAY); e.setFullYear(e.getFullYear() + 1); x.exp = e.toISOString().slice(0, 10); x.st = "ok"; });
          say(`${docById(S(), id)!.n} replaced · valid to ${fmtDate(docById(S(), id)!.exp)}`);
        },
        addFiles: (names) => {
          if (!names.length) return;
          mut((d) => names.forEach((nm, i) => d.docs.push({ id: `up${Date.now()}${i}`, g: "Uploaded", n: nm.replace(/\.[^.]+$/, ""),
            note: `Uploaded ${fmtDate(TODAY.toISOString().slice(0, 10))} · used for answers`, st: "ok", exp: null })));
          say(`${names.length} document${names.length > 1 ? "s" : ""} added to your profile`);
        },

        newTender: () => mut((d) => { d.up = { pick: null, cover: true, vault: d.org.vaultOn, extra: [] }; d.route = "new"; }),
        pick: (id) => mut((d) => { d.up.pick = id; }),
        togCover: () => mut((d) => { d.up.cover = !d.up.cover; }),
        togUpVault: () => mut((d) => { d.up.vault = !d.up.vault; }),
        addExtra: (n) => mut((d) => { d.up.extra.push(...n); }),
        rmExtra: (i) => mut((d) => { d.up.extra.splice(i, 1); }),
        start: () => {
          const id = S().up.pick; if (!id) return;
          mut((d) => {
            /* demo: every tender is seeded, so a new upload replaces the seeded copy and reads it fresh */
            if (d.tenders[id]) { delete d.tenders[id]; d.order = d.order.filter((x) => x !== id); }
            makeTender(d, id); Object.assign(d, { cur: id, route: "tender", sel: null, filter: "todo" });
          });
          return tenderPath(id, 2);
        },
        tick: (id) => mut((d) => { const t = d.tenders[id]; if (t && t.readN < READ_STEPS) t.readN++; }),

        open: (id, n) => {
          const t = S().tenders[id]; if (!t) return;
          let st = (n ?? t.stage) as Stage;
          if (st > t.reached + 1) st = (t.reached + 1) as Stage;
          if (!t.det.ok && st > 2) st = 2;
          if (st > 3 && position(S(), t) !== "excluded" && t.go !== "go") st = 3;
          mut((d) => {
            const x = d.tenders[id]; x.stage = st; x.reached = Math.max(x.reached, st);
            if (st === 3) { if (!x.ent.length) x.ent = entitlementsFor(d, x); markExcluded(d, x); }
            Object.assign(d, { cur: id, route: "tender", sel: null, focus: false, filter: "todo" });
          });
          return tenderPath(id, st);
        },
        stage: toStage,
        detField: (o, k, v) => mut((d) => { const t = cur(d)!; (t[o === "meta" ? "meta" : "det"] as unknown as Record<string, unknown>)[k] = v; }),
        detok: () => {
          const t = cur(S())!;
          if (!t.meta.buyer || !t.meta.title || !t.meta.deadline) { say("Buyer, title and deadline are required"); return; }
          mut((d) => { const x = cur(d)!; x.det.ok = true; x.det.okBy = d.me; });
          return toStage(3);
        },
        detedit: () => { mut((d) => { const x = cur(d)!; x.det.ok = false; x.stage = 2; }); return tenderPath(S().cur!, 2); },
        energy: (on) => mut((d) => {
          const t = cur(d)!; t.meta.gated = on; t.gatedOverride = null;
          t.qs = buildQuestions(t.meta, d.org, t.settings.vault); t.ent = entitlementsFor(d, t);
          d.exclusions = d.exclusions.filter((x) => x !== t.meta.id);
        }),
        lead: (u) => mut((d) => { d.leadPick = u; }),
        gwhy: (v) => mut((d) => { d.gwhy = v; }),
        godec: (v) => {
          const w = S().gwhy.trim();
          if (v === "nogo" && !w) { say("Add a reason for not bidding"); return; }
          mut((d) => { const t = cur(d)!; t.go = v; t.lead = d.leadPick || t.lead || d.me; t.goBy = d.me; t.goWhy = w; d.leadPick = null; d.gwhy = ""; });
          if (v === "go") { const p = toStage(4); say(`Bidding. ${person(cur(S())!.lead)!.name.split(" ")[0]} leads it.`); return p; }
          say("Recorded as no bid");
        },
        goreset: () => mut((d) => { const t = cur(d)!; d.leadPick = t.lead; d.gwhy = t.goWhy; t.go = null; }),
        correct: () => {
          mut((d) => {
            const t = cur(d)!; t.meta.gated = false; t.gatedOverride = false;
            d.exclusions = d.exclusions.filter((x) => x !== t.meta.id);
            t.qs = buildQuestions(t.meta, d.org, t.settings.vault); t.ent = entitlementsFor(d, t);
          });
          say(`Corrected. Position re-read as ${POSN[position(S(), cur(S())!)]}.`);
        },
        reroute: (id) => {
          mut((d) => { makeTender(d, id); Object.assign(d, { cur: id, route: "tender", sel: null }); });
          return tenderPath(id, S().tenders[id].stage);
        },
        sign: (id) => { mut((d) => { cur(d)!.ent.forEach((e) => { if (e.id === id) e.done = true; }); }); say("Signed"); },
        outcome: (v) => {
          const t = cur(S())!, was = t.outcome, n = t.qs.filter((q) => q.status === "approved").length;
          mut((d) => {
            const x = cur(d)!;
            if (was) { d.quarter[was]--; d.ppN--; }
            x.outcome = v; if (v) { d.quarter[v]++; d.ppN++; }
            const pp = docById(d, "pp"); if (pp) pp.n = "Past proposals · " + d.ppN;
          });
          if (v) say(`${n} answers saved to your library as a ${v === "won" ? "winning" : "lost"} proposal`);
        },

        filter: (f) => mut((d) => { d.filter = f; }),
        sel: (id) => mut((d) => { d.sel = id; d.edit = false; d.draft = null; }),
        step: (dir) => mut((d) => { const t = cur(d)!, i = t.qs.findIndex((q) => q.id === d.sel); const j = Math.max(0, Math.min(t.qs.length - 1, i + dir)); d.sel = t.qs[j].id; d.edit = false; d.draft = null; }),
        gapx: (id) => mut((d) => { cur(d)!.hideGap[id] = true; }),
        gapup: (id) => {
          let n = 0;
          mut((d) => { const x = docById(d, id)!; x.st = "ok"; x.exp = null; n = fillGap(d, id); });
          say(`${docById(S(), id)!.n} saved to your company library · ${n} question${n !== 1 ? "s" : ""} drafted`);
        },
        assign: (q, x, y) => mut((d) => { d.pop = { q, x, y }; }),
        unpop: () => mut((d) => { d.pop = null; }),
        doassign: (u) => {
          mut((d) => {
            const q = qById(cur(d)!, d.pop!.q)!;
            q.owner = u; if (q.status === "unassigned") q.status = q.a ? "drafted" : "assigned";
            if (q.approver === u) { q.approver = null; if (q.status === "approved") q.status = "drafted"; }
            stamp(d, q, "Assigned to " + person(u)!.name); d.pop = null;
          });
          say("Assigned to " + person(u)!.name);
        },
        write: () => mut((d) => { const q = curQ(d)!; if (!q.owner) { q.owner = d.me; q.status = "assigned"; } d.edit = true; d.draft = q.a || ""; }),
        edit: () => mut((d) => { const q = curQ(d); if (!q) return; d.edit = true; d.draft = q.a || ""; }),
        cancel: () => mut((d) => { d.edit = false; d.draft = null; }),
        draft: (v) => mut((d) => { d.draft = v; }),
        cdraft: (v) => mut((d) => { d.cdraft = v; }),
        save: () => {
          const v = (S().draft || "").trim(); if (!v) { say("Write something first, or cancel."); return; }
          mut((d) => {
            const q = curQ(d)!, was = q.status === "approved";
            q.a = v; if (!q.cite || q.reuse === "human") { q.attest = d.me; q.quote = null; q.cite = null; }
            if (!q.owner) q.owner = d.me;
            q.status = "drafted"; q.approver = null; q.changed = false;
            stamp(d, q, was ? "Edited, approval cleared," : "Written"); d.edit = false; d.draft = null;
          });
        },
        approve: () => {
          const q = curQ(S()); if (!q) return;
          const c = canApprove(S(), q); if (!c[0]) { say(c[1]); return; }
          mut((d) => { const x = curQ(d)!; x.status = "approved"; x.approver = d.me; x.changed = false; stamp(d, x, "Approved"); });
          say("Approved · question " + pad(q.no));
        },
        sendback: () => {
          const v = S().cdraft.trim(); if (!v) { say("Say why it is going back. A comment is required."); return; }
          mut((d) => { const q = curQ(d)!; q.thread.push({ id: "m" + Date.now(), by: d.me, at: "now", tx: v, res: false }); q.status = "drafted"; q.approver = null; stamp(d, q, "Sent back"); d.cdraft = ""; });
        },
        send: () => {
          const v = S().cdraft.trim(); if (!curQ(S()) || !v) return;
          const hit = PEOPLE.find((p) => v.includes("@" + p.name) || v.includes("@" + p.name.split(" ")[0])) ?? null;
          let assigned = false;
          mut((d) => {
            const q = curQ(d)!; q.thread.push({ id: "m" + Date.now(), by: d.me, at: "now", tx: v, res: false }); d.cdraft = "";
            if (hit && !q.owner) { q.owner = hit.id; q.status = q.a ? "drafted" : "assigned"; stamp(d, q, "Assigned to " + hit.name + " by mention"); assigned = true; }
          });
          if (hit) say(hit.name + " mentioned" + (assigned ? " and assigned" : ""));
        },
        resolve: () => mut((d) => { const q = curQ(d)!; q.thread.forEach((m) => { m.res = true; }); stamp(d, q, "Thread resolved"); }),
        focus: (on) => mut((d) => { d.focus = on ?? !d.focus; d.fi = 0; d.edit = false; d.draft = null; }),
        fstep: (dir) => mut((d) => { const L = todo(cur(d)!); d.fi = Math.max(0, Math.min(L.length - 1, d.fi + dir)); d.edit = false; }),
        openq: (id, q) => {
          mut((d) => { const t = d.tenders[id]; t.stage = 4; t.reached = Math.max(t.reached, 4); Object.assign(d, { cur: id, route: "tender", focus: false, filter: "all", sel: q, edit: false }); });
          return tenderPath(id, 4);
        },
        approvals: (id) => {
          mut((d) => { const t = d.tenders[id]; t.stage = 4; t.reached = Math.max(t.reached, 4); Object.assign(d, { cur: id, route: "tender", filter: "review", sel: null, focus: true, fi: 0, edit: false }); });
          return tenderPath(id, 4);
        },
        goq: (q) => { mut((d) => { cur(d)!.stage = 4; Object.assign(d, { focus: false, filter: "all", sel: q }); }); return tenderPath(S().cur!, 4); },
        goreview: () => { mut((d) => { cur(d)!.stage = 4; Object.assign(d, { focus: false, filter: "todo", sel: null }); }); return tenderPath(S().cur!, 4); },
        levers: (id, v) => mut((d) => { d.levers[id] = v; }),
        download: () => {
          const t = cur(S())!; if (blockers(S(), t).length) return;
          mut((d) => { const x = cur(d)!; if (!x.exported) { x.exported = true; d.quarter.submitted++; if (position(d, x) === "advantaged") d.quarter.claimed += 100000; } });
          say("Bid pack downloaded");
        },
      };
      return { ...loadScenario("cert"), hydrated: false, a };
    }),
    {
      name: "qeema.demo.v1",
      version: 1,
      storage: createJSONStorage(() => (EMBED ? noop : localStorage)),
      skipHydration: true,
      partialize: (s) => { const { a: _a, hydrated: _h, toast: _t, pop: _p, ...rest } = s; return rest; },
    },
  ),
);

export const useA = () => useStore((s) => s.a);
export const useT = () => useStore((s) => (s.cur ? s.tenders[s.cur] ?? null : null));
