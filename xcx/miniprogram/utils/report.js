const METRIC_CONFIG = [
  {
    key: 'predictedSsc',
    label: '糖度 SSC',
    unit: '°Brix',
    digits: 2,
    recommendedMin: 11.5,
    recommendedMax: 13.5,
    acceptableMin: 10.5,
    acceptableMax: 14.5,
    excellentComment: '糖度位于推荐区间，甜度表现稳定。',
    goodComment: '糖度接近推荐区间，可继续观察。',
    attentionComment: '糖度偏离推荐区间，建议复核。'
  },
  {
    key: 'predictedTa',
    label: '酸度 TA',
    unit: '%',
    digits: 3,
    recommendedMin: 0.7,
    recommendedMax: 1.0,
    acceptableMin: 0.55,
    acceptableMax: 1.15,
    excellentComment: '酸度控制良好，风味平衡较佳。',
    goodComment: '酸度处于可接受范围，整体稳定。',
    attentionComment: '酸度波动较大，建议结合批次复核。'
  },
  {
    key: 'predictedRatio',
    label: '糖酸比',
    unit: '',
    digits: 2,
    recommendedMin: 12,
    recommendedMax: 16,
    acceptableMin: 10,
    acceptableMax: 18,
    excellentComment: '糖酸比协调，口感表现较优。',
    goodComment: '糖酸比基本合理，可继续跟踪。',
    attentionComment: '糖酸比偏离较大，建议复核原始数据。'
  },
  {
    key: 'predictedVc',
    label: '维生素 C',
    unit: 'mg/100g',
    digits: 3,
    recommendedMin: 45,
    recommendedMax: 65,
    acceptableMin: 35,
    acceptableMax: 75,
    excellentComment: '维生素 C 水平较高，营养表现良好。',
    goodComment: '维生素 C 处于可接受范围。',
    attentionComment: '维生素 C 偏离推荐区间，建议关注储运与成熟度。'
  }
];

function toFixedNumber(value, digits) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return num.toFixed(digits);
}

function formatRange(min, max, digits) {
  return `${toFixedNumber(min, digits)} - ${toFixedNumber(max, digits)}`;
}

function evaluateMetric(result, config) {
  const rawValue = Number(result[config.key]);
  const value = Number.isFinite(rawValue) ? rawValue : 0;

  if (value >= config.recommendedMin && value <= config.recommendedMax) {
    return {
      ...config,
      value,
      displayValue: toFixedNumber(value, config.digits),
      recommendedRange: formatRange(config.recommendedMin, config.recommendedMax, config.digits),
      status: 'excellent',
      score: 100,
      comment: config.excellentComment
    };
  }

  if (value >= config.acceptableMin && value <= config.acceptableMax) {
    return {
      ...config,
      value,
      displayValue: toFixedNumber(value, config.digits),
      recommendedRange: formatRange(config.recommendedMin, config.recommendedMax, config.digits),
      status: 'good',
      score: 82,
      comment: config.goodComment
    };
  }

  return {
    ...config,
    value,
    displayValue: toFixedNumber(value, config.digits),
    recommendedRange: formatRange(config.recommendedMin, config.recommendedMax, config.digits),
    status: 'attention',
    score: 60,
    comment: config.attentionComment
  };
}

function buildGrade(metrics, confidence) {
  const metricScore = metrics.reduce((sum, item) => sum + item.score, 0) / metrics.length;
  const confidenceScore = Math.min(10, Math.round(Number(confidence || 0) * 10));
  const finalScore = Math.min(99, Math.round(metricScore * 0.9 + confidenceScore));

  if (finalScore >= 90) {
    return {
      level: 'A',
      label: '优选样本',
      score: finalScore,
      summary: '综合表现优秀，建议作为优先推荐样本。'
    };
  }

  if (finalScore >= 80) {
    return {
      level: 'B',
      label: '良好样本',
      score: finalScore,
      summary: '综合表现良好，建议持续跟踪批次变化。'
    };
  }

  return {
    level: 'C',
    label: '关注样本',
    score: finalScore,
    summary: '存在一定波动风险，建议结合原始光谱复核。'
  };
}

function buildRecommendations(result, metrics, grade) {
  const tips = [
    `当前预测产地为${result.predictedOrigin || '未知'}，置信度约为 ${((Number(result.confidence || 0) || 0) * 100).toFixed(1)}%。`,
    `${grade.level} 级判定为“${grade.label}”，可作为当前样本综合参考。`
  ];

  const attentionMetrics = metrics.filter((item) => item.status === 'attention');
  if (attentionMetrics.length > 0) {
    tips.push(`建议重点复核 ${attentionMetrics.map((item) => item.label).join('、')}。`);
  } else {
    tips.push('各项指标整体稳定，可继续按照当前管理策略推进。');
  }

  return tips;
}

function buildReportViewModel(result, overrides = {}) {
  const metrics = METRIC_CONFIG.map((config) => evaluateMetric(result, config));
  const grade = buildGrade(metrics, result.confidence);

  return {
    grade,
    metrics,
    recommendations: buildRecommendations(result, metrics, grade),
    originConclusion: {
      predictedOrigin: result.predictedOrigin || '未知产地',
      confidencePercent: `${((Number(result.confidence || 0) || 0) * 100).toFixed(1)}%`,
      sampleOriginName: result.sample && result.sample.originName ? result.sample.originName : '--',
      compareSampleOriginName: result.compareSample && result.compareSample.originName ? result.compareSample.originName : null
    },
    ...overrides
  };
}

module.exports = {
  buildReportViewModel
};

