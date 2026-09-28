import type { Metadata } from "next";
import { NewTender } from "@/components/screens/NewTender";

export const metadata: Metadata = { title: "New tender" };
export default function Page() { return <NewTender />; }
