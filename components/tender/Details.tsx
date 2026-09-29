"use client";
/* Stage 2: reading the tender, then the details a person confirms before anything else happens. */
import { useRouter } from "next/navigation";
import { I } from "@/components/icons";
import { Body } from "@/components/ui";
import { days, fmtDate, pad, person, qr } from "@/lib/format";
import { READ_STEPS, SRCNAME, libCount, prog, srcMap } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";
import type { Tender } from "@/lib/types";

export function Details({ t }: { t: Tender }) {
  const s = useStore();
  const m = t.meta, n = t.readN, done = n >= READ_STEPS, lib = libCount(s);
  const secs = [...new Set(t.qs.map((q) => q.sec))];
  const steps: [string, string][] = [
    ["Reading the document", m.pages ? `${m.pages} pages${m.lang ? " · " + m.lang : ""}` : m.file],
    ["Pulling out tender details", "Buyer, reference, deadline"],
    ["Finding questions and requirements", `${t.qs.length} questions in ${secs.length} sections`],
    ["Checking the local-content clause", m.gated ? `Minimum ICV ${m.minIcv}%` : "No ICV requirement"],
    ["Searching your sources", (t.settings.vault ? `${lib.docs} documents, ${lib.pp} past proposals` : "Library off") + (t.extra.length ? ` + ${t.extra.length} tender file${t.extra.length > 1 ? "s" : ""}` : "")],
    ["Mapping each question to a source", done ? `${t.qs.filter((q) => q.a).length} of ${t.qs.length} matched` : "Citing page and paragraph"],
  ];

  return (
    <Body wide>
      <h1 className="h1">{done ? "Read" : "Reading"} {m.id || m.title}</h1>
      <p className="lede">{m.file}{m.size ? ` · ${m.size}` : ""}. {done ? (t.manual && !t.qs.length ? "Nothing was read automatically. Check the details below, then add the questions on the Questions tab." : "Here is what Qeema found and where every answer comes from.") : "One pass. You can leave this page, it keeps going."}</p>
      <div className="rd2">
        <ol className="pipe">
          {steps.map(([title, sub], i) => {
            const st = i < n ? "done" : i === n ? "cur" : "wait";
            return (
              <li key={title} className={st}>
                <span className="pm">{st === "done" ? <I.ok /> : st === "cur" ? <i className="spin" /> : null}</span>
                <span className="pt"><b>{title}</b><span>{st === "wait" ? "" : sub}</span></span>
              </li>
            );
          })}
        </ol>
        <div className="found">
          {n < 2 && <div className="fcard ghost"><span className="lb">What Qeema finds shows up here</span><div className="sk" /><div className="sk" style={{ width: "70%" }} /><div className="sk" style={{ width: "84%" }} /></div>}
          {n >= 2 && (
            <div className="fcard"><span className="lb">Tender</span>
              <dl className="kv"><dt>Buyer</dt><dd>{m.buyer}</dd><dt>Reference</dt><dd>{m.id}</dd><dt>Scope</dt><dd>{m.title}</dd><dt>Closes</dt><dd>{fmtDate(m.deadline)} · {days(m.deadline)} days</dd><dt>Language</dt><dd>{m.lang}</dd></dl>
            </div>
          )}
          {n >= 3 && (
            <div className="fcard"><span className="lb">Questions · {t.qs.length}</span>
              <div className="secs">{secs.map((sc) => <span key={sc}>{sc} <b>{t.qs.filter((q) => q.sec === sc).length}</b></span>)}</div>
            </div>
          )}
          {n >= 4 && (
            <div className="fcard"><span className="lb">Local content</span>
              <p className="fp">{m.gated ? <>Clause found: bids need an ICV certificate with a score of at least <b>{m.minIcv}%</b>.</> : "No ICV requirement. National-product and SME preferences under Cabinet Decision 11/2022 can still be claimed."}</p>
            </div>
          )}
          {n >= 6 ? (
            <div className="fcard"><span className="lb">Where the answers come from</span>
              <div className="smap">
                {srcMap(t).map((r) => {
                  const sys = r.k[0] === "~", w = r.k === "~gap" || r.k === "~hum";
                  return (
                    <div key={r.k} className={`sr${w ? " w" : ""}`}>
                      <span className="sn">{!sys && <I.file />}{sys ? SRCNAME[r.k] : r.k}</span>
                      <span className="sq">{r.n.map(pad).join(" ")}</span>
                      <span className="sc">{r.n.length}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : n >= 5 ? (
            <div className="fcard ghost"><span className="lb">Where the answers come from</span><div className="sk" /><div className="sk" style={{ width: "62%" }} /></div>
          ) : null}
        </div>
      </div>
      {done && <DetailsCard t={t} />}
    </Body>
  );
}

function DetailsCard({ t }: { t: Tender }) {
  const a = useA();
  const router = useRouter();
  const m = t.meta, d = t.det, src = d.src || {}, ed = !d.ok;

  /* Plain render helpers, not components: inputs must keep their identity while you type. */
  const srcTag = (k: string | null) =>
    k === null ? <span className="s">Your team</span> : src[k] ? <span className="s"><I.read />{src[k]}</span> : <span className="s none">Not in document</span>;
  const txt = (o: "meta" | "det", k: string, val: string | number | null | undefined, type = "text") =>
    ed ? (
      <input className="inp dti" type={type} defaultValue={val ?? ""} inputMode={type === "number" ? "numeric" : undefined}
        onChange={(e) => a.detField(o, k, type === "number" ? (e.target.value === "" ? null : +e.target.value) : e.target.value)} />
    ) : val ? <span className="ro">{val}</span> : <span className="ro ns">Not stated</span>;
  const row = (label: string, k: string | null, children: React.ReactNode, req?: boolean) => (
    <div className="dr" key={label}><span className="l">{label}{req && <i>Required</i>}</span><span className="v">{children}</span>{srcTag(k)}</div>
  );
  const opt: [string, string, string | null | undefined, "meta" | "det"][] = [
    ["Clarification deadline", "clar", d.clar ? fmtDate(d.clar) : null, "det"], ["Site visit", "site", d.site, "det"], ["Bid bond", "bond", d.bond, "det"],
    ["Bid validity", "valid", d.valid, "det"], ["Submission format", "fmt", d.fmt, "det"], ["Language", "lang", m.lang, "meta"],
  ];
  const gaps = t.qs.filter((q) => !q.a).length;

  return (
    <div className="dtc">
      <div className="dtc-h">
        <div className="vn"><b>Tender details</b><span>{ed ? "Qeema read these from the document. Check each against its page, then confirm." : `Confirmed by ${person(d.okBy)?.name}. These drive the deadline, reminders and the verdict.`}</span></div>
        {!ed && <button className="btn q sm" style={{ marginInlineStart: "auto" }} onClick={() => { const p = a.detedit(); if (p) router.push(p); }}>Edit</button>}
      </div>
      <div className="mfh">Required<span>6</span></div>
      {row("Reference", "buyer", ed ? txt("meta", "id", m.id) : <span className="ro">{m.id || "Not stated"}</span>, true)}
      {row("Buyer", "buyer", txt("meta", "buyer", m.buyer), true)}
      {row("Title and scope", "title", txt("meta", "title", m.title), true)}
      {row("Submission deadline", "deadline", ed ? <span className="two">{txt("meta", "deadline", m.deadline, "date")}{txt("det", "time", d.time, "time")}</span>
          : <span className="ro">{fmtDate(m.deadline)}{d.time ? `, ${d.time}` : ""} · {days(m.deadline)} days</span>, true)}
      {row("Energy sector", "energy", ed ? <><span className="seg"><button className={m.gated ? "on" : ""} onClick={() => a.energy(true)}>Yes</button><button className={m.gated ? "" : "on"} onClick={() => a.energy(false)}>No</button></span><span className="hint">Decides whether an ICV certificate is mandatory</span></>
          : <span className="ro">{m.gated ? "Yes · ICV certificate mandatory" : "No"}</span>, true)}
      {row("Minimum ICV score", m.gated ? "minIcv" : "energy", m.gated ? <>{txt("meta", "minIcv", m.minIcv, "number")}{ed ? <span className="hint">%</span> : "%"}</> : <span className="ro ns">Not applicable</span>, true)}
      <div className="mfh">If the tender states them<span>{opt.filter((x) => x[2]).length} of {opt.length} found</span></div>
      {opt.map(([label, k, val, o]) => row(label, k, k === "clar" && ed ? txt("det", "clar", d.clar, "date") : txt(o, k, val)))}
      <div className="mfh">Your team</div>
      {row("Contract value, your estimate", null, ed ? <span className="two">{txt("det", "value", d.value, "number")}<span className="hint">QR · optional</span></span>
          : d.value ? <span className="ro">{qr(+d.value)} est.</span> : <span className="ro ns">Not estimated</span>)}
      {(d.value ?? 0) >= 5000000 && !m.gated && <div className="dnote"><I.info />Above QR 5m, so the SME set-aside does not apply. The Qatari-content price preference still can.</div>}
      <div className="dtc-f">
        {ed ? (
          <><span className="meta">Nothing is drafted against a deadline you have not checked.</span>
            <div className="r"><button className="btn p" onClick={() => { const p = a.detok(); if (p) router.push(p); }}>Confirm details</button></div></>
        ) : (
          <><span className="meta">{prog(t).total - gaps} drafted with a source · {gaps} need you</span>
            <div className="r"><button className="btn p" onClick={() => { const p = a.stage(3); if (p) router.push(p); }}>See the verdict</button></div></>
        )}
      </div>
    </div>
  );
}
