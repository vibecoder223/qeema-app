"use client";
/* Boots the store (from localStorage, or from a ?demo= link), applies the theme,
   runs tender reading in the background, and shows the toast. */
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { READ_STEPS } from "@/lib/logic";
import { EMBED, SCREENS, pathOf, useStore } from "@/lib/store";
import { PEOPLE, SCEN } from "@/lib/data";
import type { PersonId, ScenarioKey } from "@/lib/types";

export function Providers({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const a = useStore.getState().a;
    if (EMBED) {
      const p = new URLSearchParams(window.location.search);
      const def = SCREENS[p.get("demo") || "home"] ?? SCREENS.home;
      const sc = (p.get("s") && p.get("s")! in SCEN ? p.get("s") : def.s) as ScenarioKey;
      const next = def.run(sc);
      next.scenario = sc;
      const as = p.get("as");
      if (as && PEOPLE.some((x) => x.id === as)) next.me = as as PersonId;
      if (p.get("theme") === "dark") next.theme = "dark";
      a.replace(next);
      router.replace(pathOf(next));
      setReady(true);
    } else {
      Promise.resolve(useStore.persist.rehydrate()).then(() => setReady(true));
    }
  }, [router]);

  return (
    <>
      <Theme />
      <Reader />
      {ready ? children : null}
      <Toast />
    </>
  );
}

function Theme() {
  const theme = useStore((s) => s.theme);
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  return null;
}

/* Tender reading keeps going wherever you are in the app. */
function Reader() {
  const reading = useStore((s) => s.order.filter((id) => s.tenders[id].readN < READ_STEPS).join(","));
  useEffect(() => {
    if (!reading) return;
    const fast = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const h = setInterval(() => { reading.split(",").forEach((id) => useStore.getState().a.tick(id)); }, fast ? 60 : 900);
    return () => clearInterval(h);
  }, [reading]);
  return null;
}

function Toast() {
  const toast = useStore((s) => s.toast);
  const pathname = usePathname();
  useEffect(() => {
    if (!toast) return;
    const h = setTimeout(() => useStore.getState().a.say(null), 2600);
    return () => clearTimeout(h);
  }, [toast, pathname]);
  return (
    <>
      <div className="vh" role="status" aria-live="polite">{toast}</div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
