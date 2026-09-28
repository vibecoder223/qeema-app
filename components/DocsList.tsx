"use client";
import Link from "next/link";
import { Fragment, useState } from "react";
import { I } from "@/components/icons";
import { docLabel } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";

/* The company library, grouped. With actions on the profile; read-only in setup. */
export function DocsList({ actions }: { actions?: boolean }) {
  const docs = useStore((s) => s.docs);
  const a = useA();
  const groups: string[] = [];
  docs.forEach((d) => { if (!groups.includes(d.g)) groups.push(d.g); });

  return (
    <div className="dtab">
      {groups.map((g) => (
        <Fragment key={g}>
          <div className="dgh">{g}<span>{docs.filter((x) => x.g === g).length}</span></div>
          {docs.filter((d) => d.g === g).map((d) => {
            const [st, label] = docLabel(d);
            return (
              <div key={d.id} className={`doc${actions ? "" : " na"}`}>
                <span className="fi"><I.file /></span>
                <div className="dn"><b>{d.n}</b><span>{d.note ?? (d.annex ? "Attached to responses" : "Used for answers")}</span></div>
                <span className={`st ${st}`}>{label}</span>
                {actions && (
                  st === "exp" || st === "soon" ? <button className="btn o sm" onClick={() => a.replaceDoc(d.id)}>Replace</button>
                  : st === "miss" && d.id !== "icv" ? <button className="btn p sm" onClick={() => a.upload(d.id)}><I.up />Upload</button>
                  : d.id === "icv" && st !== "ok" ? <Link className="btn o sm" href="/icv">Open ICV</Link>
                  : <button className="btn q sm" onClick={() => a.replaceDoc(d.id)}>Replace</button>
                )}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

export function DropZone() {
  const a = useA();
  const [over, setOver] = useState(false);
  const names = (f: FileList | null) => [...(f ?? [])].map((x) => x.name);
  return (
    <label
      className={`dz${over ? " over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); a.addFiles(names(e.dataTransfer.files)); }}
    >
      <input type="file" multiple hidden onChange={(e) => { a.addFiles(names(e.target.files)); e.target.value = ""; }} />
      <span className="dzi"><I.up /></span>
      <span className="dzt"><b>Upload documents</b><span>Drop files here or click to browse. PDF, Word or images. Qeema sorts them and reads expiry dates.</span></span>
      <span className="btn o sm" aria-hidden="true">Browse</span>
    </label>
  );
}
