"use client";
/* First run: the company profile. CR, then ICV, then the document library. */
import { useRouter } from "next/navigation";
import { DocsList } from "@/components/DocsList";
import { I } from "@/components/icons";
import { Toggle } from "@/components/ui";
import { SCEN } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { exemptEnd, isExempt } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";

export function Setup() {
  const s = useStore();
  const a = useA();
  const router = useRouter();
  const o = s.ob;
  const go = (p: string | void) => { if (p) router.push(p); };

  const fld = (lb: string, v: string, k: string, ro?: boolean) => (
    <div className="field" key={k}>
      <label>{lb}</label>
      <input className="inp ex" value={v} readOnly={ro} onChange={(e) => a.obfield(k, e.target.value)} />
      <span className="src">from CR Certificate 2025.pdf</span>
    </div>
  );
  const opt = (k: "cert" | "self" | "none", b: string, sub: string) => (
    <button className={`opt${o.icvPick === k ? " on" : ""}`} onClick={() => a.obpick(k)}><span className="rd" /><span><b>{b}</b><span>{sub}</span></span></button>
  );
  const icvOk = o.icvPick === "none" || (o.icvPick === "cert" && o.certDone) || (o.icvPick === "self" && !!o.self);

  return (
    <div className="ob">
      <div className="ob-in">
        <div className="ob-top">
          <span className="mk">ق</span><span className="wm">Qeema</span>
          <button className="btn q sm skip" onClick={() => go(a.obskip())}>Skip for now</button>
        </div>
        <div className="steps">{[1, 2, 3].map((n) => <span key={n} className={n < o.step ? "d" : n === o.step ? "a" : ""} />)}</div>

        {o.step === 1 && (
          <>
            <span className="stepn">1 of 3 · Company</span>
            <h1 className="h1">Start with your commercial registration.</h1>
            <p className="lede">Qeema reads it and fills in the rest. You check it, you do not type it. This is the only setup that matters before your first tender.</p>
            <div className="card">
              {!o.crDone ? (
                <button className="drop" onClick={a.obcr}><span className="ic"><I.up /></span><h4>Drop your CR certificate</h4><p>PDF or photo · Arabic or English</p></button>
              ) : (
                <>
                  <div className="file"><span className="fi">PDF</span><div><div className="fn">CR Certificate 2025.pdf</div><div className="fs">Read in 3 seconds · 6 fields found</div></div><span className="ok">✓</span></div>
                  <div className="grid2" style={{ marginTop: 18 }}>
                    {fld("Company name", s.org.name, "name")}{fld("Commercial registration", s.org.cr, "cr")}{fld("Established", fmtDate(s.org.est), "est", true)}
                    {fld("Classification", s.org.cls, "cls")}{fld("Registered address", s.org.addr, "addr")}{fld("Employees", s.org.staff, "staff")}
                  </div>
                  <p className="meta" style={{ marginTop: 12 }}>Tinted fields came from the document. Edit anything that is wrong.</p>
                </>
              )}
            </div>
            <div className="ob-foot"><span className="meta">About 1 minute</span><div className="r"><button className="btn p" disabled={!o.crDone} onClick={a.obnext}>Continue</button></div></div>
          </>
        )}

        {o.step === 2 && (
          <>
            <span className="stepn">2 of 3 · In-Country Value</span>
            <h1 className="h1">Do you hold a Tawteen ICV certificate?</h1>
            <p className="lede">This decides what Qeema tells you on energy-sector tenders. No answer is wrong, and each one gets a different kind of help.</p>
            <div className="choice">
              {opt("cert", "Yes, I have a certificate", "Upload it and Qeema reads the score and expiry. ICV questions will answer themselves.")}
              {opt("self", "I have a score, but no certificate", "Stored as self-reported. It powers your estimate and recommendations, never your eligibility.")}
              {opt("none", "No", "Qeema will tell you plainly where that closes a door, and show you where it does not.")}
            </div>
            {o.icvPick === "cert" && (
              <div className="card">
                {o.certDone
                  ? <div className="file"><span className="fi">PDF</span><div><div className="fn">ICV Certificate 2026.pdf</div><div className="fs">Score 48.2% · {SCEN.cert.cert!.fy} accounts · valid to 30 June 2027</div></div><span className="ok">✓</span></div>
                  : <button className="drop" onClick={a.obcert}><span className="ic"><I.up /></span><h4>Drop your ICV certificate</h4><p>Qeema reads the score, the certifier and the validity date</p></button>}
              </div>
            )}
            {o.icvPick === "self" && (
              <div className="card">
                <div className="field" style={{ maxWidth: 240 }}>
                  <label htmlFor="selfsc">Your score, as you understand it</label>
                  <input className="inp" id="selfsc" inputMode="decimal" value={o.self} placeholder="e.g. 44" autoFocus onChange={(e) => a.obself(e.target.value)} />
                </div>
                <div className="note warn" style={{ marginTop: 14 }}><span className="ic"><I.alert /></span><div><h4>Not a certificate</h4><p>On energy-sector tenders a bid without an audited score is disqualified at commercial evaluation. Qeema will keep treating you as uncertified there, and will show this number only as an estimate.</p></div></div>
              </div>
            )}
            {o.icvPick === "none" && (
              <div className="card">
                {isExempt(s.org)
                  ? <div className="note ok"><span className="ic"><I.ok /></span><div><h4>You are exempt until {fmtDate(exemptEnd(s.org))}</h4><p>Your CR shows you were established on {fmtDate(s.org.est)}. Suppliers under two years old in Qatar are exempt from mandatory ICV. Qeema will count down to the date it ends.</p></div></div>
                  : <div className="note lock"><span className="ic"><I.info /></span><div><h4>Understood</h4><p>Energy-sector tenders usually require a certificate. Qeema will say so before you spend a week on one, and point you at tenders that do not. Most government tenders outside energy do not need one at all.</p></div></div>}
              </div>
            )}
            <div className="ob-foot"><button className="btn q" onClick={a.obback}>Back</button><div className="r"><button className="btn p" disabled={!icvOk} onClick={a.obnext}>Continue</button></div></div>
          </>
        )}

        {o.step === 3 && (
          <>
            <span className="stepn">3 of 3 · Company documents</span>
            <h1 className="h1">Upload once. Never again.</h1>
            <p className="lede">Certificates, accounts, CVs, past proposals. Qeema sorts them, reads the expiry dates and attaches them to every response. <b>An expired certificate is the most common reason a bid gets rejected.</b></p>
            <div className="card">
              {!o.docsDone
                ? <button className="drop" onClick={a.obdocs}><span className="ic"><I.up /></span><h4>Drop a folder of company documents</h4><p>Any order, any names. Qeema works out what each one is.</p></button>
                : <DocsList />}
              <div className="hr" />
              <Toggle on={s.org.vaultOn} onClick={a.togVault} label="Use these documents to answer questions" sub="Off means every question is answered by hand. You can change this per tender." />
            </div>
            <div className="ob-foot"><button className="btn q" onClick={a.obback}>Back</button><span className="meta">You can finish this later</span><div className="r"><button className="btn p" onClick={() => go(a.obdone())}>Go to tenders</button></div></div>
          </>
        )}
      </div>
    </div>
  );
}
