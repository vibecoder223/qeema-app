/* The real backend, over HTTP. Four endpoints under one base URL; see AI-CONTRACT.md.
   Files go as multipart/form-data; everything else as JSON. */
import type { QeemaAI } from "./contract";

async function call<T>(base: string, path: string, body: FormData | object, token?: string): Promise<T> {
  const isForm = body instanceof FormData;
  const res = await fetch(base.replace(/\/+$/, "") + path, {
    method: "POST",
    headers: { ...(isForm ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: isForm ? body : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text().catch(() => "")}`.trim());
  return res.json() as Promise<T>;
}
const form = (fields: Record<string, string | File>) => { const f = new FormData(); Object.entries(fields).forEach(([k, v]) => f.append(k, v)); return f; };

export function httpAI(base: string, token?: string): QeemaAI {
  return {
    readTender: ({ file }) => call(base, "/v1/read-tender", form({ file }), token),
    draftAnswer: (req) => call(base, "/v1/draft-answer", req, token),
    classifyDocument: ({ id, file }) => call(base, "/v1/classify-document", form({ id, file }), token),
    readCr: ({ file }) => call(base, "/v1/read-cr", form({ file }), token),
  };
}

/* Health check used by the settings page. */
export async function ping(base: string, token?: string): Promise<boolean> {
  try {
    const res = await fetch(base.replace(/\/+$/, "") + "/v1/health", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.ok;
  } catch { return false; }
}
