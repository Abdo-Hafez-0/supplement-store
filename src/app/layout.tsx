import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

// Poppins matches the DRIVEX wordmark (headings); Inter is the body font.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "DRIVEX", template: "%s | DRIVEX" },
  description: "DRIVEX dietary supplements, shipped across the US.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#123f36",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-text">{children}</body>
    </html>
  );
}
