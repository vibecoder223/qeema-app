"use client";
import { useState } from "react";
import { DocsList, DropZone } from "@/components/DocsList";
import { Avatar, Body, Toggle, Top } from "@/components/ui";
import { docState } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";
import type { Org } from "@/lib/types";

const FIELDS: [keyof Org, string, string?][] = [
  ["name", "Company name"], ["cr", "Commercial registration"], ["est", "Established", "date"],
  ["cls", "Classification"], ["staff", "Employees"], ["addr", "Registered address"],
];

export function Profile() {
  const s = useStore();
  const a = useA();
  const inDate = s.docs.filter((d) => docState(d) === "ok").length;
  const [nm, setNm] = useState(""), [rl, setRl] = useState("");

  return (
    <>
      <Top crumb={<b>Company profile</b>} />
      <Body>
        <h1 className="h1">{s.org.name || "Your company"}</h1>
        <p className="lede">Your knowledge base. Every tender is answered from here, so upload once and keep it in date. Files for a single bid go in that tender instead.</p>
        <div className="grid2" style={{ marginTop: 22 }}>
          {FIELDS.map(([k, l, type]) => (
            <label key={k} className="field">
              <span>{l}</span>
              <input className="inp" type={type || "text"} value={String(s.org[k] ?? "")} onChange={(e) => a.orgField(k, e.target.value)} />
            </label>
          ))}
        </div>
        <div className="hr" />
        <Toggle on={s.org.vaultOn} onClick={a.togVault} label="Answer from company documents" sub="Applies to new tenders. Off means facts and attachments are filled by hand." />

        <div className="hr" />
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
          <h2 style={{ fontSize: 17 }}>Company library</h2>
          <span className="meta">{inDate} of {s.docs.length} in date</span>
        </div>
        <DropZone />
        <DocsList actions />

        <div className="hr" />
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
          <h2 style={{ fontSize: 17 }}>Team</h2>
          <span className="meta">{s.people.length} people · owners write, anyone else approves</span>
        </div>
        <div className="dtab team">
          {s.people.map((p) => (
            <div key={p.id} className="doc act">
              <Avatar id={p.id} />
              <div className="dn">
                <input className="inp bare" value={p.name} aria-label="Name" onChange={(e) => a.editPerson(p.id, { name: e.target.value })} />
                <input className="inp bare sub" value={p.role} aria-label="Role" onChange={(e) => a.editPerson(p.id, { role: e.target.value })} />
              </div>
              <span className="meta">{p.id === s.me ? "You" : ""}</span>
              <span className="dact">
                {p.id !== s.me && <button className="btn q sm danger" onClick={() => { if (confirm(`Remove ${p.name}? Their questions become unassigned.`)) a.removePerson(p.id); }}>Remove</button>}
              </span>
            </div>
          ))}
          <form className="doc act addp" onSubmit={(e) => { e.preventDefault(); a.addPerson(nm, rl); setNm(""); setRl(""); }}>
            <span className="fi">+</span>
            <div className="dn two">
              <input className="inp" placeholder="Name" value={nm} onChange={(e) => setNm(e.target.value)} />
              <input className="inp" placeholder="Role, e.g. HSE lead" value={rl} onChange={(e) => setRl(e.target.value)} />
            </div>
            <span />
            <span className="dact"><button className="btn o sm" disabled={!nm.trim()}>Add</button></span>
          </form>
        </div>
      </Body>
    </>
  );
}
