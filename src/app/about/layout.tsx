import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于平台 - 橙源智鉴",
  description: "橙源智鉴项目的缘起、使命与开发团队背景，旨在打造柑橘产业的数字化分级标准。",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
