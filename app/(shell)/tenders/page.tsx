import type { Metadata } from "next";
import { Tenders } from "@/components/screens/Tenders";

export const metadata: Metadata = { title: "Tenders" };
export default function Page() { return <Tenders />; }
