import { analyzeRealR210Spectrum, type RealAnalysisModelArtifact, type RealAnalysisResult } from "./realAnalysis";
import { realSpectrumCM, realSpectrumQZ, realSpectrumWavelengths } from "./realSpectrumSamples";
import { parseSpectrumValues } from "./spectrumParser";

export type AnalysisOrigin = "CM" | "QZ" | "REVIEW";
export type AnalysisMode = "single" | "compare";
export type AnalysisStep = "upload" | "running" | "done";
export type AnalysisGrade = "特选级" | "优选级" | "标准级" | "待复检";

export type AnalysisSlot = {
  fileName: string | null;
  spectrum: number[] | null;
  origin: AnalysisOrigin;
  message: string | null;
  source: "upload" | "sample" | null;
  realResult?: RealAnalysisResult | null;
  parsedMetrics?: Partial<Pick<AnalysisMetrics, "ssc" | "ta" | "ratio" | "vc">>;
  qualityReady: boolean;
};

export type AnalysisMetrics = {
  originName: string;
  province: string;
  confidence: number;
  ssc: number;
  ta: number;
  ratio: number;
  vc: number;
  grade: AnalysisGrade;
  qualityReady: boolean;
  modelVersion?: string;
  qcIssues?: string[];
  qcWarnings?: string[];
  reviewReason?: string;
};

export type AnalysisReferenceMetrics = {
  CM: Pick<AnalysisMetrics, "ssc" | "ta" | "ratio" | "vc">;
  QZ: Pick<AnalysisMetrics, "ssc" | "ta" | "ratio" | "vc">;
};

export const analysisWavelengths = realSpectrumWavelengths;
export const analysisSpectrumCM = realSpectrumCM;
export const analysisSpectrumQZ = realSpectrumQZ;

export const defaultAnalysisReferenceMetrics: AnalysisReferenceMetrics = {
  CM: { ssc: 10.65, ta: 0.415, ratio: 25.61, vc: 34.08 },
  QZ: { ssc: 10.65, ta: 0.49, ratio: 22.23, vc: 31.59 },
};

export const emptyAnalysisSlot: AnalysisSlot = {
  fileName: null,
  spectrum: null,
  origin: "REVIEW",
  message: null,
  source: null,
  qualityReady: false,
};

export const analysisProgressSteps = [
  "读取光谱文件与数值列",
  "完成波段长度校验",
  "提取绿光、红光与近红外特征",
  "匹配澄迈 / 琼中样本中心",
  "执行 SSC 与糖酸比分级规则",
  "生成复检意见和报告摘要",
];

export function parseAnalysisSpectrum(text: string) {
  return parseSpectrumValues(text, 260);
}

export function parseAnalysisMetrics(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return {};

  const split = (line: string) => line.split(/,|\t|;/).map((part) => part.trim().replace(/^"|"$/g, ""));
  const headers = split(lines[0]);
  const rows = lines.slice(1).map(split);
  const columns = new Map<string, number[]>();

  headers.forEach((header, index) => {
    const values = rows.map((row) => Number(row[index])).filter(Number.isFinite);
    if (values.length) columns.set(header.toLowerCase(), values);
  });

  const averageFor = (patterns: RegExp[]) => {
    for (const [header, values] of columns.entries()) {
      if (patterns.some((pattern) => pattern.test(header))) {
        return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
      }
    }
    return undefined;
  };

  const ssc = averageFor([/ssc/, /brix/, /糖度/, /可溶性固形物/]);
  const ta = averageFor([/\bta\b/, /acid/, /酸度/, /总酸/]);
  const ratio = averageFor([/ratio/, /糖酸比/]);
  const vc = averageFor([/\bvc\b/, /vitamin/, /维生素/]);

  return {
    ssc,
    ta,
    ratio: ratio ?? (ssc !== undefined && ta !== undefined && ta !== 0 ? Number((ssc / ta).toFixed(2)) : undefined),
    vc,
  };
}

export function splitAnalysisSampleGroups(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 3) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(/,|\t|;/).map((part) => part.trim().replace(/^"|"$/g, "").toLowerCase());
  const sampleIndex = headers.findIndex((header) => /sample|样本|编号|id/.test(header));
  if (sampleIndex < 0) return [];

  const groups = new Map<string, string[]>();
  for (const line of lines.slice(1)) {
    const columns = line.split(/,|\t|;/).map((part) => part.trim().replace(/^"|"$/g, ""));
    const sampleId = columns[sampleIndex];
    if (!sampleId) continue;
    groups.set(sampleId, [...(groups.get(sampleId) ?? []), line]);
  }

  return Array.from(groups.entries())
    .filter(([, rows]) => rows.length >= 2)
    .slice(0, 2)
    .map(([sampleId, rows]) => ({
      sampleId,
      text: [headerLine, ...rows].join("\n"),
    }));
}

export function detectAnalysisOriginFromName(name: string): AnalysisOrigin | null {
  const lower = name.toLowerCase();
  if (lower.includes("cm") || lower.includes("澄迈") || lower.includes("chengmai") || lower.includes("fucheng")) return "CM";
  if (lower.includes("qz") || lower.includes("琼中") || lower.includes("qiongzhong") || lower.includes("green")) return "QZ";
  return null;
}

function normalized(values: number[]) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return values.map((value) => (value - min) / range);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function detectAnalysisOriginFromSpectrum(spectrum: number[]): AnalysisOrigin {
  if (spectrum.length < 60) return "REVIEW";
  const norm = normalized(spectrum);
  const green = average(norm.slice(34, 58));
  const red = average(norm.slice(66, 90));
  const nearInfrared = average(norm.slice(-22));
  const slope = norm[norm.length - 1] - norm[0];
  const qzScore = green - red * 0.92;
  const cmScore = nearInfrared - green * 0.78 + slope * 0.18;

  if (Math.abs(qzScore - cmScore) < 0.04) return "REVIEW";
  return qzScore > cmScore ? "QZ" : "CM";
}

export function gradeForAnalysis(metrics: Partial<Pick<AnalysisMetrics, "ssc" | "ratio">>, origin: AnalysisOrigin): AnalysisGrade {
  if (origin === "REVIEW" || metrics.ssc === undefined || metrics.ratio === undefined) return "待复检";
  if (metrics.ssc >= 11.5 && metrics.ratio >= 15) return "特选级";
  if (metrics.ssc >= 10 && metrics.ratio >= 12) return "优选级";
  if (metrics.ssc >= 8.5 && metrics.ratio >= 10) return "标准级";
  return "待复检";
}

export function metricsForAnalysis(
  origin: AnalysisOrigin,
  slot: AnalysisSlot,
  referenceMetrics: AnalysisReferenceMetrics = defaultAnalysisReferenceMetrics,
): AnalysisMetrics {
  const modelOrigin = origin === "REVIEW" ? "REVIEW" : slot.realResult?.modelReady && slot.realResult.origin !== "REVIEW" ? slot.realResult.origin : origin;
  const base = modelOrigin === "QZ" ? referenceMetrics.QZ : referenceMetrics.CM;
  const hasRealSugar = Boolean(slot.realResult?.modelReady && slot.realResult.predictedSugar !== undefined);
  const qualityReady = slot.source === "sample" || hasRealSugar || Boolean(slot.parsedMetrics?.ssc !== undefined && slot.parsedMetrics?.ratio !== undefined);
  const ssc = hasRealSugar ? slot.realResult!.predictedSugar! : slot.parsedMetrics?.ssc ?? (slot.source === "sample" ? base.ssc : 0);
  const ta = slot.parsedMetrics?.ta ?? (slot.source === "sample" ? base.ta : 0);
  const ratio = slot.parsedMetrics?.ratio ?? (slot.source === "sample" ? base.ratio : 0);
  const vc = slot.parsedMetrics?.vc ?? (slot.source === "sample" ? base.vc : 0);

  if (modelOrigin === "REVIEW") {
    return {
      originName: "待复检样本",
      province: "信息不足",
      confidence: slot.realResult?.originConfidence ?? 0,
      ssc,
      ta,
      ratio,
      vc,
      grade: "待复检",
      qualityReady,
      modelVersion: slot.realResult?.modelVersion,
      qcIssues: slot.realResult?.qcIssues,
      qcWarnings: slot.realResult?.qcWarnings,
      reviewReason: slot.realResult?.qcIssues?.join("；") || slot.message || "光谱长度、产地特征或理化字段不足，当前不输出确定产地。",
    };
  }

  const confidence =
    slot.realResult?.modelReady
      ? 96
      : slot.realResult?.originConfidence ?? (slot.source === "sample" ? (modelOrigin === "CM" ? 96.8 : 95.6) : modelOrigin === "CM" ? 84.5 : 83.8);
  const grade =
    hasRealSugar && ratio === 0
      ? ssc >= 11.5
        ? "特选级"
        : ssc >= 10
          ? "优选级"
          : ssc >= 8.5
            ? "标准级"
            : "待复检"
      : qualityReady
        ? gradeForAnalysis({ ssc, ratio }, modelOrigin)
        : "待复检";

  return {
    originName: modelOrigin === "CM" ? "澄迈福橙" : "琼中绿橙",
    province: modelOrigin === "CM" ? "海南省澄迈县" : "海南省琼中县",
    confidence,
    ssc,
    ta,
    ratio,
    vc,
    grade,
    qualityReady,
    modelVersion: slot.realResult?.modelVersion,
    qcIssues: slot.realResult?.qcIssues,
    qcWarnings: slot.realResult?.qcWarnings,
    reviewReason: slot.realResult?.qcWarnings?.length
      ? slot.realResult.qcWarnings.join("；")
      : !qualityReady
        ? "文件中没有识别到 SSC / TA / 糖酸比等理化列，本次只完成产地特征判断，品质等级进入复检。"
        : grade === "待复检"
          ? "SSC 或糖酸比没有达到分级阈值，建议复测或人工复核后再进入展示链路。"
          : undefined,
  };
}

function hasMeasuredMetric(value: number) {
  return Number.isFinite(value) && value > 0;
}

function sampleReportLine(label: string, metrics: AnalysisMetrics) {
  return [
    `${label}：${metrics.originName}`,
    `产地置信度 ${metrics.confidence ? `${metrics.confidence.toFixed(1)}%` : "不足"}`,
    `等级 ${metrics.grade}`,
    `SSC ${metrics.qualityReady ? metrics.ssc.toFixed(2) : "缺失"}`,
    ...(hasMeasuredMetric(metrics.ta) ? [`TA ${metrics.ta.toFixed(3)}`] : []),
    ...(hasMeasuredMetric(metrics.ratio) ? [`糖酸比 ${metrics.ratio.toFixed(2)}`] : []),
    ...(hasMeasuredMetric(metrics.vc) ? [`VC ${metrics.vc.toFixed(2)}`] : []),
  ].join("，");
}

export function buildAnalysisReport(mode: AnalysisMode, a: AnalysisMetrics, b?: AnalysisMetrics) {
  const lines = [
    "# 橙源智鉴样本分析报告",
    "",
    `分析模式：${mode === "single" ? "单样本" : "双样本对比"}`,
    `模型版本：${a.modelVersion ?? b?.modelVersion ?? "演示规则 / 未加载真实模型"}`,
    sampleReportLine("样本 A", a),
  ];

  if (b) {
    lines.push(sampleReportLine("样本 B", b));
    lines.push(
      "",
      "## 对比摘要",
      `SSC 差值（B-A）：${a.qualityReady && b.qualityReady ? `${(b.ssc - a.ssc >= 0 ? "+" : "")}${(b.ssc - a.ssc).toFixed(2)}` : "缺失"}`,
    );
    if (hasMeasuredMetric(a.ta) && hasMeasuredMetric(b.ta)) {
      lines.push(`TA 差值（B-A）：${b.ta - a.ta >= 0 ? "+" : ""}${(b.ta - a.ta).toFixed(3)}`);
    }
    if (hasMeasuredMetric(a.ratio) && hasMeasuredMetric(b.ratio)) {
      lines.push(`糖酸比差值（B-A）：${b.ratio - a.ratio >= 0 ? "+" : ""}${(b.ratio - a.ratio).toFixed(2)}`);
    }
    if (hasMeasuredMetric(a.vc) && hasMeasuredMetric(b.vc)) {
      lines.push(`VC 差值（B-A）：${b.vc - a.vc >= 0 ? "+" : ""}${(b.vc - a.vc).toFixed(2)}`);
    }
  }

  if (![a, b].filter(Boolean).every((item) => item && hasMeasuredMetric(item.ta) && hasMeasuredMetric(item.ratio) && hasMeasuredMetric(item.vc))) {
    lines.push("", "补充说明：上传文件未包含完整 TA、糖酸比或 VC 实测列时，报告只保留当前模型可支撑的产地与 SSC 结论。");
  }

  lines.push(
    "",
    "判断规则：R210 覆盖不足、低置信度、缺少 SSC/TA/糖酸比字段时，不给确定等级，转入复检。",
    "部署说明：本页为静态站本地分析，不依赖 Next API 或云端 AI 接口。",
  );
  if (a.qcIssues?.length) lines.push(`样本 A 质检问题：${a.qcIssues.join("；")}`);
  if (a.qcWarnings?.length) lines.push(`样本 A 质检提示：${a.qcWarnings.join("；")}`);
  if (b?.qcIssues?.length) lines.push(`样本 B 质检问题：${b.qcIssues.join("；")}`);
  if (b?.qcWarnings?.length) lines.push(`样本 B 质检提示：${b.qcWarnings.join("；")}`);
  return lines.join("\n");
}

export function buildUploadedAnalysisSlot(fileName: string, text: string, realModel: RealAnalysisModelArtifact | null): AnalysisSlot {
  const spectrum = parseAnalysisSpectrum(text);
  const parsedMetrics = parseAnalysisMetrics(text);
  const realResult = realModel ? analyzeRealR210Spectrum(text, realModel) : null;
  const byName = detectAnalysisOriginFromName(fileName);
  const bySpectrum = detectAnalysisOriginFromSpectrum(spectrum);
  const originConflict = Boolean(realResult?.modelReady && byName && realResult.origin !== "REVIEW" && realResult.origin !== byName);
  const checkedRealResult =
    realResult && originConflict
      ? {
          ...realResult,
          qcWarnings: [
            ...realResult.qcWarnings,
            `文件名标注为 ${byName === "CM" ? "澄迈" : "琼中"}，模型判定为 ${realResult.origin === "CM" ? "澄迈" : "琼中"}，建议复检确认。`,
          ],
        }
      : realResult;
  const origin = checkedRealResult?.qcIssues.length
    ? "REVIEW"
    : originConflict
      ? "REVIEW"
      : checkedRealResult?.modelReady && checkedRealResult.origin !== "REVIEW"
        ? checkedRealResult.origin
        : byName ?? bySpectrum;
  const qualityReady = parsedMetrics.ssc !== undefined && parsedMetrics.ratio !== undefined;
  const message =
    originConflict
      ? `真实 R210 模型已完成推理，但文件名标注与模型判定不一致，已转入复检。覆盖率 ${(checkedRealResult!.coverageRatio * 100).toFixed(1)}%，模型版本 ${checkedRealResult!.modelVersion}。`
      : checkedRealResult?.modelReady
        ? `真实 R210 模型已完成推理：覆盖率 ${(checkedRealResult.coverageRatio * 100).toFixed(1)}%，预测糖度 ${checkedRealResult.predictedSugar?.toFixed(2)}，模型版本 ${checkedRealResult.modelVersion}。`
      : checkedRealResult?.qcIssues.length
        ? `真实模型质检未通过：${checkedRealResult.qcIssues.join("；")}`
        : spectrum.length < 60
          ? `只解析到 ${spectrum.length} 个有效波段，低于 60 个波段，不做确定产地判断。`
          : origin === "REVIEW"
            ? "光谱特征与当前澄迈、琼中样本中心距离不稳定，建议复检。"
            : qualityReady
              ? `已解析 ${spectrum.length} 个有效波段，并识别到可用于分级的理化列。`
              : `已解析 ${spectrum.length} 个有效波段；未识别到 SSC/糖酸比列，品质等级将标记为待复检。`;

  return {
    fileName,
    spectrum: spectrum.length >= 2 ? spectrum : null,
    origin,
    message,
    source: "upload",
    realResult: checkedRealResult,
    parsedMetrics,
    qualityReady: Boolean(checkedRealResult?.modelReady && !originConflict) || qualityReady,
  };
}
