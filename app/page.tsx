"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EMBED } from "@/lib/store";

/* "/" opens the dashboard. A ?demo= link is routed by Providers instead. */
export default function Root() {
  const router = useRouter();
  useEffect(() => { if (!EMBED) router.replace("/home"); }, [router]);
  return null;
}
