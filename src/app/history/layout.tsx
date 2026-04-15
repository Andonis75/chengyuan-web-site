import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "历史检测记录 - 橙源智鉴",
  description: "检索过去所有的柑橘检测报告、核对样本理化指标判定情况与历史趋势追踪。",
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
