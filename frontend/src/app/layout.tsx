import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniHub | One Platform. Endless Possibilities.",
  description:
    "Discover a smarter way to shop, work, learn, connect, and manage your business with OmniHub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
