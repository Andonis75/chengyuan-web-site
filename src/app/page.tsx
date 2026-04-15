"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  ChevronRight,
  Citrus,
  Database,
  FileText,
  FlaskConical,
  MapPin,
  ShieldCheck,
  Waves,
} from "lucide-react";
import { homeQuickLinks, originProfiles } from "@/lib/siteContent";
import { sampleDatasetOverview } from "@/lib/sampleData";

const features = [
  {
    title: "AI 产地识别",
    description: "上传样本后，系统会结合光谱特征判断它更接近哪个产区，帮你更快看清来源线索。",
    icon: MapPin,
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "智能营养预测",
    description: "不用切开果实，也能快速查看糖度、酸度和维生素 C 等关键指标，先一步了解品质表现。",
    icon: Activity,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "异常预警与溯源",
    description: "发现异常样本时会及时标记，并给出分析结果，方便继续复检、分级和留档。",
    icon: ShieldCheck,
    color: "bg-blue-100 text-blue-600",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden pb-12 pt-8 md:pb-16 md:pt-10">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-[30%] -right-[10%] h-[70%] w-[70%] rounded-full bg-orange-200/30 blur-3xl" />
          <div className="absolute -bottom-[20%] -left-[10%] h-[60%] w-[60%] rounded-full bg-green-200/20 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center md:px-6">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
            </span>
            全新一代高光谱智能分析系统
          </motion.div>

          <motion.h1
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-5xl font-extrabold tracking-tight text-foreground md:text-7xl"
          >
            让每一颗柑橘的
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              品质与来源清晰可见
            </span>
          </motion.h1>

          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-foreground/70 md:text-xl"
          >
            在这里，你可以先了解不同产区的柑橘特点，
            再查看真实检测结果，判断它的品质和来源。
          </motion.p>

          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/dashboard"
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30 sm:w-auto"
            >
              进入可视化大屏
              <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
            </Link>
            <Link
              href="/analysis"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-orange-200 bg-white px-8 py-4 text-lg font-semibold text-foreground transition-all hover:border-orange-300 hover:bg-orange-50 sm:w-auto"
            >
              体验智能样本分析
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-orange-100 bg-white/50 py-12 md:py-14 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">核心能力</h2>
            <p className="mx-auto max-w-2xl text-foreground/60">
              不讲复杂术语，直接告诉你这套系统能看什么、怎么判断，以及结果能拿来做什么。
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-panel rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-2"
              >
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color}`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-foreground">{feature.title}</h3>
                <p className="leading-relaxed text-foreground/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <div className="glass-panel relative overflow-hidden rounded-3xl p-6 md:p-8">
            <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
              <div className="md:w-1/2">
                <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">
                  从样本到报告，
                  <br />
                  只需 <span className="text-primary">3</span> 个步骤
                </h2>
                <ul className="space-y-6">
                  {[
                    { step: "01", title: "采集样本数据", desc: "记录柑橘样本的光谱信息和检测数据" },
                    { step: "02", title: "开始智能分析", desc: "系统自动比对特征，生成产地和品质结果" },
                    { step: "03", title: "查看分析报告", desc: "用清晰的页面展示样本、结论和关键指标" },
                  ].map((item) => (
                    <li key={item.step} className="flex gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-primary">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-foreground">{item.title}</h4>
                        <p className="text-foreground/60">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link href="/analysis" className="inline-flex items-center gap-2 font-semibold text-primary transition-colors hover:text-orange-700">
                    查看完整演示流程 <ChevronRight size={20} />
                  </Link>
                </div>
              </div>

              <div className="w-full md:w-1/2">
                <div className="relative mx-auto aspect-square max-w-md">
                  <div
                    className="absolute inset-0 animate-spin-slow rounded-full bg-gradient-to-tr from-orange-100 to-green-50 opacity-50"
                    style={{ animationDuration: "20s" }}
                  />
                  <div className="absolute inset-4 flex items-center justify-center rounded-full border border-white bg-white/80 shadow-xl backdrop-blur-sm">
                    <div className="text-center">
                      <BrainCircuit size={64} className="mx-auto mb-4 text-primary" />
                      <div className="text-xl font-bold text-foreground">橙源智鉴 AI 核心</div>
                      <div className="mt-2 text-sm text-foreground/50">Processing...</div>
                    </div>
                  </div>

                  <div className="absolute top-0 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-orange-100 bg-white shadow-lg">
                    <Citrus className="text-orange-500" size={24} />
                  </div>
                  <div className="absolute bottom-0 left-1/2 flex h-16 w-16 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-green-100 bg-white shadow-lg">
                    <Activity className="text-green-500" size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-orange-100 bg-white/50 py-12 md:py-14 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-panel rounded-3xl p-8 md:p-10"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1 text-sm font-medium text-orange-700">
                <Database size={16} />
                海南样本速览
              </div>
              <h2 className="mt-5 text-3xl font-bold text-foreground md:text-4xl">先认识产区，再看真实数据</h2>
              <p className="mt-4 max-w-2xl leading-8 text-foreground/70">
                这里先选了澄迈福橙和琼中绿橙两类样本，
                方便你直接对比它们在糖度、酸度和光谱数据上的区别。
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/80 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-primary">
                    <FlaskConical size={20} />
                  </div>
                  <div className="mt-4 text-3xl font-bold text-foreground">{sampleDatasetOverview.chemistrySampleCount}</div>
                  <div className="mt-1 text-sm text-foreground/60">份检测数据</div>
                </div>
                <div className="rounded-3xl bg-white/80 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <MapPin size={20} />
                  </div>
                  <div className="mt-4 text-3xl font-bold text-foreground">{sampleDatasetOverview.comparedOrigins}</div>
                  <div className="mt-1 text-sm text-foreground/60">个产区可直接对比</div>
                </div>
                <div className="rounded-3xl bg-white/80 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-primary">
                    <Waves size={20} />
                  </div>
                  <div className="mt-4 text-3xl font-bold text-foreground">{sampleDatasetOverview.spectralFileCount}</div>
                  <div className="mt-1 text-sm text-foreground/60">组光谱数据已整理</div>
                </div>
              </div>

              <p className="mt-6 text-sm leading-7 text-foreground/65">{sampleDatasetOverview.note}</p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-1">
              {homeQuickLinks.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="glass-panel rounded-3xl p-8"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-primary">
                    {index === 0 ? <MapPin size={22} /> : index === 1 ? <ShieldCheck size={22} /> : <FileText size={22} />}
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-foreground">{item.title}</h3>
                  <p className="mb-6 text-sm leading-7 text-foreground/70">{item.description}</p>
                  <Link href={item.href} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-orange-700">
                    {item.cta} <ArrowUpRight size={16} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8 flex flex-col gap-3 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">首批上线产区</h2>
            <p className="mx-auto max-w-3xl text-foreground/65">
              先上线几类最容易看出差异的产区，让你先建立直观印象，再继续往下看真实样本和分析结果。
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {originProfiles.map((origin, index) => (
              <motion.div
                key={origin.name}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="glass-panel overflow-hidden rounded-3xl"
              >
                {origin.imageSrc ? (
                  <div className="relative h-56 overflow-hidden">
                    <img src={origin.imageSrc} alt={origin.imageAlt ?? origin.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                    <div className="absolute top-5 left-5 inline-flex rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-orange-700">
                      {origin.region}
                    </div>
                  </div>
                ) : null}

                <div className="p-7">
                  {!origin.imageSrc ? (
                    <div className="mb-4 inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                      {origin.region}
                    </div>
                  ) : null}
                  <h3 className="mb-2 text-2xl font-bold text-foreground">{origin.name}</h3>
                  <p className="mb-4 text-sm text-foreground/60">{origin.category}</p>
                  <p className="mb-4 text-sm leading-7 text-foreground/75">{origin.summary}</p>
                  <p className="text-sm leading-7 text-foreground/70">{origin.flavor}</p>
                  {origin.imageCredit ? (
                    <p className="mt-4 text-xs text-foreground/45">{origin.imageCredit}</p>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/origins"
              className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-7 py-3 font-semibold text-primary transition-colors hover:bg-orange-50"
            >
              查看完整产区专题 <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
