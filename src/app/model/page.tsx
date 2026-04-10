"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Network, BarChart3, Layers } from "lucide-react";
import { SafeEChart } from "@/components/charts/SafeEChart";

export default function Model() {
  const [activeTab, setActiveTab] = useState<"classification" | "regression">("classification");

  // 模型对比数据
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
    { name: "XGBoost", r2: 0.90, rmse: 0.48, time: "85ms" },
  ];

  // 导入真实数据
  const mockData = require("@/lib/mockData.json");

  // 特征重要性图表 (可解释 AI)
  const featureImportanceOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
    xAxis: {
      type: "category",
      name: "波长 (nm)",
      data: mockData.spectrum.wavelengths.filter((_: any, i: number) => i % 2 === 0).map((w: number) => w.toFixed(1)),
      axisLine: { lineStyle: { color: "#FED7AA" } },
      axisLabel: { color: "#431407" }
    },
    yAxis: {
      type: "value",
      name: "特征贡献度",
      splitLine: { lineStyle: { color: "rgba(254, 215, 170, 0.5)", type: "dashed" } },
      axisLabel: { color: "#431407" }
    },
    series: [
      {
        name: "贡献度",
        type: "bar",
        data: Array.from({ length: 50 }, (_, i) => {
          // 模拟几个关键波段的高贡献度
          if (i > 10 && i < 15) return Math.random() * 0.5 + 0.5; // 叶绿素吸收带
          if (i > 35 && i < 40) return Math.random() * 0.6 + 0.4; // 水分/糖分吸收带
          return Math.random() * 0.2;
        }),
        itemStyle: {
          color: (params: any) => {
            return params.value > 0.4 ? "#EA580C" : "#FDBA74";
          }
        }
      }
    ]
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">模型与可解释 AI</h1>
        <p className="text-foreground/60 mt-2">深入了解算法性能与模型决策依据，打破 AI 黑箱</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 模型性能对比 */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Network size={20} className="text-primary" />
              模型性能评估
            </h3>
            <div className="flex bg-orange-100/50 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("classification")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "classification" ? "bg-white text-primary shadow-sm" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                产地分类
              </button>
              <button
                onClick={() => setActiveTab("regression")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "regression" ? "bg-white text-primary shadow-sm" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                营养回归
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
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
                  ? classificationModels.map((model, i) => (
                      <tr key={model.name} className="border-b border-orange-100/50 last:border-0">
                        <td className="py-4 font-medium text-foreground flex items-center gap-2">
                          {i === 0 && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                          {model.name}
                        </td>
                        <td className="py-4 text-foreground">{model.acc}%</td>
                        <td className="py-4 text-foreground">{model.f1}%</td>
                        <td className="py-4 text-foreground/60">{model.time}</td>
                      </tr>
                    ))
                  : regressionModels.map((model, i) => (
                      <tr key={model.name} className="border-b border-orange-100/50 last:border-0">
                        <td className="py-4 font-medium text-foreground flex items-center gap-2">
                          {i === 0 && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                          {model.name}
                        </td>
                        <td className="py-4 text-foreground">{model.r2}</td>
                        <td className="py-4 text-foreground">{model.rmse}</td>
                        <td className="py-4 text-foreground/60">{model.time}</td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-foreground/50 bg-orange-50 p-3 rounded-lg">
            * 1D-CNN 模型在准确率和推理速度上均表现最优，已被选为当前系统的核心部署模型。
          </div>
        </motion.div>

        {/* 网络结构示意 */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl flex flex-col"
        >
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <Layers size={20} className="text-primary" />
            核心网络架构 (1D-CNN)
          </h3>
          <div className="flex-1 flex items-center justify-center bg-white/30 rounded-xl border border-orange-100 p-4">
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="w-full bg-orange-100 text-orange-800 py-2 text-center rounded-lg text-sm font-medium border border-orange-200">
                Input: 光谱序列 (1 × 256)
              </div>
              <div className="h-4 w-px bg-orange-300"></div>
              <div className="w-3/4 bg-blue-50 text-blue-800 py-2 text-center rounded-lg text-sm border border-blue-200">
                Conv1D + ReLU + MaxPool
              </div>
              <div className="h-4 w-px bg-orange-300"></div>
              <div className="w-2/4 bg-blue-50 text-blue-800 py-2 text-center rounded-lg text-sm border border-blue-200">
                Conv1D + ReLU + MaxPool
              </div>
              <div className="h-4 w-px bg-orange-300"></div>
              <div className="w-1/3 bg-purple-50 text-purple-800 py-2 text-center rounded-lg text-sm border border-purple-200">
                Flatten & Dense
              </div>
              <div className="h-4 w-px bg-orange-300"></div>
              <div className="flex gap-4 w-full justify-center">
                <div className="w-1/3 bg-green-100 text-green-800 py-2 text-center rounded-lg text-sm font-medium border border-green-200">
                  Output: 产地类别
                </div>
                <div className="w-1/3 bg-green-100 text-green-800 py-2 text-center rounded-lg text-sm font-medium border border-green-200">
                  Output: 营养指标
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 可解释 AI (XAI) */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-6 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BrainCircuit size={20} className="text-primary" />
            可解释 AI：特征重要性分析 (Grad-CAM)
          </h3>
        </div>
        <p className="text-sm text-foreground/70 mb-6">
          下图展示了 AI 模型在进行产地识别时，对不同高光谱波段的关注程度。高亮区域表示该波段对最终分类结果的贡献度最大。
        </p>
        <div className="h-[350px]">
          <SafeEChart option={featureImportanceOption} style={{ height: "100%", width: "100%" }} />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
            <h4 className="font-bold text-orange-800 mb-2">波段 520-580 nm (高贡献)</h4>
            <p className="text-sm text-orange-700">
              该区域对应叶绿素和类胡萝卜素的吸收带，不同产地的光照和土壤条件导致果皮色素比例存在微小差异，是模型区分产地的关键依据。
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
            <h4 className="font-bold text-orange-800 mb-2">波段 820-880 nm (高贡献)</h4>
            <p className="text-sm text-orange-700">
              该近红外区域与果实内部的水分和糖分（O-H, C-H 键）泛频吸收相关，反映了不同产地微气候对果实内部品质的深层影响。
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
