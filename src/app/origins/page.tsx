"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Camera, Database, MapPin, Sparkles } from "lucide-react";
import { originProfiles, policyDocuments } from "@/lib/siteContent";
import { hainanOriginSummaries, sampleDatasetOverview } from "@/lib/sampleData";

const references = policyDocuments.filter((item) => ["江西", "广西", "海南"].includes(item.category));

const imageStrip = [
  {
    src: "/origin-images/gannan.jpg",
    alt: "赣南脐橙枝头果实",
    title: "赣南脐橙",
  },
  {
    src: "/origin-images/fuchuan-fixed.jpg",
    alt: "富川脐橙枝头果实",
    title: "富川脐橙",
  },
  {
    src: "/origin-images/qiongzhong-feature.jpg",
    alt: "琼中绿橙产品展示",
    title: "琼中绿橙",
  },
  {
    src: "/origin-images/chengmai-display.jpg",
    alt: "澄迈福橙果实近景",
    title: "澄迈福橙",
  },
];

const metricMeta = [
  { key: "avgSsc", label: "甜度表现", unit: "", max: 16.6 },
  { key: "avgTa", label: "酸度表现", unit: "", max: 1.13 },
  { key: "avgRatio", label: "糖酸平衡", unit: "", max: 28.69 },
  { key: "avgVc", label: "维生素 C", unit: "", max: 40.8 },
] as const;

const sampleReadings = [
  "当前展示基于项目已整理的海南真实理化样本汇总结果。",
  "页面使用均值和区间摘要，方便访客快速理解两地风味差异。",
  "后续接入江西、广西批次后，可继续扩展成更多产区对照。",
];

export default function OriginsPage() {
  const cm = hainanOriginSummaries.find((item) => item.code === "CM");
  const qz = hainanOriginSummaries.find((item) => item.code === "QZ");

  if (!cm || !qz) return null;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="mb-8 text-center md:mb-10">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1 text-sm font-medium text-orange-700"
        >
          <Sparkles size={16} />
          产区与品种
        </motion.div>
        <motion.h1
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-3 text-3xl font-bold text-foreground md:text-4xl"
        >
          江西、广西、海南代表性柑橘产区
        </motion.h1>
        <motion.p
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto max-w-3xl text-lg leading-relaxed text-foreground/70"
        >
          从产区风味到海南样本，这一页把“看起来怎么样”和“数据表现如何”放在一起看。
        </motion.p>
      </div>

      <div className="space-y-10 md:space-y-12">
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {originProfiles.map((origin, index) => (
            <motion.article
              key={origin.name}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="glass-panel overflow-hidden rounded-3xl"
            >
              <div className="relative h-64 overflow-hidden">
                <img src={origin.imageSrc} alt={origin.imageAlt ?? origin.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    <MapPin size={12} />
                    {origin.region}
                  </div>
                  <h2 className="text-2xl font-bold">{origin.name}</h2>
                  <p className="mt-1 text-sm text-white/85">{origin.category}</p>
                </div>
              </div>

              <div className="p-6">
                <p className="text-sm leading-7 text-foreground/75">{origin.summary}</p>

                <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/80 p-4">
                  <div className="mb-2 text-sm font-semibold text-orange-800">风味印象</div>
                  <p className="text-sm leading-7 text-orange-900/80">{origin.flavor}</p>
                </div>

                <div className="mt-5 space-y-3">
                  {origin.highlights.map((item) => (
                    <div key={item} className="rounded-2xl bg-white/75 px-4 py-3 text-sm leading-7 text-foreground/72">
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-5 text-sm leading-7 text-foreground/65">{origin.stage}</div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground/55">
                  {origin.imageCreditUrl ? (
                    <a
                      href={origin.imageCreditUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-orange-700"
                    >
                      {origin.imageCredit}
                    </a>
                  ) : (
                    <span>{origin.imageCredit}</span>
                  )}
                  {origin.sourceUrl ? (
                    <a
                      href={origin.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 font-semibold text-primary hover:text-orange-700"
                    >
                      查看公开资料 <ArrowUpRight size={16} />
                    </a>
                  ) : null}
                </div>
              </div>
            </motion.article>
          ))}
        </section>

        <section className="glass-panel rounded-3xl p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                <Database size={16} />
                海南样本对照
              </div>
              <h2 className="text-3xl font-bold text-foreground">两地风味差异，可以直接看出来</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/70">
                当前页面基于 {sampleDatasetOverview.totalChemistrySamples} 份海南理化样本摘要，把澄迈福橙与琼中绿橙放到同一视角里比较。
              </p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-sm text-foreground/65">
              澄迈 {cm.sampleCount} 份样本 · 琼中 {qz.sampleCount} 份样本
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {imageStrip.map((item) => (
              <div key={item.title} className="overflow-hidden rounded-3xl bg-white/75">
                <div className="h-40 overflow-hidden">
                  <img src={item.src} alt={item.alt} className="h-full w-full object-cover" />
                </div>
                <div className="px-4 py-3 text-sm font-medium text-foreground">{item.title}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="grid gap-4 md:grid-cols-2">
              {[cm, qz].map((item) => (
                <div key={item.code} className="rounded-3xl bg-white/80 p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-orange-700">{item.region}</div>
                      <div className="text-2xl font-bold text-foreground">{item.name}</div>
                    </div>
                    <div className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                      {item.sampleCount} 份
                    </div>
                  </div>

                  <div className="space-y-4">
                    {metricMeta.map((metric) => {
                      const value = item[metric.key] as number;
                      const width = Math.max(18, (value / metric.max) * 100);

                      return (
                        <div key={metric.key}>
                          <div className="mb-2 flex items-center justify-between text-sm text-foreground/72">
                            <span>{metric.label}</span>
                            <span className="font-bold text-foreground">
                              {value}
                              {metric.unit}
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-orange-100">
                            <div
                              className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                              style={{ width: `${Math.min(width, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-2xl bg-orange-50/80 px-4 py-3 text-sm leading-7 text-foreground/70">
                    糖度范围 {item.sscRange[0]} - {item.sscRange[1]}，糖酸比范围 {item.ratioRange[0]} - {item.ratioRange[1]}。
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-orange-100 bg-orange-50/70 p-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-orange-700">
                <Camera size={16} />
                怎么读这组数据
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-white/85 p-4">
                  <div className="text-sm font-semibold text-foreground">更甜更清爽</div>
                  <p className="mt-2 text-sm leading-7 text-foreground/70">
                    琼中绿橙的平均糖度更高，糖酸比也更靠前，页面上更容易对应到“清爽、好记、带辨识度”的口感印象。
                  </p>
                </div>

                <div className="rounded-2xl bg-white/85 p-4">
                  <div className="text-sm font-semibold text-foreground">更厚更扎实</div>
                  <p className="mt-2 text-sm leading-7 text-foreground/70">
                    澄迈福橙的平均酸度与平均 VC 更高，整体会更适合往“果园管理、样本批次、品质稳定性”这条线去讲。
                  </p>
                </div>

                <div className="rounded-2xl bg-white/85 p-4">
                  <div className="text-sm font-semibold text-foreground">数据怎么来的</div>
                  <p className="mt-2 text-sm leading-7 text-foreground/70">
                    当前展示值来自项目已整理的海南实测样本汇总，页面只展示均值和区间，不直接堆原始实验记录。
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {sampleReadings.map((item) => (
                  <div key={item} className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-7 text-foreground/70">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-foreground">公开资料参考</h2>
            <span className="text-sm text-foreground/55">政府与部委公开来源</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {references.map((item, index) => (
              <motion.a
                key={item.title}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="glass-panel rounded-3xl p-6 transition-transform hover:-translate-y-1"
              >
                <div className="text-xs font-medium text-orange-700">
                  {item.category} · {item.date}
                </div>
                <h3 className="mt-2 text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-foreground/70">{item.summary}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  打开来源 <ArrowUpRight size={16} />
                </div>
              </motion.a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
