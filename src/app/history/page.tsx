"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Download, Eye, Filter, Search } from "lucide-react";
import mockData from "@/lib/mockData.json";

type ChemRecord = {
  id: string;
  ssc: number;
  ta: number;
  ratio: number;
  vc: number;
};

const chemData = mockData.chemData as ChemRecord[];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

const historyDates = [
  "2026-04-10",
  "2026-04-10",
  "2026-04-09",
  "2026-04-09",
  "2026-04-08",
  "2026-04-08",
  "2026-04-07",
  "2026-04-07",
  "2026-04-06",
  "2026-04-06",
];

const historyData = chemData.map((item, index) => {
  return {
    id: item.id,
    date: historyDates[index] ?? "2026-04-05",
    time: `10:${pad(23 - (index % 5) * 2)}:${pad(45 - (index % 5) * 10)}`,
    origin: index % 2 === 0 ? "澄迈福橙" : "琼中绿橙",
    ssc: item.ssc,
    ta: item.ta,
    ratio: item.ratio,
    status: item.ssc > 8 ? "优质" : "合格",
  };
});

export default function History() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("all");

  const filteredData = historyData.filter((item) => {
    const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrigin = filterOrigin === "all" || item.origin.includes(filterOrigin);
    return matchesSearch && matchesOrigin;
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">历史检测记录</h1>
        <p className="mt-2 text-foreground/60">查看、检索和导出所有样本的检测报告</p>
      </div>

      <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="glass-panel mb-6 rounded-2xl p-6">
        <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="text"
                placeholder="搜索样本编号..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-orange-200 bg-white/50 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:w-64"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <select
                value={filterOrigin}
                onChange={(event) => setFilterOrigin(event.target.value)}
                className="w-full appearance-none rounded-xl border border-orange-200 bg-white/50 py-2 pl-10 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:w-48"
              >
                <option value="all">所有产地</option>
                <option value="澄迈">澄迈福橙</option>
                <option value="琼中">琼中绿橙</option>
              </select>
            </div>
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-100 px-4 py-2 font-medium text-primary transition-colors hover:bg-orange-200 md:w-auto">
            <Download size={18} />
            导出报表
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-orange-200 bg-orange-50/50 text-sm text-foreground/60">
                <th className="rounded-tl-xl p-4 font-medium">样本编号</th>
                <th className="p-4 font-medium">检测时间</th>
                <th className="p-4 font-medium">预测产地</th>
                <th className="p-4 font-medium">糖度 (SSC)</th>
                <th className="p-4 font-medium">酸度 (TA)</th>
                <th className="p-4 font-medium">糖酸比</th>
                <th className="p-4 font-medium">品质评级</th>
                <th className="rounded-tr-xl p-4 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-b border-orange-100/50 transition-colors hover:bg-orange-50/30">
                  <td className="p-4 font-medium text-foreground">{item.id}</td>
                  <td className="p-4 text-foreground/80">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-foreground/40" />
                      {item.date} <span className="text-xs text-foreground/50">{item.time}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-800">
                      {item.origin}
                    </span>
                  </td>
                  <td className="p-4 text-foreground/80">{item.ssc}%</td>
                  <td className="p-4 text-foreground/80">{item.ta}%</td>
                  <td className="p-4 text-foreground/80">{item.ratio}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.status === "优质" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      className="inline-flex items-center justify-center rounded-lg p-2 text-primary transition-colors hover:bg-orange-100"
                      title="查看报告"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-foreground/50">
                    没有找到匹配的记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-orange-100 pt-4">
          <div className="text-sm text-foreground/60">
            显示 1 到 {filteredData.length} 条，共 {filteredData.length} 条记录
          </div>
          <div className="flex gap-2">
            <button className="cursor-not-allowed rounded-lg border border-orange-200 p-2 text-foreground/40">
              <ChevronLeft size={18} />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-medium text-white">
              1
            </button>
            <button className="cursor-not-allowed rounded-lg border border-orange-200 p-2 text-foreground/40">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
