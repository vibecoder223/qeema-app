"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { I } from "@/components/icons";
import { Body, Top } from "@/components/ui";
import { days, short, pct } from "@/lib/format";
import { POSN, docState, position, prog, stepsFor } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";

export function Tenders() {
  const s = useStore();
  const a = useA();
  const router = useRouter();
  const due = s.order.filter((id) => days(s.tenders[id].meta.deadline) <= 14).length;
  const expd = s.docs.filter((d) => docState(d) === "exp");

  return (
    <>
      <Top crumb={<b>Tenders</b>} right={<Link className="btn p sm" href="/tenders/new" onClick={a.newTender}>+ New tender</Link>} />
      <Body wide>
        <h1 className="h1">Tenders</h1>
        <p className="lede">
          {s.order.length ? `${s.order.length} open · ${due} due in the next two weeks` : "Nothing open yet."}
          {s.exclusions.length > 0 && <> · <b>{s.exclusions.length} closed to you this quarter</b></>}
        </p>
        {expd.length > 0 && (
          <div className="note warn" style={{ marginTop: 18 }}>
            <span className="ic"><I.alert /></span>
            <div><h4>{expd[0].n} expired {-days(expd[0].exp!)} days ago</h4><p>It is attached to every response. Replace it before your next export.</p></div>
            <Link className="btn o sm" href="/profile">Replace</Link>
          </div>
        )}
        {!s.order.length ? (
          <div className="empty" style={{ marginTop: 26 }}>
            <h3>Drop your first tender</h3>
            <p>Qeema reads it, tells you whether you can bid, and drafts every answer it can find a source for.</p>
            <Link className="btn p" href="/tenders/new" onClick={a.newTender}>+ New tender</Link>
          </div>
        ) : (
          <table className="tbl" style={{ marginTop: 22 }}>
            <thead><tr><th>Tender</th><th>Position</th><th>Progress</th><th>Stage</th><th>Closes</th></tr></thead>
            <tbody>
              {s.order.map((id) => {
                const t = s.tenders[id], p = prog(t), pos = position(s, t), st = stepsFor(s, t)[t.stage - 1];
                return (
                  <tr key={id} className="click" onClick={() => { const to = a.open(id); if (to) router.push(to); }}>
                    <td><b>{t.meta.id || "No reference"}</b>{[t.meta.buyer, t.meta.title].filter(Boolean).join(" · ")}</td>
                    <td><span className={`pos ${t.reached < 3 ? "new" : pos}`}><i />{t.reached < 3 && <I.read />}{t.reached < 3 ? "Reading" : POSN[pos]}</span></td>
                    <td>{pos === "excluded" || t.reached < 4
                      ? <span className="meta">·</span>
                      : <><div className="bar"><i style={{ width: `${pct(p.approved, p.total)}%` }} /></div><span className="meta tnum">{p.approved} of {p.total} approved</span></>}</td>
                    <td>{t.exported ? "Exported" : st}</td>
                    <td className="tnum">{short(t.meta.deadline)}<br /><span className="meta">{days(t.meta.deadline)} days</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Body>
    </>
  );
}
