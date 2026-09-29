/* Orchestration: runs the AI jobs and feeds results into the store. Screens call these. */
import { ai } from ".";
import { getFile, putFile } from "../files";
import { useStore } from "../store";
import type { Doc, Tender } from "../types";
import type { ClassifyDocumentResult } from "./contract";

const A = () => useStore.getState().a;
const S = () => useStore.getState();

const library = () => S().docs.filter((d) => d.st !== "miss").map((d) => ({ id: d.id, name: d.n, category: d.g, expires: d.exp }));
const company = () => { const s = S(); return { name: s.org.name, cr: s.org.cr, established: s.org.est, icvScore: s.org.cert?.score ?? s.org.self, icvCertified: !!s.org.cert }; };

/* Job 1 then job 2 for every answerable question. Drives the reading pipeline on the Details tab. */
export async function readAndDraft(key: string) {
  const t0 = S().tenders[key]; if (!t0) return;
  try {
    const file = await getFile(t0.filePath);
    if (!file) throw new Error("The tender file is no longer in this browser");
    A().setReadN(key, 1);
    const r = await ai().readTender({ file });
    A().setReadN(key, 3); A().applyRead(key, r); A().setReadN(key, 5);
    await draftAll(key);
  } catch (e) {
    A().say(`Could not read the tender: ${(e as Error).message}`);
  } finally {
    A().setReadN(key, 6);
  }
}

export async function draftOne(key: string, qid: string) {
  const t = S().tenders[key]; const q = t?.qs.find((x) => x.id === qid); if (!t || !q || q.a) return;
  try {
    const r = await ai().draftAnswer({ question: { text: q.text, section: q.sec, ref: q.ref },
      tender: { reference: t.meta.id, buyer: t.meta.buyer, title: t.meta.title }, company: company(), library: library() });
    A().applyDraft(key, qid, r);
    return r.status;
  } catch (e) { A().say(`Drafting failed: ${(e as Error).message}`); }
}
export async function draftAll(key: string) {
  const t: Tender | undefined = S().tenders[key]; if (!t) return 0;
  const todo = t.qs.filter((q) => !q.a && q.reuse !== "human").map((q) => q.id);
  let n = 0;
  for (const id of todo) if ((await draftOne(key, id)) === "drafted") n++;
  return n;
}

/* Job 3: store the file, classify it, add it to the library. */
export async function addToLibrary(files: File[]) {
  for (const file of files) {
    const stored = await putFile(file), id = "d" + crypto.randomUUID().slice(0, 8);
    let c: ClassifyDocumentResult | null = null;
    try { c = await ai().classifyDocument({ id, file }); } catch (e) { A().say(`Could not classify ${file.name}: ${(e as Error).message}`); }
    const doc: Doc = { id, g: c?.category ?? "Other", n: c?.name ?? file.name.replace(/\.[^.]+$/, ""), st: "ok", exp: c?.expires ?? null,
      annex: c?.attachToResponses ?? false, path: stored.path, size: stored.size, note: c ? undefined : "Uploaded · not classified" };
    A().addDoc(doc);
  }
  if (files.length) A().say(`${files.length} document${files.length > 1 ? "s" : ""} added to your library`);
}

/* Attach a file to an existing library entry (a missing document, or a replacement). */
export async function attachTo(docId: string, file: File) {
  const stored = await putFile(file);
  let exp: string | null = null;
  try { exp = (await ai().classifyDocument({ id: docId, file })).expires; } catch { /* keep going without it */ }
  A().docAttach(docId, stored);
  if (exp) A().docEdit(docId, { exp });
}

/* Job 4: the CR, during setup. */
export async function readCrInto(file: File) {
  const r = await ai().readCr({ file });
  const a = A();
  if (r.companyName) a.orgField("name", r.companyName);
  if (r.crNumber) a.orgField("cr", r.crNumber);
  if (r.established) a.orgField("est", r.established);
  if (r.classification) a.orgField("cls", r.classification);
  if (r.address) a.orgField("addr", r.address);
  if (r.employees) a.orgField("staff", r.employees);
  a.obcr();
}
