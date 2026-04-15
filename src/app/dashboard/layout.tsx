import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "数据可视化大屏 - 橙源智鉴",
  description: "海南样本检测可视化大屏，展示近期柑橘样本理化特征趋势与产地鉴别成功率。",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
