"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { I } from "@/components/icons";
import { Body, Toggle, Top } from "@/components/ui";
import { TENDERS } from "@/lib/data";
import { libCount } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";

export function NewTender() {
  const s = useStore();
  const a = useA();
  const router = useRouter();
  const u = s.up, lib = libCount(s);
  const m = u.pick ? TENDERS[u.pick] : null;

  return (
    <>
      <Top crumb={<b>New tender</b>} />
      <Body>
        <h1 className="h1">New tender</h1>
        <p className="lede">Drop the tender document. Nothing else to fill in.</p>
        <div style={{ marginTop: 22 }}>
          {!m ? (
            <div className="drop" style={{ cursor: "default" }}>
              <span className="ic"><I.up /></span>
              <h4>Drop your tender here</h4>
              <p>PDF or Word, up to 40 MB</p>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                <span className="meta" style={{ alignSelf: "center" }}>Try one:</span>
                {Object.values(TENDERS).map((x) => <button key={x.id} className="chip" onClick={() => a.pick(x.id)}>{x.id} · {x.buyer}</button>)}
              </div>
            </div>
          ) : (
            <div className="file">
              <span className="fi">PDF</span>
              <div><div className="fn">{m.file}</div><div className="fs">{m.size} · {m.pages} pages · {m.buyer}</div></div>
              <button className="btn q sm" onClick={() => a.pick(null)} style={{ marginInlineStart: "auto" }}>Remove</button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 26 }}>
          <span className="slab" style={{ padding: 0 }}>Response</span>
          <div className="choice" style={{ marginTop: 8 }}>
            <button className="opt on" aria-pressed="true"><span className="rd" /><span><b>Question and answer</b><span>Every requirement becomes a question. Reviewed one by one, exported as a Word document with a cover letter.</span></span></button>
            <div className="opt" style={{ opacity: 0.5, cursor: "default" }}><span className="rd" /><span><b>Fill the buyer&apos;s own forms</b><span>Answers written straight into the tender&apos;s appendices. Coming after the first release.</span></span></div>
          </div>
        </div>

        <div style={{ marginTop: 26 }}>
          <span className="slab" style={{ padding: 0 }}>Answer from</span>
          <div className="srcs">
            <div className={`src${u.vault ? " on" : ""}`}>
              <span className="si"><I.org /></span>
              <div className="sb">
                <b>Company library</b>
                <span>{lib.docs} documents and {lib.pp} past proposals from your profile. Uploaded once, used in every tender.</span>
                <Link className="lnk" href="/profile">Manage library</Link>
              </div>
              <Toggle on={u.vault} onClick={a.togUpVault} />
            </div>
            <div className="src on">
              <span className="si"><I.file /></span>
              <div className="sb">
                <b>This tender only</b>
                <span>Addenda, clarification replies, site-visit notes, a subcontractor quote. Stays in this tender, never reused.</span>
                {u.extra.length > 0 && (
                  <div className="xf">
                    {u.extra.map((n, i) => (
                      <span key={i} className="xchip"><I.file />{n}<button onClick={() => a.rmExtra(i)} aria-label={`Remove ${n}`}><I.x /></button></span>
                    ))}
                  </div>
                )}
              </div>
              <label className="btn o sm" style={{ cursor: "pointer" }}>
                <input type="file" multiple hidden onChange={(e) => { a.addExtra([...(e.target.files ?? [])].map((f) => f.name)); e.target.value = ""; }} />
                <I.plus />Add files
              </label>
            </div>
          </div>
          <p className="meta" style={{ marginTop: 8 }}>The tender document itself is always read first. Anything reusable, like a new certificate, belongs in the library.</p>
        </div>

        <div style={{ marginTop: 20 }}>
          <Toggle on={u.cover} onClick={a.togCover} label="Add a cover letter" sub="Where SME and Qatari-content preferences get claimed. Preferences not asserted in the bid do not apply." />
        </div>

        <div className="ob-foot">
          <span className="meta">Reading takes under a minute</span>
          <div className="r"><button className="btn p lg" disabled={!u.pick} onClick={() => { const p = a.start(); if (p) router.push(p); }}>Read tender</button></div>
        </div>
      </Body>
    </>
  );
}
