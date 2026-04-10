"use client";

import { motion } from "framer-motion";
import { Activity, MapPin, Target, AlertTriangle } from "lucide-react";
import { SafeEChart } from "@/components/charts/SafeEChart";

// Mock Data
const statsData = [
  { title: "总样本数", value: "12,458", icon: Target, color: "text-blue-500", bg: "bg-blue-100" },
  { title: "产地类别", value: "8", icon: MapPin, color: "text-orange-500", bg: "bg-orange-100" },
  { title: "平均准确率", value: "98.5%", icon: Activity, color: "text-green-500", bg: "bg-green-100" },
  { title: "异常预警", value: "24", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-100" },
];

// 导入真实数据
const mockData = require("@/lib/mockData.json");

const recentDetections = mockData.chemData.slice(0, 5).map((item: any, index: number) => ({
  id: item.id,
  origin: index % 2 === 0 ? "澄迈" : "琼中",
  ssc: `${item.ssc}%`,
  status: item.ssc > 8 ? "正常" : "异常",
  time: `${(index + 1) * 10}分钟前`
}));

export default function Dashboard() {
  // ECharts Options
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
        { name: "融安金桔", max: 100 }
      ],
      splitArea: {
        areaStyle: {
          color: ["rgba(234, 88, 12, 0.05)", "rgba(234, 88, 12, 0.1)", "rgba(234, 88, 12, 0.15)", "rgba(234, 88, 12, 0.2)"]
        }
      },
      axisLine: { lineStyle: { color: "rgba(234, 88, 12, 0.3)" } },
      splitLine: { lineStyle: { color: "rgba(234, 88, 12, 0.3)" } },
      axisName: { color: "#431407" }
    },
    series: [{
      name: "模型准确率",
      type: "radar",
      data: [
        {
          value: [99.2, 98.5, 97.8, 96.5, 98.1, 97.4],
          name: "准确率 (%)",
          itemStyle: { color: "#EA580C" },
          areaStyle: { color: "rgba(234, 88, 12, 0.4)" }
        }
      ]
    }]
  };

  const barOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: ["澄迈", "琼中", "赣南", "奉节", "其他"],
      axisLine: { lineStyle: { color: "#FED7AA" } },
      axisLabel: { color: "#431407" }
    },
    yAxis: {
      type: "value",
      name: "平均糖度 (SSC %)",
      nameTextStyle: { color: "#431407" },
      splitLine: { lineStyle: { color: "rgba(254, 215, 170, 0.5)", type: "dashed" } },
      axisLabel: { color: "#431407" }
    },
    series: [
      {
        name: "SSC",
        type: "bar",
        barWidth: "40%",
        data: [12.5, 11.8, 13.5, 12.8, 10.8],
        itemStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#F97316" },
              { offset: 1, color: "#FDBA74" }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };

  const scatterOption = {
    backgroundColor: "transparent",
    title: {
      text: "样本 PCA 降维分布",
      left: "center",
      textStyle: { color: "#431407", fontSize: 16, fontWeight: "normal" }
    },
    tooltip: { 
      trigger: "item",
      formatter: function (params: any) {
        return `${params.seriesName}<br/>PC1: ${params.value[0].toFixed(2)}<br/>PC2: ${params.value[1].toFixed(2)}`;
      }
    },
    legend: { bottom: 0, textStyle: { color: "#431407" } },
    xAxis: { splitLine: { show: false }, axisLine: { lineStyle: { color: "#FED7AA" } }, axisLabel: { color: "#431407" } },
    yAxis: { splitLine: { show: false }, axisLine: { lineStyle: { color: "#FED7AA" } }, axisLabel: { color: "#431407" } },
    series: [
      {
        name: "澄迈福橙",
        type: "scatter",
        symbolSize: 8,
        data: Array.from({ length: 50 }, () => [Math.random() * 10 + 5, Math.random() * 10 + 5]),
        itemStyle: { color: "#EA580C" }
      },
      {
        name: "琼中绿橙",
        type: "scatter",
        symbolSize: 8,
        data: Array.from({ length: 50 }, () => [Math.random() * 10 - 5, Math.random() * 10 - 5]),
        itemStyle: { color: "#16A34A" }
      },
      {
        name: "异常样本",
        type: "scatter",
        symbolSize: 12,
        data: Array.from({ length: 5 }, () => [Math.random() * 20 - 10, Math.random() * 20 - 10]),
        itemStyle: { color: "#EF4444" }
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">数据可视化大屏</h1>
        <p className="text-foreground/60 mt-2">实时监控样本检测数据与模型运行状态</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-panel p-6 rounded-2xl flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-sm text-foreground/60 mb-1">{stat.title}</div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6 rounded-2xl flex-1"
          >
            <h3 className="text-lg font-bold text-foreground mb-4">产地识别准确率</h3>
            <div className="h-[300px]">
              <SafeEChart option={radarOption} style={{ height: "100%", width: "100%" }} />
            </div>
          </motion.div>
          
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-6 rounded-2xl flex-1"
          >
            <h3 className="text-lg font-bold text-foreground mb-4">各产地平均糖度</h3>
            <div className="h-[250px]">
              <SafeEChart option={barOption} style={{ height: "100%", width: "100%" }} />
            </div>
          </motion.div>
        </div>

        {/* Middle Column (Main Chart) */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 rounded-2xl lg:col-span-1 flex flex-col"
        >
          <h3 className="text-lg font-bold text-foreground mb-4">样本特征空间分布</h3>
          <div className="flex-1 min-h-[400px]">
            <SafeEChart option={scatterOption} style={{ height: "100%", width: "100%" }} />
          </div>
          <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
            <p className="text-sm text-orange-800">
              <strong>AI 洞察：</strong> 当前模型在特征空间中能有效区分澄迈与琼中产地样本。检测到 5 个异常样本偏离正常分布簇，建议进行复核。
            </p>
          </div>
        </motion.div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-panel p-6 rounded-2xl flex-1"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">实时检测动态</h3>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
            
            <div className="space-y-4">
              {recentDetections.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 transition-colors border border-transparent hover:border-orange-100">
                  <div>
                    <div className="font-medium text-sm text-foreground">{item.id}</div>
                    <div className="text-xs text-foreground/60 mt-1">
                      预测产地: <span className="text-primary font-medium">{item.origin}</span> | SSC: {item.ssc}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded-full inline-block mb-1 ${
                      item.status === "正常" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {item.status}
                    </div>
                    <div className="text-xs text-foreground/40 block">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              className="w-full mt-4 py-2 text-sm text-primary font-medium hover:bg-orange-50 rounded-lg transition-colors"
              onClick={() => window.location.href = '/history'}
            >
              查看全部记录
            </button>
          </motion.div>
        </div>
      </div>

      {/* Bottom Row: Trend Chart */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-panel p-6 rounded-2xl"
      >
        <h3 className="text-lg font-bold text-foreground mb-4">近30天糖度(SSC)与酸度(TA)变化趋势</h3>
        <div className="h-[300px]">
          <SafeEChart 
            option={{
              backgroundColor: "transparent",
              tooltip: { trigger: "axis" },
              legend: { data: ["平均糖度 (SSC)", "平均酸度 (TA)"], textStyle: { color: "#431407" } },
              grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
              xAxis: {
                type: "category",
                boundaryGap: false,
                data: Array.from({ length: 30 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (29 - i));
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }),
                axisLine: { lineStyle: { color: "#FED7AA" } },
                axisLabel: { color: "#431407" }
              },
              yAxis: [
                {
                  type: "value",
                  name: "糖度 (%)",
                  position: "left",
                  axisLine: { show: true, lineStyle: { color: "#F97316" } },
                  splitLine: { lineStyle: { color: "rgba(254, 215, 170, 0.5)", type: "dashed" } },
                  axisLabel: { color: "#431407" }
                },
                {
                  type: "value",
                  name: "酸度 (%)",
                  position: "right",
                  axisLine: { show: true, lineStyle: { color: "#16A34A" } },
                  splitLine: { show: false },
                  axisLabel: { color: "#431407" }
                }
              ],
              series: [
                {
                  name: "平均糖度 (SSC)",
                  type: "line",
                  smooth: true,
                  data: Array.from({ length: 30 }, () => 11 + Math.random() * 3),
                  itemStyle: { color: "#F97316" },
                  areaStyle: {
                    color: {
                      type: "linear", x: 0, y: 0, x2: 0, y2: 1,
                      colorStops: [{ offset: 0, color: "rgba(249, 115, 22, 0.3)" }, { offset: 1, color: "rgba(249, 115, 22, 0.05)" }]
                    }
                  }
                },
                {
                  name: "平均酸度 (TA)",
                  type: "line",
                  yAxisIndex: 1,
                  smooth: true,
                  data: Array.from({ length: 30 }, () => 0.5 + Math.random() * 0.4),
                  itemStyle: { color: "#16A34A" }
                }
              ]
            }} 
            style={{ height: "100%", width: "100%" }} 
          />
        </div>
      </motion.div>
    </div>
  );
}
