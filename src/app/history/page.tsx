"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function History() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  // 导入真实数据
  const mockData = require("@/lib/mockData.json");

  // 模拟历史记录数据 (基于真实化验值)
  const historyData = mockData.chemData.map((item: any, index: number) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(index / 2)); // 模拟不同日期
    
    return {
      id: item.id,
      date: date.toISOString().split('T')[0],
      time: `10:${23 - (index % 5) * 2}:${45 - (index % 5) * 10}`,
      origin: index % 2 === 0 ? "澄迈福橙" : "琼中绿橙",
      ssc: item.ssc,
      ta: item.ta,
      ratio: item.ratio,
      status: item.ssc > 8 ? "优质" : "合格",
    };
  });

  // 过滤数据
  const filteredData = historyData.filter((item: any) => {
    const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrigin = filterOrigin === "all" || item.origin.includes(filterOrigin);
    return matchesSearch && matchesOrigin;
  });

  if (!mounted) return null;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">历史检测记录</h1>
        <p className="text-foreground/60 mt-2">查看、检索和导出所有样本的检测报告</p>
      </div>

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-2xl mb-6"
      >
        {/* 工具栏 */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="text"
                placeholder="搜索样本编号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-orange-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-64"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <select
                value={filterOrigin}
                onChange={(e) => setFilterOrigin(e.target.value)}
                className="pl-10 pr-8 py-2 rounded-xl border border-orange-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none w-full sm:w-48"
              >
                <option value="all">所有产地</option>
                <option value="澄迈">澄迈福橙</option>
                <option value="琼中">琼中绿橙</option>
              </select>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-primary rounded-xl hover:bg-orange-200 transition-colors font-medium w-full md:w-auto justify-center">
            <Download size={18} />
            导出报表
          </button>
        </div>

        {/* 数据表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-orange-200 text-sm text-foreground/60 bg-orange-50/50">
                <th className="p-4 font-medium rounded-tl-xl">样本编号</th>
                <th className="p-4 font-medium">检测时间</th>
                <th className="p-4 font-medium">预测产地</th>
                <th className="p-4 font-medium">糖度 (SSC)</th>
                <th className="p-4 font-medium">酸度 (TA)</th>
                <th className="p-4 font-medium">糖酸比</th>
                <th className="p-4 font-medium">品质评级</th>
                <th className="p-4 font-medium text-center rounded-tr-xl">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item: any, index: number) => (
                <tr key={item.id} className="border-b border-orange-100/50 hover:bg-orange-50/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">{item.id}</td>
                  <td className="p-4 text-foreground/80">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-foreground/40" />
                      {item.date} <span className="text-xs text-foreground/50">{item.time}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {item.origin}
                    </span>
                  </td>
                  <td className="p-4 text-foreground/80">{item.ssc}%</td>
                  <td className="p-4 text-foreground/80">{item.ta}%</td>
                  <td className="p-4 text-foreground/80">{item.ratio}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.status === "优质" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button className="p-2 text-primary hover:bg-orange-100 rounded-lg transition-colors inline-flex items-center justify-center" title="查看报告">
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

        {/* 分页 */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-orange-100">
          <div className="text-sm text-foreground/60">
            显示 1 到 {filteredData.length} 条，共 {filteredData.length} 条记录
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg border border-orange-200 text-foreground/40 cursor-not-allowed">
              <ChevronLeft size={18} />
            </button>
            <button className="w-9 h-9 rounded-lg bg-primary text-white font-medium flex items-center justify-center">
              1
            </button>
            <button className="p-2 rounded-lg border border-orange-200 text-foreground/40 cursor-not-allowed">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
