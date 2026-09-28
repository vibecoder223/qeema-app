/* The response document. Word opens HTML saved as .doc, which keeps the demo dependency-free.
   Production would render a real .docx on the server. */
import { letter, person } from "./format";
import { annexes, docLabel, letterClaims, prog } from "./logic";
import type { State, Tender } from "./types";

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function downloadDoc(S: State, t: Tender, draft = false) {
  const ax = annexes(S, t), p = prog(t);
  let body = "";
  if (t.settings.cover) {
    body += `<p><b>${esc(S.org.name)}</b><br>${esc(S.org.addr)} · CR ${esc(S.org.cr)}<br>25 September 2026</p><p>To: ${esc(t.meta.buyer)}<br>Re: ${esc(t.meta.id)}, ${esc(t.meta.title)}</p>`;
    body += `<p>${esc(S.org.name)} submits this response to tender ${esc(t.meta.id)}.</p>`;
    const c = letterClaims(S, t);
    if (c) body += `<p>${esc(c)}</p>`;
    body += `<p>This response is valid for 90 days. Supporting documents are attached as Annexes A to ${letter(ax.length - 1)}.</p><p>Signed: ____________________</p><br style='page-break-before:always'>`;
  }
  if (draft) body = `<p style='color:#b45309;font-weight:bold'>DRAFT · ${p.approved} of ${p.total} answers approved · not for submission</p>` + body;
  body += "<h2>Responses</h2>";
  t.qs.forEach((q) => {
    const ok = q.status === "approved";
    body += `<p><b>${q.no}. ${esc(q.text)}</b><br><i style='color:#666'>Tender: ${esc(q.ref)}</i></p>`;
    body += `<p>${ok ? esc(q.a) : "<i style='color:#999'>[Awaiting approval]</i>"}</p>`;
    if (q.cite && ok) body += `<p style='font-size:9pt;color:#555'>Source: ${esc(q.cite)}</p>`;
    if (q.approver) body += `<p style='font-size:9pt;color:#555'>Approved by ${esc(person(q.approver)?.name)}</p>`;
  });
  body += "<br style='page-break-before:always'><h2>Annex index</h2>";
  ax.forEach((d, i) => { body += `<p>${letter(i)}. ${esc(d.n)} · ${esc(docLabel(d)[1])}</p>`; });
  const html = `<html><head><meta charset='utf-8'><style>body{font-family:'Times New Roman';font-size:11pt;line-height:1.3}h2{font-size:13pt}</style></head><body>${body}</body></html>`;
  const blob = new Blob(["﻿" + html], { type: "application/msword" });
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = `${t.meta.id}-01-Response${draft ? "-DRAFT" : ""}.doc`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
