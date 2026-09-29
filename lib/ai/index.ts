/* Which AI the app uses. Set NEXT_PUBLIC_AI_ENDPOINT (and optionally NEXT_PUBLIC_AI_TOKEN)
   at build time to call a backend; otherwise the built-in mock answers. */
import type { QeemaAI } from "./contract";
import { httpAI } from "./http";
import { mockAI } from "./mock";

const ENDPOINT = process.env.NEXT_PUBLIC_AI_ENDPOINT || "";
const TOKEN = process.env.NEXT_PUBLIC_AI_TOKEN || undefined;

export const ai = (): QeemaAI => (ENDPOINT ? httpAI(ENDPOINT, TOKEN) : mockAI);
/* "drafted by the mock AI" / "drafted by your backend" */
export const aiBy = () => (ENDPOINT ? "your backend" : "the mock AI");

export type * from "./contract";
