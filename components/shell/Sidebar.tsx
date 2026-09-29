"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { I } from "@/components/icons";
import { SCEN } from "@/lib/data";
import { clearFiles } from "@/lib/files";
import { docState, isExempt, queue } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";
import type { ScenarioKey } from "@/lib/types";

function NavLink({ href, icon, label, count, warn, on, onClick }: { href: string; icon: ReactNode; label: string; count?: string; warn?: boolean; on: boolean; onClick?: () => void }) {
  return (
    <Link className={`nl${on ? " on" : ""}`} href={href} onClick={onClick} aria-current={on ? "page" : undefined}>
      <span className="gl" aria-hidden="true">{icon}</span>
      <span className="hide">{label}</span>
      {count && <span className={`ct hide${warn ? " w" : ""}`}>{count}</span>}
    </Link>
  );
}

export function Sidebar() {
  const s = useStore();
  const a = useA();
  const path = usePathname().replace(/\/$/, "") || "/";
  const router = useRouter();
  const q = queue(s), qc = q.approve.length + q.write.length + q.mention.length;
  const warn = s.docs.filter((d) => { const x = docState(d); return x === "exp" || x === "soon"; }).length;
  const onTender = path === "/tenders" || path.startsWith("/tender/");

  return (
    <nav className="nav" aria-label="Main">
      <div className="org">
        <span className="mk" aria-hidden="true">ق</span>
        <div className="hide"><div className="nm">{s.org.short}</div><div className="sub">CR {s.org.cr}</div></div>
      </div>
      <div>
        <span className="slab hide">Work</span>
        <NavLink href="/home" icon={<I.home />} label="Home" count={qc ? String(qc) : ""} on={path === "/home"} />
        <NavLink href="/tenders" icon={<I.list />} label="Tenders" count={s.order.length ? String(s.order.length) : ""} on={onTender} />
        <NavLink href="/tenders/new" icon={<I.plus />} label="New tender" on={path === "/tenders/new"} onClick={a.newTender} />
      </div>
      <div>
        <span className="slab hide">Company</span>
        <NavLink href="/profile" icon={<I.org />} label="Company profile" count={warn ? String(warn) : ""} warn on={path === "/profile"} />
        <NavLink href="/icv" icon={<I.gauge />} label="ICV" count={s.org.cert ? s.org.cert.score + "%" : isExempt(s.org) ? "exempt" : ""} on={path === "/icv"} />
      </div>
      <div className="navfoot">
        <div className="hide">
          <span className="slab">Acting as</span>
          <div className="acting">
            {s.people.map((p) => (
              <button key={p.id} className={`av sm${p.id === s.me ? " me" : ""}`} onClick={() => a.actas(p.id)} title={`${p.name} · ${p.role}`}>{p.ini}</button>
            ))}
          </div>
        </div>
        <div className="demo hide">
          <span className="slab">Demo company</span>
          <div className="scn" role="radiogroup" aria-label="Demo scenario">
            {(Object.keys(SCEN) as ScenarioKey[]).map((k) => (
              <button key={k} className={`so${k === s.scenario ? " on" : ""}`} onClick={() => a.scen(k)} role="radio" aria-checked={k === s.scenario}>
                <span className="sd" />{SCEN[k].label}
              </button>
            ))}
          </div>
          <div className="row">
            <button className="btn o sm" style={{ flex: 1 }} onClick={() => router.push(a.jump()!)}>Jump in</button>
            <button className="btn q sm" onClick={() => router.push(a.restart()!)}>Setup</button>
            <button className="btn q sm" title="Delete everything you created in this browser" onClick={async () => { if (!confirm("Delete everything you created in this browser and reload the sample company?")) return; await clearFiles(); router.push(a.jump()!); }}>Reset</button>
          </div>
        </div>
        <button className="nl hide" onClick={a.theme}><span className="gl"><I.theme /></span>Theme: {s.theme}</button>
      </div>
    </nav>
  );
}
