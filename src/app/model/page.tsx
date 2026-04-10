"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Layers, Network } from "lucide-react";
import mockData from "@/lib/mockData.json";
import { SafeEChart } from "@/components/charts/SafeEChart";

const classificationModels = [
  { name: "1D-CNN", acc: 98.5, f1: 98.2, time: "12ms" },
  { name: "SVM", acc: 94.2, f1: 93.8, time: "45ms" },
  { name: "PLS-DA", acc: 91.5, f1: 91.0, time: "8ms" },
  { name: "Random Forest", acc: 95.8, f1: 95.5, time: "120ms" },
];

const regressionModels = [
  { name: "1D-CNN-Reg", r2: 0.92, rmse: 0.45, time: "15ms" },
  { name: "PLSR", r2: 0.85, rmse: 0.68, time: "10ms" },
  { name: "SVR", r2: 0.88, rmse: 0.55, time: "50ms" },
  { name: "XGBoost", r2: 0.9, rmse: 0.48, time: "85ms" },
];

const wavelengths = mockData.spectrum.wavelengths
  .filter((_: number, index: number) => index % 2 === 0)
  .slice(0, 50)
  .map((wavelength: number) => wavelength.toFixed(1));

const featureImportanceData = Array.from({ length: 50 }, (_, index) => {
  if (index > 10 && index < 15) {
    return Number((0.58 + (index - 11) * 0.07).toFixed(2));
  }

  if (index > 35 && index < 40) {
    return Number((0.48 + (index - 36) * 0.09).toFixed(2));
  }

  return Number((0.08 + (index % 6) * 0.02 + (index % 3) * 0.01).toFixed(2));
});

const featureImportanceOption = {
  backgroundColor: "transparent",
  tooltip: { trigger: "axis" },
  grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
  xAxis: {
    type: "category",
    name: "波长 (nm)",
    data: wavelengths,
    axisLine: { lineStyle: { color: "#FED7AA" } },
    axisLabel: { color: "#431407" },
  },
  yAxis: {
    type: "value",
    name: "特征贡献度",
    splitLine: { lineStyle: { color: "rgba(254, 215, 170, 0.5)", type: "dashed" } },
    axisLabel: { color: "#431407" },
  },
  series: [
    {
      name: "贡献度",
      type: "bar",
      data: featureImportanceData,
      itemStyle: {
        color(params: { value: number }) {
          return params.value > 0.4 ? "#EA580C" : "#FDBA74";
        },
      },
    },
  ],
};

export default function Model() {
  const [activeTab, setActiveTab] = useState<"classification" | "regression">("classification");

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">模型与可解释 AI</h1>
        <p className="mt-2 text-foreground/60">深入了解模型如何识别产地、估算品质，并给出可以解释的判断依据</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Network size={20} className="text-primary" />
              模型性能评估
            </h3>
            <div className="flex rounded-lg bg-orange-100/50 p-1">
              <button
                onClick={() => setActiveTab("classification")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "classification" ? "bg-white text-primary shadow-sm" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                产地分类
              </button>
              <button
                onClick={() => setActiveTab("regression")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "regression" ? "bg-white text-primary shadow-sm" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                营养回归
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-orange-200 text-sm text-foreground/60">
                  <th className="pb-3 font-medium">模型名称</th>
                  <th className="pb-3 font-medium">{activeTab === "classification" ? "Accuracy" : "R²"}</th>
                  <th className="pb-3 font-medium">{activeTab === "classification" ? "F1-Score" : "RMSE"}</th>
                  <th className="pb-3 font-medium">推理耗时</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === "classification"
                  ? classificationModels.map((model, index) => (
                      <tr key={model.name} className="border-b border-orange-100/50 last:border-0">
                        <td className="flex items-center gap-2 py-4 font-medium text-foreground">
                          {index === 0 && <span className="h-2 w-2 rounded-full bg-green-500"></span>}
                          {model.name}
                        </td>
                        <td className="py-4 text-foreground">{model.acc}%</td>
                        <td className="py-4 text-foreground">{model.f1}%</td>
                        <td className="py-4 text-foreground/60">{model.time}</td>
                      </tr>
                    ))
                  : regressionModels.map((model, index) => (
                      <tr key={model.name} className="border-b border-orange-100/50 last:border-0">
                        <td className="flex items-center gap-2 py-4 font-medium text-foreground">
                          {index === 0 && <span className="h-2 w-2 rounded-full bg-green-500"></span>}
                          {model.name}
                        </td>
                        <td className="py-4 text-foreground">{model.r2}</td>
                        <td className="py-4 text-foreground">{model.rmse}</td>
                        <td className="py-4 text-foreground/60">{model.time}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-lg bg-orange-50 p-3 text-sm text-foreground/50">
            * 1D-CNN 模型在准确率和推理速度上综合表现最好，当前页面采用它作为核心展示模型。
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel flex flex-col rounded-2xl p-6"
        >
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-foreground">
            <Layers size={20} className="text-primary" />
            核心网络架构 (1D-CNN)
          </h3>
          <div className="flex flex-1 items-center justify-center rounded-xl border border-orange-100 bg-white/30 p-4">
            <div className="flex w-full flex-col items-center gap-4">
              <div className="w-full rounded-lg border border-orange-200 bg-orange-100 py-2 text-center text-sm font-medium text-orange-800">
                Input: 光谱序列 (1 × 256)
              </div>
              <div className="h-4 w-px bg-orange-300"></div>
              <div className="w-3/4 rounded-lg border border-blue-200 bg-blue-50 py-2 text-center text-sm text-blue-800">
                Conv1D + ReLU + MaxPool
              </div>
              <div className="h-4 w-px bg-orange-300"></div>
              <div className="w-2/4 rounded-lg border border-blue-200 bg-blue-50 py-2 text-center text-sm text-blue-800">
                Conv1D + ReLU + MaxPool
              </div>
              <div className="h-4 w-px bg-orange-300"></div>
              <div className="w-1/3 rounded-lg border border-purple-200 bg-purple-50 py-2 text-center text-sm text-purple-800">
                Flatten & Dense
              </div>
              <div className="h-4 w-px bg-orange-300"></div>
              <div className="flex w-full justify-center gap-4">
                <div className="w-1/3 rounded-lg border border-green-200 bg-green-100 py-2 text-center text-sm font-medium text-green-800">
                  Output: 产地类别
                </div>
                <div className="w-1/3 rounded-lg border border-green-200 bg-green-100 py-2 text-center text-sm font-medium text-green-800">
                  Output: 营养指标
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel rounded-2xl p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <BrainCircuit size={20} className="text-primary" />
            可解释 AI：特征重要性分析
          </h3>
        </div>
        <p className="mb-6 text-sm text-foreground/70">
          下图展示了 AI 在产地识别时关注哪些高光谱波段。颜色更深、柱子更高的位置，代表该波段对最终判断贡献更大。
        </p>
        <div className="h-[350px]">
          <SafeEChart option={featureImportanceOption} style={{ height: "100%", width: "100%" }} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
            <h4 className="mb-2 font-bold text-orange-800">波段 520-580 nm (高贡献)</h4>
            <p className="text-sm text-orange-700">
              该区域对应叶绿素和类胡萝卜素吸收带，不同产地的光照与栽培环境会在这里留下可识别差异。
            </p>
          </div>
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
            <h4 className="mb-2 font-bold text-orange-800">波段 820-880 nm (高贡献)</h4>
            <p className="text-sm text-orange-700">
              该近红外区域与果实内部水分和糖分有关，是连接“口感表现”和“光谱变化”的关键窗口。
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
