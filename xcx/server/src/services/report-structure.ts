import { TaskType } from "@prisma/client";

type MetricStatus = "excellent" | "good" | "attention";

type StructuredMetricInput = {
  key: string;
  label: string;
  value: number | null | undefined;
  unit: string;
  digits?: number;
  recommendedMin: number;
  recommendedMax: number;
  acceptableMin: number;
  acceptableMax: number;
  excellentComment: string;
  goodComment: string;
  attentionComment: string;
};

export type StructuredReportMetric = {
  key: string;
  label: string;
  value: number;
  displayValue: string;
  unit: string;
  recommendedRange: string;
  status: MetricStatus;
  score: number;
  comment: string;
};

export type StructuredReport = {
  schemaVersion: string;
  reportTitle: string;
  generatedAt: string;
  provider: string;
  version: string | null;
  taskType: TaskType;
  sampleCode: string;
  compareSampleCode: string | null;
  aiSummary: string;
  grade: {
    level: "A" | "B" | "C";
    label: string;
    score: number;
    summary: string;
  };
  originConclusion: {
    predictedOrigin: string;
    confidence: number;
    confidencePercent: string;
    sampleOriginName: string;
    compareSampleOriginName: string | null;
  };
  metrics: StructuredReportMetric[];
  recommendations: string[];
};

export type StructuredReportInput = {
  provider: string;
  version?: string | null;
  taskType: TaskType;
  sampleCode: string;
  sampleOriginName: string;
  compareSampleCode?: string | null;
  compareSampleOriginName?: string | null;
  predictedOrigin: string;
  confidence: number;
  predictedSsc: number;
  predictedTa: number;
  predictedRatio: number;
  predictedVc: number;
  aiSummary: string;
  generatedAt?: Date;
};

function formatNumber(value: number, digits = 2) {
  return value.toFixed(digits);
}

function formatRange(min: number, max: number, digits = 2) {
  return `${formatNumber(min, digits)} - ${formatNumber(max, digits)}`;
}

function evaluateMetric(input: StructuredMetricInput): StructuredReportMetric {
  const digits = input.digits ?? 2;
  const value = typeof input.value === "number" ? input.value : 0;

  if (value >= input.recommendedMin && value <= input.recommendedMax) {
    return {
      key: input.key,
      label: input.label,
      value,
      displayValue: formatNumber(value, digits),
      unit: input.unit,
      recommendedRange: formatRange(input.recommendedMin, input.recommendedMax, digits),
      status: "excellent",
      score: 100,
      comment: input.excellentComment
    };
  }

  if (value >= input.acceptableMin && value <= input.acceptableMax) {
    return {
      key: input.key,
      label: input.label,
      value,
      displayValue: formatNumber(value, digits),
      unit: input.unit,
      recommendedRange: formatRange(input.recommendedMin, input.recommendedMax, digits),
      status: "good",
      score: 82,
      comment: input.goodComment
    };
  }

  return {
    key: input.key,
    label: input.label,
    value,
    displayValue: formatNumber(value, digits),
    unit: input.unit,
    recommendedRange: formatRange(input.recommendedMin, input.recommendedMax, digits),
    status: "attention",
    score: 60,
    comment: input.attentionComment
  };
}

function buildMetrics(input: StructuredReportInput) {
  return [
    evaluateMetric({
      key: "predictedSsc",
      label: "糖度 SSC",
      value: input.predictedSsc,
      unit: "°Brix",
      recommendedMin: 11.5,
      recommendedMax: 13.5,
      acceptableMin: 10.5,
      acceptableMax: 14.5,
      excellentComment: "糖度位于推荐区间，甜度表现稳定。",
      goodComment: "糖度接近推荐区间，可继续保持采后管理。",
      attentionComment: "糖度偏离推荐区间，建议结合原始光谱复核。"
    }),
    evaluateMetric({
      key: "predictedTa",
      label: "酸度 TA",
      value: input.predictedTa,
      unit: "%",
      digits: 3,
      recommendedMin: 0.7,
      recommendedMax: 1.0,
      acceptableMin: 0.55,
      acceptableMax: 1.15,
      excellentComment: "酸度落在理想区间，风味平衡较好。",
      goodComment: "酸度处于可接受范围，整体口感较稳定。",
      attentionComment: "酸度波动较大，建议关注成熟度与批次差异。"
    }),
    evaluateMetric({
      key: "predictedRatio",
      label: "糖酸比",
      value: input.predictedRatio,
      unit: "",
      recommendedMin: 12,
      recommendedMax: 16,
      acceptableMin: 10,
      acceptableMax: 18,
      excellentComment: "糖酸比协调，适合优选样本判定。",
      goodComment: "糖酸比基本合理，可继续观察后续批次。",
      attentionComment: "糖酸比偏离较大，建议结合实测理化指标复核。"
    }),
    evaluateMetric({
      key: "predictedVc",
      label: "维生素 C",
      value: input.predictedVc,
      unit: "mg/100g",
      digits: 3,
      recommendedMin: 45,
      recommendedMax: 65,
      acceptableMin: 35,
      acceptableMax: 75,
      excellentComment: "维生素 C 表现良好，营养水平较高。",
      goodComment: "维生素 C 处于可接受范围，营养表现稳定。",
      attentionComment: "维生素 C 偏离推荐区间，建议关注储运和成熟度。"
    })
  ];
}

function buildGrade(score: number, confidence: number) {
  const confidenceBonus = Math.min(10, Math.round(confidence * 10));
  const finalScore = Math.min(99, Math.round(score * 0.9 + confidenceBonus));

  if (finalScore >= 90) {
    return {
      level: "A" as const,
      label: "优选样本",
      score: finalScore,
      summary: "综合表现优秀，产地判别稳定，品质指标落在推荐区间。"
    };
  }

  if (finalScore >= 80) {
    return {
      level: "B" as const,
      label: "良好样本",
      score: finalScore,
      summary: "综合表现良好，建议继续结合批次数据进行跟踪。"
    };
  }

  return {
    level: "C" as const,
    label: "关注样本",
    score: finalScore,
    summary: "存在一定波动风险，建议复核光谱文件与理化指标。"
  };
}

function buildRecommendations(input: StructuredReportInput, metrics: StructuredReportMetric[], grade: StructuredReport["grade"]) {
  const recommendations = [
    `预测产地为${input.predictedOrigin}，当前置信度约为 ${(input.confidence * 100).toFixed(1)}%。`,
    `${grade.level} 级判定为“${grade.label}”，可作为当前批次的综合参考。`
  ];

  const attentionMetrics = metrics.filter((metric) => metric.status === "attention");
  if (attentionMetrics.length > 0) {
    recommendations.push(`重点关注 ${attentionMetrics.map((metric) => metric.label).join("、")}，建议结合原始光谱文件复核。`);
  } else {
    recommendations.push("各项核心指标均处于可接受范围，可继续按照当前管理策略推进。");
  }

  if (input.taskType === TaskType.COMPARE && input.compareSampleCode) {
    recommendations.push(`本次为对比分析，建议将 ${input.sampleCode} 与 ${input.compareSampleCode} 按批次持续追踪。`);
  }

  return recommendations;
}

export function buildStructuredReport(input: StructuredReportInput): StructuredReport {
  const metrics = buildMetrics(input);
  const averageMetricScore = metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length;
  const grade = buildGrade(averageMetricScore, input.confidence);

  return {
    schemaVersion: "1.0",
    reportTitle: "橙源智能分析报告",
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    provider: input.provider,
    version: input.version ?? null,
    taskType: input.taskType,
    sampleCode: input.sampleCode,
    compareSampleCode: input.compareSampleCode ?? null,
    aiSummary: input.aiSummary,
    grade,
    originConclusion: {
      predictedOrigin: input.predictedOrigin,
      confidence: input.confidence,
      confidencePercent: `${(input.confidence * 100).toFixed(1)}%`,
      sampleOriginName: input.sampleOriginName,
      compareSampleOriginName: input.compareSampleOriginName ?? null
    },
    metrics,
    recommendations: buildRecommendations(input, metrics, grade)
  };
}

