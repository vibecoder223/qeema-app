// A minimal Qeema AI backend: the four endpoints from AI-CONTRACT.md, returning canned data.
// No dependencies. Run: node examples/mock-server.mjs   → http://localhost:8787
// Replace each handler's body with real model calls.
import http from "node:http";

const PORT = process.env.PORT || 8787;

const handlers = {
  "/v1/read-tender": () => ({
    details: {
      reference: { value: "EX-2026-0001", source: { page: 1, section: null } },
      buyer: { value: "Example Ministry", source: { page: 1, section: null } },
      title: { value: "Example facilities services", source: { page: 1, section: null } },
      deadline: { value: "2026-12-01", source: { page: 2, section: "§1.3" } },
      deadlineTime: { value: "12:00", source: { page: 2, section: "§1.3" } },
      energySector: { value: false, source: { page: 1, section: "§1.1" } },
      minIcvScore: { value: null, source: null },
      clarificationDeadline: { value: "2026-11-15", source: { page: 2, section: "§1.4" } },
      siteVisit: { value: null, source: null },
      bidBond: { value: "2% of bid value", source: { page: 6, section: "§3.2" } },
      bidValidity: { value: "90 days", source: { page: 6, section: "§3.4" } },
      submissionFormat: { value: "One sealed envelope, by hand", source: { page: 3, section: "§2.1" } },
      language: { value: "English", source: { page: 1, section: null } },
      pages: 12,
    },
    questions: [
      { section: "Company", text: "State your commercial registration number and date of incorporation.", ref: "Schedule A, 1", kind: "answer" },
      { section: "HSE", text: "Describe your HSE management system.", ref: "Schedule C, 1", kind: "answer" },
      { section: "Commercial", text: "Provide your pricing schedule.", ref: "Schedule D, 1", kind: "human" },
    ],
  }),
  "/v1/draft-answer": (body) =>
    /pric|staff|mobilisation|programme/i.test(body?.question?.text ?? "")
      ? { status: "human" }
      : body?.library?.length
        ? { status: "drafted", answer: `Example answer to: ${body.question.text}`, fromRecords: false,
            citation: { docId: body.library[0].id, docName: body.library[0].name, page: 1, quote: "Example quote from the source document." } }
        : { status: "no_source", missing: null },
  "/v1/classify-document": () => ({ name: "Example document", category: "Other", expires: null, attachToResponses: false, fields: {} }),
  "/v1/read-cr": () => ({ companyName: "Example Trading W.L.L.", crNumber: "100001", established: "2020-01-01", classification: null, address: null, employees: null }),
};

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };

http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  if (req.url === "/v1/health") { res.writeHead(200, { ...cors, "Content-Type": "application/json" }); return res.end('{"ok":true}'); }
  const handler = handlers[req.url];
  if (!handler || req.method !== "POST") { res.writeHead(404, cors); return res.end(); }
  let raw = ""; for await (const chunk of req) raw += chunk;   // multipart bodies are ignored here; parse them in a real server
  let body = null; if ((req.headers["content-type"] || "").includes("json")) { try { body = JSON.parse(raw); } catch { /* ignore */ } }
  res.writeHead(200, { ...cors, "Content-Type": "application/json" });
  res.end(JSON.stringify(handler(body)));
}).listen(PORT, () => console.log(`Qeema example AI backend on http://localhost:${PORT}`));
