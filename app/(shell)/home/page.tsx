import type { Metadata } from "next";
import { Home } from "@/components/screens/Home";

export const metadata: Metadata = { title: "Home" };
export default function Page() { return <Home />; }
