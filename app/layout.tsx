import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Business Client OS", template: "%s · Business Client OS" },
  description:
    "A considered workspace for your clients, your work, and your next move.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
