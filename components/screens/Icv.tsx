"use client";
import { I } from "@/components/icons";
import { Body, Top } from "@/components/ui";
import { LEVERS, TENDERS } from "@/lib/data";
import { days, fmtDate, kqr, qr } from "@/lib/format";
import { exemptEnd, icvBase, isExempt, projected } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Icv() {
  const s = useStore();
  const a = useA();
  const o = s.org, base = icvBase(s);
  const kind = o.cert ? "cert" : isExempt(o) ? "young" : o.self != null ? "self" : "none";
  const proj = projected(s, base);

  return (
    <>
      <Top crumb={<b>ICV</b>} />
      <Body>
        <span className="eyebrow">In-Country Value · Tawteen</span>
        {kind === "cert" && <><h1 className="h1">{o.cert!.score}%, certified</h1><p className="lede">Valid to {fmtDate(o.cert!.validTo)}. Your next score comes from your FY2026 accounts, which close on 31 December. <b>What you change in the next three months sets it.</b></p></>}
        {kind === "young" && <><h1 className="h1">Exempt until {fmtDate(exemptEnd(o))}</h1><p className="lede">Established under two years in Qatar, so mandatory ICV does not apply yet. When it ends, your first score comes from the accounts for the year you are in now. <b>Plan it before the clock does it for you.</b></p></>}
        {kind === "self" && <><h1 className="h1">Self-reported, not certified</h1><p className="lede">You told us {o.self}%. Qeema uses it to plan, never to decide eligibility. On energy-sector tenders you are treated as uncertified until a prequalified certifier audits it.</p></>}
        {kind === "none" && <><h1 className="h1">No certificate</h1><p className="lede">That is a fine place to be if your pipeline is outside the energy sector. Here is what it cost you this quarter, and what certifying would take.</p></>}

        <div style={{ marginTop: 24 }}>
          {kind === "cert" && (
            <>
              <div className="track">
                <span className="f" style={{ width: `${proj}%` }} />
                <span className="t" style={{ insetInlineStart: "35%" }}><span>QatarEnergy min 35%</span></span>
                <span className="t" style={{ insetInlineStart: "55%" }}><span>target 55%</span></span>
              </div>
              <div className="scale"><span>0%</span><span>{base}% today</span><span>100%</span></div>
              <div className="clock">{MONTHS.map((m, i) => <div key={m} className={i < 8 ? "p" : i === 8 ? "n" : "w"}><i /><span>{m}</span></div>)}</div>
              <p className="meta" style={{ marginTop: 8 }}>Three months left in the window that sets your next score.</p>
            </>
          )}
          {kind === "young" && (
            <div className="note ok"><span className="ic"><I.clock /></span><div><h4>{Math.max(0, Math.round(days(exemptEnd(o)) / 30.4))} months of exemption left</h4><p>Every exempt company becomes a certified or excluded one on a known date. Yours is {fmtDate(exemptEnd(o))}.</p></div></div>
          )}
          {(kind === "self" || kind === "none") && (
            <>
              <div className="dashed" style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <span className="lb">{kind === "self" ? "Self-reported" : "Estimated from your own numbers"}</span>
                  <span className="big">{kind === "self" ? "" : "~"}{base}%</span>
                  <span className="cap">Unaudited. Not a certificate, never shown to a buyer.</span>
                </div>
                <div style={{ marginInlineStart: "auto" }}><button className="btn p">Talk to a certifier</button></div>
              </div>
              {kind === "none" && (
                <div style={{ marginTop: 18 }}>
                  <span className="slab" style={{ padding: 0 }}>Closed to you this quarter</span>
                  {s.exclusions.length ? (
                    <table className="tbl"><tbody>
                      {s.exclusions.filter((k) => s.tenders[k]).map((k) => { const m = s.tenders[k].meta; return <tr key={k}><td><b>{m.id}</b>{m.buyer} · {m.title}</td><td className="tnum" style={{ textAlign: "end" }}>{m.value ? qr(m.value) : ""}</td></tr>; })}
                    </tbody></table>
                  ) : <p className="meta" style={{ marginTop: 6 }}>None yet. Qeema records each energy-sector tender you could not bid, so the cost of not certifying is a number, not a feeling.</p>}
                </div>
              )}
            </>
          )}
        </div>

        <div className="hr" />
        <h2 style={{ fontSize: 17 }}>{kind === "cert" ? "Cheapest ways to raise it" : kind === "young" ? "How to set a strong first score" : "What would move it"}</h2>
        <p className="meta" style={{ marginTop: 4 }}>Ranked by points gained per riyal of real cost, for your numbers. Drag to see the effect.</p>
        <div style={{ marginTop: 6 }}>
          {LEVERS.map((l, i) => {
            const v = s.levers[l.id], g = (v / l.max) * l.gain;
            return (
              <div key={l.id} className="lev">
                <span className="rk">{i + 1}</span>
                <div><b>{l.t}<span className="cost">{l.cost} cost</span></b><span className="d">{l.d}</span></div>
                <input className="rng" type="range" min={0} max={l.max} step={l.step} value={v}
                  style={{ "--v": `${Math.round((v / l.max) * 100)}%` } as React.CSSProperties}
                  aria-label={l.t} aria-valuetext={kqr(v)} onChange={(e) => a.levers(l.id, +e.target.value)} />
                <div className="o"><b>{kqr(v)}</b><span className={g > 0 ? "up" : ""}>+{g.toFixed(1)} pts</span></div>
              </div>
            );
          })}
        </div>
        <p className="meta" style={{ marginTop: 14 }}>Projected: <b className="tnum">{proj.toFixed(1)}%</b>. Coefficients are illustrative, standing in for the verified Tawteen formula. Recommendations cover spend composition only. Qeema does not name suppliers.</p>
      </Body>
    </>
  );
}
