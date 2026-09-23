import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { RepoProvider } from "@/lib/data/provider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "연구 업무 관리",
  description: "연구 과제와 업무를 한곳에서 관리합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {/*
          RepoProvider 가 여기 있는 이유: /share/[token] 이 (app) 그룹 바깥이라
          같은 저장소 인스턴스를 봐야 한다. B단계에서는 이 자리가
          Supabase 클라이언트 프로바이더로 바뀐다.
        */}
        <RepoProvider>{children}</RepoProvider>
      </body>
    </html>
  );
}
