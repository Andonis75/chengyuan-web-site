export type DatasetFile = {
  name: string;
  category: string;
  countLabel: string;
  note: string;
};

export type OriginSampleSummary = {
  code: "CM" | "QZ";
  name: string;
  region: string;
  sampleCount: number;
  avgSsc: number;
  avgTa: number;
  avgRatio: number;
  avgVc: number;
  sscRange: [number, number];
  taRange: [number, number];
  ratioRange: [number, number];
};

export type RepresentativeSample = {
  id: string;
  origin: string;
  ssc: number;
  ta: number;
  ratio: number;
  vc: number;
};

export type SampleComparisonItem = {
  label: string;
  cmValue: string;
  qzValue: string;
  difference: string;
};

export const sampleDatasetOverview = {
  title: "海南样本一览",
  description:
    "这里先展示海南两地的代表数据，方便你快速了解不同产区之间的差别。",
  chemistrySampleCount: 399,
  totalChemistrySamples: 399,
  comparedOrigins: 2,
  originCount: 2,
  spectralFileCount: 6,
  fileCount: 8,
  note: "当前展示的是澄迈和琼中的代表数据，后续会继续补充更多产区内容。",
};

export const hainanOriginSummaries: OriginSampleSummary[] = [
  {
    code: "CM",
    name: "澄迈福橙",
    region: "海南澄迈",
    sampleCount: 199,
    avgSsc: 9.72,
    avgTa: 0.666,
    avgRatio: 15.35,
    avgVc: 40.8,
    sscRange: [5.45, 16.6],
    taRange: [0.365, 1.13],
    ratioRange: [5.72, 28.18],
  },
  {
    code: "QZ",
    name: "琼中绿橙",
    region: "海南琼中",
    sampleCount: 200,
    avgSsc: 10.79,
    avgTa: 0.611,
    avgRatio: 18.11,
    avgVc: 31,
    sscRange: [7.05, 14.2],
    taRange: [0.44, 0.9],
    ratioRange: [9, 28.69],
  },
];

export const sampleComparison: SampleComparisonItem[] = [
  {
    label: "平均糖度",
    cmValue: "9.72",
    qzValue: "10.79",
    difference: "琼中 +1.07",
  },
  {
    label: "平均酸度",
    cmValue: "0.666",
    qzValue: "0.611",
    difference: "澄迈 +0.055",
  },
  {
    label: "平均糖酸比",
    cmValue: "15.35",
    qzValue: "18.11",
    difference: "琼中 +2.76",
  },
  {
    label: "平均 VC",
    cmValue: "40.80",
    qzValue: "31.00",
    difference: "澄迈 +9.80",
  },
];

export const representativeSamples: RepresentativeSample[] = [
  { id: "CM-1", origin: "澄迈福橙", ssc: 7.35, ta: 0.69, ratio: 10.65, vc: 46.57 },
  { id: "CM-52", origin: "澄迈福橙", ssc: 8.5, ta: 0.575, ratio: 15.02, vc: 36.9 },
  { id: "CM-120", origin: "澄迈福橙", ssc: 10.65, ta: 0.415, ratio: 25.61, vc: 34.08 },
  { id: "QZ-1", origin: "琼中绿橙", ssc: 10.65, ta: 0.49, ratio: 22.23, vc: 31.59 },
  { id: "QZ-58", origin: "琼中绿橙", ssc: 10.5, ta: 0.465, ratio: 22.55, vc: 28.12 },
  { id: "QZ-144", origin: "琼中绿橙", ssc: 10.85, ta: 0.71, ratio: 15.24, vc: 29.81 },
];

export const spectralHighlights = [
  {
    title: "HSI 平均光谱",
    detail: "澄迈 199 条，琼中 200 条，覆盖 389nm 起始波段。",
  },
  {
    title: "R210 近红外光谱",
    detail: "澄迈 199 条，琼中 200 条，覆盖 901nm 起始波段。",
  },
  {
    title: "S960 对齐光谱",
    detail: "澄迈 200 条，琼中 200 条，可继续用于批次扩展展示。",
  },
];

export const datasetFiles: DatasetFile[] = [
  {
    name: "1 化验值 滴定法.xlsx",
    category: "理化指标",
    countLabel: "399 条记录",
    note: "包含糖度、酸度、糖酸比和 VC。",
  },
  {
    name: "2 液质 糖+有机酸+氨基酸.xlsx",
    category: "组分检测",
    countLabel: "实验文件",
    note: "可继续扩展糖、有机酸和氨基酸维度。",
  },
  {
    name: "3 HSI澄迈福橙数据整理_平均值.xlsx",
    category: "HSI 光谱",
    countLabel: "199 条样本",
    note: "澄迈福橙高光谱平均值文件。",
  },
  {
    name: "4 HSI琼中绿橙数据整理_平均值.xlsx",
    category: "HSI 光谱",
    countLabel: "200 条样本",
    note: "琼中绿橙高光谱平均值文件。",
  },
  {
    name: "5 R210 CM1-200.xlsx",
    category: "R210 光谱",
    countLabel: "199 条样本",
    note: "澄迈福橙近红外采样文件。",
  },
  {
    name: "6 R210 QZ 1-200.xlsx",
    category: "R210 光谱",
    countLabel: "200 条样本",
    note: "琼中绿橙近红外采样文件。",
  },
  {
    name: "7 S960 CM1-200 去波段对齐.xlsx",
    category: "S960 光谱",
    countLabel: "200 条样本",
    note: "澄迈福橙波段对齐文件。",
  },
  {
    name: "8 S960 QZ 1-200.xlsx",
    category: "S960 光谱",
    countLabel: "200 条样本",
    note: "琼中绿橙波段对齐文件。",
  },
];
