import type { Metadata } from "next";
import { Icv } from "@/components/screens/Icv";

export const metadata: Metadata = { title: "ICV" };
export default function Page() { return <Icv />; }
