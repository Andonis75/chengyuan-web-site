import type { AnalysisMetrics, AnalysisMode } from "./analysisEngine";

export type AiReportPayload = {
  mode: AnalysisMode;
  reportText: string;
  sampleA: AnalysisMetrics;
  sampleB?: AnalysisMetrics;
};

export type AiReportResult = {
  summary: string;
  provider?: string;
};

export async function requestAiReportSummary(payload: AiReportPayload, endpoint = import.meta.env.VITE_AI_REPORT_ENDPOINT) {
  if (!endpoint) {
    throw new Error("AI 报告代理未配置。请先部署后端代理，并设置 VITE_AI_REPORT_ENDPOINT。");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`AI 报告代理返回 ${response.status}`);
  }

  const data = (await response.json()) as Partial<AiReportResult>;
  if (!data.summary) {
    throw new Error("AI 报告代理没有返回 summary 字段。");
  }

  return {
    summary: data.summary,
    provider: data.provider,
  };
}

export function buildLocalAiReportSummary(payload: AiReportPayload) {
  const { mode, sampleA, sampleB } = payload;
  const lines = [
    "本地多维总结",
    `样本 A 判定为 ${sampleA.originName}，等级 ${sampleA.grade}，SSC ${sampleA.qualityReady ? sampleA.ssc.toFixed(2) : "缺失"}，糖酸比 ${sampleA.ratio ? sampleA.ratio.toFixed(2) : "未实测"}。`,
  ];

  if (mode === "compare" && sampleB) {
    const sscDelta = sampleB.ssc - sampleA.ssc;
    const ratioDelta = sampleB.ratio - sampleA.ratio;
    lines.push(
      `样本 B 判定为 ${sampleB.originName}，等级 ${sampleB.grade}，SSC ${sampleB.qualityReady ? sampleB.ssc.toFixed(2) : "缺失"}，糖酸比 ${sampleB.ratio ? sampleB.ratio.toFixed(2) : "未实测"}。`,
      `对比看，B 相对 A 的 SSC ${sscDelta >= 0 ? "高" : "低"} ${Math.abs(sscDelta).toFixed(2)}，糖酸比 ${ratioDelta >= 0 ? "高" : "低"} ${Math.abs(ratioDelta).toFixed(2)}。`,
    );
  }

  const warnings = [sampleA.reviewReason, sampleB?.reviewReason].filter(Boolean);
  lines.push(warnings.length ? `复核关注：${warnings.join("；")}` : "复核关注：当前字段较完整，可进入报告留档。");
  lines.push("DeepSeek 接入后，这里会由后端代理生成更细的口感、质检、溯源和经营建议总结。");
  return lines.join("\n");
}
