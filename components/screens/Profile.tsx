"use client";
import { DocsList, DropZone } from "@/components/DocsList";
import { Body, Toggle, Top } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { docState } from "@/lib/logic";
import { useA, useStore } from "@/lib/store";

export function Profile() {
  const s = useStore();
  const a = useA();
  const inDate = s.docs.filter((d) => docState(d) === "ok").length;
  return (
    <>
      <Top crumb={<b>Company profile</b>} />
      <Body>
        <h1 className="h1">{s.org.name}</h1>
        <p className="lede">Your knowledge base. Every tender is answered from here, so upload once and keep it in date. Files for a single bid go in that tender instead.</p>
        <div className="grid2" style={{ marginTop: 22 }}>
          {[["Commercial registration", s.org.cr], ["Established", fmtDate(s.org.est)], ["Classification", s.org.cls], ["Employees", s.org.staff]].map(([l, v]) => (
            <div key={l} className="field"><label>{l}</label><div className="inp" style={{ background: "var(--canvas)" }}>{v}</div></div>
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
      </Body>
    </>
  );
}
