import type { Metadata } from "next";
import { Setup } from "@/components/screens/Setup";

export const metadata: Metadata = { title: "Setup" };
export default function Page() { return <Setup />; }
