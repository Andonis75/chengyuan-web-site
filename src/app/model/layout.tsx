import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 核心模型构架 - 橙源智鉴",
  description: "了解智鉴平台背后深度学习网络与多模态光谱处理算法的理论支撑与识别原理。",
};

export default function ModelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
