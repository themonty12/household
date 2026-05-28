import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Household Finance",
  description: "Invite-only household finance and asset management"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
