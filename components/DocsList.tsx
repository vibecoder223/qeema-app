"use client";
import Link from "next/link";
import { Fragment, useState } from "react";
import { I } from "@/components/icons";
import { addToLibrary, attachTo } from "@/lib/ai/run";
import { fmtSize, openFile, pickFiles, removeFile } from "@/lib/files";
import { docLabel } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";
import type { Doc } from "@/lib/types";

const CATEGORIES = ["Identity", "Financial", "Local content", "Quality and HSE", "Capability", "Library", "Other"];

/* The company library, grouped. With actions on the profile; read-only in setup. */
export function DocsList({ actions }: { actions?: boolean }) {
  const docs = useStore((s) => s.docs);
  const [open, setOpen] = useState<string | null>(null);
  const groups: string[] = [];
  docs.forEach((d) => { if (!groups.includes(d.g)) groups.push(d.g); });

  return (
    <div className="dtab">
      {groups.map((g) => (
        <Fragment key={g}>
          <div className="dgh">{g}<span>{docs.filter((x) => x.g === g).length}</span></div>
          {docs.filter((d) => d.g === g).map((d) => (
            <Fragment key={d.id}>
              <DocRow d={d} actions={actions} editing={open === d.id} onEdit={() => setOpen(open === d.id ? null : d.id)} />
              {actions && open === d.id && <DocEditor d={d} onDone={() => setOpen(null)} />}
            </Fragment>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

function DocRow({ d, actions, editing, onEdit }: { d: Doc; actions?: boolean; editing: boolean; onEdit: () => void }) {
  const a = useA();
  const [st, label] = docLabel(d);
  const [busy, setBusy] = useState(false);
  const attach = async () => { const [f] = await pickFiles(false); if (!f) return; setBusy(true); await attachTo(d.id, f); setBusy(false); };
  const sub = d.note ?? [d.path ? fmtSize(d.size) : "", d.annex ? "Attached to responses" : "Used for answers"].filter(Boolean).join(" · ");

  return (
    <div className={`doc${actions ? " act" : " na"}${editing ? " editing" : ""}`}>
      <span className="fi"><I.file /></span>
      <div className="dn">
        {d.path ? <button className="dlink" onClick={async () => { if (!(await openFile(d.path))) a.say("That file is not in this browser any more"); }}>{d.n}</button> : <b>{d.n}</b>}
        <span>{sub}</span>
      </div>
      <span className={`st ${st}`}>{label}</span>
      {actions && (
        <span className="dact">
          {st === "miss" && d.id !== "icv" ? <button className="btn p sm" disabled={busy} onClick={attach}><I.up />{busy ? "Uploading…" : "Upload"}</button>
            : d.id === "icv" && st !== "ok" ? <Link className="btn o sm" href="/icv">Open ICV</Link>
            : <button className={`btn ${st === "exp" || st === "soon" ? "o" : "q"} sm`} disabled={busy} onClick={attach}>{busy ? "Uploading…" : "Replace"}</button>}
          <button className="btn q sm ico" onClick={onEdit} aria-label={`Edit ${d.n}`} aria-expanded={editing}><I.pen /></button>
        </span>
      )}
    </div>
  );
}

function DocEditor({ d, onDone }: { d: Doc; onDone: () => void }) {
  const a = useA();
  return (
    <div className="dedit">
      <label className="field"><span>Name</span><input className="inp" value={d.n} onChange={(e) => a.docEdit(d.id, { n: e.target.value })} /></label>
      <label className="field"><span>Category</span>
        <select className="inp" value={CATEGORIES.includes(d.g) ? d.g : "Other"} onChange={(e) => a.docEdit(d.id, { g: e.target.value })}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label className="field"><span>Expires</span>
        <input className="inp" type="date" value={d.exp ?? ""} onChange={(e) => a.docEdit(d.id, { exp: e.target.value || null, st: d.st === "exp" ? "ok" : d.st })} />
      </label>
      <label className="chk"><input type="checkbox" checked={!!d.annex} onChange={(e) => a.docEdit(d.id, { annex: e.target.checked })} />Attach to every response</label>
      <div className="dedit-f">
        <button className="btn q sm danger" onClick={async () => { if (confirm(`Delete ${d.n} from the library?`)) { await removeFile(d.path); a.docDelete(d.id); onDone(); } }}>Delete</button>
        <button className="btn o sm" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}

export function DropZone() {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const add = async (files: File[]) => { if (!files.length) return; setBusy(true); await addToLibrary(files); setBusy(false); };
  return (
    <label
      className={`dz${over ? " over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); add([...e.dataTransfer.files]); }}
    >
      <input type="file" multiple hidden onChange={(e) => { add([...(e.target.files ?? [])]); e.target.value = ""; }} />
      <span className="dzi"><I.up /></span>
      <span className="dzt"><b>{busy ? "Reading documents…" : "Upload documents"}</b><span>Drop files here or click to browse. Qeema sorts them and reads expiry dates. Files stay in this browser.</span></span>
      <span className="btn o sm" aria-hidden="true">Browse</span>
    </label>
  );
}
