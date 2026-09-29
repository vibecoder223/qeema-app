"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Top } from "@/components/ui";
import { days, short } from "@/lib/format";
import { READ_STEPS, gateRows, position, prog, stageOpen, tstatus } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";
import type { Stage, Tender } from "@/lib/types";

/* Breadcrumb, status, deadline, and the tabs. Tabs lock until their step is reachable. */
export function TenderTop({ t }: { t: Tender }) {
  const s = useStore();
  const a = useA();
  const router = useRouter();
  const ex = position(s, t) === "excluded";
  const [tone, label] = tstatus(s, t);
  const p = prog(t), g = gateRows(s, t).length;

  const right = (
    <>
      {t.stage === 4 && !ex && !s.focus && (
        <button className="btn o sm" onClick={() => a.focus(true)}>Focus mode <span className="kbd">F</span></button>
      )}
      <span className={`st tst ${tone}`}>{label}</span>
      <span className="meta tnum">Closes {short(t.meta.deadline)} · {days(t.meta.deadline)} days</span>
      <button className="btn q sm danger" onClick={() => { if (confirm(`Delete ${t.meta.id || "this tender"}? Its answers and comments go too.`)) { router.push("/tenders"); a.deleteTender(t.key); } }}>Delete</button>
    </>
  );
  const tabs: [Stage, string, React.ReactNode][] = ex
    ? [[2, "Details", null], [3, "Verdict", null], [4, "Advisory", null], [5, "Alternatives", null]]
    : [
        [2, "Details", t.det.ok ? null : <span className="n w">!</span>],
        [3, "Verdict", null],
        [4, "Questions", <span className="n">{p.approved}/{p.total}</span>],
        [5, "Export", g ? <span className="n w">{g}</span> : null],
      ];

  return (
    <>
      <Top
        crumb={<><Link className="crumbl" href="/tenders">Tenders</Link><span className="sl">/</span><b>{t.meta.id || "New tender"}</b><span className="cs">{[t.meta.buyer, t.meta.title].filter(Boolean).join(" · ")}</span></>}
        right={right}
      />
      {t.readN >= READ_STEPS && (
        <div className="ttabs" role="tablist">
          {tabs.map(([n, name, badge]) => (
            <button key={n} className={`tt${t.stage === n ? " on" : ""}`} role="tab" aria-selected={t.stage === n}
              disabled={!stageOpen(s, t, n)} onClick={() => { const to = a.stage(n); if (to) router.push(to); }}>
              {name}{badge}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
