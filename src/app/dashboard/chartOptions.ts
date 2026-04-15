import * as echarts from "echarts/core";

export const trendLabels = [
  "3/12", "3/13", "3/14", "3/15", "3/16", "3/17", "3/18", "3/19", "3/20", "3/21",
  "3/22", "3/23", "3/24", "3/25", "3/26", "3/27", "3/28", "3/29", "3/30", "3/31",
  "4/1", "4/2", "4/3", "4/4", "4/5", "4/6", "4/7", "4/8", "4/9", "4/10",
];

export const sscTrendData = [
  11.2, 11.4, 11.1, 11.6, 11.8, 12.1, 11.9, 12.2, 12.4, 12.1,
  12.5, 12.7, 12.4, 12.8, 13.0, 12.9, 12.6, 12.8, 13.1, 13.3,
  13.0, 12.9, 12.7, 12.8, 13.2, 13.4, 13.1, 12.9, 12.8, 13.0,
];

export const taTrendData = [
  0.78, 0.77, 0.79, 0.76, 0.74, 0.73, 0.72, 0.71, 0.7, 0.69,
  0.68, 0.69, 0.67, 0.66, 0.65, 0.64, 0.65, 0.63, 0.62, 0.61,
  0.62, 0.6, 0.59, 0.6, 0.58, 0.57, 0.58, 0.56, 0.55, 0.56,
];

export function createRandomCluster(count: number, centerX: number, centerY: number, spreadX: number, spreadY: number) {
  return Array.from({ length: count }, () => [
    Number((centerX + (Math.random() - 0.5) * 2 * spreadX).toFixed(2)),
    Number((centerY + (Math.random() - 0.5) * 2 * spreadY).toFixed(2)),
  ]);
}

export const chengmaiCluster = createRandomCluster(24, 6.8, 6.3, 1.2, 1.1);
export const qiongzhongCluster = createRandomCluster(24, -4.6, -4.1, 1.3, 1.25);
export const anomalyCluster = [
  [Number((Math.random() * 16 - 8).toFixed(2)), Number((Math.random() * 16 - 8).toFixed(2))],
  [Number((Math.random() * 16 - 8).toFixed(2)), Number((Math.random() * 16 - 8).toFixed(2))],
  [Number((Math.random() * 16 - 8).toFixed(2)), Number((Math.random() * 16 - 8).toFixed(2))],
  [Number((Math.random() * 16 - 8).toFixed(2)), Number((Math.random() * 16 - 8).toFixed(2))],
  [Number((Math.random() * 16 - 8).toFixed(2)), Number((Math.random() * 16 - 8).toFixed(2))],
];

export const radarOption = {
  backgroundColor: "transparent",
  tooltip: {},
  radar: {
    indicator: [
      { name: "澄迈福橙", max: 100 },
      { name: "琼中绿橙", max: 100 },
      { name: "赣南脐橙", max: 100 },
      { name: "奉节脐橙", max: 100 },
      { name: "蒲江丑柑", max: 100 },
      { name: "融安金桔", max: 100 },
    ],
    splitArea: {
      areaStyle: {
        color: [
          "rgba(234, 88, 12, 0.05)",
          "rgba(234, 88, 12, 0.1)",
          "rgba(234, 88, 12, 0.15)",
          "rgba(234, 88, 12, 0.2)",
        ],
      },
    },
    axisLine: { lineStyle: { color: "rgba(234, 88, 12, 0.3)" } },
    splitLine: { lineStyle: { color: "rgba(234, 88, 12, 0.3)" } },
    axisName: { color: "#431407" },
  },
  series: [
    {
      name: "模型准确率",
      type: "radar",
      data: [
        {
          value: [99.2, 98.5, 97.8, 96.5, 98.1, 97.4],
          name: "准确率 (%)",
          itemStyle: { color: "#EA580C" },
          areaStyle: { color: "rgba(234, 88, 12, 0.4)" },
        },
      ],
    },
  ],
};

export const barOption = {
  backgroundColor: "transparent",
  tooltip: { trigger: "axis" },
  grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
  xAxis: {
    type: "category",
    data: ["澄迈福橙", "琼中绿橙", "赣南脐橙", "奉节脐橙", "其他样本"],
    axisLine: { lineStyle: { color: "#FED7AA" } },
    axisLabel: { color: "#431407", interval: 0, rotate: 10 },
  },
  yAxis: {
    type: "value",
    name: "平均糖度 (SSC %)",
    nameTextStyle: { color: "#431407" },
    splitLine: { lineStyle: { color: "rgba(254, 215, 170, 0.5)", type: "dashed" } },
    axisLabel: { color: "#431407" },
  },
  series: [
    {
      name: "SSC",
      type: "bar",
      barWidth: "42%",
      data: [8.16, 9.43, 12.9, 12.5, 10.8],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "#F97316" },
          { offset: 1, color: "#FDBA74" },
        ]),
        borderRadius: [6, 6, 0, 0],
      },
    },
  ],
};

export const scatterOption = {
  backgroundColor: "transparent",
  title: {
    text: "样本 PCA 降维分布",
    left: "center",
    textStyle: { color: "#431407", fontSize: 16, fontWeight: "normal" },
  },
  tooltip: {
    trigger: "item",
    formatter(params: { seriesName: string; value: number[] }) {
      return `${params.seriesName}<br/>PC1: ${params.value[0].toFixed(2)}<br/>PC2: ${params.value[1].toFixed(2)}`;
    },
  },
  legend: { bottom: 0, textStyle: { color: "#431407" } },
  xAxis: {
    name: "PC1",
    splitLine: { show: false },
    axisLine: { lineStyle: { color: "#FED7AA" } },
    axisLabel: { color: "#431407" },
  },
  yAxis: {
    name: "PC2",
    splitLine: { show: false },
    axisLine: { lineStyle: { color: "#FED7AA" } },
    axisLabel: { color: "#431407" },
  },
  series: [
    {
      name: "澄迈福橙",
      type: "scatter",
      symbolSize: 8,
      data: chengmaiCluster,
      itemStyle: { color: "#EA580C" },
    },
    {
      name: "琼中绿橙",
      type: "scatter",
      symbolSize: 8,
      data: qiongzhongCluster,
      itemStyle: { color: "#16A34A" },
    },
    {
      name: "偏离样本",
      type: "scatter",
      symbolSize: 12,
      data: anomalyCluster,
      itemStyle: { color: "#EF4444" },
    },
  ],
};

export const trendOption = {
  backgroundColor: "transparent",
  tooltip: { trigger: "axis" },
  legend: {
    data: ["平均糖度 (SSC)", "平均酸度 (TA)"],
    textStyle: { color: "#431407" },
  },
  grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: trendLabels,
    axisLine: { lineStyle: { color: "#FED7AA" } },
    axisLabel: { color: "#431407" },
  },
  yAxis: [
    {
      type: "value",
      name: "糖度 (%)",
      position: "left",
      axisLine: { show: true, lineStyle: { color: "#F97316" } },
      splitLine: { lineStyle: { color: "rgba(254, 215, 170, 0.5)", type: "dashed" } },
      axisLabel: { color: "#431407" },
    },
    {
      type: "value",
      name: "酸度 (%)",
      position: "right",
      axisLine: { show: true, lineStyle: { color: "#16A34A" } },
      splitLine: { show: false },
      axisLabel: { color: "#431407" },
    },
  ],
  series: [
    {
      name: "平均糖度 (SSC)",
      type: "line",
      smooth: true,
      data: sscTrendData,
      itemStyle: { color: "#F97316" },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(249, 115, 22, 0.3)" },
          { offset: 1, color: "rgba(249, 115, 22, 0.05)" },
        ]),
      },
    },
    {
      name: "平均酸度 (TA)",
      type: "line",
      yAxisIndex: 1,
      smooth: true,
      data: taTrendData,
      itemStyle: { color: "#16A34A" },
    },
  ],
};
