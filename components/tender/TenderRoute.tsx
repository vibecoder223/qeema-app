"use client";
/* /tender/[tab]?id=… The URL is the source of truth for which stage you see;
   a tab you cannot open yet redirects to the furthest one you can. */
import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { STAGE_OF, position, stageOpen } from "@/lib/logic";
import { useStore } from "@/lib/store";
import { Details } from "./Details";
import { Export } from "./Export";
import { Questions } from "./Questions";
import { TenderTop } from "./TenderTop";
import { Advisory, Alternatives, Verdict } from "./Verdict";

export function TenderRoute() {
  const params = useParams<{ tab: string }>();
  const id = useSearchParams().get("id") ?? "", n = STAGE_OF[params.tab];
  const router = useRouter();
  const t = useStore((s) => s.tenders[id]);
  const s = useStore();
  const ok = !!t && !!n && stageOpen(s, t, n);
  const synced = ok && s.cur === id && t.stage === n;

  useEffect(() => {
    const S = useStore.getState();
    if (!S.tenders[id]) { router.replace("/tenders"); return; }
    if (!n || !stageOpen(S, S.tenders[id], n)) { router.replace(S.a.open(id) || "/tenders"); return; }
    if (S.cur !== id || S.tenders[id].stage !== n)
      S.a.set((d) => {
        const x = d.tenders[id];
        if (d.cur !== id) Object.assign(d, { sel: null, focus: false, edit: false, filter: "todo" });
        d.cur = id; d.route = "tender"; x.stage = n; x.reached = Math.max(x.reached, n);
      });
    document.title = `${S.tenders[id].meta.id || "Tender"} · Qeema`;
  }, [id, n, router, ok]);

  if (!synced) return null;
  const ex = position(s, t) === "excluded";
  return (
    <>
      <TenderTop t={t} />
      {n === 2 && <Details t={t} />}
      {n === 3 && <Verdict t={t} />}
      {n === 4 && (ex ? <Advisory /> : <Questions t={t} />)}
      {n === 5 && (ex ? <Alternatives t={t} /> : <Export t={t} />)}
    </>
  );
}
