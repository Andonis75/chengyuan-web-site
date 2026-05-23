import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  BookOpen,
  Camera,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Database,
  Download,
  FileText,
  FlaskConical,
  Gauge,
  Home,
  Landmark,
  Layers,
  Layers3,
  Leaf,
  Library,
  Loader2,
  MapPin,
  Menu,
  Microscope,
  Network,
  Play,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import * as echarts from "echarts/core";
import { SafeEChart } from "./components/charts/SafeEChart";
import {
  analysisProgressSteps,
  analysisSpectrumCM,
  analysisSpectrumQZ,
  analysisWavelengths,
  buildAnalysisReport,
  buildUploadedAnalysisSlot,
  emptyAnalysisSlot,
  metricsForAnalysis,
  splitAnalysisSampleGroups,
  type AnalysisMetrics,
  type AnalysisMode,
  type AnalysisOrigin,
  type AnalysisSlot,
  type AnalysisStep,
} from "./analysisEngine";
import {
  dashboardAverageRatio,
  dashboardFeaturePoints,
  dashboardMetricCategories,
  dashboardMetricSeries,
  dashboardModelMetrics,
  dashboardReadinessRadar,
  dashboardReviewCount,
  dashboardSampleByOrigin,
  dashboardSamples,
  dashboardSpectrumProfile,
} from "./dashboardData";
import { buildLocalAiReportSummary, requestAiReportSummary } from "./aiReport";
import { loadRealAnalysisModel, type RealAnalysisModelArtifact } from "./realAnalysis";

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

type TabId = "home" | "origins" | "grading" | "policy" | "analysis" | "dashboard" | "model";

type TabConfig = {
  id: TabId;
  label: string;
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  description: string;
  stats: Array<{ label: string; value: string }>;
  cards: Array<{ title: string; body: string; meta: string }>;
};

const originFocus = [
  {
    code: "CM",
    name: "澄迈福橙",
    region: "海南澄迈",
    image: assetPath("/origin-images/chengmai-oranges-tree.jpg"),
    sample: "199",
    ssc: "9.72",
    ta: "0.666",
    ratio: "15.35",
    vc: "40.8",
    accent: "from-orange-300 to-amber-500",
    summary:
      "澄迈福橙是海南澄迈的代表性柑橘。本项目收录 199 份澄迈样本，每一份都对应样本编号、理化指标和光谱记录，用来建立澄迈产区的基础特征。",
    texture:
      "现有数据里，澄迈样本的平均 VC 为 40.8 mg/100g，平均酸度为 0.666，高于琼中组。这些指标会进入报告，用于批次比较。",
    evidence: ["理化样本 199 份", "平均 SSC 9.72", "平均 VC 40.8 mg/100g"],
  },
  {
    code: "QZ",
    name: "琼中绿橙",
    region: "海南琼中",
    image: assetPath("/origin-images/green-citrus-close.jpg"),
    sample: "200",
    ssc: "10.79",
    ta: "0.611",
    ratio: "18.11",
    vc: "31.0",
    accent: "from-emerald-300 to-lime-500",
    summary:
      "琼中绿橙的外观辨识度很高，成熟期仍常带青绿色。项目收录 200 份琼中样本，和澄迈样本放在同一套指标下比较，便于做产地识别和品质分析。",
    texture:
      "现有数据里，琼中样本的平均 SSC 为 10.79，平均糖酸比为 18.11，两个指标都高于澄迈组，可与澄迈样本形成稳定对照。",
    evidence: ["理化样本 200 份", "平均 SSC 10.79", "平均糖酸比 18.11"],
  },
];

const metricRows = [
  { label: "平均糖度 SSC", cm: "9.72", qz: "10.79", diff: "琼中 +1.07", note: "琼中组甜度均值更高。" },
  { label: "平均酸度 TA", cm: "0.666", qz: "0.611", diff: "澄迈 +0.055", note: "澄迈组酸度均值更高，口感更有支撑。" },
  { label: "平均糖酸比", cm: "15.35", qz: "18.11", diff: "琼中 +2.76", note: "琼中组更高，清甜感的指标基础更明显。" },
  { label: "平均 VC", cm: "40.80", qz: "31.00", diff: "澄迈 +9.80", note: "澄迈组更高，报告中会作为营养指标保留。" },
];

const dataRules = [
  {
    title: "样本编号",
    body: "澄迈样本使用 CM-数字，琼中样本使用 QZ-数字。上传、分析、报告留档都按这套编号追踪。",
    meta: "CM / QZ",
  },
  {
    title: "理化指标",
    body: "系统记录 SSC、TA、糖酸比和 VC。甜度、酸度和糖酸比共同影响品质分级。",
    meta: "399 记录",
  },
  {
    title: "光谱质检",
    body: "清洗报告发现 HSI 存在跨产地重复问题。这部分数据保留为质检记录，正式分析优先使用 R210、S960 和理化指标。",
    meta: "质检说明",
  },
  {
    title: "S960 波段",
    body: "S960 对齐后保留 1402 个共同波段，可与理化指标一起进入样本档案。",
    meta: "1402 bands",
  },
];

const originGallery = [
  { title: "挂果状态", image: assetPath("/origin-images/gallery-guoguo.jpg"), copy: "果面颜色、成熟度和病斑会影响采样记录。" },
  { title: "果园批次", image: assetPath("/origin-images/gallery-guoyuan.jpg"), copy: "同一批样本绑定产区、果园和采收时间。" },
  { title: "采收留样", image: assetPath("/origin-images/gallery-caishou-wide.jpg"), copy: "采收后进入编号、称量、留样和检测准备。" },
  { title: "分选检测", image: assetPath("/origin-images/gallery-fenxuan.jpg"), copy: "分选结果与理化指标一起进入品质档案。" },
];

const originReference = [
  {
    name: "赣南脐橙",
    region: "江西赣州",
    image: assetPath("/origin-images/gannan.jpg"),
    status: "扩展产区候选",
    copy:
      "赣南脐橙是国内辨识度很高的地理标志果品，品牌体系、分级包装、产销追溯都比较成熟，可作为跨区域样本库的参照产区。",
    next:
      "接入赣南样本时，同步采集光谱、理化指标和产地证明，再与海南样本分库建模，保证每个产区都有独立数据来源。",
  },
  {
    name: "富川脐橙",
    region: "广西贺州",
    image: assetPath("/origin-images/fuchuan-fixed.jpg"),
    status: "跨省对照候选",
    copy:
      "富川脐橙是华南脐橙产区的对照对象。它和海南样本同属南方柑橘产业带，但地理环境、种植管理和市场表达不同，可用于跨区域识别。",
    next:
      "接入富川样本时，记录采样季节、果园批次和检测方法，再比较它与澄迈、琼中的光谱和理化距离。",
  },
];

const sampleJourney = [
  {
    title: "采样",
    body:
      "先确定样本来自哪个产区、哪个批次。澄迈样本进入 CM 编号，琼中样本进入 QZ 编号，分析和报告沿用同一套编号。",
    meta: "CM / QZ",
  },
  {
    title: "检测",
    body:
      "每个样本保留糖度、酸度、糖酸比、VC 等理化指标，同时关联 R210、S960 等光谱文件。外观图片作为辅助记录。",
    meta: "理化 + 光谱",
  },
  {
    title: "清洗",
    body:
      "清洗阶段处理空行、空表、样本缺失和波段对齐。HSI 跨产地重复样本被单独标记，正式分析优先使用更稳定的数据表。",
    meta: "QC",
  },
  {
    title: "建库",
    body:
      "最终进入样本库的是 399 份海南共同样本。它们支撑澄迈和琼中的对照分析，也为智能分析页提供统一数据口径。",
    meta: "399 样本",
  },
];

const gradingTiers = [
  {
    name: "特选级",
    tag: "精品批次",
    threshold: "SSC ≥ 11.5 / 糖酸比 ≥ 15",
    copy: "用于礼盒、品牌展示和重点批次。判定时同步校验 SSC、糖酸比、产地匹配和字段完整度。",
    checks: ["SSC ≥ 11.5", "糖酸比 ≥ 15", "产地匹配通过", "理化字段完整"],
    tone: "from-amber-300 to-orange-500",
  },
  {
    name: "优选级",
    tag: "主力商品果",
    threshold: "SSC ≥ 10 / 糖酸比 ≥ 12",
    copy: "用于电商、商超和稳定供货批次。指标达到商品果主线，报告保留产地、指标和批次信息。",
    checks: ["SSC ≥ 10", "糖酸比 ≥ 12", "酸度处于正常区间", "批次信息完整"],
    tone: "from-emerald-300 to-lime-500",
  },
  {
    name: "标准级",
    tag: "常规流通",
    threshold: "SSC ≥ 8.5 / 糖酸比 ≥ 10",
    copy: "用于常规销售和批量分选。指标达到基础流通线，等级低于特选级和优选级。",
    checks: ["SSC ≥ 8.5", "糖酸比 ≥ 10", "基础指标达标", "常规分选"],
    tone: "from-sky-300 to-cyan-500",
  },
  {
    name: "待复检",
    tag: "人工复核",
    threshold: "字段缺失 / 指标不足 / 光谱异常",
    copy: "用于暂缓分级的样本。系统记录触发项，样本进入复采、复测或人工分拣流程。",
    checks: ["SSC < 8.5", "糖酸比 < 10", "理化字段缺失", "光谱长度不足"],
    tone: "from-rose-300 to-red-500",
  },
];

const gradingDimensions = [
  {
    title: "内在品质",
    metric: "SSC / TA / 糖酸比 / VC",
    body: "记录甜度、酸度、风味平衡和营养指标，是等级判定的核心输入。",
  },
  {
    title: "产地结果",
    metric: "CM / QZ / REVIEW",
    body: "产地匹配通过后进入完整分级；置信度不足时转入复检。",
  },
  {
    title: "流程完整度",
    metric: "编号 / 批次 / 文件",
    body: "样本编号、检测时间和上传文件相互对应，报告保留追溯链路。",
  },
  {
    title: "人工复核",
    metric: "缺失 / 异常 / 偏离",
    body: "低糖度、短光谱、字段缺失和重复样本会单独标记，进入复采、复测或人工分拣。",
  },
];

const gradingCases = [
  { id: "CM-120", origin: "澄迈福橙", ssc: "10.65", ratio: "25.61", vc: "34.08", grade: "优选级", reason: "糖度达到优选线，糖酸比明显高于阈值。" },
  { id: "QZ-1", origin: "琼中绿橙", ssc: "10.65", ratio: "22.23", vc: "31.59", grade: "优选级", reason: "甜度和糖酸比都达到优选级阈值。" },
  { id: "CM-1", origin: "澄迈福橙", ssc: "7.35", ratio: "10.65", vc: "46.57", grade: "待复检", reason: "糖度低于标准级阈值，进入复测或人工分拣。" },
];

const reviewTriggers = [
  "SSC 低于 8.5，样本进入低糖复检。",
  "糖酸比低于 10，进入糖酸比复检。",
  "上传文件缺少 SSC、TA 或糖酸比，无法生成完整分级。",
  "有效光谱波段过少，进入光谱复检。",
  "样本编号、产地标签或批次信息无法对应，标记为待确认记录。",
];

const gradingReferences = [
  {
    title: "质量分级",
    body: "参考脐橙质量分级、优质生产规程和采后商品化处理资料，将口感指标转成分级阈值。",
  },
  {
    title: "采后分选",
    body: "分级结果用于分选、包装和批次留档；外观瑕疵、损伤和成熟度保留人工分拣记录。",
  },
  {
    title: "溯源记录",
    body: "产地匹配、样本编号和检测时间随报告保存，用于采购复核和批次追踪。",
  },
];

const policyDocuments = [
  {
    category: "全国",
    title: "中华人民共和国农产品质量安全法",
    date: "2022-09-02",
    source: "中国政府网",
    type: "法律",
    theme: "质量安全",
    level: "A",
    use: "支撑质量安全、风险监测、监督抽查和检测机构边界。",
    summary: "法律层面明确农产品质量安全监管、风险监测、监督抽查和追溯要求，是网站质量链路的上位依据。",
    href: "https://www.gov.cn/xinwen/2022-09/03/content_5708127.htm",
  },
  {
    category: "全国",
    title: "农产品质量安全监测管理办法",
    date: "2022-01-07",
    source: "中国政府网",
    type: "部门规章",
    theme: "风险监测",
    level: "A",
    use: "支撑复检、风险提示和批次监测的表达边界。",
    summary: "办法规定风险监测、监督抽查和结果分析要求，可作为复检预警与质量看板的制度背景。",
    href: "https://www.gov.cn/zhengce/2022-01/07/content_5721361.htm",
  },
  {
    category: "全国",
    title: "农产品质量安全信息化追溯管理办法（试行）",
    date: "2021-11-04",
    source: "农业农村部",
    type: "部委文件",
    theme: "信息化追溯",
    level: "A",
    use: "支撑样本编号、批次记录、检测报告和追溯档案。",
    summary: "文件围绕国家追溯平台、主体责任、检测结果上传和总结分析报告提出制度要求。",
    href: "https://www.moa.gov.cn/nybgb/2021/202108/202111/t20211104_6381383.htm",
  },
  {
    category: "全国",
    title: "国家农产品质量安全追溯管理信息平台",
    date: "2017-07-02",
    source: "农业农村部农产品质量安全中心",
    type: "国家平台",
    theme: "追溯平台",
    level: "A",
    use: "支撑检测、监管、追溯和公众查询四类信息化入口。",
    summary: "国家追溯平台包含追溯、监管、监测、执法等系统，为批次信息和质量安全数据归档提供参照。",
    href: "https://www.qsst.moa.gov.cn/xxcj/",
  },
  {
    category: "全国",
    title: "农业农村部关于全面推广应用国家农产品质量安全追溯管理信息平台的通知",
    date: "2018-12-18",
    source: "农业农村部",
    type: "部委通知",
    theme: "平台应用",
    level: "A",
    use: "支撑追溯码、批次信息、交易流向和风险预警的链路设计。",
    summary: "通知说明主体注册、产品信息采集、追溯码生成、流通记录和风险预警等平台应用方式。",
    href: "https://www.moa.gov.cn/nybgb/2018/201810/201812/t20181218_6165124.htm",
  },
  {
    category: "江西",
    title: "赣深联合开展全国首批脐橙质量分级试点",
    date: "2025-11-24",
    source: "赣州市人民政府",
    type: "政府公开",
    theme: "质量分级",
    level: "A",
    use: "支撑评级标准页的等级阈值和分级试点背景。",
    summary: "资料提到《优质赣南脐橙生产技术规程》和《脐橙质量分级》团体标准，并授牌首批试点企业。",
    href: "https://www.ganzhou.gov.cn/gzszf/c100022/202511/068d6302918c43db83f9c3879e16e958.shtml",
  },
  {
    category: "江西",
    title: "江西赣州：突出绿色化、标准化、品牌化 全域打造优质脐橙生产基地",
    date: "2023-09-05",
    source: "农产品质量安全监管司",
    type: "部委资料",
    theme: "标准化与溯源",
    level: "A",
    use: "支撑采后处理、质量标准和区块链溯源链路。",
    summary: "资料提到《脐橙》国家标准、赣南脐橙相关标准、采后商品化处理规程和区块链溯源做法。",
    href: "https://jgs.moa.gov.cn/gzjb/202309/t20230905_6435871.htm",
  },
  {
    category: "江西",
    title: "赣南脐橙品牌价值连续十一年位列水果类第一",
    date: "2025-05-16",
    source: "赣州市人民政府",
    type: "政府公开",
    theme: "品牌价值",
    level: "B",
    use: "支撑扩展产区中的品牌成熟度说明。",
    summary: "资料强调赣南脐橙长期位列水果类品牌价值前列，可作为成熟产区的品牌参照。",
    href: "https://www.ganzhou.gov.cn/gzszf/c100022/202505/d62847b6c7c646c0974d347e26d4ce95.shtml",
  },
  {
    category: "广西",
    title: "今年广西富川脐橙产量可达 74.39 万吨，产值约 20.08 亿元",
    date: "2023-11-20",
    source: "农业农村部网站",
    type: "部委转载",
    theme: "产业规模",
    level: "A",
    use: "支撑富川作为跨区域样本库候选产区。",
    summary: "资料披露富川脐橙产量、产值和生产加工营销一体化情况，可作为产区规模证据。",
    href: "https://www.moa.gov.cn/xw/qg/202311/t20231120_6440872.htm",
  },
  {
    category: "海南",
    title: "地方标准 DB46/T 586-2023《地理标志产品 琼中绿橙》",
    date: "2023-01-29",
    source: "全国标准信息公共服务平台",
    type: "地方标准",
    theme: "地理标志标准",
    level: "A",
    use: "支撑琼中绿橙保护范围、产品要求和产区档案。",
    summary: "标准页面显示文件适用于地理标志产品琼中绿橙，并引用 GB/T 22440-2008《地理标志产品 琼中绿橙》。",
    href: "https://std.samr.gov.cn/db/search/stdDBDetailed?id=FDDAEDE8CE964843E05397BE0A0A208D",
  },
  {
    category: "海南",
    title: "为“琼中绿橙”品牌保驾护航",
    date: "2017-11-16",
    source: "农业农村部网站",
    type: "部委转载",
    theme: "地理标志与追溯",
    level: "A",
    use: "支撑琼中绿橙的统一包装、二维码溯源和授权经销说明。",
    summary: "资料提到地理标志、统一包装、二维码溯源、果径规格和授权经销，是琼中绿橙资料链的核心来源。",
    href: "https://www.moa.gov.cn/xw/qg/201805/t20180529_6144035.htm",
  },
  {
    category: "海南",
    title: "我省地理标志产品达 116 个",
    date: "2022-09-15",
    source: "海南省人民政府",
    type: "政府公开",
    theme: "地理标志底座",
    level: "A",
    use: "支撑海南特色农产品和地理标志基础盘。",
    summary: "资料披露海南地理标志产品数量、用标主体增长和乡村振兴成效，可作为海南区域品牌背景。",
    href: "https://www.hainan.gov.cn/hainan/5309/202209/1fa2151fdc804c4bbd922df44fd134b2.shtml",
  },
  {
    category: "海南",
    title: "海南澄迈：绘就产业品牌“名片” 打造乡村振兴“引擎”",
    date: "2023-12-14",
    source: "海南省农业农村厅转载",
    type: "省级转载",
    theme: "产业品牌",
    level: "B",
    use: "支撑澄迈福橙和澄迈农业品牌矩阵。",
    summary: "资料呈现澄迈特色农业、品牌矩阵和县域农业名片建设，可作为澄迈产区专题背景。",
    href: "https://agri.hainan.gov.cn/hnsnyt/ywdt/zwdt/202312/t20231214_3550095.html",
  },
  {
    category: "海南",
    title: "澄迈地理标志保护继续升级",
    date: "2025-12",
    source: "海南省人民政府",
    type: "政府公开",
    theme: "地理标志保护",
    level: "A",
    use: "支撑澄迈福橙等地理标志产品的保护和产区展示。",
    summary: "公开信息显示澄迈获批国家地理标志保护示范区，福橙等优势产业进入保护体系。",
    href: "https://www.hainan.gov.cn/hainan/sxian/202512/5d0b76bd8df846fea38108fa20d72ce5.shtml",
  },
  {
    category: "海南",
    title: "澄迈深入推进地理标志运用促进工程，助推产业增效农民增收",
    date: "2024-03-29",
    source: "海南省人民政府",
    type: "政府公开",
    theme: "地理标志工程",
    level: "A",
    use: "支撑澄迈地理标志保护和产业增效链路。",
    summary: "资料将地理标志运用与产业增效、农民增收挂钩，可作为澄迈品牌建设依据。",
    href: "https://www.hainan.gov.cn/hainan/sxian/202403/54a0a73da02f4475a6fbea560f9156db.shtml",
  },
  {
    category: "研究",
    title: "柑橘真实性溯源技术持续扩展",
    date: "2023",
    source: "现代食品科技",
    type: "学术综述",
    theme: "真实性溯源",
    level: "B",
    use: "支撑光谱、代谢组、多元素等技术可用于产地真实性研究。",
    summary: "综述梳理稳定同位素、多元素、代谢组、风味物质和光谱分析在柑橘真实性溯源中的应用。",
    href: "https://xdspkj.ijournals.cn/xdspkj/article/html/20231243?st=search",
  },
];

const policyCategories = ["全国", "海南", "江西", "广西", "研究"] as const;

const policyReviewRules = [
  {
    title: "来源门槛",
    body: "法律、部门规章、政府公开、标准平台和学术期刊进入核心层；产业报道只作为背景层。",
    meta: "A/B",
  },
  {
    title: "用途标注",
    body: "每条资料标明服务页面：评级标准、产区档案、追溯链路、复检规则或技术原理。",
    meta: "Use",
  },
  {
    title: "范围控制",
    body: "公开资料说明规则来源；样本均值、模型结果和复检状态按项目数据归档。",
    meta: "Scope",
  },
];

const policySignals = [
  { label: "法规与监管", value: "5", text: "质量安全法、监测办法和国家追溯平台构成上位依据。" },
  { label: "地理标志", value: "5", text: "琼中、澄迈和海南省级资料支撑产区身份与品牌保护。" },
  { label: "分级与产业", value: "4", text: "赣南、富川资料对应分级试点、标准化生产和产区规模。" },
  { label: "技术研究", value: "1", text: "真实性溯源综述支撑光谱、代谢组等技术路线说明。" },
];

const dashboardStats = [
  { title: "真实训练样本", value: `${dashboardModelMetrics.trainingSamples}`, note: "R210 建模样本库", icon: Target, tone: "sky" },
  { title: "R210 有效波段", value: `${dashboardModelMetrics.wavelengthCount}`, note: `${Math.round(dashboardModelMetrics.wavelengthMin)}-${Math.round(dashboardModelMetrics.wavelengthMax)} nm`, icon: MapPin, tone: "orange" },
  { title: "产地模型准确率", value: `${(dashboardModelMetrics.originAccuracy * 100).toFixed(2)}%`, note: `展示置信度固定 ${dashboardModelMetrics.displayedConfidence}%`, icon: TriangleAlert, tone: "rose" },
  { title: "糖度回归 RMSE", value: dashboardModelMetrics.sugarRmse.toFixed(2), note: `R2 ${dashboardModelMetrics.sugarR2.toFixed(3)} / RPD ${dashboardModelMetrics.sugarRpd.toFixed(2)}`, icon: Activity, tone: "emerald" },
];

const recentDetections = dashboardSamples.map((item) => ({
  id: item.id,
  origin: item.originName,
  ssc: item.ssc.toFixed(2),
  ratio: item.ratio.toFixed(2),
  model: item.model,
  status: item.status,
  time: dashboardModelMetrics.modelVersion,
}));

const modelEvidence = [
  { title: "输入层", metric: "HSI / R210 / S960", description: "不同设备与波段文件进入同一套样本档案，先完成波段校验和预处理。" },
  { title: "判别层", metric: "产地分类 + 置信度", description: "模型先判断样本更接近哪个产区中心，再把低置信度或特征偏移样本标出。" },
  { title: "回归层", metric: "SSC / TA / 糖酸比 / VC", description: "光谱特征映射到理化指标，和样本分级规则一起生成结论。" },
  { title: "处置层", metric: "通过 / 复检 / 留档", description: "结果不只展示数值，还要告诉用户这个样本下一步应该进哪个流程。" },
];

const classificationModels = [
  { name: "1D-CNN", usage: "光谱序列分类", status: "前端已接入", evidence: "需补训练集划分与混淆矩阵" },
  { name: "SVM", usage: "小样本对照", status: "离线对照", evidence: "需补参数与验证批次" },
  { name: "PLS-DA", usage: "线性判别基线", status: "离线对照", evidence: "需补变量筛选记录" },
  { name: "Random Forest", usage: "非线性对照", status: "离线对照", evidence: "需补特征重要性来源" },
];

const regressionModels = [
  { name: "1D-CNN-Reg", usage: "SSC / TA 回归", status: "规则页待接", evidence: "需补 R2、RMSE 与测试集" },
  { name: "PLSR", usage: "理化指标基线", status: "离线对照", evidence: "需补建模波段范围" },
  { name: "SVR", usage: "非线性回归", status: "离线对照", evidence: "需补核函数与调参记录" },
  { name: "XGBoost", usage: "表格特征回归", status: "离线对照", evidence: "需补输入字段清单" },
];

const wavelengths = Array.from({ length: 12 }, (_, index) => 520 + index * 30);
const featureImportanceData = [0.12, 0.16, 0.2, 0.32, 0.58, 0.64, 0.26, 0.18, 0.14, 0.48, 0.62, 0.22];

const coreTechCards = [
  {
    title: "高光谱成像采集",
    icon: Camera,
    accent: "bg-orange-300/16 text-orange-100 ring-1 ring-orange-300/22",
    description: "设备不是只拍一张普通照片，而是连续采集多个窄波段反射率，形成样本在空间维度与光谱维度上的联合数据。",
    bullets: ["保留果皮纹理、色泽与组织差异", "记录不同波段下的反射强弱变化", "为后续产地识别与品质预测提供基础输入"],
  },
  {
    title: "光谱校正与预处理",
    icon: ScanLine,
    accent: "bg-emerald-300/16 text-emerald-100 ring-1 ring-emerald-300/22",
    description: "原始高光谱数据会受到光照、设备状态和背景区域干扰，因此需要先完成校正、分割和归一化，再进入建模阶段。",
    bullets: ["黑白板校正降低环境光影响", "样本区域分割去除背景噪声", "平滑、归一化与特征压缩提升稳定性"],
  },
  {
    title: "特征提取与模型学习",
    icon: Cpu,
    accent: "bg-sky-300/16 text-sky-100 ring-1 ring-sky-300/22",
    description: "系统会从带理化标签的样本中学习光谱特征和真实指标之间的映射关系，让模型具备分类与回归两类能力。",
    bullets: ["分类模型识别产地与样本类别", "回归模型预测 SSC、TA、糖酸比等指标", "通过训练集与验证集控制泛化误差"],
  },
  {
    title: "结果生成与异常预警",
    icon: ShieldCheck,
    accent: "bg-amber-300/16 text-amber-100 ring-1 ring-amber-300/22",
    description: "模型推理完成后，系统会把结果组织成可展示页面，同时对偏离常见分布的样本进行标记，辅助复检与复核。",
    bullets: ["输出产地判断与关键品质指标", "给出异常点提示与复检建议", "支持图表、卡片和报告式展示"],
  },
] as const;

const workflowSteps = [
  ["01", "样本采集", "采集柑橘样本的高光谱图像，并同步建立对应理化标签。"],
  ["02", "数据预处理", "完成校正、去噪、背景剔除和有效区域提取，得到可用光谱数据。"],
  ["03", "特征建模", "提取关键波段特征，训练分类与回归模型，建立样本与指标之间的关系。"],
  ["04", "推理输出", "对新样本进行识别与预测，输出产地结果、品质指标和预警信息。"],
  ["05", "结果展示", "将分析结果组织为图表、卡片和说明文本，方便展示、对比和复核。"],
] as const;

const metricCards = [
  {
    title: "产地识别",
    icon: Database,
    description: "通过比较样本在特征空间中的分布位置，判断其更接近哪一类产区模式，用于辅助溯源与真实性判别。",
  },
  {
    title: "品质预测",
    icon: BarChart3,
    description: "结合光谱特征估计糖度、酸度、糖酸比和维生素 C 等指标，用无损方式反映果实内部品质。",
  },
  {
    title: "可解释输出",
    icon: FileText,
    description: "不仅输出结论，也同步展示关键图表、指标变化与异常提示，让分析结果更容易理解和汇报。",
  },
] as const;

const principleExplainers = [
  {
    title: "为什么高光谱能看出内部差异",
    body:
      "普通 RGB 图像只记录三个颜色通道，而高光谱成像会连续记录数十到数百个波段的反射信息。不同糖分、水分、色素和组织结构，对各波段光的吸收与反射方式并不相同，因此会留下具有区分度的光谱曲线。",
    extra:
      "在柑橘场景中，果皮色素、细胞结构、水分含量和内部可溶性固形物变化，都会在特定波段范围内产生差异。这使得高光谱数据不仅能看外观，还能间接反映内部品质状态。",
    icon: BrainCircuit,
  },
  {
    title: "模型如何同时做分类与回归",
    body:
      "系统把带标签样本划分为训练集与验证集，通过分类模型学习不同产地之间的特征边界，通过回归模型学习光谱与理化指标之间的连续映射关系。",
    extra:
      "在部署阶段，同一份样本数据可以同时送入不同任务模型，得到产地类别、置信度、糖度、酸度和异常提示等多维输出，再统一组织到可视化界面中。",
    icon: Network,
  },
] as const;

const radarOption = {
  backgroundColor: "transparent",
  tooltip: {
    backgroundColor: "rgba(5, 8, 7, 0.96)",
    borderColor: "rgba(255,255,255,0.12)",
    textStyle: { color: "#fff" },
  },
  radar: {
    indicator: dashboardReadinessRadar.map((item) => ({ name: item.label, max: 100 })),
    splitArea: {
      areaStyle: {
        color: [
          "rgba(255, 247, 237, 0.16)",
          "rgba(237, 242, 233, 0.14)",
          "rgba(255, 237, 213, 0.12)",
          "rgba(255, 255, 255, 0.06)",
        ],
      },
    },
    axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.2)" } },
    splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.16)" } },
    axisName: { color: "rgba(255,255,255,0.84)" },
  },
  series: [
    {
      name: "真实模型就绪度",
      type: "radar",
      data: [
        {
          value: dashboardReadinessRadar.map((item) => item.value),
          name: "R210 v1(%)",
          itemStyle: { color: "#EA580C" },
          areaStyle: { color: "rgba(234, 88, 12, 0.28)" },
        },
      ],
    },
  ],
};

const barOption = {
  backgroundColor: "transparent",
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(5, 8, 7, 0.96)",
    borderColor: "rgba(255,255,255,0.12)",
    textStyle: { color: "#fff" },
  },
  grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
  xAxis: {
    type: "category",
    data: dashboardMetricCategories,
    axisLine: { lineStyle: { color: "rgba(255,255,255,0.22)" } },
    axisLabel: { color: "rgba(255,255,255,0.84)", interval: 0 },
  },
  yAxis: {
    type: "value",
    name: "样本指标",
    nameTextStyle: { color: "rgba(255,255,255,0.74)" },
    splitLine: { lineStyle: { color: "rgba(255,255,255,0.16)", type: "dashed" } },
    axisLabel: { color: "rgba(255,255,255,0.82)" },
  },
  series: [
    {
      name: "CM-120",
      type: "bar",
      data: dashboardMetricSeries.CM,
      itemStyle: {
        color: "#F97316",
        borderRadius: [6, 6, 0, 0],
      },
    },
    {
      name: "QZ-1",
      type: "bar",
      data: dashboardMetricSeries.QZ,
      itemStyle: {
        color: "#22C55E",
        borderRadius: [6, 6, 0, 0],
      },
    },
  ],
};

const scatterOption = {
  backgroundColor: "transparent",
  title: {
    text: "真实光谱特征点位",
    left: "center",
    textStyle: { color: "rgba(255,255,255,0.82)", fontSize: 16, fontWeight: "normal" },
  },
  tooltip: {
    trigger: "item",
    formatter(params: { seriesName: string; value: number[] }) {
      return `${params.seriesName}<br/>901-1100nm 均值: ${params.value[0].toFixed(4)}<br/>1300-1701nm 均值: ${params.value[1].toFixed(4)}`;
    },
  },
  legend: { bottom: 0, textStyle: { color: "rgba(255,255,255,0.64)" } },
  xAxis: {
    name: "短波段反射均值",
    splitLine: { show: false },
    axisLine: { lineStyle: { color: "rgba(255,255,255,0.18)" } },
    axisLabel: { color: "rgba(255,255,255,0.72)" },
  },
  yAxis: {
    name: "近红外反射均值",
    splitLine: { show: false },
    axisLine: { lineStyle: { color: "rgba(255,255,255,0.18)" } },
    axisLabel: { color: "rgba(255,255,255,0.72)" },
  },
  series: dashboardFeaturePoints.map((point) => ({
    name: `${point.id} ${point.originName}`,
    type: "scatter",
    symbolSize: 18,
    data: [[point.shortWaveMean, point.nirMean]],
    itemStyle: { color: point.color },
  })),
};

const trendOption = {
  backgroundColor: "transparent",
  tooltip: { trigger: "axis" },
  legend: {
    data: ["CM-120 反射率", "QZ-1 反射率"],
    textStyle: { color: "rgba(255,255,255,0.66)" },
  },
  grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: dashboardSpectrumProfile.labels,
    axisLine: { lineStyle: { color: "rgba(255,255,255,0.18)" } },
    axisLabel: { color: "rgba(255,255,255,0.72)" },
  },
  yAxis: {
    type: "value",
    name: "反射率",
    axisLine: { show: true, lineStyle: { color: "#F97316" } },
    splitLine: { lineStyle: { color: "rgba(255,255,255,0.12)", type: "dashed" } },
    axisLabel: { color: "rgba(255,255,255,0.72)" },
  },
  series: [
    {
      name: "CM-120 反射率",
      type: "line",
      smooth: true,
      data: dashboardSpectrumProfile.cm,
      itemStyle: { color: "#F97316" },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(249, 115, 22, 0.24)" },
          { offset: 1, color: "rgba(249, 115, 22, 0.04)" },
        ]),
      },
    },
    {
      name: "QZ-1 反射率",
      type: "line",
      smooth: true,
      data: dashboardSpectrumProfile.qz,
      itemStyle: { color: "#16A34A" },
    },
  ],
};

const featureImportanceOption = {
  backgroundColor: "transparent",
  tooltip: { trigger: "axis" },
  grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
  xAxis: {
    type: "category",
    name: "波长 (nm)",
    data: wavelengths,
    axisLine: { lineStyle: { color: "rgba(255,255,255,0.18)" } },
    axisLabel: { color: "rgba(255,255,255,0.68)" },
  },
  yAxis: {
    type: "value",
    name: "特征贡献度",
    splitLine: { lineStyle: { color: "rgba(255,255,255,0.12)", type: "dashed" } },
    axisLabel: { color: "rgba(255,255,255,0.68)" },
  },
  series: [
    {
      name: "贡献度",
      type: "bar",
      data: featureImportanceData,
      itemStyle: {
        color(params: { value: number }) {
          return params.value > 0.4 ? "#EA580C" : "#FDBA74";
        },
      },
    },
  ],
};

const tabs: TabConfig[] = [
  {
    id: "home",
    label: "首页",
    icon: Home,
    eyebrow: "ORANGE SPECTRUM",
    title: "橙源智鉴——看见每一颗柑橘的来处与品质",
    description:
      "围绕海南柑橘样本，连接光谱采集、产地识别、品质分级和复检留档，让每一次检测都有来源、有指标、有记录。",
    stats: [
      { label: "样本库", value: "399" },
      { label: "海南产区", value: "2" },
      { label: "检测链路", value: "4 步" },
    ],
    cards: [
      { title: "检测对象", body: "面向海南柑橘样本，覆盖澄迈福橙与琼中绿橙。", meta: "CM 199 / QZ 200" },
      { title: "工作流程", body: "上传光谱文件后，系统生成产地匹配、品质分级和复检结论。", meta: "CSV / TXT" },
      { title: "复检规则", body: "置信度不足或理化字段缺失的样本，会进入人工复核队列。", meta: "人工复核" },
    ],
  },
  {
    id: "origins",
    label: "产品品种",
    icon: MapPin,
    eyebrow: "产区档案",
    title: "海南双产区样本库：澄迈福橙 × 琼中绿橙",
    description:
      "系统围绕澄迈福橙和琼中绿橙建库。每个样本都保留产地编号、理化指标和光谱文件，用同一套口径比较风味差异和检测结果。",
    stats: [
      { label: "共同样本", value: "399" },
      { label: "澄迈 / 琼中", value: "199 / 200" },
      { label: "S960 共同波段", value: "1402" },
    ],
    cards: [
      { title: "澄迈福橙", body: "199 份样本，VC 和酸度均值更高，可建立澄迈产区基础档案。", meta: "CM" },
      { title: "琼中绿橙", body: "200 份样本，SSC 和糖酸比均值更高，可作为琼中产区对照档案。", meta: "QZ" },
      { title: "统计范围", body: "当前 399 份样本只包含澄迈和琼中，扩展产区单独建库。", meta: "QC" },
    ],
  },
  {
    id: "grading",
    label: "评级标准",
    icon: ShieldCheck,
    eyebrow: "QUALITY RULES",
    title: "品质分级与复检规则",
    description:
      "系统同时查看 SSC、糖酸比、酸度和字段完整度。达到阈值的样本进入分级，缺失或异常样本进入复检。",
    stats: [
      { label: "特选级", value: "SSC ≥ 11.5" },
      { label: "优选级", value: "SSC ≥ 10" },
      { label: "复检线", value: "SSC < 8.5" },
    ],
    cards: [
      { title: "特选级", body: "SSC 与糖酸比同时达标，样本可进入高等级果品记录。", meta: "高糖酸比" },
      { title: "标准级", body: "指标达到基础阈值，样本进入常规批次流转。", meta: "稳定规则" },
      { title: "复检队列", body: "字段缺失、短光谱、低糖度或糖酸比不足时，样本进入复检队列。", meta: "复检队列" },
    ],
  },
  {
    id: "policy",
    label: "政策资料",
    icon: FileText,
    eyebrow: "REFERENCE DESK",
    title: "政策资料与标准依据",
    description:
      "集中整理政策、标准和公开资料，标明来源、时间和适用范围，用于核对分级规则。",
    stats: [
      { label: "资料类型", value: "政策 / 标准" },
      { label: "用途", value: "依据说明" },
      { label: "状态", value: "持续更新" },
    ],
    cards: [
      { title: "标准参考", body: "整理柑橘质量分级、采后处理和品牌建设相关资料。", meta: "资料留档" },
      { title: "适用范围", body: "公开资料用于说明规则来源，实际判定仍以检测结果和复检记录为准。", meta: "范围说明" },
      { title: "资料更新", body: "海南本地农业政策、行业标准和检测规范会按来源持续归档。", meta: "来源管理" },
    ],
  },
  {
    id: "analysis",
    label: "智能分析",
    icon: FlaskConical,
    eyebrow: "ANALYSIS BENCH",
    title: "上传光谱文件，输出产地、分级和复检意见",
    description:
      "上传 CSV 或 TXT 光谱文件后，系统检查字段、波段数量和理化指标，再生成产地、分级和复检结论。",
    stats: [
      { label: "格式", value: "CSV / TXT" },
      { label: "字段", value: "SSC / TA" },
      { label: "报告", value: "MD" },
    ],
    cards: [
      { title: "上传校验", body: "先检查文件格式、波段数量和可识别理化列。", meta: "格式检查" },
      { title: "本地推理", body: "产地置信度不足、光谱过短或字段缺失时，结果标记为待复检。", meta: "复检标记" },
      { title: "报告留档", body: "输出光谱曲线、指标结果、分级结论和复检意见。", meta: "证据链" },
    ],
  },
  {
    id: "dashboard",
    label: "数据看板",
    icon: BarChart3,
    eyebrow: "BATCH DASHBOARD",
    title: "用同一数据口径查看样本库与最近批次",
    description:
      "看板区分总样本库、最近记录、复检率和趋势口径，用于快速查看样本状态。",
    stats: [
      { label: "总样本库", value: "399" },
      { label: "最近记录", value: "10" },
      { label: "复检率", value: "阈值计算" },
    ],
    cards: [
      { title: "产地分布", body: "CM=199，QZ=200，样本来源和数量单独列出。", meta: "n=399" },
      { title: "批次趋势", body: "查看近批次糖度、酸度和糖酸比变化。", meta: "2026-04" },
      { title: "复检原因", body: "光谱偏离、字段缺失、SSC 或糖酸比不足会分别记录。", meta: "风险队列" },
    ],
  },
  {
    id: "model",
    label: "技术原理",
    icon: BookOpen,
    eyebrow: "MODEL EVIDENCE",
    title: "光谱识别与模型流程",
    description:
      "从光谱预处理到产地识别、品质预测，技术页展示输入、输出、模型状态和验证材料。",
    stats: [
      { label: "输入", value: "光谱序列" },
      { label: "输出", value: "产地 / 分级" },
      { label: "证据", value: "验证材料" },
    ],
    cards: [
      { title: "光谱预处理", body: "从原始波段中提取有效序列，保留异常和缺失提示。", meta: "R210 / S960" },
      { title: "模型接入", body: "记录 1D-CNN、SVM、PLS-DA 等模型在产地识别和品质预测中的用途。", meta: "模型清单" },
      { title: "验证材料", body: "训练集划分、混淆矩阵、R2、RMSE 和模型版本统一归档。", meta: "可信度" },
    ],
  },
];

const navDelays = [0, 80, 140, 200, 260, 320, 380];

function Workspace({ tab }: { tab: TabConfig }) {
  if (tab.id === "origins") {
    return <OriginWorkspace tab={tab} />;
  }

  if (tab.id === "grading") {
    return <GradingWorkspace tab={tab} />;
  }

  if (tab.id === "policy") {
    return <PolicyWorkspace tab={tab} />;
  }

  if (tab.id === "dashboard") {
    return <DashboardWorkspace tab={tab} />;
  }

  if (tab.id === "model") {
    return <ModelWorkspace tab={tab} />;
  }

  if (tab.id === "analysis") {
    return <AnalysisWorkspace tab={tab} />;
  }

  return (
    <div key={tab.id} className="workspace-panel panel-fade-in w-full rounded-[24px] p-4 sm:p-5 lg:p-6">
      <div className="grid gap-5 lg:grid-cols-[1.05fr_1.35fr] lg:items-stretch">
        <div className="flex flex-col justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-400/12 px-3 py-1 text-xs font-bold tracking-[0.22em] text-orange-100">
              <Layers3 size={14} />
              {tab.eyebrow}
            </div>
            <h2 className="hero-readable max-w-3xl text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl lg:text-5xl">
              {tab.title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">{tab.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {tab.stats.map((item) => (
              <div key={item.label} className="data-card rounded-2xl px-3 py-3">
                <div className="text-[11px] font-semibold text-white/48">{item.label}</div>
                <div className="mt-1 text-sm font-bold text-white sm:text-base">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
          {tab.cards.map((card, index) => (
            <div key={card.title} className="data-card rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-base font-semibold text-white">{card.title}</div>
                <div className="rounded-full border border-white/12 bg-white/8 px-2 py-1 text-[11px] font-semibold text-white/58">
                  {card.meta}
                </div>
              </div>
              <p className="text-sm leading-6 text-white/68">{card.body}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-300 via-emerald-300 to-sky-300"
                  style={{ width: `${70 + index * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalysisWorkspace({ tab }: { tab: TabConfig }) {
  const [mode, setMode] = useState<AnalysisMode>("single");
  const [step, setStep] = useState<AnalysisStep>("upload");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState(analysisProgressSteps[0]);
  const [slotA, setSlotA] = useState<AnalysisSlot>(emptyAnalysisSlot);
  const [slotB, setSlotB] = useState<AnalysisSlot>(emptyAnalysisSlot);
  const [reportText, setReportText] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [aiSummaryState, setAiSummaryState] = useState<"idle" | "local" | "loading" | "ready" | "error">("idle");
  const [aiSummaryError, setAiSummaryError] = useState("");
  const [realModel, setRealModel] = useState<RealAnalysisModelArtifact | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const analysisRunIdRef = useRef(0);

  const canAnalyze = mode === "single" ? Boolean(slotA.spectrum) : Boolean(slotA.spectrum && slotB.spectrum);
  const metricsA = metricsForAnalysis(slotA.origin, slotA);
  const metricsB = metricsForAnalysis(slotB.origin, slotB);
  const spectrumA = slotA.spectrum ?? analysisSpectrumCM;
  const spectrumB = slotB.spectrum ?? analysisSpectrumQZ;
  const spectrumAxis =
    realModel && (slotA.realResult?.modelReady || slotB.realResult?.modelReady)
      ? realModel.wavelengths.map((wavelength) => Math.round(wavelength))
      : analysisWavelengths;
  const hasResult = step === "done";
  const aiEndpointConfigured = Boolean(import.meta.env.VITE_AI_REPORT_ENDPOINT);
  const resultMetrics = metricsA;
  const compareResultCards: Array<{ label: string; metrics: AnalysisMetrics; tone: string }> = [
    { label: "样本 A", metrics: metricsA, tone: "border-orange-200/18 bg-orange-300/10" },
    { label: "样本 B", metrics: metricsB, tone: "border-emerald-200/18 bg-emerald-300/10" },
  ];
  const formatDelta = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
  const compareSummaryRows = [
    ["SSC 差值", metricsA.qualityReady && metricsB.qualityReady ? `B-A ${formatDelta(metricsB.ssc - metricsA.ssc)}` : "缺失"],
    ["糖酸比差值", metricsA.ratio && metricsB.ratio ? `B-A ${formatDelta(metricsB.ratio - metricsA.ratio)}` : "未实测"],
  ];
  const compareHasReview = compareResultCards.some(({ metrics }) => metrics.grade === "待复检");
  const compareReviewText =
    compareResultCards
      .map(({ label, metrics }) => (metrics.reviewReason ? `${label}：${metrics.reviewReason}` : null))
      .filter(Boolean)
      .join("；") || "两个样本字段完整，产地和品质结论可以进入报告留档。";
  const resultModelVersion = mode === "compare" ? metricsA.modelVersion ?? metricsB.modelVersion : resultMetrics.modelVersion;
  const resultPassed = hasResult && (mode === "compare" ? !compareHasReview : resultMetrics.grade !== "待复检");

  const spectrumOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(5, 8, 7, 0.96)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#fff" },
      },
      legend: mode === "compare" ? { top: 0, textStyle: { color: "rgba(255,255,255,0.72)" } } : undefined,
      grid: { top: mode === "compare" ? 34 : 16, left: 42, right: 16, bottom: 34 },
      xAxis: {
        type: "category",
        data: spectrumAxis,
        axisLabel: { color: "rgba(255,255,255,0.5)", fontSize: 10, interval: 17 },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.16)" } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "rgba(255,255,255,0.5)", fontSize: 10 },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)", type: "dashed" } },
      },
      series:
        mode === "single"
          ? [
              {
                name: slotA.fileName ? "样本 A 光谱" : "示例光谱",
                type: "line",
                smooth: true,
                symbol: "none",
                data: spectrumA,
                lineStyle: { width: 2.4, color: slotA.origin === "QZ" ? "#6ee7b7" : "#fb923c" },
                areaStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: slotA.origin === "QZ" ? "rgba(110,231,183,0.22)" : "rgba(251,146,60,0.22)" },
                    { offset: 1, color: "rgba(255,255,255,0)" },
                  ]),
                },
              },
            ]
          : [
              { name: "样本 A", type: "line", smooth: true, symbol: "none", data: spectrumA, lineStyle: { width: 2, color: "#fb923c" } },
              { name: "样本 B", type: "line", smooth: true, symbol: "none", data: spectrumB, lineStyle: { width: 2, color: "#6ee7b7" } },
            ],
    }),
    [mode, slotA.fileName, slotA.origin, spectrumA, spectrumB, spectrumAxis],
  );

  const metricOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(5, 8, 7, 0.96)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#fff" },
      },
      grid: { top: 18, left: 38, right: 12, bottom: 32 },
      xAxis: {
        type: "category",
        data: ["SSC", "TA x10", "糖酸比", "VC/10"],
        axisLabel: { color: "rgba(255,255,255,0.58)", fontSize: 10 },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.14)" } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "rgba(255,255,255,0.48)", fontSize: 10 },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)", type: "dashed" } },
      },
      series:
        mode === "compare"
          ? [
              { name: "样本 A", type: "bar", barWidth: "26%", data: [metricsA.ssc, metricsA.ta * 10, metricsA.ratio, metricsA.vc / 10], itemStyle: { color: "#fb923c", borderRadius: [6, 6, 0, 0] } },
              { name: "样本 B", type: "bar", barWidth: "26%", data: [metricsB.ssc, metricsB.ta * 10, metricsB.ratio, metricsB.vc / 10], itemStyle: { color: "#6ee7b7", borderRadius: [6, 6, 0, 0] } },
            ]
          : [
              {
                name: "样本 A",
                type: "bar",
                barWidth: "42%",
                data: [metricsA.ssc, metricsA.ta * 10, metricsA.ratio, metricsA.vc / 10],
                itemStyle: {
                  borderRadius: [6, 6, 0, 0],
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: "#fed7aa" },
                    { offset: 1, color: "#f97316" },
                  ]),
                },
              },
            ],
    }),
    [metricsA, metricsB, mode],
  );

  const clearProgressTimer = () => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const resetRunState = () => {
    analysisRunIdRef.current += 1;
    clearProgressTimer();
    setStep("upload");
    setProgress(0);
    setProgressLabel(analysisProgressSteps[0]);
    setReportText("");
    setAiSummary("");
    setAiSummaryState("idle");
    setAiSummaryError("");
  };

  const resetAnalysis = () => {
    resetRunState();
    setSlotA({ ...emptyAnalysisSlot });
    setSlotB({ ...emptyAnalysisSlot });
  };

  useEffect(() => {
    let active = true;
    loadRealAnalysisModel().then((model) => {
      if (active) setRealModel(model);
    });
    return () => {
      active = false;
      clearProgressTimer();
    };
  }, []);

  const loadExample = (slot: "A" | "B", origin: Exclude<AnalysisOrigin, "REVIEW">) => {
    const base = dashboardSampleByOrigin[origin];
    const next: AnalysisSlot = {
      fileName: origin === "CM" ? "示例_澄迈福橙_CM-120.csv" : "示例_琼中绿橙_QZ-1.csv",
      spectrum: origin === "CM" ? analysisSpectrumCM : analysisSpectrumQZ,
      origin,
      message: "已载入示例样本，可直接查看完整分析链路。",
      source: "sample",
      parsedMetrics: { ssc: base.ssc, ta: base.ta, ratio: base.ratio, vc: base.vc },
      qualityReady: true,
    };
    if (slot === "A") setSlotA(next);
    else setSlotB(next);
    resetRunState();
  };

  const handleUpload = (slot: "A" | "B", file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "txt"].includes(ext)) {
      const next: AnalysisSlot = {
        fileName: file.name,
        spectrum: null,
        origin: "REVIEW",
        message: "当前页面只解析 CSV/TXT。Excel、HDR、原始 ENVI 文件需要先导出为文本数值表后再上传。",
        source: "upload",
        qualityReady: false,
      };
      if (slot === "A") setSlotA(next);
      else setSlotB(next);
      resetRunState();
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result ?? "");

      const sampleGroups = mode === "compare" ? splitAnalysisSampleGroups(text) : [];
      if (sampleGroups.length >= 2) {
        setSlotA(buildUploadedAnalysisSlot(`${file.name} · ${sampleGroups[0].sampleId}`, sampleGroups[0].text, realModel));
        setSlotB(buildUploadedAnalysisSlot(`${file.name} · ${sampleGroups[1].sampleId}`, sampleGroups[1].text, realModel));
        resetRunState();
        return;
      }

      const next = buildUploadedAnalysisSlot(file.name, text, realModel);
      if (slot === "A") setSlotA(next);
      else setSlotB(next);
      resetRunState();
    };
    reader.readAsText(file, "utf-8");
  };

  const startAnalysis = () => {
    if (!canAnalyze || step === "running") return;
    clearProgressTimer();
    setStep("running");
    setProgress(0);
    setReportText("");
    let currentStep = 0;
    const runId = (analysisRunIdRef.current += 1);
    setProgressLabel(analysisProgressSteps[0]);

    progressTimerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (analysisRunIdRef.current !== runId) return prev;
        const next = Math.min(100, prev + 2.8);
        const nextStep = Math.min(analysisProgressSteps.length - 1, Math.floor((next / 100) * analysisProgressSteps.length));
        if (nextStep !== currentStep) {
          currentStep = nextStep;
          setProgressLabel(analysisProgressSteps[nextStep]);
        }
        if (next >= 100) {
          clearProgressTimer();
          if (analysisRunIdRef.current === runId) {
            setStep("done");
            setReportText(buildAnalysisReport(mode, metricsA, mode === "compare" ? metricsB : undefined));
            setAiSummary("");
            setAiSummaryState("idle");
            setAiSummaryError("");
          }
        }
        return next;
      });
    }, 38);
  };

  const exportReport = () => {
    if (!hasResult || !reportText) return;
    const text = reportText;
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chengyuan-analysis-report.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  const summarizeReport = async () => {
    if (!hasResult || !reportText || aiSummaryState === "loading") return;
    const payload = {
      mode,
      reportText,
      sampleA: metricsA,
      sampleB: mode === "compare" ? metricsB : undefined,
    };

    if (!aiEndpointConfigured) {
      setAiSummary(buildLocalAiReportSummary(payload));
      setAiSummaryState("local");
      setAiSummaryError("DeepSeek 代理未配置，当前显示本地规则总结。");
      return;
    }

    setAiSummaryState("loading");
    setAiSummaryError("");
    try {
      const result = await requestAiReportSummary(payload);
      setAiSummary(result.summary);
      setAiSummaryState("ready");
    } catch (error) {
      setAiSummary(buildLocalAiReportSummary(payload));
      setAiSummaryState("error");
      setAiSummaryError(error instanceof Error ? error.message : "AI 总结失败，已切换本地规则总结。");
    }
  };

  const renderSlot = (slot: "A" | "B", data: AnalysisSlot) => (
    <article className="analysis-slot rounded-[22px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-[0.18em] text-orange-200/72">SAMPLE {slot}</div>
          <h3 className="mt-2 text-lg font-semibold text-white">{data.fileName ?? "等待 CSV / TXT 文件"}</h3>
          <p className="mt-2 text-sm leading-6 text-white/58">{data.message ?? "可上传本地光谱表，也可以先载入示例样本验证完整流程。"}</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${data.origin === "REVIEW" ? "bg-rose-400/14 text-rose-100" : "bg-emerald-400/14 text-emerald-100"}`}>
          {data.origin === "CM" ? "澄迈" : data.origin === "QZ" ? "琼中" : "复检"}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <label className="analysis-action cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-white">
          <input
            className="hidden"
            type="file"
            accept=".csv,.txt"
            onClick={(event) => {
              event.currentTarget.value = "";
            }}
            onChange={(event) => event.target.files?.[0] && handleUpload(slot, event.target.files[0])}
          />
          <span className="flex items-center gap-2"><Upload size={16} /> 上传文件</span>
        </label>
        <button className="analysis-action rounded-full px-4 py-2 text-sm font-semibold text-white" onClick={() => loadExample(slot, "CM")}>澄迈示例</button>
        <button className="analysis-action rounded-full px-4 py-2 text-sm font-semibold text-white" onClick={() => loadExample(slot, "QZ")}>琼中示例</button>
      </div>
    </article>
  );

  return (
    <div key={tab.id} className="analysis-workbench kinetic-page panel-fade-in mx-auto w-full max-w-7xl pb-12">
      <section className="analysis-hero mb-6 rounded-[30px] p-6 md:p-8">
        <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="policy-eyebrow"><FlaskConical size={15} /> 本地光谱分析</div>
            <h1 className="mt-5 max-w-5xl text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">{tab.title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">{tab.description}</p>
          </div>
          <div className="analysis-rule-grid">
            {[
              ["格式", "CSV / TXT", "Excel / HDR 需先转文本"],
              ["模型", realModel ? "R210 v1" : "加载中", "SVM 溯源 + PLSR 糖度"],
              ["质检", "覆盖率 86%", "不足则进入复检"],
            ].map(([label, value, note]) => (
              <div key={label} className="analysis-mini-card rounded-2xl p-4">
                <div className="text-xs font-bold tracking-[0.16em] text-white/48">{label}</div>
                <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
                <div className="mt-1 text-xs text-white/54">{note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="analysis-console rounded-[28px] p-4 md:p-5">
        <div className="analysis-toolbar mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex rounded-full border border-white/10 bg-black/20 p-1">
            {[
              ["single", "单样本"],
              ["compare", "双样本对比"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  if (mode === key) return;
                  setMode(key as AnalysisMode);
                  resetAnalysis();
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === key ? "bg-white text-black" : "text-white/62 hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!canAnalyze || step === "running"}
              onClick={startAnalysis}
              className="analysis-primary rounded-full px-5 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-45"
            >
              {step === "running" ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
              开始分析
            </button>
            <button className="analysis-action rounded-full px-4 py-2.5 text-sm font-semibold text-white" onClick={resetAnalysis}>
              <RefreshCw size={16} /> 重置
            </button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="grid gap-5">
            <div className={`grid gap-4 ${mode === "compare" ? "lg:grid-cols-2" : ""}`}>
              {renderSlot("A", slotA)}
              {mode === "compare" && renderSlot("B", slotB)}
            </div>

            <div className="analysis-chart-grid">
              <article className="analysis-panel rounded-[22px] p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">原始光谱曲线</h3>
                    <p className="mt-1 text-xs text-white/48">横轴为波段位置，纵轴为反射率；上传数据不足时只显示示例。</p>
                  </div>
                  <ScanLine className="text-orange-200/72" size={22} />
                </div>
                <div className="h-[300px]">
                  <SafeEChart option={spectrumOption} style={{ height: "100%", width: "100%" }} />
                </div>
              </article>
              <article className="analysis-panel rounded-[22px] p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">理化指标</h3>
                    <p className="mt-1 text-xs text-white/48">SSC 可由 R210 模型预测；糖酸比、酸度和 VC 使用上传实测列。</p>
                  </div>
                  <Gauge className="text-emerald-200/72" size={22} />
                </div>
                <div className="h-[300px]">
                  <SafeEChart option={metricOption} style={{ height: "100%", width: "100%" }} />
                </div>
              </article>
            </div>
          </div>

          <aside className="analysis-result rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold tracking-[0.18em] text-white/42">RESULT</div>
                <h3 className="mt-2 text-2xl font-semibold text-white">{hasResult ? (mode === "compare" ? "双样本对比" : resultMetrics.originName) : "等待分析"}</h3>
              </div>
              {resultPassed ? <CheckCircle2 className="text-emerald-200" size={30} /> : <AlertCircle className="text-orange-200" size={30} />}
            </div>

            {mode === "compare" && hasResult ? (
              <div className="mt-5 grid gap-3">
                {compareResultCards.map(({ label, metrics, tone }) => (
                  <div key={label} className={`rounded-2xl border p-4 ${tone}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold tracking-[0.16em] text-white/48">{label}</div>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white/68">{metrics.grade}</span>
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">{metrics.originName}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        ["置信度", metrics.confidence ? `${metrics.confidence.toFixed(1)}%` : "不足"],
                        ["SSC", metrics.qualityReady ? metrics.ssc.toFixed(2) : "缺失"],
                        ["糖酸比", metrics.ratio ? metrics.ratio.toFixed(2) : "未实测"],
                        ["VC", metrics.vc ? metrics.vc.toFixed(2) : "未实测"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-black/16 px-3 py-2">
                          <div className="text-[11px] text-white/42">{label}</div>
                          <div className="mt-1 text-sm font-semibold text-white">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  {compareSummaryRows.map(([label, value]) => (
                    <div key={label} className="analysis-kpi rounded-2xl p-4">
                      <div className="text-xs text-white/46">{label}</div>
                      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["置信度", resultMetrics.confidence ? `${resultMetrics.confidence.toFixed(1)}%` : "不足"],
                  ["等级", hasResult ? resultMetrics.grade : "-"],
                  ["SSC", resultMetrics.qualityReady ? resultMetrics.ssc.toFixed(2) : "缺失"],
                  ["糖酸比", resultMetrics.ratio ? resultMetrics.ratio.toFixed(2) : "未实测"],
                ].map(([label, value]) => (
                  <div key={label} className="analysis-kpi rounded-2xl p-4">
                    <div className="text-xs text-white/46">{label}</div>
                    <div className="mt-1 text-xl font-semibold text-white">{value}</div>
                  </div>
                ))}
              </div>
            )}

            {step === "running" ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-white/68">
                  <span>{progressLabel}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-orange-300 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/62">
                {hasResult ? (mode === "compare" ? compareReviewText : resultMetrics.reviewReason ?? "样本字段完整，产地和品质结论可以进入报告留档。") : "上传样本后按钮才会启用；也可以载入示例样本查看工作台效果。"}
                {hasResult && resultModelVersion ? (
                  <div className="mt-3 border-t border-white/10 pt-3 text-xs leading-6 text-white/46">
                    模型版本：{resultModelVersion}
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-5 grid gap-3">
              {analysisProgressSteps.map((item, index) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/62">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${hasResult || progress / 100 > index / analysisProgressSteps.length ? "border-orange-200/40 bg-orange-300/14 text-orange-100" : "border-white/12 bg-white/5"}`}>
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="analysis-panel rounded-[24px] p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">算法口径</h2>
              <p className="mt-2 text-sm leading-7 text-white/58">列出本页使用的格式、产地、分级和复检规则，报告结论有据可查。</p>
            </div>
            <Leaf className="text-emerald-200/72" size={26} />
          </div>
          <div className="grid gap-3">
            {[
              ["格式校验", "只解析 CSV/TXT 的数值列；xlsx、hdr 需先导出为文本数值表。"],
              ["产地判断", "R210 光谱走真实 SVM RFE20 模型；覆盖不足或边界距离偏低时进入复检。"],
              ["糖度预测", "R210 光谱走真实 SG二阶+SNV+RFE30+PLSR 模型；酸度、糖酸比和 VC 优先使用上传实测列。"],
              ["复检触发", "R210 覆盖率不足、低置信度、缺少理化字段或指标低于阈值时，不输出高等级结论。"],
            ].map(([title, body]) => (
              <div key={title} className="analysis-rule-row rounded-2xl p-4">
                <div className="text-sm font-semibold text-white">{title}</div>
                <p className="mt-1 text-sm leading-6 text-white/58">{body}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="analysis-panel rounded-[24px] p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">报告输出</h2>
              <p className="mt-2 text-sm leading-7 text-white/58">报告保留模型版本、样本结论、质检问题和部署说明，方便后续审计。</p>
            </div>
            <button
              className="analysis-action rounded-full px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!hasResult || !reportText}
              onClick={exportReport}
            >
              <Download size={16} /> 导出 MD
            </button>
          </div>
          <pre className="analysis-report rounded-2xl p-4 text-sm leading-7 text-white/68">
            {hasResult && reportText
              ? reportText
              : "等待开始分析。\n\n上传文件后这里只保留为空，点击“开始分析”并完成进度后，系统才会生成正式报告。"}
          </pre>
          <div className="ai-report-panel mt-4 rounded-2xl p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <BrainCircuit size={17} />
                  DeepSeek 多维总结
                </div>
                <p className="mt-1 text-xs leading-5 text-white/48">
                  {aiEndpointConfigured ? "已配置 AI 代理，点击后生成产地、品质、风险和经营建议。" : "静态站不保存密钥；配置后端代理后可切换为 DeepSeek 总结。"}
                </p>
              </div>
              <button
                className="analysis-action rounded-full px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!hasResult || !reportText || aiSummaryState === "loading"}
                onClick={summarizeReport}
              >
                {aiSummaryState === "loading" ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                {aiEndpointConfigured ? "生成 AI 总结" : "生成本地总结"}
              </button>
            </div>
            <pre className="ai-report-output mt-3 rounded-xl p-3 text-sm leading-7 text-white/68">
              {aiSummary || "完成分析后，可在这里生成多方位总结。后续 DeepSeek 密钥只放在后端代理环境变量里。"}
            </pre>
            {aiSummaryError ? <div className="mt-2 text-xs leading-5 text-orange-100/72">{aiSummaryError}</div> : null}
          </div>
        </article>
      </section>
    </div>
  );
}

function PolicyWorkspace({ tab }: { tab: TabConfig }) {
  const sourceLevels = [
    { level: "A", title: "核心依据", body: "法律、部门规章、政府公开、标准平台、农业农村部资料。", count: policyDocuments.filter((item) => item.level === "A").length },
    { level: "B", title: "背景资料", body: "地方转载、产业报道和学术综述，用于补充产区和技术语境。", count: policyDocuments.filter((item) => item.level === "B").length },
  ];
  const evidenceFlow = [
    ["01", "法规", "质量安全法与监测办法"],
    ["02", "标准", "地理标志与地方标准"],
    ["03", "产区", "海南及参考产区公开材料"],
    ["04", "映射", "评级、分析、技术页引用"],
  ];
  const coreDocs = policyDocuments.filter((item) => item.level === "A").slice(0, 4);

  return (
    <div key={tab.id} className="policy-page kinetic-page panel-fade-in mx-auto w-full max-w-6xl pb-14">
      <section className="policy-editorial policy-top-card">
        <div className="policy-cover">
        <div className="policy-cover__grid">
          <div>
            <div className="policy-eyebrow">
              <Landmark size={15} />
              {tab.eyebrow}
            </div>
            <h2>政策资料库</h2>
          </div>
          <p>
            只保留能回到原文的法规、标准、平台和产区公开资料，并标清它们对应的业务用途。
          </p>
        </div>
        <div className="policy-coreline">
          {sourceLevels.map((item) => (
            <div key={item.level}>
              <span>{item.level}</span>
              <strong>{item.title}</strong>
              <em>{item.count} 条</em>
            </div>
          ))}
        </div>
        </div>
      </section>

      <section className="policy-editorial policy-strip-card">
        <section className="policy-feature">
          <span>资料索引</span>
          <ol>
            {evidenceFlow.map(([step, title, body]) => (
              <li key={step}>
                <em>{step}</em>
                <strong>{title}</strong>
                <span>{body}</span>
              </li>
            ))}
          </ol>
        </section>

        <nav className="policy-floating-index" aria-label="政策资料目录">
          {policyCategories.map((category) => {
            const docs = policyDocuments.filter((item) => item.category === category);
            return (
              <a key={category} href={`#policy-${category}`}>
                <span>{category}</span>
                <strong>{docs.length}</strong>
              </a>
            );
          })}
        </nav>
      </section>

      <section className="policy-editorial policy-core-card">
        <div className="policy-paper">
        <main className="policy-paper__body">
          <section className="policy-core-docs">
            <header>
              <span>CORE SOURCES</span>
              <h3>核心依据</h3>
            </header>
            <div>
              {coreDocs.map((item) => (
                <a key={item.title} href={item.href} target="_blank" rel="noreferrer">
                  <span>{item.type}</span>
                  <strong>{item.title}</strong>
                  <p>{item.use}</p>
                </a>
              ))}
            </div>
          </section>
        </main>
        </div>
      </section>

      {policyCategories.map((category) => {
        const docs = policyDocuments.filter((item) => item.category === category);
        return (
          <section key={category} id={`policy-${category}`} className="policy-editorial policy-chapter-card">
            <div className="paper-chapter">
                <header>
                  <span>{category}</span>
                  <h3>{category === "全国" ? "法规与追溯底座" : category === "海南" ? "海南产区与地理标志" : `${category}产区资料`}</h3>
                  <em>{docs.length} 条</em>
                </header>
                <div className="paper-rows">
                  {docs.map((item, index) => (
                    <a key={item.title} href={item.href} target="_blank" rel="noreferrer" className="paper-row">
                      <div className="paper-row__num">{String(index + 1).padStart(2, "0")}</div>
                      <div className="paper-row__main">
                        <time>{item.date}</time>
                        <strong>{item.title}</strong>
                        <span>{item.source} / {item.theme}</span>
                      </div>
                      <p>{item.summary}</p>
                      <div className="paper-row__action">
                        <span>{item.level}</span>
                        <ArrowUpRight size={15} />
                      </div>
                    </a>
                  ))}
                </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GradingWorkspace({ tab }: { tab: TabConfig }) {
  return (
    <div key={tab.id} className="origin-lab kinetic-page panel-fade-in mx-auto w-full max-w-7xl pb-12">
      <section className="grade-hero relative overflow-hidden rounded-[30px]">
        <img src={assetPath("/origin-images/gallery-fenxuan.jpg")} alt="柑橘分选检测" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(251,146,60,0.34),transparent_28%),radial-gradient(circle_at_78%_26%,rgba(110,231,183,0.22),transparent_30%),linear-gradient(90deg,rgba(0,0,0,0.9),rgba(0,0,0,0.5)_52%,rgba(0,0,0,0.82))]" />
        <div className="scan-grid absolute inset-0" />
        <div className="relative z-10 grid min-h-[520px] gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_0.92fr] lg:p-10">
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200/28 bg-black/28 px-3 py-1.5 text-xs font-bold tracking-[0.24em] text-orange-100 backdrop-blur-md">
                <ShieldCheck size={14} />
                {tab.eyebrow}
              </div>
              <h2 className="hero-readable max-w-4xl text-4xl font-semibold leading-[0.96] tracking-[-0.045em] sm:text-5xl lg:text-7xl">
                品质分级判定台
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/76">
                系统同步读取 SSC、糖酸比、酸度、字段完整度和产地匹配结果，输出特选级、优选级、标准级或待复检。
              </p>
            </div>
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {tab.stats.map((item) => (
                <div key={item.label} className="readout-card rounded-2xl px-4 py-4">
                  <div className="text-[11px] font-semibold tracking-[0.16em] text-white/42">{item.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lab-console self-end rounded-[26px] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold tracking-[0.22em] text-emerald-100/62">GRADE MATRIX</div>
                <div className="mt-1 text-xl font-semibold text-white">四级判定阈值</div>
              </div>
              <span className="rounded-full bg-orange-300/14 px-3 py-1 text-xs font-semibold text-orange-100">SSC + 糖酸比</span>
            </div>
            <div className="grid gap-3">
              {gradingTiers.map((tier) => (
                <div key={tier.name} className="readout-line">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-white">{tier.name}</span>
                    <span className="text-xs text-white/46">{tier.threshold}</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full bg-gradient-to-r ${tier.tone}`} style={{ width: tier.name === "特选级" ? "92%" : tier.name === "优选级" ? "76%" : tier.name === "标准级" ? "58%" : "36%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-7 grid gap-5 lg:grid-cols-4">
        {gradingTiers.map((tier) => (
          <article key={tier.name} className="grade-tier-card rounded-[26px] p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-[0.18em] text-white/42">{tier.tag}</div>
                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">{tier.name}</h3>
              </div>
              <span className={`h-10 w-10 rounded-full bg-gradient-to-br ${tier.tone} shadow-lg`} />
            </div>
            <div className="rounded-2xl bg-white/7 px-3 py-2 text-sm font-semibold text-white/76">{tier.threshold}</div>
            <p className="mt-4 text-sm leading-7 text-white/62">{tier.copy}</p>
            <div className="mt-5 grid gap-2">
              {tier.checks.map((check) => (
                <div key={check} className="flex items-center gap-2 text-sm text-white/58">
                  <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${tier.tone}`} />
                  {check}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-7 grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="lab-console rounded-[28px] p-5 sm:p-6">
          <div className="text-xs font-bold tracking-[0.22em] text-orange-100/70">判定维度</div>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">四类信息一起看</h3>
          <p className="mt-4 text-sm leading-7 text-white/64">
            等级判定同时读取口感指标、产地结果、流程记录和异常状态。单个指标达标，只代表其中一项通过。
          </p>
          <div className="mt-5 grid gap-3">
            {gradingDimensions.map((item) => (
              <div key={item.title} className="rail-item rounded-2xl p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="font-semibold text-white">{item.title}</div>
                  <span className="rounded-full bg-white/8 px-2 py-1 text-[11px] font-semibold text-white/48">{item.metric}</span>
                </div>
                <p className="text-sm leading-6 text-white/62">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lab-console rounded-[28px] p-5 sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold tracking-[0.22em] text-emerald-100/70">样本演算</div>
              <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">代表样本怎么落级</h3>
            </div>
            <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/52">来自 399 份样本库</span>
          </div>
          <div className="grid gap-3">
            {gradingCases.map((item) => (
              <article key={item.id} className="grade-case rounded-2xl p-4">
                <div className="grid gap-4 md:grid-cols-[0.9fr_1.2fr_0.7fr] md:items-center">
                  <div>
                    <div className="text-xs font-semibold text-white/42">{item.origin}</div>
                    <div className="mt-1 text-xl font-semibold text-white">{item.id}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["SSC", item.ssc],
                      ["糖酸比", item.ratio],
                      ["VC", item.vc],
                    ].map(([label, value]) => (
                      <div key={label} className="readout-card rounded-xl px-3 py-2">
                        <div className="text-[10px] font-semibold tracking-[0.14em] text-white/36">{label}</div>
                        <div className="mt-1 text-base font-semibold text-white">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-left md:text-right">
                    <div className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${item.grade === "待复检" ? "bg-rose-300/15 text-rose-100" : "bg-emerald-300/15 text-emerald-100"}`}>
                      {item.grade}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/56">{item.reason}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="lab-console rounded-[28px] p-5 sm:p-6">
          <div className="text-xs font-bold tracking-[0.22em] text-rose-100/70">复检触发</div>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">复检样本触发项</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {reviewTriggers.map((item, index) => (
              <div key={item} className="rail-item rounded-2xl p-4">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-rose-300/12 text-sm font-bold text-rose-100">{index + 1}</div>
                <p className="text-sm leading-7 text-white/64">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lab-console rounded-[28px] p-5 sm:p-6">
          <div className="text-xs font-bold tracking-[0.22em] text-orange-100/70">标准依据</div>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">分级依据</h3>
          <div className="mt-5 grid gap-3">
            {gradingReferences.map((item) => (
              <div key={item.title} className="rail-item rounded-2xl p-4">
                <div className="font-semibold text-white">{item.title}</div>
                <p className="mt-2 text-sm leading-7 text-white/62">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function OriginWorkspace({ tab }: { tab: TabConfig }) {
  const cm = originFocus[0];
  const qz = originFocus[1];

  return (
    <div key={tab.id} className="origin-lab kinetic-page panel-fade-in mx-auto w-full max-w-7xl pb-12">
      <section className="origin-hero relative overflow-hidden rounded-[30px]">
        <div className="absolute inset-0 grid grid-cols-2">
          <img src={cm.image} alt={cm.name} className="h-full w-full object-cover opacity-72" />
          <img src={qz.image} alt={qz.name} className="h-full w-full object-cover opacity-78" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(255,159,64,0.32),transparent_28%),radial-gradient(circle_at_74%_34%,rgba(83,255,161,0.24),transparent_30%),linear-gradient(90deg,rgba(0,0,0,0.86),rgba(0,0,0,0.42)_48%,rgba(0,0,0,0.78))]" />
        <div className="scan-grid absolute inset-0" />
        <div className="relative z-10 grid min-h-[520px] gap-8 p-5 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200/28 bg-black/28 px-3 py-1.5 text-xs font-bold tracking-[0.24em] text-orange-100 backdrop-blur-md">
                <MapPin size={14} />
                {tab.eyebrow}
              </div>
              <h2 className="hero-readable max-w-4xl text-4xl font-semibold leading-[0.96] tracking-[-0.045em] sm:text-5xl lg:text-7xl">
                海南双产区样本库
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/76">
                澄迈福橙与琼中绿橙使用同一套检测口径：样本编号、理化指标、光谱文件、质检记录彼此对应。两类果品的差异，会在同一张样本库里展开。
              </p>
            </div>
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {tab.stats.map((item) => (
                <div key={item.label} className="readout-card rounded-2xl px-4 py-4">
                  <div className="text-[11px] font-semibold tracking-[0.16em] text-white/42">{item.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-end">
            <div className="lab-console w-full rounded-[26px] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold tracking-[0.22em] text-emerald-100/62">LIVE SAMPLE READOUT</div>
                  <div className="mt-1 text-xl font-semibold text-white">CM / QZ 对照读数</div>
                </div>
                <span className="rounded-full bg-emerald-300/14 px-3 py-1 text-xs font-semibold text-emerald-100">n=399</span>
              </div>
              <div className="grid gap-3">
                {metricRows.map((item) => (
                  <div key={item.label} className="readout-line">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                      <span className="text-xs text-white/42">{item.diff}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-orange-300" style={{ width: `${item.label.includes("VC") ? 100 : 62}%` }} />
                      </div>
                      <div className="grid min-w-[7rem] grid-cols-2 gap-3 text-center text-sm font-semibold">
                        <span className="text-orange-100">{item.cm}</span>
                        <span className="text-emerald-100">{item.qz}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-emerald-300" style={{ width: `${item.label.includes("VC") ? 76 : 78}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-7 grid gap-5 lg:grid-cols-2">
        {originFocus.map((item, index) => (
          <article key={item.name} className={`origin-profile ${index === 1 ? "origin-profile-green" : ""} overflow-hidden rounded-[28px]`}>
            <div className="relative min-h-[430px]">
              <img src={item.image} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/50 to-black/8" />
              <div className="scan-grid absolute inset-0 opacity-55" />
              <div className="relative z-10 flex min-h-[430px] flex-col justify-end p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">{item.region}</span>
                  <span className="rounded-full bg-black/36 px-3 py-1 text-xs font-semibold text-white/58 backdrop-blur-md">{item.code}</span>
                </div>
                <h3 className="text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">{item.name}</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/76">{item.summary}</p>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/62">{item.texture}</p>
                <div className="mt-5 grid grid-cols-4 gap-2">
                  {[
                    ["样本", item.sample],
                    ["SSC", item.ssc],
                    ["TA", item.ta],
                    ["糖酸比", item.ratio],
                  ].map(([label, value]) => (
                    <div key={label} className="readout-card rounded-2xl px-3 py-3">
                      <div className="text-[10px] font-semibold tracking-[0.16em] text-white/38">{label}</div>
                      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {item.evidence.map((line) => (
                    <div key={line} className="rounded-2xl border border-white/10 bg-black/24 px-3 py-2 text-xs leading-5 text-white/62 backdrop-blur-md">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-7 grid gap-5 lg:grid-cols-[0.58fr_1.42fr]">
        <div className="lab-console rounded-[28px] p-5 sm:p-6">
          <div className="text-xs font-bold tracking-[0.22em] text-orange-100/70">数据口径</div>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">这批数据怎么来的</h3>
          <p className="mt-4 text-sm leading-7 text-white/64">
            原始文件来自理化检测、光谱采集和数据清洗结果。能用于统计的列入样本库，有质检问题的数据单独标记。
          </p>
          <div className="mt-5 grid gap-3">
            {dataRules.map((item) => (
              <div key={item.title} className="rail-item rounded-2xl p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="font-semibold text-white">{item.title}</div>
                  <span className="rounded-full bg-white/8 px-2 py-1 text-[11px] font-semibold text-white/48">{item.meta}</span>
                </div>
                <p className="text-sm leading-6 text-white/62">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px]">
          <div className="grid gap-3 md:grid-cols-2">
            {originGallery.map((item, index) => (
              <div
                key={item.title}
                className={`group relative min-h-[260px] overflow-hidden rounded-[22px] ${index === 0 ? "md:min-h-[340px]" : ""}`}
              >
                <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-white/58">{item.copy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-7 lab-console rounded-[28px] p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <div className="text-xs font-bold tracking-[0.22em] text-emerald-100/70">建库流程</div>
            <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">一颗果子怎么进入样本库</h3>
            <p className="mt-4 text-sm leading-7 text-white/64">
              从果园到报告，样本会经过编号、检测、清洗和建库。每一步都留下口径，后面的产地识别和品质分级才有来处。
            </p>
          </div>
          <div className="journey-track grid gap-3 md:grid-cols-4">
            {sampleJourney.map((item, index) => (
              <article key={item.title} className="journey-node relative rounded-2xl p-4">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">{index + 1}</div>
                <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                <p className="mt-3 text-sm leading-6 text-white/62">{item.body}</p>
                <span className="mt-4 inline-flex rounded-full bg-white/8 px-2 py-1 text-[11px] font-semibold text-white/48">{item.meta}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-7 grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="lab-console rounded-[28px] p-5 sm:p-6">
          <div className="text-xs font-bold tracking-[0.22em] text-orange-100/70">扩展产区</div>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">下一阶段的跨区域样本库</h3>
          <p className="mt-4 text-sm leading-7 text-white/64">
            赣南、富川可作为跨区域样本库：单独采样、单独清洗、单独建档，再和海南样本做对照。
          </p>
          <div className="mt-5 rounded-2xl border border-amber-200/18 bg-amber-300/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
              <Sparkles size={16} />
              当前范围
            </div>
            <p className="mt-2 text-sm leading-6 text-white/64">
              现阶段的 399 份样本只包含澄迈和琼中。赣南、富川展示的是扩展方向，不计入本页均值和样本统计。
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {originReference.map((item) => (
            <article key={item.name} className="origin-reference-card overflow-hidden rounded-[28px]">
              <div className="relative h-56 overflow-hidden">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/12 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/70 backdrop-blur-md">{item.region}</span>
                    <span className="rounded-full bg-black/32 px-3 py-1 text-xs font-semibold text-white/60 backdrop-blur-md">{item.status}</span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">{item.name}</div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm leading-7 text-white/64">{item.copy}</p>
                <p className="mt-3 rounded-2xl bg-white/6 p-3 text-sm leading-6 text-white/56">{item.next}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function DashboardWorkspace({ tab }: { tab: TabConfig }) {
  return (
    <div key={tab.id} className="kinetic-page panel-fade-in mx-auto w-full max-w-7xl pb-12">
      <section className="page-hero mb-8 rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-white/18 bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white/75">
              SAMPLE INTELLIGENCE
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">数据可视化大屏</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72 md:text-base">
              关联真实 R210 光谱样本与 orange-real-analysis-v1 模型，展示训练规模、交叉验证指标、质检阈值和 CM-120 / QZ-1 双样本对比。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["MODEL", "v1", "真实算法"],
              ["BANDS", `${dashboardModelMetrics.wavelengthCount}`, "R210 波段"],
              ["CONF", `${dashboardModelMetrics.displayedConfidence}%`, "展示置信度"],
            ].map(([code, value, label]) => (
              <div key={code} className="data-ribbon min-w-28 rounded-2xl px-4 py-3">
                <div className="text-xs font-bold tracking-[0.18em] text-white/55">{code}</div>
                <div className="mt-1 text-2xl font-black">{value}</div>
                <div className="text-xs text-white/62">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="glass-panel signal-card flex items-center gap-4 rounded-2xl p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
              <stat.icon size={24} />
            </div>
            <div>
              <div className="mb-1 text-sm text-white/60">{stat.title}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-xs text-white/45">{stat.note}</div>
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
            <h3 className="mb-1 text-lg font-bold text-white">真实模型就绪度</h3>
            <p className="mb-4 text-xs text-white/45">口径：R210 artifact；产地准确率来自交叉验证，糖度 R2 为 PLSR 回归表现。</p>
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
            <h3 className="mb-1 text-lg font-bold text-white">真实样本理化对比</h3>
            <p className="mb-4 text-xs text-white/45">CM-120 与 QZ-1 来自双样本 CSV；TA 与 VC 做比例缩放便于同图比较。</p>
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
          <h3 className="mb-1 text-lg font-bold text-white">光谱特征空间</h3>
          <p className="mb-4 text-xs text-white/45">由真实 R210 反射率计算：短波段均值对比近红外均值，不再使用演示散点。</p>
          <div className="min-h-[400px] flex-1">
            <SafeEChart option={scatterOption} style={{ height: "100%", width: "100%" }} />
          </div>
          <div className="mt-4 rounded-xl border border-white/12 bg-white/6 p-4">
            <div className="text-sm font-bold text-white">真实质检规则</div>
            <div className="mt-2 grid gap-1.5 text-xs leading-5 text-white/72">
              <span>覆盖率阈值：{Math.round(dashboardModelMetrics.minCoverageRatio * 100)}%</span>
              <span>有效波段阈值：{dashboardModelMetrics.minValidBands} / {dashboardModelMetrics.wavelengthCount}</span>
              <span>展示置信度固定：{dashboardModelMetrics.displayedConfidence}%</span>
            </div>
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
              <h3 className="text-lg font-bold text-white">真实样本记录</h3>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
              </span>
            </div>

            <div className="space-y-4">
              {recentDetections.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-transparent bg-white/4 p-3 transition-colors hover:border-white/12 hover:bg-white/7"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{item.id}</div>
                    <div className="mt-1 text-xs text-white/60">
                      识别结果: <span className="font-medium text-orange-200">{item.origin}</span> | SSC: {item.ssc} | 糖酸比: {item.ratio} | {item.model}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`mb-1 inline-block rounded-full px-2 py-1 text-xs ${
                        item.status === "真实样本" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.status}
                    </div>
                    <div className="block text-xs text-white/40">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2 rounded-xl border border-white/12 bg-white/6 p-4 text-xs leading-5 text-white/70">
              <span>产地分类：R210 SG+SNV + RFE20 + SVM</span>
              <span>糖度回归：R210 SG2+SNV + RFE30 + PLSR</span>
              <span>复检触发：当前代表样本 {dashboardReviewCount} 条</span>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
        className="glass-panel rounded-2xl p-6"
      >
        <h3 className="mb-1 text-lg font-bold text-white">R210 原始光谱曲线</h3>
        <p className="mb-4 text-xs text-white/45">从真实样本中抽取展示点，完整波段为 {dashboardModelMetrics.wavelengthCount} 个；代表样本平均糖酸比 {dashboardAverageRatio}。</p>
        <div className="h-[300px]">
          <SafeEChart option={trendOption} style={{ height: "100%", width: "100%" }} />
        </div>
      </motion.div>
    </div>
  );
}

function ModelWorkspace({ tab }: { tab: TabConfig }) {
  return (
    <div key={tab.id} className="kinetic-page panel-fade-in mx-auto w-full max-w-7xl pb-12">
      <section className="page-hero tech-hero mb-7 rounded-[30px] p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="policy-eyebrow">
              <Microscope size={15} />
              技术原理
            </div>
            <h1 className="tech-hero-title mt-5 max-w-5xl font-semibold text-white">
              从高光谱采集到智能建模的完整分析链路
            </h1>
            <p className="mt-5 max-w-4xl text-base leading-8 text-white/76 md:text-lg">
              橙源智鉴以高光谱成像为数据基础，通过光谱预处理、特征提取、分类识别和指标回归，实现柑橘样本的产地判断、品质预测与异常预警，并最终将结果组织成可展示的可视化页面。
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              {["高光谱采集", "光谱预处理", "模型推理", "结果输出"].map((item) => (
                <span key={item} className="tech-chip">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="tech-diagram rounded-[28px] p-6">
            <div className="tech-stage relative mx-auto flex h-[320px] max-w-[400px] items-center justify-center">
              <div className="tech-node tech-node-orange left-4 top-10">采集光谱数据</div>
              <div className="tech-node tech-node-emerald right-4 top-24">预处理与校正</div>
              <div className="tech-node tech-node-sky left-8 bottom-24">分类与回归</div>
              <div className="tech-node tech-node-amber bottom-6 right-8">结果展示</div>
              <div className="tech-core">
                <Layers size={54} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {coreTechCards.map((card) => (
          <article key={card.title} className="tech-card rounded-[24px] p-6">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${card.accent}`}>
              <card.icon size={22} />
            </div>
            <h2 className="text-xl font-semibold text-white">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-white/72">{card.description}</p>
            <div className="mt-5 grid gap-2.5">
              {card.bullets.map((bullet) => (
                <div key={bullet} className="flex gap-2 text-sm leading-6 text-white/66">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-orange-300" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="tech-flow-section mb-7 rounded-[28px] p-6 md:p-8">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="text-xs font-bold tracking-[0.18em] text-orange-200/76">WORKFLOW</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">技术流程</h2>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-white/62 lg:justify-self-end">
            页面里的识别结果并不是直接从原始图像读取出来，而是经历了采集、预处理、建模和结果组织几步连续流程。
          </p>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-5">
          {workflowSteps.map(([step, title, description]) => (
            <article key={step} className="tech-step-card rounded-[22px] p-5">
              <div className="text-sm font-semibold tracking-[0.18em] text-orange-200/78">{step}</div>
              <div className="mt-3 text-base font-semibold text-white">{title}</div>
              <p className="mt-3 text-sm leading-6 text-white/62">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-7 grid gap-5 lg:grid-cols-2">
        {principleExplainers.map((item) => (
          <article key={item.title} className="tech-explainer rounded-[28px] p-6 md:p-7">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/8 text-orange-100 ring-1 ring-white/10">
              <item.icon size={22} />
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">{item.title}</h2>
            <p className="mt-4 text-sm leading-7 text-white/72 md:text-base">{item.body}</p>
            <p className="mt-4 text-sm leading-7 text-white/62 md:text-base">{item.extra}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold tracking-[0.18em] text-orange-200/76">OUTPUT</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">模型输出</h2>
          </div>
          <span className="hidden text-sm text-white/46 md:block">产地判断、品质预测、可解释结果</span>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {metricCards.map((item) => (
            <article key={item.title} className="tech-metric-card rounded-[24px] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-300/16 text-orange-100 ring-1 ring-orange-300/22">
                <item.icon size={22} />
              </div>
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/68">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<TabId>(() => {
    const hash = window.location.hash.replace("#", "");
    return tabs.some((tab) => tab.id === hash) ? (hash as TabId) : "home";
  });
  const activeIndex = tabs.findIndex((tab) => tab.id === activeId);
  const activeTab = tabs[activeIndex] ?? tabs[0];
  const mobileLinks = useMemo(() => tabs, []);
  const isHome = activeTab.id === "home";
  const useSubpageShade = !isHome;

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (tabs.some((tab) => tab.id === hash)) {
        setActiveId(hash as TabId);
      }
    };
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const goTo = (id: TabId) => {
    setActiveId(id);
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMenuOpen(false);
  };

  const move = (direction: -1 | 1) => {
    const nextIndex = (activeIndex + direction + tabs.length) % tabs.length;
    goTo(tabs[nextIndex].id);
  };

  return (
    <main className="relative min-h-screen bg-black text-white">
      <img className="fixed inset-0 z-0 h-full w-full object-cover" src={assetPath("/hero-background.png")} alt="" />

      <div
        className="pointer-events-none fixed inset-0 z-[1] backdrop-blur-xl"
        style={{
          WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 45%)",
          maskImage: "linear-gradient(to top, black 0%, transparent 45%)",
        }}
      />

      {useSubpageShade && (
        <div
          className="pointer-events-none fixed inset-0 z-[2]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.34) 24%, rgba(0,0,0,0.56) 100%)",
          }}
        />
      )}

      <div className="relative z-50 flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 px-4 py-4 sm:px-6 md:px-10 md:py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="w-4 sm:w-8 md:w-10" />

            <nav className="nav-chip hidden items-center gap-1 rounded-full px-2 py-2 lg:flex">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const active = activeId === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => goTo(tab.id)}
                    className={`animate-blur-fade-up flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      active ? "nav-active" : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    style={{ animationDelay: `${navDelays[index]}ms` }}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => setMenuOpen((value) => !value)}
              className="liquid-glass animate-blur-fade-up relative flex h-10 w-10 items-center justify-center rounded-full text-white lg:hidden"
              style={{ animationDelay: "350ms" }}
              aria-label="打开导航"
            >
              <Menu className={`absolute transition-all duration-300 ${menuOpen ? "rotate-180 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} size={18} />
              <X className={`absolute transition-all duration-300 ${menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-180 scale-50 opacity-0"}`} size={18} />
            </button>
          </div>

          <div
            className={`absolute left-0 right-0 top-[72px] z-40 border-y border-white/10 bg-black/88 px-4 py-4 shadow-2xl backdrop-blur-lg transition-all duration-300 lg:hidden ${
              menuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"
            }`}
          >
            <div className="grid gap-1">
              {mobileLinks.map((tab, index) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => goTo(tab.id)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-all ${
                      activeId === tab.id ? "bg-orange-400/18 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    style={{ transitionDelay: `${index * 30}ms` }}
                  >
                    <Icon size={17} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {isHome ? (
          <section className="flex flex-1 flex-col justify-end px-4 pb-8 sm:px-6 md:px-12 md:pb-16">
            <div className="flex flex-col items-start gap-8 md:flex-row md:items-end">
              <div className="flex-1">
                <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-white/74 sm:gap-6 sm:text-sm">
                  <span className="animate-blur-fade-up flex items-center gap-2 rounded-full bg-black/24 px-3 py-1.5 backdrop-blur-md" style={{ animationDelay: "300ms" }}>
                    <Database size={16} />
                    399 份样本库
                  </span>
                  <span className="animate-blur-fade-up flex items-center gap-2 rounded-full bg-black/24 px-3 py-1.5 backdrop-blur-md" style={{ animationDelay: "350ms" }}>
                    <MapPin size={16} />
                    澄迈 / 琼中
                  </span>
                  <span className="animate-blur-fade-up flex items-center gap-2 rounded-full bg-black/24 px-3 py-1.5 backdrop-blur-md" style={{ animationDelay: "400ms" }}>
                    <ClipboardCheck size={16} />
                    可复核报告
                  </span>
                </div>

                <h1
                  className="hero-readable animate-blur-fade-up max-w-5xl text-4xl font-normal leading-[0.98] tracking-[-0.04em] sm:text-5xl md:text-6xl lg:text-7xl"
                  style={{ animationDelay: "430ms" }}
                >
                  {activeTab.title}
                </h1>
                <p
                  className="animate-blur-fade-up mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg md:text-xl"
                  style={{ animationDelay: "520ms" }}
                >
                  {activeTab.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
                  <button
                    onClick={() => goTo("analysis")}
                    className="animate-blur-fade-up flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-200 sm:px-8"
                    style={{ animationDelay: "600ms" }}
                  >
                    <FlaskConical size={18} />
                    进入智能分析
                  </button>
                  <button
                    onClick={() => goTo("origins")}
                    className="liquid-glass animate-blur-fade-up rounded-full px-6 py-3 text-sm font-semibold text-white sm:px-8"
                    style={{ animationDelay: "700ms" }}
                  >
                    查看产品品种
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => move(-1)}
                  className="liquid-glass animate-blur-fade-up flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white sm:px-6"
                  style={{ animationDelay: "800ms" }}
                >
                  <ChevronLeft size={18} />
                  上一页
                </button>
                <button
                  onClick={() => move(1)}
                  className="liquid-glass animate-blur-fade-up flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white sm:px-6"
                  style={{ animationDelay: "900ms" }}
                >
                  下一页
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="flex-1 px-4 pb-10 pt-2 sm:px-6 md:px-10">
            <div className="mx-auto w-full max-w-7xl">
              <Workspace tab={activeTab} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
