import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "产地追踪与样本 - 橙源智鉴",
  description: "了解海南澄迈、琼中以及江西、广西等代表性柑橘产区风土特点与平均指标对照。",
};

export default function OriginsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
