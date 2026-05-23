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
  const hasMeasuredMetric = (value: number) => Number.isFinite(value) && value > 0;
  const sampleLine = (label: string, sample: AnalysisMetrics) =>
    [
      `${label} 判定为 ${sample.originName}`,
      `等级 ${sample.grade}`,
      `SSC ${sample.qualityReady ? sample.ssc.toFixed(2) : "缺失"}`,
      ...(hasMeasuredMetric(sample.ratio) ? [`糖酸比 ${sample.ratio.toFixed(2)}`] : []),
    ].join("，") + "。";
  const lines = [
    "本地多维总结",
    sampleLine("样本 A", sampleA),
  ];

  if (mode === "compare" && sampleB) {
    const sscDelta = sampleB.ssc - sampleA.ssc;
    lines.push(
      sampleLine("样本 B", sampleB),
      `对比看，B 相对 A 的 SSC ${sscDelta >= 0 ? "高" : "低"} ${Math.abs(sscDelta).toFixed(2)}。`,
    );
    if (hasMeasuredMetric(sampleA.ratio) && hasMeasuredMetric(sampleB.ratio)) {
      const ratioDelta = sampleB.ratio - sampleA.ratio;
      lines.push(`糖酸比方面，B 相对 A ${ratioDelta >= 0 ? "高" : "低"} ${Math.abs(ratioDelta).toFixed(2)}。`);
    }
  }

  const warnings = [sampleA.reviewReason, sampleB?.reviewReason].filter(Boolean);
  lines.push(warnings.length ? `复核关注：${warnings.join("；")}` : "复核关注：当前字段较完整，可进入报告留档。");
  lines.push("DeepSeek 接入后，这里会由后端代理生成更细的口感、质检、溯源和经营建议总结。");
  return lines.join("\n");
}
