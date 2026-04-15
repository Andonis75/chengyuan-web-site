import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "智能样本分析演示 - 橙源智鉴",
  description: "上传柑橘高光谱文件，体验核心 AI 模型的快速产地识别与特征判定流程过程。",
};

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
