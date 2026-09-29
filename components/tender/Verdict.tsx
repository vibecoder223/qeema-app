"use client";
/* Stage 3: can we bid, and do we want to. The position is derived; the decision is a person's. */
import { useRouter } from "next/navigation";
import Link from "next/link";
import { I } from "@/components/icons";
import { Avatar, Body } from "@/components/ui";
import { REDIRECTS } from "@/lib/data";
import { days, fmtDate, person, qr } from "@/lib/format";
import { exemptEnd, position, prog } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";
import type { Tender } from "@/lib/types";

export function Verdict({ t }: { t: Tender }) {
  const s = useStore();
  const a = useA();
  const router = useRouter();
  const go = (p: string | void) => { if (p) router.push(p); };
  const pos = position(s, t), m = t.meta, p = prog(t);

  return (
    <Body>
      <span className="eyebrow">Before you spend the week</span>
      <h1 className="h1">{m.title}</h1>
      <p className="lede">{m.buyer} · {t.det.value ? `${qr(+t.det.value)} est.` : "value not stated"} · closes {fmtDate(m.deadline)} · {p.total} questions</p>
      <div style={{ marginTop: 22 }}>
        {pos === "certified" && s.org.cert && (
          <div className="vcard ok">
            <div className="hd"><h3>You can bid. Strong fit.</h3></div>
            <p>{m.minIcv ? `This tender requires a minimum ICV of ${m.minIcv}%. Your certified score of ${s.org.cert.score}% clears it by ${(s.org.cert.score - m.minIcv).toFixed(1)} points.` : "No ICV requirement on this tender. Your certificate still strengthens the evaluation."}</p>
            {m.minIcv ? (
              <>
                <div className="track"><span className="f" style={{ width: `${s.org.cert.score}%` }} /><span className="t" style={{ insetInlineStart: `${m.minIcv}%` }}><span>min {m.minIcv}%</span></span></div>
                <div className="scale"><span>0%</span><span>your score {s.org.cert.score}%</span><span>100%</span></div>
              </>
            ) : null}
            <ul><li>ICV questions answer themselves from your certificate</li><li>Certificate valid to {fmtDate(s.org.cert.validTo)}, well past the closing date</li></ul>
          </div>
        )}
        {pos === "exempt" && (
          <div className="vcard ok">
            <div className="hd"><h3>You can bid. You are exempt.</h3></div>
            <p>You were established in Qatar on {fmtDate(s.org.est)}, under two years ago, so mandatory ICV does not apply to you on this tender.</p>
            <ul><li>The ICV question is answered for you, citing your CR</li><li>Exemption ends {fmtDate(exemptEnd(s.org))}, in about {Math.round(days(exemptEnd(s.org)) / 30.4)} months</li></ul>
            <p className="fine">Your first score will be computed from the audited accounts for the year you are in now. What you spend this year sets it. <Link className="btn q sm" href="/icv">Plan for it</Link></p>
          </div>
        )}
        {pos === "advantaged" && (
          <div className="vcard gold">
            <div className="hd"><h3>You can bid, with an advantage</h3><span className="am">{qr(100000)}</span></div>
            <p>This tender is outside the energy sector, so no ICV certificate is needed. Cabinet Decision 11/2022 applies, and it works in your favour.</p>
            <ul><li>Reserved for local SMEs. Larger competitors are excluded outright, not outbid</li><li>10% Qatari-content price preference, claimed in your cover letter</li><li>Exempt from the performance guarantee, so the capital stays in the business</li></ul>
            <p className="fine">You do not need a certificate for this. Do not spend the money on our account. Figures illustrative, thresholds pending confirmation against the gazetted regulation.</p>
          </div>
        )}
        {pos === "excluded" && (
          <>
            <div className="vcard">
              <div className="hd"><h3>Likely not eligible, unconfirmed</h3></div>
              <p>This reads as an energy-sector tender. A Tawteen ICV certificate is mandatory to bid, and {s.org.short} does not hold one{s.org.self != null ? " (a self-reported score does not count)" : ""}.</p>
              <p className="fine">Qeema cannot confirm eligibility from a document alone. A bid without an ICV score on the closing date is disqualified at commercial evaluation, after you have done all the work. Worth a call to the tender committee before you commit the week.</p>
            </div>
            <div className="note" style={{ marginTop: 12 }}>
              <span className="ic"><I.ask /></span>
              <div><h4>Is this actually an energy-sector tender?</h4><p>If the committee says ICV is not required, correct it here and Qeema will re-read your position.</p></div>
              <button className="btn o sm" onClick={a.correct}>Not gated, correct this</button>
            </div>
          </>
        )}
      </div>
      {pos === "excluded" ? (
        <div className="ob-foot">
          <div className="r">
            <button className="btn o" onClick={() => go(a.stage(5))}>Where can I bid instead</button>
            <button className="btn p" onClick={() => go(a.stage(4))}>What would change this</button>
          </div>
        </div>
      ) : <GoCard t={t} />}
    </Body>
  );
}

function GoCard({ t }: { t: Tender }) {
  const s = useStore();
  const a = useA();
  const router = useRouter();
  const lead = s.leadPick || t.lead || s.me, p = prog(t);

  if (t.go === "go")
    return (
      <div className="dtc dec">
        <div className="dtc-h">
          <span className="decm ok"><I.okc /></span>
          <div className="vn"><b>Bidding · led by {person(t.lead)?.name}</b><span>Decided by {person(t.goBy)?.name}{t.goWhy ? ` · ${t.goWhy}` : ""}</span></div>
          <button className="btn q sm" style={{ marginInlineStart: "auto" }} onClick={a.goreset}>Change</button>
        </div>
        <div className="dtc-f">
          <span className="meta">{p.total - p.write} of {p.total} already drafted</span>
          <div className="r"><button className="btn p" onClick={() => { const to = a.stage(4); if (to) router.push(to); }}>Go to questions</button></div>
        </div>
      </div>
    );
  if (t.go === "nogo")
    return (
      <div className="dtc dec">
        <div className="dtc-h">
          <span className="decm no"><I.x /></span>
          <div className="vn"><b>Not bidding</b><span>{t.goWhy} · decided by {person(t.goBy)?.name}</span></div>
          <button className="btn o sm" style={{ marginInlineStart: "auto" }} onClick={a.goreset}>Reopen</button>
        </div>
      </div>
    );
  return (
    <div className="dtc dec">
      <div className="dtc-h"><div className="vn"><b>Bid or no bid?</b><span>Decide before anyone spends time on answers. The lead owns this tender through to submission.</span></div></div>
      <div className="decb">
        <span className="l">Bid lead</span>
        <div className="leads">
          {s.people.map((x) => (
            <button key={x.id} className={`lp${x.id === lead ? " on" : ""}`} aria-pressed={x.id === lead} onClick={() => a.lead(x.id)}>
              <Avatar id={x.id} sm />{x.name.split(" ")[0]}
            </button>
          ))}
        </div>
        <span className="l">Reason</span>
        <textarea className="inp" rows={2} value={s.gwhy} onChange={(e) => a.gwhy(e.target.value)}
          placeholder="Optional to bid. Required to walk away, so the next tender like this is an easier call." />
      </div>
      <div className="dtc-f">
        <span className="meta">Recorded against the tender, with your name.</span>
        <div className="r">
          <button className="btn o" onClick={() => a.godec("nogo")}>No bid</button>
          <button className="btn p" onClick={() => { const to = a.godec("go"); if (to) router.push(to); }}>Bid, start drafting</button>
        </div>
      </div>
    </div>
  );
}

/* Excluded path, stage 4: what would open the door. */
export function Advisory() {
  const s = useStore();
  const a = useA();
  const router = useRouter();
  return (
    <Body>
      <span className="eyebrow">Advisory, not a verdict</span>
      <h1 className="h1">What would open this door</h1>
      <p className="lede">You cannot bid this one without a certificate. Here is how far away one is.</p>
      <div className="dashed" style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <div>
          <span className="lb">{s.org.self != null ? "Your self-reported score" : "Estimated from your own numbers"}</span>
          <span className="big">{s.org.self != null ? s.org.self : "~41"}%</span>
          <span className="cap">Unaudited. Not a certificate, and never shown to a buyer.</span>
        </div>
        <div style={{ marginInlineStart: "auto", display: "flex", gap: 8 }}>
          <Link className="btn o" href="/icv">See what would move it</Link>
          <button className="btn p">Talk to a certifier</button>
        </div>
      </div>
      <div className="note" style={{ marginTop: 14 }}>
        <span className="ic"><I.info /></span>
        <div><h4>Certifying is a market-entry decision</h4><p>For a firm your size it opens roughly six facilities-management tenders a quarter in the energy sector. Qeema will tell you plainly if your pipeline does not justify it.</p></div>
      </div>
      <div className="ob-foot"><div className="r"><button className="btn p" onClick={() => { const to = a.stage(5); if (to) router.push(to); }}>Where can I bid instead</button></div></div>
    </Body>
  );
}

/* Excluded path, stage 5: tenders open to you instead. */
export function Alternatives({ t }: { t: Tender }) {
  const a = useA();
  const router = useRouter();
  return (
    <Body>
      <span className="eyebrow">Not a dead end</span>
      <h1 className="h1">Three tenders open to you now</h1>
      <p className="lede">None of these require an ICV certificate. Opening one runs the verdict again.</p>
      <table className="tbl" style={{ marginTop: 20 }}>
        <tbody>
          {REDIRECTS.map((r) => (
            <tr key={r.id}>
              <td><b>{r.id}</b>{r.t}</td>
              <td><span className="pos advantaged"><i />{r.tag}</span></td>
              <td style={{ textAlign: "end" }}>
                {r.live
                  ? <button className="btn p sm" onClick={() => { const to = a.reroute(r.id); if (to) router.push(to); }}>Open</button>
                  : <button className="btn o sm" onClick={() => a.say("Sample only in this demo")}>Open</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="meta" style={{ marginTop: 18 }}>Nothing to submit on {t.meta.id}. It is counted in your quarter so the cost of exclusion is visible on the ICV page.</p>
    </Body>
  );
}
