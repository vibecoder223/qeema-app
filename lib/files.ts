/* Files, kept in this browser (IndexedDB) so an upload can be opened again after a reload.
   Each person's copy of the app is their own; nothing leaves the browser except calls to an AI endpoint you configure. */
import type { StoredFile } from "./types";

const DB = "qeema-files", STORE = "files";

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = fn(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putFile(file: File): Promise<StoredFile> {
  const path = "f:" + crypto.randomUUID();
  await tx("readwrite", (s) => s.put(file, path));
  return { n: file.name, path, size: file.size };
}
export async function getFile(path?: string): Promise<File | null> {
  if (!path) return null;
  try { return ((await tx("readonly", (s) => s.get(path))) as File) ?? null; } catch { return null; }
}
export async function openFile(path?: string): Promise<boolean> {
  const f = await getFile(path);
  if (!f) return false;
  const url = URL.createObjectURL(f);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
export async function removeFile(path?: string) {
  if (path) await tx("readwrite", (s) => s.delete(path)).catch(() => {});
}
export async function clearFiles() {
  await tx("readwrite", (s) => s.clear()).catch(() => {});
}

export const fmtSize = (b?: number) => (b == null ? "" : b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`);

/* Open the system file picker from code. */
export function pickFiles(multiple = false, accept?: string): Promise<File[]> {
  return new Promise((resolve) => {
    const i = document.createElement("input");
    i.type = "file"; i.multiple = multiple;
    if (accept) i.accept = accept;
    i.onchange = () => resolve([...(i.files ?? [])]);
    i.click();
  });
}
