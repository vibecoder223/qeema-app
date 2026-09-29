import type { Metadata } from "next";
import { Settings } from "@/components/screens/Settings";

export const metadata: Metadata = { title: "AI connection" };
export default function Page() { return <Settings />; }
