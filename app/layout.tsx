import type { Metadata, Viewport } from "next";
import { Manrope, Rubik } from "next/font/google";
import { Providers } from "@/components/shell/Providers";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-manrope", display: "swap" });
const rubik = Rubik({ subsets: ["arabic", "latin"], weight: ["400", "500"], variable: "--font-rubik", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Qeema", template: "%s · Qeema" },
  description: "Qatar tender responses, drafted from your own records and reviewed by your team.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" data-theme="light" className={`${manrope.variable} ${rubik.variable}`}>
      <body>
        <div className="app-root">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
