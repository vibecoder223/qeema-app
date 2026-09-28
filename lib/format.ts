import { PEOPLE, TODAY } from "./data";
import type { Person, PersonId } from "./types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const at = (iso: string) => new Date(iso + "T12:00:00");

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = at(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
export function short(iso: string): string {
  const d = at(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}
export function days(iso: string): number {
  return Math.round((at(iso).getTime() - TODAY.getTime()) / 864e5);
}
export const qr = (n: number) => "QR " + n.toLocaleString("en-US");
/* 1200 → "QR 1.2m", 0 → "QR 0" */
export function kqr(k: number): string {
  k = +k;
  if (!k) return "QR 0";
  return k >= 1000 ? `QR ${(k / 1000).toFixed(k % 1000 ? 1 : 0)}m` : `QR ${k}k`;
}
export const pad = (n: number) => (n < 10 ? "0" : "") + n;
export const letter = (i: number) => String.fromCharCode(65 + i);

export function person(id: PersonId | null | undefined): Person | null {
  return PEOPLE.find((p) => p.id === id) ?? null;
}
export const first = (id: PersonId | null | undefined) => person(id)?.name.split(" ")[0] ?? "";

export function greet(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
export const now = () => "25 Sep, " + new Date().toTimeString().slice(0, 5);
