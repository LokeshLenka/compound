import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Poppins, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Personal Hub", template: "%s · Personal Hub" },
  description:
    "Habits, tasks, notes and diary — your private personal hub.",
  manifest: "/manifest.webmanifest",
  icons: [{ rel: "icon", url: "/icon.svg", type: "image/svg+xml" }],
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e6" },
    { media: "(prefers-color-scheme: dark)", color: "#2b241c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}