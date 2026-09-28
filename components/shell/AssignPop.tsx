"use client";
import { PEOPLE } from "@/lib/data";
import { useA, useStore } from "@/lib/store";

/* "Assign to" popover. Opened from a question; positioned at its trigger. */
export function AssignPop() {
  const pop = useStore((s) => s.pop);
  const me = useStore((s) => s.me);
  const a = useA();
  if (!pop) return null;
  return (
    <>
      <div className="scrim" onClick={a.unpop} />
      <div className="pop" style={{ left: pop.x, top: pop.y }} role="menu">
        <span className="slab">Assign to</span>
        {PEOPLE.map((p) => (
          <button key={p.id} onClick={() => a.doassign(p.id)} role="menuitem">
            <span className={`av sm${p.id === me ? " me" : ""}`}>{p.ini}</span>
            <span className="nm">{p.name}</span>
            <span className="rl">{p.role}</span>
          </button>
        ))}
      </div>
    </>
  );
}

/* Where to open the popover for a trigger element. */
export function popAt(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const x = Math.max(8, Math.min(r.left, window.innerWidth - 270));
  let y = r.bottom + 6;
  if (y + 300 > window.innerHeight) y = Math.max(8, r.top - 296);
  return { x, y };
}
