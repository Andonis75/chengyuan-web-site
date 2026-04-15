import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私与使用条款 - 橙源智鉴",
  description: "查看基于高光谱智能辅助平台的安全承诺、使用要求及信息免责申明条款。",
};

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
