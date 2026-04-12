"use client";

import { motion } from "framer-motion";
import { Activity, ArrowRight, MapPin, Target, TriangleAlert } from "lucide-react";
import mockData from "@/lib/mockData.json";
import { SafeEChart } from "@/components/charts/SafeEChart";
import * as echarts from "echarts";

type ChemRecord = {
  id: string;
  ssc: number;
  ta: number;
  ratio: number;
  vc: number;
};

const chemData = mockData.chemData as ChemRecord[];

const statsData = [
  { title: "当前样本批次", value: `${chemData.length}`, icon: Target, color: "text-blue-500", bg: "bg-blue-100" },
  { title: "重点产地专题", value: "2", icon: MapPin, color: "text-orange-500", bg: "bg-orange-100" },
  { title: "平均识别率", value: "98.5%", icon: Activity, color: "text-green-500", bg: "bg-green-100" },
  { title: "建议复检", value: "5", icon: TriangleAlert, color: "text-red-500", bg: "bg-red-100" },
];

const trendLabels = [
  "3/12", "3/13", "3/14", "3/15", "3/16", "3/17", "3/18", "3/19", "3/20", "3/21",
  "3/22", "3/23", "3/24", "3/25", "3/26", "3/27", "3/28", "3/29", "3/30", "3/31",
  "4/1", "4/2", "4/3", "4/4", "4/5", "4/6", "4/7", "4/8", "4/9", "4/10",
];

const sscTrendData = [
  11.2, 11.4, 11.1, 11.6, 11.8, 12.1, 11.9, 12.2, 12.4, 12.1,
  12.5, 12.7, 12.4, 12.8, 13.0, 12.9, 12.6, 12.8, 13.1, 13.3,
  13.0, 12.9, 12.7, 12.8, 13.2, 13.4, 13.1, 12.9, 12.8, 13.0,
];

const taTrendData = [
  0.78, 0.77, 0.79, 0.76, 0.74, 0.73, 0.72, 0.71, 0.7, 0.69,
  0.68, 0.69, 0.67, 0.66, 0.65, 0.64, 0.65, 0.63, 0.62, 0.61,
  0.62, 0.6, 0.59, 0.6, 0.58, 0.57, 0.58, 0.56, 0.55, 0.56,
];

function createRandomCluster(count: number, centerX: number, centerY: number, spreadX: number, spreadY: number) {
  return Array.from({ length: count }, () => [
    Number((centerX + (Math.random() - 0.5) * 2 * spreadX).toFixed(2)),
    Number((centerY + (Math.random() - 0.5) * 2 * spreadY).toFixed(2)),
  ]);
}

const chengmaiCluster = createRandomCluster(24, 6.8, 6.3, 1.2, 1.1);
const qiongzhongCluster = createRandomCluster(24, -4.6, -4.1, 1.3, 1.25);
const anomalyCluster = [
  [Number((Math.random() * 16 - 8).toFixed(2)), Number((Math.random() * 16 - 8).toFixed(2))],
  [Number((Math.random() * 16 - 8).toFixed(2)), Number((Math.random() * 16 - 8).toFixed(2))],
  [Number((Math.random() * 16 - 8).toFixed(2)), Number((Math.random() * 16 - 8).toFixed(2))],
  [Number((Math.random() * 16 - 8).toFixed(2)), Number((Math.random() * 16 - 8).toFixed(2))],
  [Number((Math.random() * 16 - 8).toFixed(2)), Number((Math.random() * 16 - 8).toFixed(2))],
];

const recentDetections = chemData.slice(0, 5).map((item, index) => ({
  id: item.id,
  origin: index % 2 === 0 ? "澄迈福橙" : "琼中绿橙",
  ssc: `${item.ssc}%`,
  ratio: item.ratio,
  status: item.ssc >= 8 ? "已通过" : "建议复检",
  time: `${(index + 1) * 10} 分钟前`,
}));

const radarOption = {
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

const barOption = {
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

const scatterOption = {
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

const trendOption = {
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

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">数据可视化大屏</h1>
        <p className="mt-2 max-w-3xl text-foreground/65">海南样本检测概览</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="glass-panel flex items-center gap-4 rounded-2xl p-6"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="mb-1 text-sm text-foreground/60">{stat.title}</div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6">
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.16 }}
            className="glass-panel flex-1 rounded-2xl p-6"
          >
            <h3 className="mb-4 text-lg font-bold text-foreground">产地识别准确率</h3>
            <div className="h-[300px]">
              <SafeEChart option={radarOption} style={{ height: "100%", width: "100%" }} />
            </div>
          </motion.div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.24 }}
            className="glass-panel flex-1 rounded-2xl p-6"
          >
            <h3 className="mb-4 text-lg font-bold text-foreground">各产地平均糖度</h3>
            <div className="h-[260px]">
              <SafeEChart option={barOption} style={{ height: "100%", width: "100%" }} />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="glass-panel flex flex-col rounded-2xl p-6 lg:col-span-1"
        >
          <h3 className="mb-4 text-lg font-bold text-foreground">样本特征空间分布</h3>
          <div className="min-h-[400px] flex-1">
            <SafeEChart option={scatterOption} style={{ height: "100%", width: "100%" }} />
          </div>
          <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-4">
            <p className="text-sm leading-6 text-orange-800">
              <strong>偏离样本：</strong> 红色点
            </p>
          </div>
        </motion.div>

        <div className="flex flex-col gap-6">
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel flex-1 rounded-2xl p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">近期样本记录</h3>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
              </span>
            </div>

            <div className="space-y-4">
              {recentDetections.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-transparent p-3 transition-colors hover:border-orange-100 hover:bg-white/50"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.id}</div>
                    <div className="mt-1 text-xs text-foreground/60">
                      识别结果: <span className="font-medium text-primary">{item.origin}</span> | SSC: {item.ssc} | 糖酸比: {item.ratio}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`mb-1 inline-block rounded-full px-2 py-1 text-xs ${
                        item.status === "已通过" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.status}
                    </div>
                    <div className="block text-xs text-foreground/40">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-primary transition-colors hover:bg-orange-50"
              onClick={() => {
                window.location.href = "/history";
              }}
            >
              查看全部样本记录
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
        className="glass-panel rounded-2xl p-6"
      >
        <h3 className="mb-4 text-lg font-bold text-foreground">近 30 批样本的糖度与酸度变化</h3>
        <div className="h-[300px]">
          <SafeEChart option={trendOption} style={{ height: "100%", width: "100%" }} />
        </div>
      </motion.div>
    </div>
  );
}
