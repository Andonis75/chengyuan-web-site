import { Prisma, SampleStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";

type SampleWithOrigin = Prisma.SampleGetPayload<{
  include: {
    origin: true;
  };
}>;

type ResultWithSample = Prisma.AnalysisResultGetPayload<{
  include: {
    sample: {
      include: {
        origin: true;
      };
    };
  };
}>;

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

async function loadSamples() {
  return prisma.sample.findMany({
    include: {
      origin: true
    },
    orderBy: {
      collectedAt: "desc"
    }
  });
}

function groupByOrigin(samples: SampleWithOrigin[]) {
  return samples.reduce<Record<string, SampleWithOrigin[]>>((accumulator, sample) => {
    if (!accumulator[sample.origin.code]) {
      accumulator[sample.origin.code] = [];
    }

    accumulator[sample.origin.code].push(sample);
    return accumulator;
  }, {});
}

export async function buildHomePayload() {
  const [samples, analyses] = await Promise.all([
    loadSamples(),
    prisma.analysisResult.findMany({
      include: {
        sample: {
          include: {
            origin: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 6
    })
  ]);

  const originGroups = groupByOrigin(samples);
  const warningCount = samples.filter((sample) => sample.status === SampleStatus.WARNING).length;

  return {
    summaryCards: [
      {
        label: "样本总量",
        value: `${samples.length}`,
        hint: "数据库样本已接入"
      },
      {
        label: "产地数量",
        value: `${Object.keys(originGroups).length}`,
        hint: "支持分产地对比"
      },
      {
        label: "预警样本",
        value: `${warningCount}`,
        hint: "建议优先复核"
      },
      {
        label: "最新分析",
        value: `${analyses.length}`,
        hint: "来自后端真实记录"
      }
    ],
    originOverview: Object.values(originGroups)
      .map((items) => ({
        code: items[0].origin.code,
        name: items[0].origin.name,
        region: items[0].origin.region,
        sampleCount: items.length,
        avgSsc: round(average(items.map((item) => item.ssc))),
        avgTa: round(average(items.map((item) => item.ta)), 3),
        avgVc: round(average(items.map((item) => item.vc)))
      }))
      .sort((left, right) => right.avgSsc - left.avgSsc),
    qualityDistribution: [
      {
        label: "高糖样本",
        count: samples.filter((sample) => sample.ssc >= 10).length,
        description: "SSC >= 10"
      },
      {
        label: "平衡样本",
        count: samples.filter((sample) => sample.ratio >= 12 && sample.ratio <= 18).length,
        description: "糖酸比在推荐区间"
      },
      {
        label: "需复核样本",
        count: warningCount,
        description: "状态为 WARNING"
      }
    ],
    recentAnalyses: analyses.map((analysis: ResultWithSample) => ({
      id: analysis.id,
      sampleCode: analysis.sample.sampleCode,
      originName: analysis.sample.origin.name,
      predictedOrigin: analysis.predictedOrigin,
      confidence: round(analysis.confidence * 100),
      summary: analysis.aiSummary,
      status: analysis.sample.status,
      createdAt: analysis.createdAt.toISOString()
    })),
    collectionTips: [
      "先从样本列表进入详情页，再创建分析任务完成联调。",
      "如果你还没有微信正式配置，登录接口会自动回退到开发模式。",
      "数据库默认使用 SQLite，后续换 MySQL 只需要改 Prisma datasource。"
    ]
  };
}

export async function buildInsightsPayload() {
  const samples = await loadSamples();
  const originGroups = groupByOrigin(samples);

  const topOrigins = Object.values(originGroups)
    .map((items) => ({
      code: items[0].origin.code,
      name: items[0].origin.name,
      sampleCount: items.length,
      avgSsc: round(average(items.map((item) => item.ssc))),
      avgRatio: round(average(items.map((item) => item.ratio))),
      avgVc: round(average(items.map((item) => item.vc)))
    }))
    .sort((left, right) => right.avgRatio - left.avgRatio);

  const trendDigest = Object.values(originGroups).map((items) => {
    const ordered = [...items].sort((left, right) => left.collectedAt.getTime() - right.collectedAt.getTime());
    const latest = ordered[ordered.length - 1];
    const sscValues = ordered.map((item) => item.ssc);
    const mean = average(sscValues);
    const variance = average(sscValues.map((value) => (value - mean) ** 2));
    const stabilityScore = Math.max(65, 100 - variance * 10);

    return {
      code: latest.origin.code,
      name: latest.origin.name,
      latestSsc: round(latest.ssc),
      latestTa: round(latest.ta, 3),
      stabilityScore: round(stabilityScore),
      latestCollectedAt: latest.collectedAt.toISOString()
    };
  });

  return {
    topOrigins,
    trendDigest,
    qualityBands: [
      {
        label: "甜度领先",
        count: samples.filter((sample) => sample.ssc >= 11).length,
        description: "适合作为高品质展示批次"
      },
      {
        label: "酸度温和",
        count: samples.filter((sample) => sample.ta <= 0.6).length,
        description: "口感更柔和，适合鲜食"
      },
      {
        label: "维 C 较高",
        count: samples.filter((sample) => sample.vc >= 50).length,
        description: "营养价值表现更强"
      }
    ],
    recommendation:
      topOrigins[0] != null
        ? `${topOrigins[0].name} 当前综合糖酸表现最好，建议优先作为小程序首页推荐产地。`
        : "当前暂无样本数据。"
  };
}
