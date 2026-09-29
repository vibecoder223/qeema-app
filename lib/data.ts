/* Fixture data for the demo. Fictional company, real Qatari tender structure.
   Everything here would come from the database and the document reader in production. */
import { fmtDate } from "./format";
import { isExempt } from "./logic";
import type { Doc, Org, Person, Question, Reuse, Scenario, ScenarioKey, TenderDetails, TenderMeta, PersonId } from "./types";

export const PEOPLE: Person[] = [
  {id:"u1",ini:"RS",name:"Rand Al-Sada",role:"Bid manager"},
  {id:"u2",ini:"FM",name:"Faisal Al-Mannai",role:"Finance and ICV"},
  {id:"u3",ini:"NK",name:"Noor Al-Kuwari",role:"HSE lead"},
  {id:"u4",ini:"HA",name:"Hamad Al-Ansari",role:"Operations"},
  {id:"u5",ini:"LH",name:"Layla Haddad",role:"IT"}
];
export const SCEN: Record<ScenarioKey, Scenario> = {
  cert:{label:"With ICV certificate", est:"2016-03-14", cert:{score:48.2,validTo:"2027-06-30",fy:"FY2025"}, self:null},
  score:{label:"Score, no certificate", est:"2016-03-14", cert:null, self:44},
  none:{label:"No ICV", est:"2016-03-14", cert:null, self:null},
  young:{label:"Under two years old", est:"2025-03-10", cert:null, self:null}
};
/* What each tender document states, with the page it says it on. null = not stated. */
export const DET: Record<string, Omit<TenderDetails, "ok" | "okBy" | "value">> = {
  "QP-2026-0418":{time:"12:00",clar:"2026-10-01",site:"30 Sep 2026 · Ras Laffan site office",bond:"QR 84,000 · 2% of bid value",valid:"120 days",fmt:"Two sealed envelopes, technical and commercial, by hand",
    src:{buyer:"p.1",title:"p.1",deadline:"p.3 · §1.4",energy:"p.2 · §1.2",minIcv:"p.14 · §7.2",clar:"p.3 · §1.5",site:"p.4 · §1.7",bond:"p.9 · §4.1",valid:"p.9 · §4.3",fmt:"p.5 · §2.1",lang:"p.2 · §1.3"}},
  "QP-2026-0405":{time:"13:00",clar:"2026-09-30",site:null,bond:"Not required for SMEs",valid:"90 days",fmt:"One sealed envelope, by hand to the MOT tenders office",
    src:{buyer:"p.1",title:"p.1",deadline:"p.2 · §1.3",energy:"p.1 · §1.1",clar:"p.2 · §1.4",bond:"p.6 · §3.2",valid:"p.6 · §3.4",fmt:"p.3 · §2.1",lang:"p.1"}},
  "QP-2026-0392":{time:"11:00",clar:"2026-10-12",site:"8 Oct 2026 · Al Wakrah municipal complex",bond:null,valid:"90 days",fmt:"Two sealed envelopes, by hand",
    src:{buyer:"p.1",title:"p.1",deadline:"p.2 · §1.2",energy:"p.1",clar:"p.2 · §1.3",site:"p.3 · §1.6",valid:"p.5 · §3.1",fmt:"p.2 · §2.1",lang:"p.1"}}
};
export const TENDERS: Record<string, TenderMeta> = {
  "QP-2026-0418":{id:"QP-2026-0418",buyer:"QatarEnergy",title:"Facilities management, Ras Laffan",gated:true,sme:false,value:4200000,deadline:"2026-10-12",minIcv:35,file:"QP-2026-0418-Tender.pdf",size:"3.4 MB",pages:42,lang:"Arabic + English"},
  "QP-2026-0392":{id:"QP-2026-0392",buyer:"Al Wakrah Municipality",title:"Facilities upkeep, municipal buildings",gated:false,sme:true,value:1900000,deadline:"2026-10-22",minIcv:null,file:"QP-2026-0392-Tender.pdf",size:"1.6 MB",pages:22,lang:"Arabic"},
  "QP-2026-0405":{id:"QP-2026-0405",buyer:"Ministry of Transport",title:"Grounds maintenance, MOT district office",gated:false,sme:true,value:3800000,deadline:"2026-10-08",minIcv:null,file:"QP-2026-0405-Tender.pdf",size:"2.1 MB",pages:28,lang:"English"}
};
export const REDIRECTS = [
  {id:"QP-2026-0392",t:"Facilities upkeep, Al Wakrah municipality",tag:"No ICV gate",live:true},
  {id:"QP-2026-0405",t:"Grounds maintenance, MOT district office",tag:"SME set-aside",live:true},
  {id:"QP-2026-0411",t:"Janitorial services, Ministry of Education",tag:"No ICV gate",live:false}
];
export const LEVERS = [
  {id:"l1",gain:4.8,max:2000,step:100,unit:"k",t:"Shift procurement to ICV-certified local suppliers",d:"Reallocates spend you already make. Not new cost.",cost:"Low"},
  {id:"l2",gain:5.4,max:600,step:50,unit:"k",t:"Add Qatari payroll",d:"Scored on pay, not headcount. Recurring cost.",cost:"High"},
  {id:"l3",gain:1.6,max:200,step:25,unit:"k",t:"Training for Qatari citizens and residents",d:"Includes supplier certification courses.",cost:"Medium"}
];

export function baseDocs(sc: Scenario): Doc[] {
  const icv: Pick<Doc, "st" | "exp" | "note"> = sc.cert
    ? { st: "ok", exp: sc.cert.validTo, note: `Score ${sc.cert.score}% · ${sc.cert.fy}` }
    : sc.self != null
      ? { st: "self", exp: null, note: `Self-reported ${sc.self}% · unaudited, not a certificate` }
      : { st: "miss", exp: null, note: "Not held" };
  return [
    { id: "cr", g: "Identity", n: "Commercial Registration", st: "ok", exp: "2027-03-14", annex: true },
    { id: "tl", g: "Identity", n: "Trade licence", st: "ok", exp: "2027-01-20" },
    { id: "cl", g: "Identity", n: "Classification certificate · Grade 3", st: "ok", exp: "2026-12-31", annex: true },
    { id: "tx", g: "Identity", n: "Tax card", st: "exp", exp: "2026-09-18", annex: true },
    { id: "fs", g: "Financial", n: "Audited accounts FY2023 to FY2025", st: "ok", exp: null, annex: true },
    { id: "bk", g: "Financial", n: "Bank facility letter", st: "ok", exp: "2026-10-10" },
    { id: "icv", g: "Local content", n: "ICV certificate", ...icv, annex: !!sc.cert, energyOnly: true },
    { id: "iso9", g: "Quality and HSE", n: "ISO 9001", st: "ok", exp: "2027-08-09" },
    { id: "iso45", g: "Quality and HSE", n: "ISO 45001", st: "ok", exp: "2026-10-13", annex: true },
    { id: "hse", g: "Quality and HSE", n: "HSE policy and statistics", st: "ok", exp: null },
    { id: "isp", g: "Quality and HSE", n: "Information security policy", st: "miss", exp: null },
    { id: "bcp", g: "Quality and HSE", n: "Business continuity plan", st: "miss", exp: null },
    { id: "cv", g: "Capability", n: "CVs · 12 staff", st: "ok", exp: null, annex: true },
    { id: "ref", g: "Capability", n: "Project references · 6", st: "ok", exp: null },
    { id: "pp", g: "Library", n: "Past proposals · 7", st: "ok", exp: null },
  ];
}

/* A tender becomes a list of items. */
export function buildQuestions(t: TenderMeta, org: Org, vaultOn: boolean): Question[] {
  const est = fmtDate(org.est);
  const Q: Question[] = [];
  function q(sec: string, text: string, ref: string, reuse: Reuse, a: string | null, cite?: string | null, quote?: string | null, owner?: PersonId | null, extra?: Partial<Question>) {
    const it: Question = {
      id: "q" + (Q.length + 1), no: Q.length + 1, sec, text, ref, reuse, a,
      cite: cite ?? null, quote: quote ?? null, owner: owner ?? null, approver: null,
      status: owner ? (a ? "drafted" : "assigned") : "unassigned",
      thread: [], log: [], changed: false, gapDoc: null, ...extra,
    };
    if (it.reuse === "vault" && !vaultOn) { it.a = null; it.cite = null; it.quote = null; it.reuse = "human"; it.vaultOff = true; }
    if (it.a && it.owner) it.status = "drafted";
    Q.push(it);
    return it;
  }
  q("Company and legal", "State your commercial registration number and date of incorporation.", 'Schedule B, 2.1 · "Tenderer shall state CR number and date of establishment."',
    "vault", `Al Rayyan Facilities Management W.L.L., Commercial Registration 118432, incorporated on ${est} with the Ministry of Commerce and Industry, State of Qatar.`,
    "CR Certificate 2025.pdf · p.1", "Commercial Registration No. 118432 · Date of registration: " + est, "u1");
  q("Company and legal", "Provide your current classification grade and issuing authority.", "Schedule B, 2.2",
    "vault", "Grade 3 contractor classification, issued by the Central Tenders Committee, valid to 31 December 2026.",
    "Classification Certificate.pdf · p.2", "Grade: Three (3) · Valid until 31/12/2026", "u1");
  q("Company and legal", "Confirm there is no pending litigation that would affect delivery.", "Schedule B, 2.5",
    "adapt", "Al Rayyan confirms no pending or threatened litigation that would affect performance of this contract, as set out in the annexed declaration.",
    "Past submission QP-2025-0221 · p.4", "We confirm there is no pending or threatened litigation…", "u1");
  q("Technical", "Describe your facilities-management delivery model for multi-site contracts.", "Scope of Work, 4.1",
    "adapt", "A hub-and-spoke model: a central operations desk in Al Wakrah dispatches to site-resident teams, and a shared CAFM platform gives the client live ticket status across all sites.",
    "Ops Manual 2025.pdf · p.34", "The Operations Desk operates on a hub-and-spoke basis, dispatching to resident site teams…", "u4");
  q("Technical", "Describe your cyber-incident response procedure.", "Scope of Work, 4.6", "gap", null, null, null, null, { gapDoc: "isp" });
  q("Technical", "Attach your business continuity and disaster-recovery plan.", "Scope of Work, 4.7", "gap", null, null, null, null, { gapDoc: "bcp" });
  q("HSE", "Describe your HSE management system.", "Schedule D, HSE Questionnaire 1",
    "adapt", "Al Rayyan operates an ISO 45001-certified HSE system, audited annually since 2022, covering every facilities-management site and subcontracted labour.",
    "HSE Policy 2024.pdf · p.12", "The Company maintains an HSE management system certified to ISO 45001:2018, subject to annual surveillance audit since 2022…", "u3");
  q("HSE", "State your lost-time injury frequency rate for the last three years.", "Schedule D, HSE Questionnaire 4",
    "vault", "LTIFR of 0.42 (2023), 0.31 (2024) and 0.19 (2025) per 200,000 hours worked, independently verified at annual surveillance audit.",
    "HSE Statistics 2025.xlsx · Sheet 2", "2023: 0.42 · 2024: 0.31 · 2025: 0.19", "u3");
  q("HSE", "Describe your emergency-response arrangements for site incidents.", "Schedule D, HSE Questionnaire 7", "gap", null, null, null, null, { gapDoc: "bcp" });
  if (t.gated) {
    let icvA: string | null = null, icvCite: string | null = null, icvQuote: string | null = null, icvReuse: Reuse = "human";
    if (org.cert) {
      icvReuse = "vault";
      icvA = `Certified ICV score of ${org.cert.score}%, validated by a Tawteen-approved certifier against ${org.cert.fy} audited accounts, valid to ${fmtDate(org.cert.validTo)}.`;
      icvCite = "ICV Certificate 2026.pdf · p.1"; icvQuote = `ICV Score: ${org.cert.score}%`;
    } else if (isExempt(org)) {
      icvReuse = "vault";
      icvA = `Al Rayyan was established in the State of Qatar on ${est} and is exempt from mandatory ICV under Tawteen's two-year provision.`;
      icvCite = "CR Certificate 2025.pdf · p.1"; icvQuote = "Date of registration: " + est;
    }
    q("Local content", "State your In-Country Value score and certifying body.", "ICV Submission Form · 1", icvReuse, icvA, icvCite, icvQuote, icvA ? "u2" : null);
    const th = q("Local content", "List Qatari nationals in supervisory roles.", "ICV Submission Form · 3",
      "adapt", "Four Qatari nationals hold site-supervisor or higher positions, 18% of supervisory headcount.",
      "ICV Profile · Payroll Q2", "Qatari supervisory headcount: 4 of 22", "u2");
    th.thread = [
      { id: "m1", by: "u1", at: "09:14", tx: "Is this still four? @Faisal Al-Mannai we promoted someone in the Msheireb team last month.", res: false },
      { id: "m2", by: "u2", at: "09:31", tx: "Five as of the March payroll run. I'll update the figure and re-cite before review.", res: false },
    ];
  }
  q("Commercial", "Provide audited financial statements for the last three years.", "Instructions to Bidders, 11.3",
    "vault", "Audited statements for FY2023, FY2024 and FY2025 are attached, prepared under IFRS and signed by a Qatar-licensed audit firm.",
    "Audited FS FY2025.pdf · p.1", "Independent auditor's report · Year ended 31 December 2025", "u2");
  q("Commercial", "Describe your proposed project organisation and key staff for this contract.", "Scope of Work, 6.3", "human", null);
  q("Commercial", "Provide your mobilisation plan and programme from award.", "Scope of Work, 6.4", "human", null);
  return Q;
}

/* What a gap upload unlocks: the answer Qeema can now draft, with its citation. */
export const GAPANS: Record<string, { a: string; cite: string; quote: string; owner: PersonId }[]> = {
  isp: [{ a: "Security incidents follow a documented response procedure: triage within one hour of detection, containment led by the IT lead, client notification within 24 hours, and a written post-incident review within five working days.",
    cite: "Information Security Policy.pdf · p.6", quote: "Incidents shall be triaged within one (1) hour of detection and the client notified within twenty-four (24) hours…", owner: "u5" }],
  bcp: [{ a: "Al Rayyan's business continuity and disaster-recovery plan is attached. It covers loss of site access, loss of systems and loss of key staff, and is tested every year.",
    cite: "Business Continuity Plan.pdf · p.1", quote: "This Plan addresses three scenarios: loss of site access, loss of systems, loss of key personnel…", owner: "u4" },
  { a: "Every site holds an emergency-response plan for fire, medical and chemical incidents, with quarterly drills and a named emergency coordinator on each shift.",
    cite: "Business Continuity Plan.pdf · p.14", quote: "A designated Emergency Coordinator shall be on duty for every shift…", owner: "u3" }],
};
