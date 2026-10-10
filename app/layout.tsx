import type { Metadata } from "next";
import { MetaMeasurement } from "@/components/commerce/conversion-tracking";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Business Client OS", template: "%s · Business Client OS" },
  description:
    "A considered workspace for your clients, your work, and your next move.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <MetaMeasurement />
      </body>
    </html>
  );
}
