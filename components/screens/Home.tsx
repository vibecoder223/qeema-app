"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { I } from "@/components/icons";
import { Avatar, Body, Top } from "@/components/ui";
import { days, greet, pad, person, qr, short } from "@/lib/format";
import { POSN, READ_STEPS, docLabel, nextAction, position, prog, queue, risks } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";

export function Home() {
  const s = useStore();
  const a = useA();
  const router = useRouter();
  const go = (p: string | void) => { if (p) router.push(p); };
  const me = person(s.me)!, lead = s.me === "u1", Q = queue(s);
  const mine = s.order.map((id) => s.tenders[id]).filter((t) => lead || t.qs.some((q) => q.owner === s.me));
  const open = mine.filter((t) => !t.exported).sort((x, y) => days(x.meta.deadline) - days(y.meta.deadline));
  const newBtn = <Link className="btn p sm" href="/tenders/new" onClick={a.newTender}>+ New tender</Link>;

  if (!s.order.length)
    return (
      <>
        <Top crumb={<b>Home</b>} right={newBtn} />
        <Body wide>
          <div className="hello"><h1 className="h1">{greet()}, {me.name.split(" ")[0]}</h1></div>
          <div className="empty" style={{ marginTop: 26 }}>
            <h3>Drop your first tender</h3>
            <p>Qeema reads it, tells you whether you can bid, and drafts every answer it can find a source for.</p>
            <Link className="btn p" href="/tenders/new" onClick={a.newTender}>+ New tender</Link>
          </div>
        </Body>
      </>
    );

  const nx = open[0];
  const total = Q.approve.length + Q.write.length + Q.mention.length;

  /* Order: things only you can write, then people waiting on you, then approvals grouped per tender. */
  const rows: { k: React.ReactNode; b: string; s: string; go: string; on: () => void }[] = [];
  Q.write.forEach((x) => rows.push({ k: <span className="kt wr"><I.pen />Write</span>, b: x.q.text,
    s: `${x.t.meta.id} · ${x.q.sec}${x.q.reuse === "human" ? " · Qeema does not draft this" : ""}`, go: "Write", on: () => go(a.openq(x.t.meta.id, x.q.id)) }));
  Q.mention.forEach((x) => rows.push({ k: <span className="kt mn"><I.at />Mention</span>,
    b: `${person(x.m.by)!.name}: "${x.m.tx.replace(/@\S+( \S+)?\s?/, "").slice(0, 90)}"`,
    s: `${x.t.meta.id} · Q${pad(x.q.no)} ${x.q.text}`, go: "Reply", on: () => go(a.openq(x.t.meta.id, x.q.id)) }));
  const byT: Record<string, typeof Q.approve> = {};
  Q.approve.forEach((x) => { (byT[x.t.meta.id] ||= []).push(x); });
  Object.entries(byT).forEach(([id, L]) => {
    const who = [...new Set(L.map((x) => person(x.q.owner)!.name.split(" ")[0]))];
    const nosrc = L.filter((x) => !x.q.cite).length;
    rows.push({ k: <span className="kt ap"><I.okc />Approve</span>, b: `${L.length} answer${L.length > 1 ? "s" : ""} ready for your approval`,
      s: `${id} · drafted by ${who.join(", ")}${nosrc ? ` · ${nosrc} hand-written, no source` : " · all cited"}`, go: "Review", on: () => go(a.approvals(id)) });
  });

  const R = lead ? risks(s) : [];

  return (
    <>
      <Top crumb={<b>Home</b>} right={newBtn} />
      <Body wide>
        <div className="hello"><h1 className="h1">{greet()}, {me.name.split(" ")[0]}</h1></div>
        <p className="lede">
          {lead ? `${open.length} open tender${open.length !== 1 ? "s" : ""}` : `You are on ${open.length} tender${open.length !== 1 ? "s" : ""}`}
          {nx && ` · next closes in ${days(nx.meta.deadline)} days, ${nx.meta.id}`}
        </p>

        {/* ① needs you */}
        <section className="hsec">
          <div className="hhead"><h2>Needs you</h2><span className="cnt">{total ? `${total} item${total > 1 ? "s" : ""}` : ""}</span></div>
          <div className="tally">
            <span className={Q.approve.length ? "" : "z"}><b>{Q.approve.length}</b>to approve</span>
            <span className={Q.write.length ? "" : "z"}><b>{Q.write.length}</b>to write</span>
            <span className={Q.mention.length ? "" : "z"}><b>{Q.mention.length}</b>mention{Q.mention.length !== 1 ? "s" : ""}</span>
          </div>
          {!total ? (
            <div className="calm">Nothing is waiting on you. {lead ? "Your team is working through their questions." : "Rand will send you anything that needs you."}</div>
          ) : (
            <div>
              <div className="nhd"><span>Type</span><span>Task</span><span>Action</span></div>
              {rows.slice(0, 8).map((r, i) => (
                <button key={i} className="row" onClick={r.on}>
                  <span className="k">{r.k}</span>
                  <span className="m"><b>{r.b}</b><span>{r.s}</span></span>
                  <span className="go">{r.go} <span className="d">→</span></span>
                </button>
              ))}
              {rows.length > 8 && <p className="meta" style={{ padding: "10px 4px" }}>and {rows.length - 8} more</p>}
            </div>
          )}
        </section>

        {/* ② could get a bid rejected. Bid manager only: documents are company-wide. */}
        {R.length > 0 && (
          <section className="hsec">
            <div className="hhead"><h2>Could get a bid rejected</h2><span className="cnt">{R.length}</span></div>
            {R.map((r) => {
              const ids = r.tenders.map((t) => t.meta.id), exp = r.st === "exp";
              return (
                <div key={r.d.id} className={`risk ${exp ? "hot" : "soon"}`}>
                  <span className="ic">{exp ? <I.alert /> : <I.clock />}</span>
                  <div className="m">
                    <b>{r.d.n}{exp ? ` expired ${-days(r.d.exp!)} days ago` : ` expires in ${days(r.d.exp!)} days`}</b>
                    <span>{exp ? "Attached to " : "Before "}{ids.length} open tender{ids.length > 1 ? "s" : ""}{exp ? "" : ` close${ids.length > 1 ? "" : "s"}`}: {ids.join(", ")}</span>
                  </div>
                  <button className="btn o sm" onClick={() => a.replaceDoc(r.d.id)}>Replace</button>
                </div>
              );
            })}
          </section>
        )}

        {/* ③ open tenders by deadline */}
        <section className="hsec">
          <div className="hhead">
            <h2>{lead ? "Open tenders" : "Tenders you are on"}</h2><span className="cnt">by closing date</span>
            <span className="r"><Link className="btn q sm" href="/tenders">All tenders</Link></span>
          </div>
          {!open.length ? <div className="calm">No open tenders.</div> : (
            <>
              <div className="thd"><span>Tender</span><span>Position</span><span>Progress</span><span>Closes</span><span>Next</span></div>
              {open.map((t) => {
                const pos = position(s, t), p = prog(t), n = nextAction(s, t), d = days(t.meta.deadline), rd = t.readN >= READ_STEPS && t.reached >= 3;
                const act = () => (n.stage === "profile" ? router.push("/profile") : go(a.open(t.meta.id, n.stage)));
                return (
                  <button key={t.meta.id} className="trow" onClick={act}>
                    <span className="t"><b>{t.meta.id}</b><span>{t.meta.buyer} · {t.meta.title}</span></span>
                    <span><span className={`pos ${rd ? pos : "new"}`}><i />{!rd && <I.read />}{rd ? POSN[pos] : t.readN < READ_STEPS ? "Reading" : "Not opened"}</span></span>
                    <span>
                      {rd && pos !== "excluded"
                        ? <><div className="bar" style={{ width: "100%" }}><i style={{ width: `${Math.round((p.approved / p.total) * 100)}%` }} /></div><span className="meta tnum">{p.approved} of {p.total} approved</span></>
                        : <span className="meta">·</span>}
                    </span>
                    <span className={`dl${d <= 10 ? " near" : ""}`}>{d} days<span>{short(t.meta.deadline)}</span></span>
                    <span className="nx">{n.who && <Avatar id={n.who} sm />}<em>{n.txt}</em><span className="go">{n.go} →</span></span>
                  </button>
                );
              })}
            </>
          )}
        </section>

        {/* ④ one quiet line: money, once, at the bottom */}
        {lead && (
          <div className="quiet">
            <span>This quarter</span>
            {s.quarter.claimed
              ? <span><span className="g">{qr(s.quarter.claimed)}</span> in preferences claimed across {s.quarter.submitted} submitted bid{s.quarter.submitted !== 1 ? "s" : ""}</span>
              : <span>No bids submitted yet</span>}
            {(s.quarter.won > 0 || s.quarter.lost > 0) && <span>{s.quarter.won} won · {s.quarter.lost} lost</span>}
            {s.exclusions.length > 0 && (
              <span>{s.exclusions.length} tender{s.exclusions.length > 1 ? "s" : ""} closed to you · <Link className="btn q sm" href="/icv" style={{ padding: "0 4px" }}>what it cost</Link></span>
            )}
          </div>
        )}
      </Body>
    </>
  );
}
