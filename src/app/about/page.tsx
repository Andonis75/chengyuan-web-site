"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Camera, Cpu, Database, Layers, Zap } from "lucide-react";

export default function About() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 md:py-8">
      <div className="mb-8 text-center md:mb-10">
        <motion.h1 
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-3xl font-bold text-foreground md:text-4xl"
        >
          技术原理与核心优势
        </motion.h1>
        <motion.p 
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-foreground/70 max-w-2xl mx-auto"
        >
          橙源智鉴融合了前沿的高光谱成像技术与深度学习算法，实现了对柑橘内部品质的无损检测和产地的精准溯源。
        </motion.p>
      </div>

      {/* 核心技术 */}
      <div className="space-y-10 md:space-y-12">
        {/* 高光谱技术 */}
        <motion.section 
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel rounded-3xl p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">高光谱成像技术 (HSI)</h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                传统相机只能捕捉红、绿、蓝三个波段的光，而高光谱相机能够捕捉数百个连续的窄波段光谱信息。这就像是给柑橘拍了一张"X光片"，不仅能看到表皮，还能探测到内部的化学成分。
              </p>
              <p className="text-foreground/70 leading-relaxed">
                不同物质对不同波长光的吸收和反射特性不同，形成了独特的"光谱指纹"。我们通过分析这些指纹，就能推算出柑橘的糖度、酸度等内部指标。
              </p>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 flex items-center justify-center relative overflow-hidden">
                {/* 模拟高光谱数据立方体 */}
                <div className="relative w-48 h-48">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i}
                      className="absolute inset-0 border-2 border-orange-400/30 rounded-lg bg-orange-500/10"
                      style={{
                        transform: `translate(${i * 10}px, ${-i * 10}px)`,
                        zIndex: 5 - i
                      }}
                    />
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center z-10" style={{ transform: 'translate(20px, -20px)' }}>
                    <Layers className="text-orange-500 w-16 h-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* AI 模型 */}
        <motion.section 
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel rounded-3xl p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
            <div className="md:w-1/2">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <BrainCircuit size={24} />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">深度学习与大模型</h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                高光谱数据量庞大且复杂，传统统计方法难以充分挖掘其中的特征。我们采用了先进的深度学习架构（如 1D-CNN、Transformer），专门针对光谱序列数据进行优化。
              </p>
              <p className="text-foreground/70 leading-relaxed">
                模型通过学习数万个带有真实化验标签的样本，建立了光谱特征与理化指标之间的高精度映射关系。同时，结合大语言模型（LLM），系统能自动生成易于理解的自然语言分析报告。
              </p>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 flex items-center justify-center relative overflow-hidden">
                <div className="grid grid-cols-3 gap-4 p-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-500"><Database size={20} /></div>
                    <span className="text-xs font-medium text-blue-800">光谱数据</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-0.5 w-full bg-blue-300 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-blue-300 rotate-45" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-blue-500 rounded-full shadow-md flex items-center justify-center text-white"><Cpu size={20} /></div>
                    <span className="text-xs font-medium text-blue-800">AI 模型</span>
                  </div>
                  <div className="col-span-3 flex justify-center mt-2">
                    <div className="w-0.5 h-8 bg-blue-300 relative">
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 border-b-2 border-r-2 border-blue-300 rotate-45" />
                    </div>
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <div className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-blue-800 border border-blue-100">
                      预测结果 & 报告
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 核心优势 */}
        <motion.section 
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">系统核心优势</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "无损检测", desc: "无需破坏果实，即可获取内部营养指标，适合大规模流水线分选。", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-100" },
              { title: "秒级响应", desc: "端云协同架构，从扫描到出具报告仅需数秒，极大提升检测效率。", icon: Zap, color: "text-green-500", bg: "bg-green-100" },
              { title: "精准溯源", desc: "基于产地特有的土壤、气候形成的光谱微小差异，实现防伪溯源。", icon: Zap, color: "text-orange-500", bg: "bg-orange-100" }
            ].map((item, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl text-center">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 ${item.bg} ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-foreground/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
