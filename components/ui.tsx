"use client";
/* Small shared pieces. Class names are the design system's (app/globals.css). */
import type { ReactNode } from "react";
import { person } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { PersonId } from "@/lib/types";

export function Avatar({ id, sm }: { id: PersonId | null | undefined; sm?: boolean }) {
  const me = useStore((s) => s.me);
  const p = person(id);
  if (!p) return null;
  return <span className={`av${sm ? " sm" : ""}${id === me ? " me" : ""}`} title={p.name}>{p.ini}</span>;
}

export function Toggle({ on, onClick, label, sub }: { on: boolean; onClick: () => void; label?: string; sub?: string }) {
  return (
    <button className={`toggle${on ? " on" : ""}`} onClick={onClick} role="switch" aria-checked={on} aria-label={label || "Use company library"}>
      <span className="tr" />
      <span>
        {label && <b style={{ display: "block", color: "var(--ink)", fontWeight: 600 }}>{label}</b>}
        {sub && <span className="meta">{sub}</span>}
      </span>
    </button>
  );
}

export function Top({ crumb, right }: { crumb: ReactNode; right?: ReactNode }) {
  return (
    <div className="top">
      <span className="crumb">{crumb}</span>
      <div className="r">{right}</div>
    </div>
  );
}

/* A page body: scroll area + padded column. */
export function Body({ wide, children, style }: { wide?: boolean; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="body">
      <div className="pad">
        <div className={`col${wide ? " wide" : ""}`} style={style}>{children}</div>
      </div>
    </div>
  );
}

/* Highlights @mentions in a comment. */
export function Mentions({ text }: { text: string }) {
  const people = useStore.getState().people.map((p) => p.name);
  const names = [...people, ...people.map((n) => n.split(" ")[0])].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!names.length) return <>{text}</>;
  const re = new RegExp("(@(?:" + names.map((n) => n.replace(/[-]/g, "\\-")).join("|") + "))", "g");
  return <>{text.split(re).map((part, i) => (part.startsWith("@") && names.includes(part.slice(1)) ? <mark key={i}>{part}</mark> : part))}</>;
}
