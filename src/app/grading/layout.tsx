import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "分级与溯源指南 - 橙源智鉴",
  description: "如何在采购、质检环节结合产地预测结果与糖酸判定为柑橘制定合理的商品分级。",
};

export default function GradingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
