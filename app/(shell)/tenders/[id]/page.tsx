"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

/* /tenders/[id] opens the tender where you left it. */
export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    const to = useStore.getState().a.open(decodeURIComponent(id));
    router.replace(to || "/tenders");
  }, [id, router]);
  return null;
}
