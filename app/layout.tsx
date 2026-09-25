import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Business Client OS", template: "%s · Business Client OS" },
  description:
    "A considered workspace for your clients, your work, and your next move.",
  robots: { index: false, follow: false },
};

const metaPixelCode = [
  "!function(f,b,e,v,n,t,s)",
  "{if(f.fbq)return;n=f.fbq=function(){n.callMethod?",
  "n.callMethod.apply(n,arguments):n.queue.push(arguments)};",
  "if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';",
  "n.queue=[];t=b.createElement(e);t.async=!0;",
  "t.src=v;s=b.getElementsByTagName(e)[0];",
  "s.parentNode.insertBefore(t,s)}(window, document,'script',",
  "'https://connect.facebook.net/en_US/fbevents.js');",
  "fbq('init', '28484325824567125');",
  "fbq('track', 'PageView');",
].join("\n");

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script id="meta-pixel" strategy="afterInteractive">
          {metaPixelCode}
        </Script>
      </body>
    </html>
  );
}
