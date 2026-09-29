import { Suspense } from "react";
import { TenderRoute } from "@/components/tender/TenderRoute";

/* /tender/questions?id=… : the four tabs are fixed pages, the tender comes from the query,
   so the whole app exports as static files (GitHub Pages). */
export const dynamicParams = false;
export function generateStaticParams() {
  return ["details", "verdict", "questions", "export"].map((tab) => ({ tab }));
}
export default function Page() {
  return <Suspense fallback={null}><TenderRoute /></Suspense>;
}
