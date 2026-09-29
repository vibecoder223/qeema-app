"use client";
/* Stage 5: the gate, the pack, the document. Download only: Qeema never submits and never signs. */
import { useRouter } from "next/navigation";
import { I } from "@/components/icons";
import { Body } from "@/components/ui";
import { useState } from "react";
import { todayIso } from "@/lib/clock";
import { downloadDoc, refOf } from "@/lib/download";
import { downloadPack } from "@/lib/pack";
import { fmtDate, letter, qr } from "@/lib/format";
import { annexes, blockers, docLabel, gateRows, letterClaims, position, prog, type GateRow } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";
import type { Tender } from "@/lib/types";

export function Export({ t }: { t: Tender }) {
  const s = useStore();
  const a = useA();
  const router = useRouter();
  const bl = blockers(s, t), rows = gateRows(s, t), p = prog(t), pos = position(s, t), ax = annexes(s, t);
  const unap = p.total - p.approved;
  const [packing, setPacking] = useState(false);
  const pack = async () => {
    setPacking(true);
    const missing = await downloadPack(s, t);
    setPacking(false); a.download();
    if (missing.length) a.say(`Pack downloaded · ${missing.length} annex file${missing.length > 1 ? "s" : ""} not uploaded yet, marked in the manifest`);
  };

  const act = (r: GateRow) => {
    if (r.kind === "profile") router.push("/profile");
    else if (r.kind === "sign") a.sign(r.id);
    else { const to = r.kind === "question" ? a.goq(r.q) : a.goreview(); if (to) router.push(to); }
  };
  const file = (ic: React.ReactNode, name: string, sub: string, ok: boolean, st: string, action?: React.ReactNode) => (
    <div className="mf" key={name}>
      <span className="mi">{ic}</span>
      <span className="mn"><b>{name}</b>{sub && <span>{sub}</span>}</span>
      <span className={`ms ${ok ? "ok" : "w"}`}>{ok ? <I.okc /> : <I.alert />}{st}</span>
      <span className="ma">{action}</span>
    </div>
  );

  return (
    <Body wide>
      <h1 className="h1">{t.exported ? "Exported" : bl.length ? "Almost there" : "Ready to export"}</h1>
      <div className="sumrow">
        <div><b>{p.approved} / {p.total}</b><span>questions approved</span></div>
        <div><b>{ax.length}</b><span>annexes attached</span></div>
        <div><b className={bl.length ? "w" : ""}>{rows.length}</b><span>blocking export</span></div>
        {pos === "advantaged" && <div><b className="g">{qr(100000)}</b><span>preference claimed</span></div>}
      </div>

      <div className={`gate${bl.length ? " bl" : ""}`} style={{ marginTop: 18 }}>
        <div className="gh"><b>{bl.length ? "Not ready to export" : "Everything checks out"}</b>{bl.length > 0 && <span className="n">{rows.length}</span>}</div>
        {!bl.length && <div className="clear">Every question approved by someone other than its owner. Every thread closed. Every attached certificate in date.</div>}
        {rows.map((r, i) => (
          <button key={i} className="gr" onClick={() => act(r)}>
            <i className="mark unassigned" /><span className="t"><b>{r.t}</b>{r.d}</span><span className="go">{r.go} <span className="d">→</span></span>
          </button>
        ))}
      </div>

      {t.ent.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <span className="slab" style={{ padding: 0 }}>Claims to assert in this bid</span>
          <table className="tbl" style={{ marginTop: 6 }}><tbody>
            {t.ent.map((e) => (
              <tr key={e.id}>
                <td><b>{e.n}</b>{e.w}</td>
                <td style={{ textAlign: "end" }}>{e.done ? <span className="st ok">{e.sig ? "Signed" : "Claimed"}</span> : <button className="btn o sm" onClick={() => a.sign(e.id)}>Sign</button>}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}

      <div className="ex2">
        {/* the pack: download up top, then every file in the zip, status always in the same column */}
        <div className="pk2">
          <div className="pkh">
            <span className="fi fo"><I.folder /></span>
            <div className="vn"><b>{refOf(t)}-response.zip</b><span>{bl.length ? `Clear the ${rows.length} item${rows.length > 1 ? "s" : ""} above to download` : "Download only. Qeema never submits on your behalf, and never signs."}</span></div>
            <button className="btn p dl" disabled={bl.length > 0 || packing} onClick={pack}><I.down />{packing ? "Packing…" : "Download bid pack"}</button>
          </div>
          <div className="mfh">Files<span>3</span></div>
          {file(<I.file />, "00-Submission-checklist.txt", "What to print, sign and seal", true, "Ready")}
          {file(<I.file />, "01-Response.doc", `${t.settings.cover ? "Cover letter + " : ""}${p.total} answers`, !unap, unap ? `${unap} not approved` : "Ready",
            unap ? <button className="btn o sm" onClick={() => { const to = a.goreview(); if (to) router.push(to); }}>Review</button> : null)}
          {file(<I.file />, "Manifest.txt", "Annex index with expiry dates", true, "Ready")}
          <div className="mfh">Annexes<span>{ax.length}</span></div>
          {ax.map((d, i) => {
            const [st, label] = docLabel(d), w = st === "exp" || st === "soon";
            return file(<b>{letter(i)}</b>, d.n, "", !w, label, w ? <button className="btn o sm" onClick={() => a.replaceDoc(d.id)}>Replace</button> : null);
          })}
        </div>

        {t.exported && (
          <div className="dtc dec">
            <div className="dtc-h">
              {!t.outcome ? (
                <>
                  <span className="decm ok"><I.ok /></span>
                  <div className="vn"><b>Downloaded. Submit by {fmtDate(t.meta.deadline)}{t.det.time ? `, ${t.det.time}` : ""}</b><span>{t.det.fmt || "As the tender asks"}. When the result lands, record it here.</span></div>
                  <div className="r" style={{ marginInlineStart: "auto", display: "flex", gap: 8 }}>
                    <button className="btn o sm" onClick={() => a.outcome("lost")}>Lost</button>
                    <button className="btn p sm" onClick={() => a.outcome("won")}>Won</button>
                  </div>
                </>
              ) : (
                <>
                  <span className={`decm ${t.outcome === "won" ? "ok" : "no"}`}>{t.outcome === "won" ? <I.okc /> : <I.x />}</span>
                  <div className="vn"><b>{t.outcome === "won" ? "Won" : "Lost"}</b><span>{p.approved} approved answers saved to your library as {t.outcome === "won" ? "a winning proposal. The next tender drafts from them first." : "an unsuccessful proposal, kept for reference."}</span></div>
                  <button className="btn q sm" style={{ marginInlineStart: "auto" }} onClick={() => a.outcome(null)}>Undo</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* the document, full width */}
        <div className="viewer">
          <div className="vbar">
            <span className="fi"><I.file /></span>
            <div className="vn"><b>01-Response.doc</b><span>{t.settings.cover ? "Cover letter and " : ""}{p.total} answers</span></div>
            <div className="vact">
              {unap ? <span className="st drf">{unap} awaiting approval</span> : <span className="st ok">All approved</span>}
              <button className="btn o sm" onClick={() => { downloadDoc(s, t, unap > 0); a.say(unap ? "Draft downloaded · unapproved answers marked" : "01-Response.doc downloaded"); }}>
                <I.down />{unap ? "Download draft" : "Download .doc"}
              </button>
            </div>
          </div>
          <div className="vbody"><div className="paper"><Paper t={t} /></div></div>
        </div>
      </div>
    </Body>
  );
}

function Paper({ t }: { t: Tender }) {
  const s = useStore();
  const claims = letterClaims(s, t), ax = annexes(s, t);
  return (
    <>
      {t.settings.cover && (
        <>
          <h5>{s.org.name}</h5>
          <p>{s.org.addr} · CR {s.org.cr}<br />{fmtDate(todayIso())}</p>
          <p>To: {t.meta.buyer}<br />Re: {t.meta.id}, {t.meta.title}</p>
          <p>{s.org.name} submits this response to tender {t.meta.id}.</p>
          {claims && <div className="claim">{claims}</div>}
          <p>This response is valid for 90 days from the date above. Supporting documents are attached as Annexes A to {letter(ax.length - 1)}.</p>
          <p>Signed: ____________________</p>
          <hr style={{ border: 0, borderTop: "1px solid oklch(.85 .01 220)", margin: "16px 0" }} />
        </>
      )}
      {t.qs.map((q) => (
        <div key={q.id}>
          <div className="pq">{q.no}. {q.text}</div>
          {q.status === "approved" ? <p>{q.a}</p> : <div className="hole">Awaiting approval · exports blank until approved</div>}
        </div>
      ))}
    </>
  );
}
