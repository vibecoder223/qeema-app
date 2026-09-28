/* The Qeema domain. Everything the UI shows is derived from these shapes (see lib/logic.ts). */

export type PersonId = "u1" | "u2" | "u3" | "u4" | "u5";
export interface Person { id: PersonId; ini: string; name: string; role: string }

export type ScenarioKey = "cert" | "score" | "none" | "young";
export interface Scenario {
  label: string;
  est: string;
  cert: { score: number; validTo: string; fy: string } | null;
  self: number | null;
}

export type DocStatus = "ok" | "exp" | "self" | "miss";
export interface Doc {
  id: string;
  g: string;           // group in the library
  n: string;           // name
  st: DocStatus;
  exp: string | null;  // ISO date
  annex?: boolean;     // attached to every response
  energyOnly?: boolean;
  note?: string;
}

export interface TenderMeta {
  id: string;
  buyer: string;
  title: string;
  gated: boolean;      // energy sector: ICV certificate mandatory
  sme: boolean;
  value: number;
  deadline: string;
  minIcv: number | null;
  file: string;
  size: string;
  pages: number;
  lang: string;
}

export interface TenderDetails {
  ok: boolean;               // confirmed by a person
  okBy: PersonId | null;
  value: number | null;      // the team's estimate
  time?: string;
  clar?: string | null;
  site?: string | null;
  bond?: string | null;
  valid?: string | null;
  fmt?: string | null;
  src: Record<string, string>;
}

/* reuse decides what Qeema may do:
   vault = fill from records · adapt = draft from past proposals · gap = needs a document · human = Qeema refuses. */
export type Reuse = "vault" | "adapt" | "gap" | "human";
export type QStatus = "unassigned" | "assigned" | "drafted" | "approved";

export interface Message { id: string; by: PersonId; at: string; tx: string; res: boolean }

export interface Question {
  id: string;
  no: number;
  sec: string;
  text: string;
  ref: string;
  reuse: Reuse;
  a: string | null;
  cite: string | null;
  quote: string | null;
  owner: PersonId | null;
  approver: PersonId | null;
  status: QStatus;
  thread: Message[];
  log: string[];
  changed: boolean;
  gapDoc: string | null;
  vaultOff?: boolean;
  attest?: PersonId;
}

export interface Entitlement { id: string; n: string; w: string; done: boolean; sig: boolean }

export type Stage = 2 | 3 | 4 | 5;
export type GoDecision = "go" | "nogo" | null;
export type Outcome = "won" | "lost" | null;

export interface Tender {
  meta: TenderMeta;
  det: TenderDetails;
  go: GoDecision;
  lead: PersonId | null;
  goBy: PersonId | null;
  goWhy: string;
  outcome: Outcome;
  hideGap: Record<string, boolean>;
  stage: Stage;
  reached: number;
  readN: number;
  extra: string[];
  settings: { cover: boolean; vault: boolean };
  gatedOverride: boolean | null;
  exported: boolean;
  ent: Entitlement[];
  qs: Question[];
}

export interface Org {
  name: string;
  short: string;
  cr: string;
  est: string;
  addr: string;
  cls: string;
  staff: string;
  cert: Scenario["cert"];
  self: number | null;
  vaultOn: boolean;
}

export type Route = "onboard" | "home" | "tenders" | "new" | "profile" | "icv" | "tender";
export type Filter = "todo" | "rec" | "write" | "review" | "apr" | "all";
export type Position = "certified" | "advantaged" | "exempt" | "excluded";

export interface Onboarding {
  step: 1 | 2 | 3;
  crDone: boolean;
  icvPick: "cert" | "self" | "none" | null;
  certDone: boolean;
  self: string;
  docsDone: boolean;
}

export interface State {
  scenario: ScenarioKey;
  theme: "light" | "dark";
  /* route/cur/stage mirror the URL. They matter for demo deep links, which set them and then navigate. */
  route: Route;
  ob: Onboarding;
  org: Org;
  docs: Doc[];
  tenders: Record<string, Tender>;
  order: string[];
  cur: string | null;
  up: { pick: string | null; cover: boolean; vault: boolean; extra: string[] };
  filter: Filter;
  sel: string | null;
  focus: boolean;
  fi: number;
  edit: boolean;
  draft: string | null;
  cdraft: string;
  gwhy: string;
  leadPick: PersonId | null;
  me: PersonId;
  pop: { q: string; x: number; y: number } | null;
  toast: string | null;
  levers: Record<string, number>;
  exclusions: string[];
  quarter: { claimed: number; submitted: number; won: number; lost: number };
  ppN: number;
}
