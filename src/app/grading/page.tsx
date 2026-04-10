"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { gradeDimensions, gradeTiers, gradingNotes, policyDocuments } from "@/lib/siteContent";

const standards = policyDocuments.filter((item) => item.category === "江西");

export default function GradingPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="mb-8 text-center md:mb-10">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1 text-sm font-medium text-orange-700"
        >
          <ShieldCheck size={16} />
          评级标准
        </motion.div>
        <motion.h1
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-3 text-3xl font-bold text-foreground md:text-4xl"
        >
          柑橘样本评级标准
        </motion.h1>
        <motion.p
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-3xl mx-auto text-lg text-foreground/70 leading-relaxed"
        >
          按糖度、糖酸比、产地匹配度和复检情况，对样本进行分级。
        </motion.p>
      </div>

      <div className="space-y-10 md:space-y-12">
        <section>
          <div className="mb-6 flex items-center gap-2 text-sm font-medium text-orange-700">
            <BadgeCheck size={16} />
            等级划分
          </div>
          <div className="grid gap-6 xl:grid-cols-4">
            {gradeTiers.map((tier, index) => (
              <motion.article
                key={tier.name}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="glass-panel rounded-3xl p-6"
              >
                <div className="mb-4 inline-flex rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                  {tier.name}
                </div>
                <h2 className="text-2xl font-bold text-foreground">{tier.slogan}</h2>
                <p className="mt-2 text-sm text-foreground/60">{tier.badge}</p>
                <div className="mt-6 space-y-3">
                  {tier.metrics.map((item) => (
                    <div key={item} className="flex gap-3 text-sm leading-7 text-foreground/70">
                      <span className="mt-2 h-2 w-2 rounded-full bg-orange-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-3xl bg-orange-50/80 px-4 py-4 text-sm leading-7 text-orange-900/80">
                  {tier.note}
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-panel rounded-3xl p-6 md:p-8"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              <SlidersHorizontal size={16} />
              评价维度
            </div>
            <h2 className="text-2xl font-bold text-foreground">主要指标</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {gradeDimensions.map((dimension) => (
                <div key={dimension.name} className="rounded-3xl bg-white/75 p-5">
                  <div className="text-sm font-semibold text-foreground">{dimension.name}</div>
                  <div className="mt-1 text-xs tracking-[0.18em] text-orange-700">{dimension.metric}</div>
                  <p className="mt-3 text-sm leading-7 text-foreground/70">{dimension.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="glass-panel rounded-3xl p-6 md:p-8"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
              <ShieldCheck size={16} />
              说明
            </div>
            <h2 className="text-2xl font-bold text-foreground">补充说明</h2>
            <div className="mt-5 space-y-4">
              {gradingNotes.map((item) => (
                <div key={item} className="rounded-3xl border border-dashed border-orange-200 px-5 py-4 text-sm leading-7 text-foreground/70">
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-foreground">公开依据</h2>
            <span className="text-sm text-foreground/55">标准与政策来源</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {standards.map((item, index) => (
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
                <div className="text-xs font-medium text-orange-700">{item.source} · {item.date}</div>
                <h3 className="mt-2 text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-foreground/70">{item.summary}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  查看来源 <ArrowUpRight size={16} />
                </div>
              </motion.a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
