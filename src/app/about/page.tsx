import {
  BarChart3,
  BrainCircuit,
  Camera,
  Cpu,
  Database,
  FileText,
  Layers,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

const coreTechCards = [
  {
    title: "高光谱成像采集",
    icon: Camera,
    color: "bg-orange-100 text-orange-700",
    description:
      "设备不是只拍一张普通照片，而是连续采集多个窄波段反射率，形成样本在空间维度与光谱维度上的联合数据。",
    bullets: [
      "保留果皮纹理、色泽与组织差异",
      "记录不同波段下的反射强弱变化",
      "为后续产地识别与品质预测提供基础输入",
    ],
  },
  {
    title: "光谱校正与预处理",
    icon: ScanLine,
    color: "bg-emerald-100 text-emerald-700",
    description:
      "原始高光谱数据会受到光照、设备状态和背景区域干扰，因此需要先完成校正、分割和归一化，再进入建模阶段。",
    bullets: [
      "黑白板校正降低环境光影响",
      "样本区域分割去除背景噪声",
      "平滑、归一化与特征压缩提升稳定性",
    ],
  },
  {
    title: "特征提取与模型学习",
    icon: Cpu,
    color: "bg-blue-100 text-blue-700",
    description:
      "系统会从带理化标签的样本中学习光谱特征和真实指标之间的映射关系，让模型具备分类与回归两类能力。",
    bullets: [
      "分类模型识别产地与样本类别",
      "回归模型预测 SSC、TA、糖酸比等指标",
      "通过训练集与验证集控制泛化误差",
    ],
  },
  {
    title: "结果生成与异常预警",
    icon: ShieldCheck,
    color: "bg-amber-100 text-amber-700",
    description:
      "模型推理完成后，系统会把结果组织成可展示页面，同时对偏离常见分布的样本进行标记，辅助复检与复核。",
    bullets: [
      "输出产地判断与关键品质指标",
      "给出异常点提示与复检建议",
      "支持图表、卡片和报告式展示",
    ],
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "样本采集",
    description: "采集柑橘样本的高光谱图像，并同步建立对应理化标签。",
  },
  {
    step: "02",
    title: "数据预处理",
    description: "完成校正、去噪、背景剔除和有效区域提取，得到可用光谱数据。",
  },
  {
    step: "03",
    title: "特征建模",
    description: "提取关键波段特征，训练分类与回归模型，建立样本与指标之间的关系。",
  },
  {
    step: "04",
    title: "推理输出",
    description: "对新样本进行识别与预测，输出产地结果、品质指标和预警信息。",
  },
  {
    step: "05",
    title: "结果展示",
    description: "将分析结果组织为图表、卡片和说明文本，方便展示、对比和复核。",
  },
];

const metricCards = [
  {
    title: "产地识别",
    icon: BrainCircuit,
    description:
      "通过比较样本在特征空间中的分布位置，判断其更接近哪一类产区模式，用于辅助溯源与真实性判别。",
  },
  {
    title: "品质预测",
    icon: BarChart3,
    description:
      "结合光谱特征估计糖度、酸度、糖酸比和维生素 C 等指标，用无损方式反映果实内部品质。",
  },
  {
    title: "可解释输出",
    icon: FileText,
    description:
      "不仅输出结论，也同步展示关键图表、指标变化与异常提示，让分析结果更容易理解和汇报。",
  },
];

const detailBlocks = [
  {
    title: "为什么高光谱能看出内部差异",
    icon: Layers,
    paragraphs: [
      "普通 RGB 图像只记录三个颜色通道，而高光谱成像会连续记录数十到数百个波段的反射信息。不同糖分、水分、色素和组织结构，对各波段光的吸收与反射方式并不相同，因此会留下具有区分度的光谱曲线。",
      "在柑橘场景中，果皮色素、细胞结构、水分含量和内部可溶性固形物变化，都会在特定波段范围内产生差异。这使得高光谱数据不仅能看外观，还能间接反映内部品质状态。",
    ],
  },
  {
    title: "模型如何同时做分类与回归",
    icon: Database,
    paragraphs: [
      "系统把带标签样本划分为训练集与验证集，通过分类模型学习不同产地之间的特征边界，通过回归模型学习光谱与理化指标之间的连续映射关系。",
      "在部署阶段，同一份样本数据可以同时送入不同任务模型，得到产地类别、置信度、糖度、酸度和异常提示等多维输出，再统一组织到可视化界面中。",
    ],
  },
];

export default function About() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <section className="mb-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">技术原理</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-foreground md:text-5xl">
            从高光谱采集到智能建模的完整分析链路
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-foreground/70 md:text-lg">
            橙源智鉴以高光谱成像为数据基础，通过光谱预处理、特征提取、分类识别和指标回归，
            实现柑橘样本的产地判断、品质预测与异常预警，并最终将结果组织成可展示的可视化页面。
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-orange-100 px-4 py-2 font-medium text-orange-800">高光谱采集</span>
            <span className="rounded-full bg-emerald-100 px-4 py-2 font-medium text-emerald-800">光谱预处理</span>
            <span className="rounded-full bg-blue-100 px-4 py-2 font-medium text-blue-800">模型推理</span>
            <span className="rounded-full bg-amber-100 px-4 py-2 font-medium text-amber-800">结果输出</span>
          </div>
        </div>

        <div className="glass-panel overflow-hidden rounded-3xl border border-orange-100 p-6">
          <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6">
            <div className="relative mx-auto flex h-[340px] max-w-[380px] items-center justify-center">
              <div className="absolute left-4 top-10 rounded-2xl border border-orange-200 bg-white/85 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-orange-800">
                  <Camera size={16} />
                  采集光谱数据
                </div>
              </div>
              <div className="absolute right-4 top-24 rounded-2xl border border-emerald-200 bg-white/85 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                  <ScanLine size={16} />
                  预处理与校正
                </div>
              </div>
              <div className="absolute left-8 bottom-24 rounded-2xl border border-blue-200 bg-white/85 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                  <Cpu size={16} />
                  分类与回归
                </div>
              </div>
              <div className="absolute bottom-6 right-8 rounded-2xl border border-amber-200 bg-white/90 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                  <FileText size={16} />
                  结果展示
                </div>
              </div>

              <div className="relative h-48 w-48">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className="absolute inset-0 rounded-3xl border border-orange-300/45 bg-orange-500/10"
                    style={{
                      transform: `translate(${index * 8}px, ${-index * 8}px)`,
                      zIndex: 20 - index,
                    }}
                  />
                ))}
                <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ transform: "translate(16px, -16px)" }}>
                  <Layers className="h-16 w-16 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {coreTechCards.map((card) => (
          <div key={card.title} className="glass-panel rounded-2xl p-6">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}>
              <card.icon size={22} />
            </div>
            <h2 className="text-xl font-bold text-foreground">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-foreground/72">{card.description}</p>
            <div className="mt-4 space-y-2">
              {card.bullets.map((bullet) => (
                <div key={bullet} className="rounded-xl bg-white/65 px-3 py-2 text-sm text-foreground/68 ring-1 ring-orange-100">
                  {bullet}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mb-10 rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50/85 via-white to-amber-50/75 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">技术流程</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/70 md:text-base">
          页面里的识别结果并不是直接从原始图像读取出来，而是经历了采集、预处理、建模和结果组织几步连续流程。
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {workflowSteps.map((item) => (
            <div key={item.step} className="rounded-2xl border border-orange-100 bg-white/85 p-5">
              <div className="text-sm font-semibold tracking-[0.18em] text-primary/70">{item.step}</div>
              <div className="mt-3 text-base font-semibold text-foreground">{item.title}</div>
              <p className="mt-3 text-sm leading-6 text-foreground/68">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 grid gap-6 lg:grid-cols-2">
        {detailBlocks.map((block) => (
          <div key={block.title} className="glass-panel rounded-3xl p-6 md:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-primary">
              <block.icon size={22} />
            </div>
            <h2 className="text-2xl font-bold text-foreground">{block.title}</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-foreground/72 md:text-base">
              {block.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold text-foreground md:text-3xl">模型输出</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {metricCards.map((item) => (
            <div key={item.title} className="glass-panel rounded-2xl p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-primary">
                <item.icon size={22} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-foreground/72">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
