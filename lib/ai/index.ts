/* Which AI the app uses: the built-in mock, or a backend you point it at in Settings.
   Stored per browser, so each partner can connect their own server. */
import type { QeemaAI } from "./contract";
import { httpAI } from "./http";
import { mockAI } from "./mock";

export interface AiSettings { endpoint: string; token: string }
const KEY = "qeema.ai";

export function aiSettings(): AiSettings {
  if (typeof window === "undefined") return { endpoint: "", token: "" };
  try { return { endpoint: "", token: "", ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { endpoint: "", token: "" }; }
}
export function saveAiSettings(s: AiSettings) { localStorage.setItem(KEY, JSON.stringify(s)); }

export function ai(): QeemaAI {
  const s = aiSettings();
  return s.endpoint ? httpAI(s.endpoint, s.token || undefined) : mockAI;
}
export const aiLabel = () => (aiSettings().endpoint ? "Connected backend" : "Mock AI");
/* "drafted by the mock AI" / "drafted by your backend" */
export const aiBy = () => (aiSettings().endpoint ? "your backend" : "the mock AI");

export type * from "./contract";
