"use client";

import { motion } from "framer-motion";
import { Activity, ArrowRight, MapPin, Target, TriangleAlert } from "lucide-react";
import mockData from "@/lib/mockData.json";
import { SafeEChart } from "@/components/charts/SafeEChart";
import * as echarts from "echarts/core";

import { radarOption, barOption, scatterOption, trendOption } from './chartOptions';
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

const recentDetections = chemData.slice(0, 5).map((item, index) => ({
  id: item.id,
  origin: index % 2 === 0 ? "澄迈福橙" : "琼中绿橙",
  ssc: `${item.ssc}%`,
  ratio: item.ratio,
  status: item.ssc >= 8 ? "已通过" : "建议复检",
  time: `${(index + 1) * 10} 分钟前`,
}));

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
