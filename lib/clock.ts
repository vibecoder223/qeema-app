/* "Today". The demo is pinned to 25 September 2026 so its deadlines stay meaningful; live uses the real date. */
const DEMO_TODAY = new Date("2026-09-25T12:00:00");
let current = DEMO_TODAY;

export const today = () => current;
export const todayIso = () => current.toISOString().slice(0, 10);
export function setLiveClock(live: boolean) {
  const d = new Date(); d.setHours(12, 0, 0, 0);
  current = live ? d : DEMO_TODAY;
}
