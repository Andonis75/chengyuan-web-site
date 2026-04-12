"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Camera, Database, MapPin, Sparkles } from "lucide-react";
import { policyDocuments } from "@/lib/siteContent";
import { hainanOriginSummaries, sampleDatasetOverview } from "@/lib/sampleData";

const BASE_PATH = "/chengyuan-web-site";

const references = policyDocuments
  .filter(
    (item) =>
      item.url.includes("ganzhou.gov.cn") ||
      item.url.includes("moa.gov.cn") ||
      item.url.includes("hainan.gov.cn") ||
      item.url.includes("agri.hainan.gov.cn"),
  )
  .slice(0, 6);

const originCards = [
  {
    name: "赣南脐橙",
    region: "江西赣州",
    imageSrc: `${BASE_PATH}/origin-images/gannan.jpg`,
    imageAlt: "赣南脐橙果园",
    summary: "作为国内脐橙代表性产区之一，适合用于展示标准化种植、品牌建设与产区辨识度。",
  },
  {
    name: "富川脐橙",
    region: "广西贺州",
    imageSrc: `${BASE_PATH}/origin-images/fuchuan-fixed.jpg`,
    imageAlt: "富川脐橙果实",
    summary: "富川脐橙具有稳定的区域品牌基础，可作为华南产区样本与江西、海南进行对照展示。",
  },
  {
    name: "琼中绿橙",
    region: "海南琼中",
    imageSrc: `${BASE_PATH}/origin-images/qiongzhong-feature.jpg`,
    imageAlt: "琼中绿橙展示",
    summary: "琼中绿橙外观特征鲜明，适合结合样本数据展示海南特色品种的产地差异与风味表现。",
  },
  {
    name: "澄迈福橙",
    region: "海南澄迈",
    imageSrc: `${BASE_PATH}/origin-images/chengmai-display.jpg`,
    imageAlt: "澄迈福橙果园",
    summary: "澄迈福橙适合与果园建设、批次样本和理化指标联合展示，用于体现产区与品质的对应关系。",
  },
];

const galleryImages = [
  {
    src: `${BASE_PATH}/origin-images/gallery-guoguo.jpg`,
    alt: "果园挂果状态",
    title: "挂果状态",
    className: "md:col-span-2 md:row-span-2",
    heightClass: "h-72 md:h-full",
  },
  {
    src: `${BASE_PATH}/origin-images/gallery-guoyuan.jpg`,
    alt: "产区果园场景",
    title: "产区果园",
    className: "",
    heightClass: "h-56",
  },
  {
    src: `${BASE_PATH}/origin-images/gallery-caishou-wide.jpg`,
    alt: "果园采收场景",
    title: "采收现场",
    className: "",
    heightClass: "h-56",
  },
  {
    src: `${BASE_PATH}/origin-images/gallery-caishou-close.jpg`,
    alt: "采收近景",
    title: "人工采收",
    className: "",
    heightClass: "h-56",
  },
  {
    src: `${BASE_PATH}/origin-images/gallery-fenxuan.jpg`,
    alt: "样本分选处理",
    title: "分选处理",
    className: "",
    heightClass: "h-56",
  },
  {
    src: `${BASE_PATH}/origin-images/gallery-zoufang.jpg`,
    alt: "果园走访记录",
    title: "果园走访",
    className: "md:col-span-2",
    heightClass: "h-60",
  },
];

const metricMeta = [
  { key: "avgSsc", label: "平均糖度", unit: "", max: 16.6 },
  { key: "avgTa", label: "平均酸度", unit: "", max: 1.13 },
  { key: "avgRatio", label: "糖酸比", unit: "", max: 28.69 },
  { key: "avgVc", label: "维生素 C", unit: "", max: 40.8 },
] as const;

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
          产区与样本
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
          聚焦江西、广西、海南代表性柑橘产区，并结合海南样本数据呈现产区形象与指标差异。
        </motion.p>
      </div>

      <div className="space-y-10 md:space-y-12">
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {originCards.map((origin, index) => (
            <motion.article
              key={origin.name}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="glass-panel overflow-hidden rounded-3xl"
            >
              <div className="relative h-64 overflow-hidden">
                <Image src={origin.imageSrc} alt={origin.imageAlt} fill className="object-cover" sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    <MapPin size={12} />
                    {origin.region}
                  </div>
                  <h2 className="text-2xl font-bold">{origin.name}</h2>
                </div>
              </div>

              <div className="p-6">
                <div className="text-sm font-medium text-foreground/72">{origin.region}</div>
                <p className="mt-3 text-sm leading-7 text-foreground/72">{origin.summary}</p>
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
              <h2 className="text-3xl font-bold text-foreground">澄迈福橙与琼中绿橙样本展示</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/70">
                当前页面基于海南理化样本摘要数据，展示两类代表样本在糖度、酸度、糖酸比和维生素 C
                等指标上的差异。
              </p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-sm text-foreground/65">
              共 {sampleDatasetOverview.totalChemistrySamples} 份样本
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {galleryImages.map((item) => (
              <div
                key={item.src}
                className={`group overflow-hidden rounded-3xl bg-white/75 ${item.className}`}
              >
                <div className={`relative overflow-hidden ${item.heightClass}`}>
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-4">
                    <div className="text-sm font-medium tracking-wide text-white">{item.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { ...cm, displayName: "澄迈福橙", displayRegion: "海南澄迈" },
                { ...qz, displayName: "琼中绿橙", displayRegion: "海南琼中" },
              ].map((item) => (
                <div key={item.code} className="rounded-3xl bg-white/80 p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-orange-700">{item.displayRegion}</div>
                      <div className="text-2xl font-bold text-foreground">{item.displayName}</div>
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
                关键指标
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-white/85 p-4">
                  <div className="text-sm font-semibold text-foreground">琼中绿橙</div>
                  <p className="mt-2 text-sm leading-7 text-foreground/70">
                    在当前样本中，平均糖度与糖酸比表现相对更高，适合用于展示清甜型风味特征。
                  </p>
                </div>

                <div className="rounded-2xl bg-white/85 p-4">
                  <div className="text-sm font-semibold text-foreground">澄迈福橙</div>
                  <p className="mt-2 text-sm leading-7 text-foreground/70">
                    在当前样本中，酸度与维生素 C 指标相对更高，适合体现不同产区的品质结构差异。
                  </p>
                </div>

                <div className="rounded-2xl bg-white/85 p-4">
                  <div className="text-sm font-semibold text-foreground">样本范围</div>
                  <p className="mt-2 text-sm leading-7 text-foreground/70">
                    页面采用均值与区间摘要展示方式，便于在同一视图下完成样本横向比较。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-foreground">公开资料参考</h2>
            <span className="text-sm text-foreground/55">政府与公开报道来源</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {references.map((item, index) => (
              <motion.a
                key={`${item.title}-${item.date}`}
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
                  {item.source} · {item.date}
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
