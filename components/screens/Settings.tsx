"use client";
/* Where the AI backend plugs in. Leave the address empty to use the built-in mock. */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { I } from "@/components/icons";
import { Body, Top } from "@/components/ui";
import { aiSettings, saveAiSettings } from "@/lib/ai";
import { ping } from "@/lib/ai/http";
import { clearFiles } from "@/lib/files";
import { useA } from "@/lib/store";

const JOBS: [string, string, string][] = [
  ["POST /v1/read-tender", "multipart: file", "Tender details with source pages, and the list of questions"],
  ["POST /v1/draft-answer", "JSON: question, tender, company, library", "An answer with its citation, or no_source, or human"],
  ["POST /v1/classify-document", "multipart: id, file", "Name, category, expiry date, whether to attach it"],
  ["POST /v1/read-cr", "multipart: file", "Company name, CR number, established date, classification"],
  ["GET /v1/health", "", "200 when the backend is up"],
];

export function Settings() {
  const a = useA();
  const router = useRouter();
  const [endpoint, setEndpoint] = useState(""), [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  useEffect(() => { const s = aiSettings(); setEndpoint(s.endpoint); setToken(s.token); }, []);
  const saved = aiSettings().endpoint;

  const save = () => { saveAiSettings({ endpoint: endpoint.trim(), token: token.trim() }); a.say(endpoint.trim() ? "Saved. Qeema now calls your backend." : "Saved. Qeema uses the mock AI."); setStatus("idle"); };
  const test = async () => { setStatus("testing"); setStatus((await ping(endpoint.trim(), token.trim() || undefined)) ? "ok" : "fail"); };

  return (
    <>
      <Top crumb={<b>AI connection</b>} />
      <Body>
        <span className="eyebrow">For developers</span>
        <h1 className="h1">AI connection</h1>
        <p className="lede">Qeema needs four AI jobs. Until a backend exists, a built-in mock answers them: realistic for the sample tenders, honest empties for anything else. Point this at your server and every upload, read and draft goes through it.</p>

        <div className="dtc">
          <div className="dtc-h">
            <span className={`decm ${saved ? "ok" : ""}`} style={saved ? undefined : { background: "var(--panel)", color: "var(--ink-3)" }}>{saved ? <I.okc /> : <I.info />}</span>
            <div className="vn"><b>{saved ? "Connected backend" : "Mock AI"}</b><span>{saved ? saved : "No backend address set. Stored in this browser only."}</span></div>
          </div>
          <div className="decb">
            <span className="l">Base address</span>
            <input className="inp" placeholder="https://your-backend.example.com" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
            <span className="l">Token</span>
            <input className="inp" placeholder="Optional. Sent as Authorization: Bearer …" value={token} onChange={(e) => setToken(e.target.value)} type="password" autoComplete="off" />
          </div>
          <div className="dtc-f">
            <span className="meta">
              {status === "testing" ? "Checking /v1/health…" : status === "ok" ? "Backend is reachable." : status === "fail" ? "No answer from /v1/health. Check the address and CORS." : "Leave empty to use the mock."}
            </span>
            <div className="r">
              <button className="btn o" disabled={!endpoint.trim() || status === "testing"} onClick={test}>Test</button>
              <button className="btn p" onClick={save}>Save</button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 26 }}>
          <span className="slab" style={{ padding: 0 }}>The contract</span>
          <table className="tbl" style={{ marginTop: 8 }}>
            <tbody>
              {JOBS.map(([ep, input, out]) => (
                <tr key={ep}><td><b style={{ fontFamily: "var(--mono)" }}>{ep}</b>{input}</td><td>{out}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="meta" style={{ marginTop: 10 }}>Full request and response shapes, with examples: <code>AI-CONTRACT.md</code> in the repository, and <code>lib/ai/contract.ts</code> in code.</p>
        </div>

        <div className="hr" />
        <h2 style={{ fontSize: 17 }}>Demo data</h2>
        <p className="meta" style={{ marginTop: 4 }}>Everything you create lives in this browser. Reset to start again from the sample company.</p>
        <div className="actrow" style={{ marginTop: 12 }}>
          <button className="btn o danger" onClick={async () => {
            if (!confirm("Delete everything in this browser and reload the sample company?")) return;
            await clearFiles(); localStorage.removeItem("qeema.demo.v2"); router.push(a.jump()!);
          }}>Reset demo data</button>
        </div>
      </Body>
    </>
  );
}
