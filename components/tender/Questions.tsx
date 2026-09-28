"use client";
/* Stage 4: every answer reviewed and approved by someone other than its owner. */
import { Fragment, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { popAt } from "@/components/shell/AssignPop";
import { I } from "@/components/icons";
import { Avatar, Mentions } from "@/components/ui";
import { pad, person } from "@/lib/format";
import { FILTERS, ROWLABEL, STCLS, badge, canApprove, docById, docState, inFilter, openThread, position, prog, qById, todo } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";
import type { Question, Tender } from "@/lib/types";

export function Questions({ t }: { t: Tender }) {
  const s = useStore();
  useKeys(t);
  if (s.focus) return <Focus t={t} />;
  return (
    <div className="split">
      <div className="body"><div className="pad" style={{ paddingTop: 22 }}><div className="col wide"><List t={t} /></div></div></div>
      {s.sel && qById(t, s.sel) && <Panel t={t} q={qById(t, s.sel)!} />}
    </div>
  );
}

function List({ t }: { t: Tender }) {
  const s = useStore();
  const a = useA();
  const router = useRouter();
  const p = prog(t);
  const missing: Record<string, number> = {};
  t.qs.forEach((q) => { if (!q.a && q.reuse === "gap" && q.gapDoc && docState(docById(s, q.gapDoc)!) === "miss") missing[q.gapDoc] = (missing[q.gapDoc] || 0) + 1; });
  const list = t.qs.filter((q) => inFilter(q, s.filter));
  const secs = [...new Set(list.map((q) => q.sec))];

  return (
    <>
      {Object.entries(missing).filter(([id]) => !t.hideGap[id]).map(([id, n]) => (
        <div key={id} className="gapbar">
          <span className="ic"><I.up /></span>
          <div><b>Upload your {docById(s, id)!.n.toLowerCase()}</b><span>Answers {n} question{n > 1 ? "s" : ""}. Nothing in your documents covers {n > 1 ? "them" : "it"} today.</span></div>
          <button className="btn o sm" onClick={() => a.gapup(id)}>Upload</button>
          <button className="gx" onClick={() => a.gapx(id)} aria-label="Dismiss" title="Dismiss"><I.x /></button>
        </div>
      ))}
      <div className="tb">
        {FILTERS.map(([f, label]) => (
          <button key={f} className={`chip${s.filter === f ? " on" : ""}`} onClick={() => a.filter(f)}>{label} <span className="n">{t.qs.filter((q) => inFilter(q, f)).length}</span></button>
        ))}
        <span className="sp meta tnum">{p.approved} of {p.total} approved</span>
      </div>
      {!list.length ? (
        <div className="empty">
          <h3>{s.filter === "todo" ? "Everything is approved" : "Nothing here"}</h3>
          <p>{s.filter === "todo" ? "Every question has a name against it. Export is next." : "Try another filter."}</p>
          {s.filter === "todo" && <button className="btn p" onClick={() => { const to = a.stage(5); if (to) router.push(to); }}>Go to export</button>}
        </div>
      ) : (
        <div className="qlist">
          <div className="qhd"><span>#</span><span>Question</span><span>Status</span><span className="qo">Owner</span><span /></div>
          {secs.map((sec) => (
            <Fragment key={sec}>
              <div className="qsec">{sec}<span>{list.filter((x) => x.sec === sec).length}</span></div>
              {list.filter((q) => q.sec === sec).map((q) => <Row key={q.id} q={q} />)}
            </Fragment>
          ))}
        </div>
      )}
    </>
  );
}

function Row({ q }: { q: Question }) {
  const sel = useStore((s) => s.sel);
  const a = useA();
  const b = badge(q)[0], open = openThread(q);
  const pv = q.a ?? (q.vaultOff ? "Company documents are off. Answer by hand." : q.reuse === "gap" ? "No source in your documents" : "Qeema does not draft this");
  return (
    <div className={`qr${sel === q.id ? " sel" : ""}`} tabIndex={0} role="button" aria-pressed={sel === q.id}
      onClick={() => a.sel(q.id)} onKeyDown={(e) => { if (e.key === "Enter") a.sel(q.id); }}>
      <span className="no">{pad(q.no)}</span>
      <span className="qt"><b>{q.text}</b><span className={`pv${q.a ? "" : " none"}`}>{pv}</span></span>
      <span className="qs"><i className={`mark ${q.status}`} /><span className={`st ${STCLS[b]}`}>{ROWLABEL[b]}</span></span>
      <span className="qo">{q.owner ? <><Avatar id={q.owner} sm /><span>{person(q.owner)!.name.split(" ")[0]}</span></> : <span className="un">Unassigned</span>}</span>
      <span className={`qc${open ? " open" : ""}`}>{q.thread.length ? <><I.chat />{q.thread.length}</> : null}</span>
    </div>
  );
}

function Panel({ t, q }: { t: Tender; q: Question }) {
  const s = useStore();
  const a = useA();
  const [bk, blabel] = badge(q), ca = canApprove(s, q), i = t.qs.indexOf(q);
  const ans = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (s.edit) ans.current?.focus(); }, [s.edit]);
  const gap = q.reuse === "gap" && q.gapDoc ? docById(s, q.gapDoc) : null;

  return (
    <aside className="pnl" aria-label={`Question ${q.no}`}>
      <div className="pnl-top">
        <span className="crumb">Question <b>{pad(q.no)}</b> of {t.qs.length}</span>
        <div style={{ marginInlineStart: "auto", display: "flex", gap: 4 }}>
          <button className="btn q sm" onClick={() => a.step(-1)} disabled={i <= 0} aria-label="Previous">↑</button>
          <button className="btn q sm" onClick={() => a.step(1)} disabled={i >= t.qs.length - 1} aria-label="Next">↓</button>
          <button className="btn q sm" onClick={() => a.sel(null)} aria-label="Close">✕</button>
        </div>
      </div>
      <div className="pnl-body">
        <div className="pgrid">
          <div className="pmain">
            <div><div className="pq">{q.text}</div><div className="pref">Tender: <i>{q.ref}</i></div></div>
            <div>
              <div className="plab">Answer <span className={`bdg ${bk}`}>{blabel}</span></div>
              {s.edit ? (
                <>
                  <textarea ref={ans} className="inp" id="ans" rows={12} placeholder="Write the answer in your own words." value={s.draft ?? ""} onChange={(e) => a.draft(e.target.value)} />
                  <div className="actrow" style={{ marginTop: 8 }}>
                    <button className="btn p sm" onClick={a.save}>Save{q.status === "approved" ? " · clears approval" : ""}</button>
                    <button className="btn q sm" onClick={a.cancel}>Cancel</button>
                    <span className="meta" style={{ alignSelf: "center" }}>Saving records you as the writer</span>
                  </div>
                </>
              ) : q.a ? (
                <div className="ans">{q.a}</div>
              ) : (
                <>
                  <div className="ans none">{q.reuse === "gap" ? "Nothing in your documents answers this. Qeema will not write one for you." : "Qeema does not write this. Prices, plans and staffing are decisions only you can make."}</div>
                  <div className="actrow" style={{ marginTop: 9 }}>
                    {gap && docState(gap) === "miss" && <button className="btn o sm" onClick={() => a.gapup(gap.id)}>Upload {gap.n.toLowerCase()}</button>}
                    <button className="btn o sm" onClick={a.write}>Write it myself</button>
                    <button className="btn q sm" onClick={(e) => { const p = popAt(e.currentTarget); a.assign(q.id, p.x, p.y); }}>Assign…</button>
                  </div>
                </>
              )}
            </div>
            {q.quote ? (
              <div><div className="plab">Source</div><div className="srcq"><b>↩ {q.cite}</b><q>{q.quote}</q></div></div>
            ) : q.a && q.attest ? (
              <div><div className="plab">Source</div><div className="srcq"><b>Written by {person(q.attest)?.name}</b>No document source. The writer is accountable for it.</div></div>
            ) : null}
            {!s.edit && q.a && (
              <>
                <div className="actrow">
                  {q.status === "approved" ? (
                    <button className="btn o sm" onClick={a.edit}>Edit · clears approval</button>
                  ) : (
                    <>
                      <button className="btn p" onClick={a.approve} disabled={!ca[0]}>Approve <span className="kbd" style={{ background: "transparent", color: "inherit", borderColor: "currentColor", opacity: 0.6 }}>A</span></button>
                      <button className="btn o" onClick={a.edit}>Edit</button>
                      <button className="btn q" onClick={a.sendback}>Send back</button>
                    </>
                  )}
                </div>
                {!ca[0] && q.status !== "approved" && <p className="meta" style={{ marginTop: -12 }}>{ca[1]}</p>}
              </>
            )}
          </div>
          <div className="pside">
            <div>
              <div className="plab">People</div>
              <div className="people">
                <div className="prow">
                  {q.owner ? <><Avatar id={q.owner} /><span><b>{person(q.owner)!.name}</b> · owner</span></> : <><span className="av sm none"><I.user /></span><span>No owner</span></>}
                  <button className="btn o sm" onClick={(e) => { const p = popAt(e.currentTarget); a.assign(q.id, p.x, p.y); }}>{q.owner ? "Reassign" : "Assign"}</button>
                </div>
                <div className="prow">
                  {q.approver ? <><Avatar id={q.approver} /><span><b>{person(q.approver)!.name}</b> · approved</span></> : <><span className="av sm none"><I.user /></span><span>Approver: anyone except the owner</span></>}
                </div>
              </div>
            </div>
            <div>
              <div className="plab">Thread{openThread(q) && <button className="btn q sm" style={{ marginInlineStart: "auto" }} onClick={a.resolve}>✓ Resolve</button>}</div>
              {!q.thread.length && <p className="meta">No comments. Type @ and a name to pull someone in.</p>}
              {q.thread.map((m) => m.res ? (
                <div key={m.id} className="res" style={{ marginBottom: 8 }}><Avatar id={m.by} sm /><span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.tx}</span><span>Resolved</span></div>
              ) : (
                <div key={m.id} className="msg" style={{ marginBottom: 12 }}>
                  <Avatar id={m.by} />
                  <div className="bd"><span className="nm">{person(m.by)!.name}</span><span className="at">{m.at}</span><div className="tx"><Mentions text={m.tx} /></div></div>
                </div>
              ))}
            </div>
            {q.log.length > 0 && <div><div className="plab">History</div><div className="hist">{[...q.log].reverse().map((l, k) => <div key={k}>{l}</div>)}</div></div>}
          </div>
        </div>
      </div>
      <div className="pnl-foot">
        <textarea className="inp" id="cbox" rows={2} placeholder="Comment. @Noor to mention, and assign if unowned." style={{ minHeight: 58 }}
          value={s.cdraft} onChange={(e) => a.cdraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); a.send(); } }} />
        <div className="actrow" style={{ marginTop: 8 }}>
          <span className="meta" style={{ alignSelf: "center" }}>Enter to send · a comment is required to send back</span>
          <button className="btn p sm" style={{ marginInlineStart: "auto" }} onClick={a.send}>Send</button>
        </div>
      </div>
    </aside>
  );
}

function Focus({ t }: { t: Tender }) {
  const s = useStore();
  const a = useA();
  const router = useRouter();
  const list = todo(t), p = prog(t);
  const fi = Math.min(s.fi, Math.max(0, list.length - 1));
  const q = list[fi];
  useEffect(() => { if (q && s.sel !== q.id) useStore.getState().a.set((d) => { d.sel = q.id; }); }, [q, s.sel]);

  const head = (
    <div className="fprog">
      <button className="btn q sm" onClick={() => a.focus(false)}>✕ Exit <span className="kbd">Esc</span></button>
      <div className="bar"><i style={{ width: `${Math.round((p.approved / p.total) * 100)}%` }} /></div>
      <span className="n">{p.approved} / {p.total}</span>
    </div>
  );
  if (!q)
    return (
      <div className="focus"><div className="fwrap">{head}
        <div className="fdone"><h3>All {p.total} approved</h3><p>Every answer has an owner and an approver on record.</p>
          <button className="btn p" style={{ marginTop: 16 }} onClick={() => { const to = a.stage(5); if (to) router.push(to); }}>Go to export</button></div>
      </div></div>
    );
  const [bk, blabel] = badge(q), ca = canApprove(s, q);
  return (
    <div className="focus"><div className="fwrap">{head}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className={`bdg ${bk}`}>{blabel}</span>
        <span className="meta">Question {pad(q.no)} · {q.sec}</span>
        <span className="who">{q.owner ? <><Avatar id={q.owner} sm />{person(q.owner)!.name}</> : "Unassigned"}</span>
      </div>
      <div className="fq">{q.text}</div>
      <div className="pref" style={{ marginTop: 6 }}>Tender: <i>{q.ref}</i></div>
      {s.edit ? (
        <>
          <textarea className="inp" id="ans" rows={6} style={{ marginTop: 16 }} autoFocus value={s.draft ?? ""} onChange={(e) => a.draft(e.target.value)} />
          <div className="actrow" style={{ marginTop: 8 }}><button className="btn p sm" onClick={a.save}>Save</button><button className="btn q sm" onClick={a.cancel}>Cancel</button></div>
        </>
      ) : (
        <div className={`fans${q.a ? "" : " none"}`}>{q.a ?? `No answer. ${q.reuse === "gap" ? "Upload a source document, or write it yourself." : "This one is yours to write."}`}</div>
      )}
      {q.quote && !s.edit && <div className="srcq" style={{ marginTop: 14 }}><b>↩ {q.cite}</b><q>{q.quote}</q></div>}
      {!ca[0] && q.a && !s.edit && <p className="meta" style={{ marginTop: 12 }}>{ca[1]}{q.owner === s.me ? " Switch who you are acting as in the sidebar." : ""}</p>}
      <div className="fkeys">
        <span><span className="kbd">A</span> approve</span><span><span className="kbd">E</span> {q.a ? "edit" : "write"}</span>
        <span><span className="kbd">C</span> comment</span><span><span className="kbd">J</span><span className="kbd">K</span> next, previous</span>
        <span style={{ marginInlineStart: "auto" }} className="tnum">{fi + 1} of {list.length} left</span>
      </div>
    </div></div>
  );
}

/* Review keys. Never animated: these run hundreds of times a day. */
function useKeys(t: Tender) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const S = useStore.getState(), a = S.a;
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName);
      if (e.key === "Escape") {
        if (S.pop) return a.unpop();
        if (S.edit) return a.cancel();
        if (S.focus) return a.focus(false);
        if (S.sel) return a.sel(null);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      const cur = S.cur ? S.tenders[S.cur] : null;
      if (!cur || cur.stage !== 4 || position(S, cur) === "excluded") return;
      const k = e.key.toLowerCase();
      if (k === "f") { e.preventDefault(); return a.focus(); }
      if (S.focus) {
        if (k === "j") return a.fstep(1);
        if (k === "k") return a.fstep(-1);
        if (k === "a") { e.preventDefault(); return a.approve(); }
        if (k === "e") { e.preventDefault(); const q = S.sel ? qById(cur, S.sel) : null; return q?.a ? a.edit() : a.write(); }
        if (k === "c") { e.preventDefault(); a.focus(false); setTimeout(() => document.getElementById("cbox")?.focus(), 0); }
        return;
      }
      if (S.sel) {
        if (k === "j") return a.step(1);
        if (k === "k") return a.step(-1);
        if (k === "a") { e.preventDefault(); return a.approve(); }
        if (k === "e") { e.preventDefault(); return a.edit(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [t.meta.id]);
}
