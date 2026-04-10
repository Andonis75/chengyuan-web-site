"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Play, FileText, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { SafeEChart } from "@/components/charts/SafeEChart";

export default function Analysis() {
  const [step, setStep] = useState<"upload" | "analyzing" | "result">("upload");
  const [progress, setProgress] = useState(0);
  const [reportText, setReportText] = useState("");
  const [mode, setMode] = useState<"single" | "compare">("single");

  // 模拟分析过程
  const startAnalysis = () => {
    setStep("analyzing");
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep("result");
          generateReport();
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  // 模拟打字机效果生成报告
  const generateReport = () => {
    const sampleData = require("@/lib/mockData.json").chemData[0];
    const fullText = `基于高光谱数据分析，该样本的光谱特征与【澄迈福橙】标准图谱高度吻合（置信度 98.5%）。\n\n营养指标预测结果显示：\n- 糖度 (SSC) 预测值为 ${sampleData.ssc}%，处于优质区间。\n- 酸度 (TA) 预测值为 ${sampleData.ta}%。\n- 糖酸比为 ${sampleData.ratio}，口感极佳。\n- 维生素C (VC) 含量为 ${sampleData.vc.toFixed(2)} mg/100g。\n\n综合判定：该样本为优质澄迈福橙，未发现异常特征，建议作为特级果品进行分级包装。`;
    let currentText = "";
    let i = 0;
    
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        currentText += fullText.charAt(i);
        setReportText(currentText);
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 30);
  };

  // 导入真实数据
  const mockData = require("@/lib/mockData.json");

  // 真实高光谱曲线数据
  const spectrumOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    legend: mode === "compare" ? { data: ["样本A (澄迈福橙)", "样本B (琼中绿橙)"], textStyle: { color: "#431407" } } : undefined,
    xAxis: {
      type: "category",
      name: "波长 (nm)",
      data: mockData.spectrum.wavelengths.map((w: number) => w.toFixed(1)),
      axisLine: { lineStyle: { color: "#FED7AA" } },
      axisLabel: { color: "#431407" }
    },
    yAxis: {
      type: "value",
      name: "反射率",
      splitLine: { lineStyle: { color: "rgba(254, 215, 170, 0.5)", type: "dashed" } },
      axisLabel: { color: "#431407" }
    },
    series: mode === "single" ? [
      {
        name: "当前样本 (澄迈福橙)",
        type: "line",
        smooth: true,
        data: mockData.spectrum.cm,
        itemStyle: { color: "#EA580C" },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: "rgba(234, 88, 12, 0.3)" }, { offset: 1, color: "rgba(234, 88, 12, 0)" }]
          }
        }
      }
    ] : [
      {
        name: "样本A (澄迈福橙)",
        type: "line",
        smooth: true,
        data: mockData.spectrum.cm,
        itemStyle: { color: "#EA580C" }
      },
      {
        name: "样本B (琼中绿橙)",
        type: "line",
        smooth: true,
        data: mockData.spectrum.qz,
        itemStyle: { color: "#16A34A" }
      }
    ]
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">智能样本分析</h1>
          <p className="text-foreground/60 mt-2">上传高光谱数据，AI 实时预测产地与营养指标</p>
        </div>
        
        {/* 模式切换 */}
        <div className="flex bg-orange-100/50 p-1 rounded-xl border border-orange-200 w-fit">
          <button
            onClick={() => { setMode("single"); setStep("upload"); setReportText(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "single" ? "bg-white text-primary shadow-sm" : "text-foreground/60 hover:text-primary"
            }`}
          >
            单样本分析
          </button>
          <button
            onClick={() => { setMode("compare"); setStep("upload"); setReportText(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "compare" ? "bg-white text-primary shadow-sm" : "text-foreground/60 hover:text-primary"
            }`}
          >
            对比分析
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧：操作区与光谱图 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">样本数据输入</h3>
              {step === "result" && (
                <button 
                  onClick={() => { setStep("upload"); setReportText(""); }}
                  className="text-sm text-primary hover:underline"
                >
                  重新分析
                </button>
              )}
            </div>

            {step === "upload" && (
              <div className="flex flex-col gap-4">
                {mode === "compare" && (
                  <div className="text-sm text-foreground/60 mb-2">请上传两个样本的数据进行对比：</div>
                )}
                <div className="flex flex-col md:flex-row gap-4">
                  <div 
                    className="flex-1 border-2 border-dashed border-orange-200 rounded-xl p-8 text-center hover:bg-orange-50/50 transition-colors cursor-pointer"
                    onClick={startAnalysis}
                  >
                    <div className="w-12 h-12 bg-orange-100 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload size={24} />
                    </div>
                    <h4 className="text-base font-medium text-foreground mb-2">
                      {mode === "compare" ? "上传样本 A" : "上传高光谱数据"}
                    </h4>
                    <p className="text-xs text-foreground/50">支持 .hdr, .raw, .csv 格式</p>
                  </div>
                  
                  {mode === "compare" && (
                    <div 
                      className="flex-1 border-2 border-dashed border-green-200 rounded-xl p-8 text-center hover:bg-green-50/50 transition-colors cursor-pointer"
                      onClick={startAnalysis}
                    >
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload size={24} />
                      </div>
                      <h4 className="text-base font-medium text-foreground mb-2">上传样本 B</h4>
                      <p className="text-xs text-foreground/50">支持 .hdr, .raw, .csv 格式</p>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={startAnalysis}
                  className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 w-full md:w-auto md:mx-auto"
                >
                  <Play size={18} /> {mode === "compare" ? "开始对比分析" : "开始演示分析"}
                </button>
              </div>
            )}

            {step === "analyzing" && (
              <div className="py-12 text-center">
                <Loader2 size={48} className="animate-spin text-primary mx-auto mb-6" />
                <h4 className="text-lg font-medium text-foreground mb-4">AI 模型正在处理数据...</h4>
                <div className="w-full max-w-md mx-auto bg-orange-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-75 ease-linear" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-foreground/60">{progress}% - 正在提取特征波段</p>
              </div>
            )}

            {step === "result" && (
              <div>
                <div className="flex items-center gap-3 mb-4 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                  <CheckCircle2 size={20} />
                  <span className="font-medium">分析完成，耗时 1.2 秒</span>
                </div>
                <div className="h-[300px] mt-6">
                  <SafeEChart option={spectrumOption} style={{ height: "100%", width: "100%" }} />
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* 右侧：分析结果与报告 */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            className={`glass-panel p-6 rounded-2xl flex-1 transition-all duration-500 ${step === "result" ? "opacity-100" : "opacity-50 grayscale pointer-events-none"}`}
          >
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <FileText size={20} className="text-primary" />
              AI 智能分析报告
            </h3>

            {step === "result" ? (
              <div className="space-y-6">
                {/* 核心指标卡片 */}
                {mode === "single" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                      <div className="text-xs text-orange-800 mb-1">预测产地</div>
                      <div className="text-xl font-bold text-primary">澄迈福橙</div>
                      <div className="text-xs text-orange-600 mt-1">置信度 98.5%</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <div className="text-xs text-green-800 mb-1">预测糖度 (SSC)</div>
                      <div className="text-xl font-bold text-green-600">{require("@/lib/mockData.json").chemData[0].ssc}%</div>
                      <div className="text-xs text-green-600 mt-1">误差 ±0.3%</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                        <div className="text-xs text-orange-800 mb-1">样本A 预测产地</div>
                        <div className="text-lg font-bold text-primary">澄迈福橙</div>
                        <div className="text-xs text-orange-600 mt-1">SSC: {require("@/lib/mockData.json").chemData[0].ssc}%</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                        <div className="text-xs text-green-800 mb-1">样本B 预测产地</div>
                        <div className="text-lg font-bold text-green-600">琼中绿橙</div>
                        <div className="text-xs text-green-600 mt-1">SSC: {require("@/lib/mockData.json").chemData[1].ssc}%</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI 文本报告 */}
                <div>
                  <div className="text-sm font-medium text-foreground mb-2">综合解读：</div>
                  <div className="bg-white/50 p-4 rounded-xl border border-orange-100 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap min-h-[150px]">
                    {mode === "single" ? reportText : "对比分析结果：\n\n样本A与样本B在可见-近红外波段存在显著差异。样本A的光谱特征与澄迈福橙高度吻合，其糖度较高（12.5%），酸度适中；样本B的光谱特征符合琼中绿橙，糖度略低（11.2%），但酸度较高，风味偏酸甜。\n\n结论：两样本产地不同，品质特征差异明显，建议分别进行包装销售。"}
                    {mode === "single" && reportText.length > 0 && reportText.length < 150 && (
                      <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse"></span>
                    )}
                  </div>
                </div>

                <button className="w-full py-3 bg-white border border-orange-200 text-primary font-medium rounded-xl hover:bg-orange-50 transition-colors">
                  导出 PDF 报告
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-foreground/40">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p>等待样本数据输入...</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
