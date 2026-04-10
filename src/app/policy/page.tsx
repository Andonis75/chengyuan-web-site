"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Landmark } from "lucide-react";
import { policyDocuments } from "@/lib/siteContent";

const categories = ["江西", "广西", "海南"] as const;

export default function PolicyPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="mb-8 text-center md:mb-10">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1 text-sm font-medium text-orange-700"
        >
          <Landmark size={16} />
          政策与资料
        </motion.div>
        <motion.h1
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-3 text-3xl font-bold text-foreground md:text-4xl"
        >
          公开政策与产业资料
        </motion.h1>
        <motion.p
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-3xl mx-auto text-lg text-foreground/70 leading-relaxed"
        >
          集中查看地理标志、质量分级、追溯管理和产业报道相关公开资料。
        </motion.p>
      </div>

      <div className="space-y-10 md:space-y-12">
        <section className="space-y-8">
          {categories.map((category) => {
            const documents = policyDocuments.filter((item) => item.category === category);

            return (
              <div key={category}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                    {category}
                  </div>
                  <div className="text-sm text-foreground/55">{documents.length} 条可直接引用的公开资料</div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {documents.map((item, index) => (
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
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-orange-700">
                        <span className="rounded-full bg-orange-100 px-2.5 py-1">{item.date}</span>
                        <span>{item.source}</span>
                      </div>
                      <h2 className="mt-4 text-2xl font-bold text-foreground">{item.title}</h2>
                      <p className="mt-4 text-sm leading-7 text-foreground/70">{item.summary}</p>
                      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        打开原文 <ArrowUpRight size={16} />
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
