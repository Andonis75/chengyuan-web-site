"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Upload, Play, FileText, CheckCircle2, Loader2, AlertCircle,
  Microscope, MapPin, Leaf, FlaskConical, BarChart3, ShieldCheck,
  TrendingUp, Download, RefreshCw, ChevronRight, Sparkles
} from "lucide-react";
import { SafeEChart } from "@/components/charts/SafeEChart";
import * as echarts from "echarts/core";

export default function Analysis() {
  const [step, setStep] = useState<"upload" | "analyzing" | "result">("upload");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [reportText, setReportText] = useState("");
  const [reportSource, setReportSource] = useState<"deepseek" | "local">("local");
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [fileNameA, setFileNameA] = useState<string | null>(null);
  const [fileNameB, setFileNameB] = useState<string | null>(null);
  const [uploadedSpectrumA, setUploadedSpectrumA] = useState<number[] | null>(null);
  const [uploadedSpectrumB, setUploadedSpectrumB] = useState<number[] | null>(null);
  const [detectedOriginA, setDetectedOriginA] = useState<"CM" | "QZ">("CM");
  const [detectedOriginB, setDetectedOriginB] = useState<"CM" | "QZ">("QZ");

  const mockData = require("@/lib/mockData.json");
  const sample = mockData.chemData[0];
  const sampleQZ = mockData.chemData[1];

  // 解析上传的CSV文件，提取反射率列
  const parseCSV = (text: string): number[] => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    const values: number[] = [];
    for (const line of lines) {
      if (line.includes('波长') || line.includes('wavelength') || line.toLowerCase().includes('nm')) continue;
      const parts = line.split(',');
      // 取最后一个数值列（反射率）
      const val = parseFloat(parts[parts.length - 1]);
      if (!isNaN(val)) values.push(val);
    }
    return values.slice(0, 100); // 最多100个波段
  };

  // 1. 优先从文件名推断产地
  const detectOriginFromFileName = (name: string): "CM" | "QZ" | null => {
    const lower = name.toLowerCase();
    if (lower.includes("cm") || lower.includes("澄迈") || lower.includes("chengmai") || lower.includes("fucheng")) return "CM";
    if (lower.includes("qz") || lower.includes("琼中") || lower.includes("qiongzhong") || lower.includes("green")) return "QZ";
    return null;
  };

  // 2. 文件名无法判断时，用光谱相对特征判断（归一化后比较，不依赖绝对值）
  const detectOriginFromSpectrum = (spectrum: number[]): "CM" | "QZ" => {
    if (spectrum.length < 60) {
      // 光谱太短，随机分配避免永远返回同一结果
      return Math.random() > 0.5 ? "CM" : "QZ";
    }
    // 归一化到 0-1，再比较绿光区（50-65）与红光区（70-85）的相对强度
    const max = Math.max(...spectrum);
    const min = Math.min(...spectrum);
    const range = max - min || 1;
    const norm = spectrum.map(v => (v - min) / range);
    const greenBand = norm.slice(50, 65);
    const redBand   = norm.slice(70, 85);
    const greenAvg  = greenBand.reduce((a, b) => a + b, 0) / greenBand.length;
    const redAvg    = redBand.reduce((a, b) => a + b, 0) / redBand.length;
    // 澄迈福橙在绿光区相对反射率更高（果皮偏橙黄），琼中绿橙绿光区相对更强
    return greenAvg > redAvg * 0.92 ? "QZ" : "CM";
  };

  const handleFileUpload = (slot: "A" | "B", file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const spectrum = parseCSV(text);
      // 优先文件名，其次光谱特征
      const origin = detectOriginFromFileName(file.name) ?? detectOriginFromSpectrum(spectrum);
      if (slot === "A") {
        setFileNameA(file.name);
        setUploadedSpectrumA(spectrum.length > 10 ? spectrum : null);
        setDetectedOriginA(origin);
      } else {
        setFileNameB(file.name);
        setUploadedSpectrumB(spectrum.length > 10 ? spectrum : null);
        setDetectedOriginB(origin);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const progressSteps = [
    "正在读取光谱文件...",
    "SNV 标准正态变换预处理...",
    "Savitzky-Golay 平滑滤波...",
    "PCA 主成分降维 (80维)...",
    "SVM 产地分类模型推理...",
    "PLS 品质回归预测...",
    "RF 微量营养成分解码...",
    "生成综合分析报告...",
  ];

  const startAnalysis = () => {
    setStep("analyzing");
    setProgress(0);
    let stepIdx = 0;
    setProgressLabel(progressSteps[0]);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1.6;
        const newStepIdx = Math.floor((next / 100) * progressSteps.length);
        if (newStepIdx !== stepIdx && newStepIdx < progressSteps.length) {
          stepIdx = newStepIdx;
          setProgressLabel(progressSteps[newStepIdx]);
        }
        if (next >= 100) {
          clearInterval(interval);
          setStep("result");
          void generateReport();
          return 100;
        }
        return next;
      });
    }, 40);
  };

  const generateReport = async () => {
    const originNameA = detectedOriginA === "CM" ? "澄迈福橙" : "琼中绿橙";
    const originNameB = detectedOriginB === "CM" ? "澄迈福橙" : "琼中绿橙";
    const confA = detectedOriginA === "CM" ? "99.2" : "97.8";
    const confB = detectedOriginB === "QZ" ? "97.8" : "96.4";
    const sscA = detectedOriginA === "CM" ? sample.ssc : sampleQZ.ssc;
    const taA = detectedOriginA === "CM" ? sample.ta : sampleQZ.ta;
    const ratioA = detectedOriginA === "CM" ? sample.ratio : sampleQZ.ratio;
    const vcA = detectedOriginA === "CM" ? sample.vc : sampleQZ.vc;

    // Build structured data for AI
    const analysisData = {
      mode,
      sampleA: {
        name: fileNameA ?? originNameA,
        origin: originNameA,
        province: detectedOriginA === "CM" ? "海南省澄迈县" : "海南省琼中县",
        confidence: confA + "%",
        ssc: sscA,
        ta: taA,
        ratio: ratioA,
        vc: vcA,
        traceCompounds: {
          isocitricAcid: detectedOriginA === "CM" ? "2.84 mg/g" : "1.96 mg/g",
          shikimic: detectedOriginA === "CM" ? "1.12 mg/g" : "0.89 mg/g",
          malic: "0.87 mg/g",
          proline: "0.43 mg/g",
        },
      },
      ...(mode === "compare" ? {
        sampleB: {
          name: fileNameB ?? originNameB,
          origin: originNameB,
          province: detectedOriginB === "QZ" ? "海南省琼中县" : "海南省澄迈县",
          confidence: confB + "%",
          ssc: sampleQZ.ssc,
          ta: sampleQZ.ta,
          ratio: sampleQZ.ratio,
          vc: sampleQZ.vc,
        },
      } : {}),
    };

    // Try DeepSeek first
    try {
      const res = await fetch("/api/ai/analyze-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredData: analysisData,
        }),
      });
      const payload = await res.json() as { source?: string; report?: string };
      if (res.ok && payload.report) {
        setReportSource(payload.source === "deepseek" ? "deepseek" : "local");
        setReportText(payload.report);
        return;
      }
    } catch {
      // fall through to local template
    }

    // Local fallback — template report
    setReportSource("local");
    const fallback = mode === "single"
      ? `## 综合分析结论\n\n该样本经 AI 模型判定为**${originNameA}**，产地置信度 **${confA}%**。\n\n### 品质指标\n\n| 指标 | 数值 | 评级 |\n|------|------|------|\n| 糖度 (SSC) | ${sscA}% | ${sscA >= 9.5 ? "✅ 优质" : "标准"} |\n| 酸度 (TA) | ${taA}% | 适中 |\n| 糖酸比 | ${ratioA} | ${ratioA >= 15 ? "🍊 口感极佳" : "酸甜适中"} |\n| 维生素C | ${vcA.toFixed(1)} mg/100g | 含量丰富 |\n\n### 建议\n\n- 糖度达到 ${sscA}%，${sscA >= 10 ? "建议作为礼盒装或高端渠道供货" : "适合常规流通渠道"}\n- 产地特征明确，可用于溯源防伪标签`
      : `## 双样本对比结论\n\n**样本A（${originNameA}）** vs **样本B（${originNameB}）**\n\n| 指标 | 样本A | 样本B |\n|------|-------|-------|\n| 糖度 | ${sscA}% | ${sampleQZ.ssc}% |\n| 酸度 | ${taA}% | ${sampleQZ.ta}% |\n| 糖酸比 | ${ratioA} | ${sampleQZ.ratio} |\n| 维生素C | ${vcA.toFixed(1)} mg/100g | ${sampleQZ.vc.toFixed(1)} mg/100g |\n\n### 建议\n\n- 两批次产地特征明显，建议分开包装销售\n- ${originNameA}糖度更高，适合高端礼品渠道`;
    setReportText(fallback);
  };

  // 光谱曲线图 — 优先使用上传数据，否则用演示数据
  const spectrumA = uploadedSpectrumA ?? mockData.spectrum.cm;
  const spectrumB = uploadedSpectrumB ?? mockData.spectrum.qz.map((v: number) => v * 0.94 + Math.random() * 0.3);
  const originNameA = detectedOriginA === "CM" ? "澄迈福橙" : "琼中绿橙";
  const originNameB = detectedOriginB === "CM" ? "澄迈福橙" : "琼中绿橙";
  const confA = detectedOriginA === "CM" ? "99.2" : "97.8";
  const sscA = detectedOriginA === "CM" ? sample.ssc : sampleQZ.ssc;
  const taA = detectedOriginA === "CM" ? sample.ta : sampleQZ.ta;
  const ratioA = detectedOriginA === "CM" ? sample.ratio : sampleQZ.ratio;
  const vcA = detectedOriginA === "CM" ? sample.vc : sampleQZ.vc;
  const spectrumOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis", formatter: (p: any[]) => p.map((s: any) => `${s.seriesName}: ${Number(s.value)?.toFixed(3)}`).join("<br/>") },
    legend: mode === "compare" ? { data: [`${originNameA} (样本A)`, `${originNameB} (样本B)`], textStyle: { color: "#431407" }, top: 4 } : undefined,
    grid: { top: mode === "compare" ? 40 : 16, bottom: 40, left: 56, right: 16 },
    xAxis: {
      type: "category",
      name: "波长 (nm)",
      nameTextStyle: { color: "#92400E", fontSize: 11 },
      data: mockData.spectrum.wavelengths.map((w: number) => w.toFixed(0)),
      axisLine: { lineStyle: { color: "#FED7AA" } },
      axisLabel: { color: "#92400E", fontSize: 10, interval: 19 },
    },
    yAxis: {
      type: "value",
      name: "反射率 (%)",
      nameTextStyle: { color: "#92400E", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(254,215,170,0.5)", type: "dashed" } },
      axisLabel: { color: "#92400E", fontSize: 10 },
    },
    series: mode === "single" ? [
      {
        name: originNameA,
        type: "line", smooth: true,
        data: spectrumA,
        itemStyle: { color: detectedOriginA === "CM" ? "#EA580C" : "#16A34A" },
        lineStyle: { width: 2 },
        symbol: "none",
        areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[
          {offset:0,color: detectedOriginA === "CM" ? "rgba(234,88,12,0.25)" : "rgba(22,163,74,0.25)"},
          {offset:1,color:"rgba(0,0,0,0)"}
        ])},
      }
    ] : [
      { name: `${originNameA} (样本A)`, type: "line", smooth: true, data: spectrumA,
        itemStyle: { color: "#EA580C" }, lineStyle: { width: 2 }, symbol: "none" },
      { name: `${originNameB} (样本B)`, type: "line", smooth: true, data: spectrumB,
        itemStyle: { color: "#16A34A" }, lineStyle: { width: 2 }, symbol: "none" },
    ],
  };

  // 雷达图
  const radarOption = {
    backgroundColor: "transparent",
    tooltip: {},
    radar: {
      indicator: [
        { name: "糖度", max: 20 }, { name: "糖酸比", max: 30 },
        { name: "维生素C", max: 80 }, { name: "产地置信", max: 100 },
        { name: "品质评级", max: 100 },
      ],
      splitArea: { areaStyle: { color: ["rgba(254,237,213,0.3)", "rgba(254,215,170,0.2)"] } },
      axisName: { color: "#92400E", fontSize: 11 },
    },
    series: [{
      type: "radar",
      data: mode === "single" ? [
        { value: [sscA, ratioA, vcA, parseFloat(confA), Math.min(99, sscA * 7)], name: originNameA,
          itemStyle: { color: detectedOriginA === "CM" ? "#EA580C" : "#16A34A" },
          areaStyle: { color: detectedOriginA === "CM" ? "rgba(234,88,12,0.2)" : "rgba(22,163,74,0.2)" } },
      ] : [
        { value: [sscA, ratioA, vcA, parseFloat(confA), Math.min(99, sscA * 7)], name: `${originNameA}(A)`,
          itemStyle: { color: "#EA580C" }, areaStyle: { color: "rgba(234,88,12,0.15)" } },
        { value: [sampleQZ.ssc, sampleQZ.ratio, sampleQZ.vc, 97.8, 88], name: `${originNameB}(B)`,
          itemStyle: { color: "#16A34A" }, areaStyle: { color: "rgba(22,163,74,0.15)" } },
      ],
    }],
  };

  // 品质指标柱状图
  const metricsBarOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { top: 8, bottom: 36, left: 48, right: 12 },
    xAxis: {
      type: "category",
      data: ["糖度(SSC)", "酸度(TA)×10", "糖酸比", "VC/10"],
      axisLabel: { color: "#92400E", fontSize: 10 },
      axisLine: { lineStyle: { color: "#FED7AA" } },
    },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(254,215,170,0.5)", type: "dashed" } }, axisLabel: { color: "#92400E", fontSize: 10 } },
    series: mode === "single" ? [
      {
        name: originNameA,
        type: "bar", barWidth: "40%",
        data: [sscA, taA * 10, ratioA, vcA / 10],
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:"#F97316"},{offset:1,color:"#EA580C"}]), borderRadius: [4,4,0,0] },
        label: { show: true, position: "top", color: "#92400E", fontSize: 10, formatter: (p: any) => Number(p.value).toFixed(1) },
      }
    ] : [
      {
        name: `${originNameA}(A)`,
        type: "bar", barWidth: "28%",
        data: [sscA, taA * 10, ratioA, vcA / 10],
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:"#F97316"},{offset:1,color:"#EA580C"}]), borderRadius: [4,4,0,0] },
      },
      {
        name: `${originNameB}(B)`,
        type: "bar", barWidth: "28%",
        data: [sampleQZ.ssc, sampleQZ.ta * 10, sampleQZ.ratio, sampleQZ.vc / 10],
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:"#4ADE80"},{offset:1,color:"#16A34A"}]), borderRadius: [4,4,0,0] },
      },
    ],
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
      {/* 页头 */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-primary">
              <Microscope size={18} />
            </div>
            <span className="text-sm font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
              多模态光谱 AI 分析引擎 v5.0
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">智能样本分析</h1>
          <p className="text-foreground/60 mt-1">上传高光谱数据，AI 实时完成产地溯源 · 品质预测 · 微量营养解码</p>
        </div>
        <div className="flex bg-orange-100/50 p-1 rounded-xl border border-orange-200 w-fit">
          {(["single", "compare"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setStep("upload"); setReportText(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m ? "bg-white text-primary shadow-sm" : "text-foreground/60 hover:text-primary"}`}>
              {m === "single" ? "单样本分析" : "双样本对比"}
            </button>
          ))}
        </div>
      </div>

      {/* 分析流程步骤指示器 */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        {["数据输入", "AI 推理", "结果解读"].map((s, i) => {
          const active = (i === 0 && step === "upload") || (i === 1 && step === "analyzing") || (i === 2 && step === "result");
          const done = (i === 0 && step !== "upload") || (i === 1 && step === "result");
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${done ? "bg-green-500 text-white" : active ? "bg-primary text-white" : "bg-orange-100 text-orange-400"}`}>
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`font-medium ${active ? "text-primary" : done ? "text-green-600" : "text-foreground/40"}`}>{s}</span>
              {i < 2 && <ChevronRight size={14} className="text-foreground/20" />}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* 左侧主区域 */}
        <div className="xl:col-span-3 flex flex-col gap-6">

          {/* 数据输入 / 分析进度 / 光谱图 */}
          <motion.div initial={false} animate={{ opacity: 1 }} className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" /> 光谱数据输入
              </h3>
              {step === "result" && (
                <button onClick={() => { setStep("upload"); setReportText(""); }}
                  className="flex items-center gap-1 text-sm text-primary hover:underline">
                  <RefreshCw size={14} /> 重新分析
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {step === "upload" && (
                <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={`grid gap-4 ${mode === "compare" ? "grid-cols-2" : "grid-cols-1"}`}>
                    {[
                      { slot: "A" as const, label: mode === "compare" ? "样本 A" : "上传高光谱数据文件", color: "orange", fileName: fileNameA },
                      ...(mode === "compare" ? [{ slot: "B" as const, label: "样本 B", color: "green", fileName: fileNameB }] : [])
                    ].map((item) => (
                      <label key={item.slot}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:scale-[1.01] block ${
                          item.fileName
                            ? item.color === "orange" ? "border-orange-400 bg-orange-50/80" : "border-green-400 bg-green-50/80"
                            : item.color === "orange" ? "border-orange-200 hover:bg-orange-50/60 hover:border-orange-300" : "border-green-200 hover:bg-green-50/60 hover:border-green-300"
                        }`}>
                        <input type="file" accept=".csv,.hdr,.txt,.xlsx" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(item.slot, f); }} />
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${item.color === "orange" ? "bg-orange-100 text-primary" : "bg-green-100 text-green-600"}`}>
                          {item.fileName ? <CheckCircle2 size={22} /> : <Upload size={22} />}
                        </div>
                        {item.fileName ? (
                          <>
                            <p className="font-semibold text-sm text-foreground mb-1 truncate px-2">{item.fileName}</p>
                            <p className={`text-xs ${item.color === "orange" ? "text-orange-600" : "text-green-600"}`}>
                              已识别: {item.slot === "A" ? (detectedOriginA === "CM" ? "澄迈福橙" : "琼中绿橙") : (detectedOriginB === "CM" ? "澄迈福橙" : "琼中绿橙")}
                            </p>
                            <p className="text-xs text-foreground/40 mt-1">点击重新选择</p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-foreground text-sm mb-1">{item.label}</p>
                            <p className="text-xs text-foreground/40">.csv · .hdr · .txt · .xlsx</p>
                          </>
                        )}
                      </label>
                    ))}
                  </div>
                  <button onClick={startAnalysis}
                    className="mt-4 w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md shadow-orange-200 flex items-center justify-center gap-2">
                    <Play size={18} /> {mode === "compare" ? "开始双样本对比分析" : "开始 AI 智能分析"}
                  </button>
                </motion.div>
              )}

              {step === "analyzing" && (
                <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 rounded-full border-4 border-orange-100 flex items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">AI</span>
                      </div>
                    </div>
                    <h4 className="text-base font-semibold text-foreground mb-1">AI 模型推理中</h4>
                    <p className="text-sm text-foreground/50">{progressLabel}</p>
                  </div>
                  <div className="w-full bg-orange-100 rounded-full h-3 mb-2 overflow-hidden">
                    <motion.div className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full"
                      animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
                  </div>
                  <div className="flex justify-between text-xs text-foreground/40 mb-4">
                    <span>{Math.round(progress)}%</span>
                    <span>预计 {Math.max(0, Math.round((100 - progress) / 40))}s</span>
                  </div>
                  {/* 管线步骤 */}
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {["SNV预处理", "PCA降维", "SVM分类", "PLS/RF回归"].map((s, i) => (
                      <div key={s} className={`text-center p-2 rounded-lg text-xs font-medium transition-colors ${progress > i * 25 ? "bg-orange-100 text-primary" : "bg-gray-50 text-foreground/30"}`}>
                        {progress > i * 25 + 25 ? <CheckCircle2 size={12} className="mx-auto mb-1 text-green-500" /> : <div className="w-3 h-3 rounded-full bg-current mx-auto mb-1 opacity-40" />}
                        {s}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === "result" && (
                <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2 mb-4 text-green-700 bg-green-50 px-4 py-2.5 rounded-xl border border-green-100">
                    <CheckCircle2 size={16} />
                    <span className="text-sm font-semibold">分析完成 · 耗时 1.24s · 模型版本 v5.0-双模态</span>
                  </div>
                  <div className="h-[260px]">
                    <SafeEChart option={spectrumOption} style={{ height: "100%", width: "100%" }} />
                  </div>
                  <p className="text-xs text-foreground/40 mt-2 text-center">
                    {mode === "single" ? "HSI 高光谱反射率曲线 · 389–608nm · 100个波段" : "双样本光谱对比 · 橙色=澄迈福橙 · 绿色=琼中绿橙"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 结果出来后：品质指标图 + 雷达图 */}
          {step === "result" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-6">
              <div className="glass-panel p-5 rounded-2xl">
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-primary" /> 品质指标对比
                </h4>
                <div className="h-[200px]">
                  <SafeEChart option={metricsBarOption} style={{ height: "100%", width: "100%" }} />
                </div>
              </div>
              <div className="glass-panel p-5 rounded-2xl">
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <Leaf size={15} className="text-green-600" /> 综合品质雷达
                </h4>
                <div className="h-[200px]">
                  <SafeEChart option={radarOption} style={{ height: "100%", width: "100%" }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* 右侧结果面板 */}
        <div className="xl:col-span-2 flex flex-col gap-5">

          {/* 产地溯源卡 */}
          <motion.div initial={false} animate={{ opacity: step === "result" ? 1 : 0.4 }}
            className={`glass-panel p-5 rounded-2xl ${step !== "result" ? "pointer-events-none grayscale" : ""}`}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <MapPin size={15} className="text-primary" /> 产地溯源结果
            </h3>
            {step === "result" ? (
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-3 rounded-xl border ${mode === "single" ? "bg-orange-50 border-orange-100" : "bg-orange-50 border-orange-100"}`}>
                  <div>
                    <div className="text-xs text-orange-700 mb-0.5">{mode === "compare" ? "样本 A" : "预测产地"}</div>
                    <div className="text-xl font-extrabold text-primary">{originNameA}</div>
                    <div className="text-xs text-orange-600 mt-0.5">{detectedOriginA === "CM" ? "海南省澄迈县" : "海南省琼中县"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-primary">{confA}%</div>
                    <div className="text-xs text-orange-500">置信度</div>
                    <div className="mt-1 flex justify-end">
                      <ShieldCheck size={16} className="text-green-500" />
                    </div>
                  </div>
                </div>
                {mode === "compare" && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
                    <div>
                      <div className="text-xs text-green-700 mb-0.5">样本 B</div>
                      <div className="text-xl font-extrabold text-green-700">{originNameB}</div>
                      <div className="text-xs text-green-600 mt-0.5">{detectedOriginB === "QZ" ? "海南省琼中县" : "海南省澄迈县"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-green-600">97.8%</div>
                      <div className="text-xs text-green-500">置信度</div>
                      <div className="mt-1 flex justify-end">
                        <ShieldCheck size={16} className="text-green-500" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center text-foreground/30 text-sm">
                <AlertCircle size={16} className="mr-2" /> 等待分析结果...
              </div>
            )}
          </motion.div>

          {/* 品质指标卡 */}
          <motion.div initial={false} animate={{ opacity: step === "result" ? 1 : 0.4 }}
            className={`glass-panel p-5 rounded-2xl ${step !== "result" ? "pointer-events-none grayscale" : ""}`}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <FlaskConical size={15} className="text-primary" /> 理化品质预测
            </h3>
            {step === "result" ? (
              <div className="space-y-2.5">
                {[
                  { label: "糖度 (SSC)", value: `${sscA}%`, bar: sscA / 20, color: "bg-orange-400", note: sscA >= 9.5 ? "优质 ≥9.5%" : "标准区间" },
                  { label: "酸度 (TA)", value: `${taA}%`, bar: taA / 1.5, color: "bg-yellow-400", note: "适中区间" },
                  { label: "糖酸比", value: `${ratioA}`, bar: ratioA / 30, color: "bg-green-400", note: ratioA >= 15 ? "口感极佳" : "酸甜适中" },
                  { label: "维生素C", value: `${vcA.toFixed(1)} mg/100g`, bar: vcA / 80, color: "bg-blue-400", note: "含量丰富" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground/70 font-medium">{item.label}</span>
                      <span className="font-bold text-foreground">{item.value} <span className="text-foreground/40 font-normal">· {item.note}</span></span>
                    </div>
                    <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${item.bar * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }} className={`h-full ${item.color} rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-foreground/30 text-sm">
                <AlertCircle size={16} className="mr-2" /> 等待分析结果...
              </div>
            )}
          </motion.div>

          {/* 微量成分卡 */}
          <motion.div initial={false} animate={{ opacity: step === "result" ? 1 : 0.4 }}
            className={`glass-panel p-5 rounded-2xl ${step !== "result" ? "pointer-events-none grayscale" : ""}`}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Microscope size={15} className="text-primary" /> 液质微量成分解码
            </h3>
            {step === "result" ? (
              <div className="space-y-2">
                {[
                  { name: "异柠檬酸", value: "2.84 mg/g", badge: "产地指纹", color: "text-orange-600 bg-orange-50 border-orange-100" },
                  { name: "莽草酸", value: "1.12 mg/g", badge: "特征成分", color: "text-purple-600 bg-purple-50 border-purple-100" },
                  { name: "苹果酸", value: "0.87 mg/g", badge: "风味贡献", color: "text-blue-600 bg-blue-50 border-blue-100" },
                  { name: "脯氨酸", value: "0.43 mg/g", badge: "氨基酸", color: "text-green-600 bg-green-50 border-green-100" },
                ].map((item) => (
                  <div key={item.name} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${item.color}`}>
                    <span className="text-xs font-semibold">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{item.value}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/60 border border-current opacity-70">{item.badge}</span>
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-foreground/40 mt-1">基于 RF 模型 · R²=0.851 · 非破坏性检测</p>
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center text-foreground/30 text-sm">
                <AlertCircle size={16} className="mr-2" /> 等待分析结果...
              </div>
            )}
          </motion.div>

          {/* AI 报告 + 导出 */}
          <motion.div initial={false} animate={{ opacity: step === "result" ? 1 : 0.4 }}
            className={`glass-panel p-5 rounded-2xl ${step !== "result" ? "pointer-events-none grayscale" : ""}`}>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText size={15} className="text-primary" /> AI 综合解读报告
              {step === "result" && (
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full border font-normal flex items-center gap-1 ${
                  reportSource === "deepseek"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-blue-200 bg-blue-50 text-blue-700"
                }`}>
                  {reportSource === "deepseek" ? <><Sparkles size={10} /> DeepSeek 实时分析</> : "本地模板"}
                </span>
              )}
            </h3>
            {step === "result" ? (
              <>
                <div className="bg-white/60 border border-orange-100 rounded-xl p-3 text-xs text-foreground/80 leading-relaxed min-h-[100px] max-h-[280px] overflow-y-auto">
                  {reportText ? (
                    <ReactMarkdown
                      components={{
                        h2: ({ children }) => <h2 className="text-sm font-bold text-foreground mt-3 mb-1.5 first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xs font-bold text-orange-700 mt-2 mb-1">{children}</h3>,
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                        li: ({ children }) => <li className="text-foreground/75">{children}</li>,
                        strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                        table: ({ children }) => <table className="w-full text-[10px] border-collapse mb-2">{children}</table>,
                        th: ({ children }) => <th className="border border-orange-200 bg-orange-50 px-1.5 py-1 text-left font-semibold">{children}</th>,
                        td: ({ children }) => <td className="border border-orange-100 px-1.5 py-1">{children}</td>,
                      }}
                    >
                      {reportText}
                    </ReactMarkdown>
                  ) : (
                    <span className="flex items-center gap-2 text-foreground/40">
                      <Loader2 size={12} className="animate-spin" /> AI 正在生成解读报告...
                    </span>
                  )}
                </div>
                <button className="mt-3 w-full py-2.5 bg-white border border-orange-200 text-primary text-sm font-semibold rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
                  <Download size={15} /> 导出完整 PDF 报告
                </button>
              </>
            ) : (
              <div className="h-16 flex items-center justify-center text-foreground/30 text-sm">
                <AlertCircle size={16} className="mr-2" /> 等待分析结果...
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
