import { realSpectrumCM, realSpectrumQZ, realSpectrumWavelengths } from "./realSpectrumSamples";

export type DashboardOrigin = "CM" | "QZ";

export type DashboardSample = {
  id: string;
  origin: DashboardOrigin;
  originName: string;
  province: string;
  ssc: number;
  ta: number;
  ratio: number;
  vc: number;
  model: string;
  status: string;
};

export const dashboardModelMetrics = {
  modelVersion: "orange-real-analysis-v1",
  sensor: "R210",
  trainingSamples: 398,
  wavelengthCount: realSpectrumWavelengths.length,
  wavelengthMin: realSpectrumWavelengths[0],
  wavelengthMax: realSpectrumWavelengths[realSpectrumWavelengths.length - 1],
  originAccuracy: 0.9623,
  originMacroF1: 0.9623,
  sugarR2: 0.7053,
  sugarRmse: 0.9279,
  sugarMae: 0.7109,
  sugarRpd: 1.8444,
  minCoverageRatio: 0.86,
  minValidBands: 180,
  displayedConfidence: 96,
  originSelectedBands: 20,
  sugarSelectedBands: 30,
} as const;

export const dashboardSamples: DashboardSample[] = [
  {
    id: "CM-120",
    origin: "CM",
    originName: "澄迈福橙",
    province: "海南省澄迈县",
    ssc: 10.65,
    ta: 0.415,
    ratio: 25.615,
    vc: 34.0806,
    model: "R210 SVM+PLSR",
    status: "真实样本",
  },
  {
    id: "QZ-1",
    origin: "QZ",
    originName: "琼中绿橙",
    province: "海南省琼中县",
    ssc: 10.65,
    ta: 0.49,
    ratio: 22.23,
    vc: 31.59,
    model: "R210 SVM+PLSR",
    status: "真实样本",
  },
];

export const dashboardSampleByOrigin = dashboardSamples.reduce(
  (acc, sample) => {
    acc[sample.origin] = sample;
    return acc;
  },
  {} as Record<DashboardOrigin, DashboardSample>,
);

export const dashboardReviewCount = dashboardSamples.filter((sample) => sample.ssc < 8.5 || sample.ratio < 12).length;
export const dashboardAverageRatio = Number((dashboardSamples.reduce((sum, sample) => sum + sample.ratio, 0) / dashboardSamples.length).toFixed(2));

export const dashboardReadinessRadar = [
  { label: "波段覆盖", value: 100 },
  { label: "有效波段", value: 100 },
  { label: "产地CV", value: Number((dashboardModelMetrics.originAccuracy * 100).toFixed(2)) },
  { label: "糖度R2", value: Number((dashboardModelMetrics.sugarR2 * 100).toFixed(2)) },
  { label: "质检规则", value: 100 },
];

export const dashboardMetricCategories = ["SSC", "TA x10", "糖酸比", "VC / 10"];
export const dashboardMetricSeries = {
  CM: [
    dashboardSampleByOrigin.CM.ssc,
    Number((dashboardSampleByOrigin.CM.ta * 10).toFixed(2)),
    Number(dashboardSampleByOrigin.CM.ratio.toFixed(2)),
    Number((dashboardSampleByOrigin.CM.vc / 10).toFixed(2)),
  ],
  QZ: [
    dashboardSampleByOrigin.QZ.ssc,
    Number((dashboardSampleByOrigin.QZ.ta * 10).toFixed(2)),
    Number(dashboardSampleByOrigin.QZ.ratio.toFixed(2)),
    Number((dashboardSampleByOrigin.QZ.vc / 10).toFixed(2)),
  ],
};

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function meanBetween(spectrum: number[], min: number, max: number) {
  const values = spectrum.filter((_, index) => {
    const wavelength = realSpectrumWavelengths[index];
    return wavelength >= min && wavelength <= max;
  });
  return Number(average(values).toFixed(4));
}

export const dashboardFeaturePoints = [
  {
    id: "CM-120",
    originName: "澄迈福橙",
    color: "#F97316",
    shortWaveMean: meanBetween(realSpectrumCM, 901, 1100),
    nirMean: meanBetween(realSpectrumCM, 1300, 1701),
  },
  {
    id: "QZ-1",
    originName: "琼中绿橙",
    color: "#22C55E",
    shortWaveMean: meanBetween(realSpectrumQZ, 901, 1100),
    nirMean: meanBetween(realSpectrumQZ, 1300, 1701),
  },
];

function downsampleSpectrum(step = 12) {
  const labels: string[] = [];
  const cm: number[] = [];
  const qz: number[] = [];
  for (let index = 0; index < realSpectrumWavelengths.length; index += step) {
    labels.push(String(Math.round(realSpectrumWavelengths[index])));
    cm.push(Number(realSpectrumCM[index].toFixed(4)));
    qz.push(Number(realSpectrumQZ[index].toFixed(4)));
  }
  const lastIndex = realSpectrumWavelengths.length - 1;
  if (labels[labels.length - 1] !== String(Math.round(realSpectrumWavelengths[lastIndex]))) {
    labels.push(String(Math.round(realSpectrumWavelengths[lastIndex])));
    cm.push(Number(realSpectrumCM[lastIndex].toFixed(4)));
    qz.push(Number(realSpectrumQZ[lastIndex].toFixed(4)));
  }
  return { labels, cm, qz };
}

export const dashboardSpectrumProfile = downsampleSpectrum();

