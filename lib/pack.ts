/* The bid pack: one zip with the response, the checklist, the manifest and every annex. */
import JSZip from "jszip";
import { responseHtml, refOf, saveBlob } from "./download";
import { getFile } from "./files";
import { fmtDate, letter } from "./format";
import { annexes, docLabel, letterClaims } from "./logic";
import type { State, Tender } from "./types";

export async function downloadPack(S: State, t: Tender) {
  const zip = new JSZip(), ref = refOf(t), root = zip.folder(`${ref}-response`)!;
  const ax = annexes(S, t), det = t.det;

  root.file("01-Response.doc", "﻿" + responseHtml(S, t));

  const checklist = [
    `SUBMISSION CHECKLIST · ${t.meta.id || t.meta.title}`,
    `${t.meta.buyer} · ${t.meta.title}`,
    "",
    `Deadline: ${fmtDate(t.meta.deadline)}${det.time ? ", " + det.time : ""}`,
    det.fmt ? `Format: ${det.fmt}` : "Format: as the tender states",
    det.bond ? `Bid bond: ${det.bond}` : null,
    det.valid ? `Bid validity: ${det.valid}` : null,
    "",
    "[ ] Print 01-Response.doc and sign the cover letter",
    letterClaims(S, t) ? "[ ] Check the claims in the cover letter match what you intend to assert" : null,
    ...t.ent.filter((e) => e.sig).map((e) => `[ ] ${e.n}: authorised signature`),
    ...ax.map((d, i) => `[ ] Annex ${letter(i)}: ${d.n}`),
    "[ ] Seal and deliver as the tender instructs",
    "",
    "Qeema prepared this pack. It does not submit or sign on your behalf.",
  ].filter((x) => x !== null).join("\r\n");
  root.file("00-Submission-checklist.txt", checklist);

  const missing: string[] = [];
  const manifest = [`ANNEX INDEX · ${t.meta.id || t.meta.title}`, ""];
  for (const [i, d] of ax.entries()) {
    const f = await getFile(d.path);
    const name = `${letter(i)}-${d.n.replace(/[^\w.-]+/g, "-")}${f ? f.name.slice(f.name.lastIndexOf(".")) : ".txt"}`;
    manifest.push(`${letter(i)}. ${d.n} · ${docLabel(d)[1]}${f ? "" : " · FILE NOT UPLOADED"}`);
    if (f) root.file(`annexes/${name}`, f);
    else { missing.push(d.n); root.file(`annexes/${name}`, `${d.n} has not been uploaded to Qeema yet. Add the file before submitting.`); }
  }
  root.file("Manifest.txt", manifest.join("\r\n"));

  saveBlob(await zip.generateAsync({ type: "blob" }), `${ref}-response.zip`);
  return missing;
}
