import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "우리집 가계부",
  description: "초대된 가족만 사용하는 가계부와 자산 관리"
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
