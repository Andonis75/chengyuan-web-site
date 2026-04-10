export type OriginProfile = {
  name: string;
  region: string;
  category: string;
  summary: string;
  flavor: string;
  highlights: string[];
  stage: string;
  imageSrc?: string;
  imageAlt?: string;
  imageCredit?: string;
  imageCreditUrl?: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

export type GradeTier = {
  name: string;
  slogan: string;
  badge: string;
  metrics: string[];
  note: string;
};

export type GradeDimension = {
  name: string;
  metric: string;
  description: string;
};

export type PolicyDocument = {
  title: string;
  category: string;
  date: string;
  source: string;
  theme?: string;
  takeaway?: string;
  summary: string;
  url: string;
};

export type OriginReferenceTheme = {
  label: string;
  title: string;
  summary: string;
  highlights: string[];
};

export type HomeQuickLink = {
  title: string;
  description: string;
  cta: string;
  href: string;
};

export const originProfiles: OriginProfile[] = [
  {
    name: "赣南脐橙",
    region: "江西赣州",
    category: "代表性脐橙产区",
    summary:
      "赣南脐橙是很多人一提到脐橙就会想到的名字，产区知名度高，品牌体系也相对成熟。",
    flavor: "整体风味甜酸平衡、香气完整，吃起来干净扎实，属于辨识度很强的一类脐橙。",
    highlights: [
      "品牌认知度高，适合做产区标杆展示。",
      "公开资料可见质量分级与溯源体系建设。",
      "适合突出标准化果园、分选包装和品牌授权。",
    ],
    stage: "适合放在全国脐橙版图里的核心位置来认识。",
    imageSrc: "/origin-images/gannan.jpg",
    imageAlt: "挂在枝头上的橙果",
    imageCredit: "图片来源：Wikimedia Commons",
    imageCreditUrl:
      "https://commons.wikimedia.org/wiki/File:Orange_on_the_tree.jpg",
    sourceLabel: "赣州市人民政府：质量分级试点",
    sourceUrl:
      "https://www.ganzhou.gov.cn/gzszf/c100022/202511/068d6302918c43db83f9c3879e16e958.shtml",
  },
  {
    name: "富川脐橙",
    region: "广西贺州富川",
    category: "广西产区代表",
    summary:
      "富川是广西很有代表性的脐橙产区之一，也常被放进华南脐橙的重要产区版图里一起讨论。",
    flavor: "它给人的印象通常更清爽，果肉脆嫩、酸甜利落，属于耐吃型的风味。",
    highlights: [
      "具备地理标志与区域品牌辨识度。",
      "规模化种植基础较强，适合做广西专题入口。",
      "适合强调脐橙优势带中的区位价值。",
    ],
    stage: "放到广西板块里，会是很自然的一张名片。",
    imageSrc: "/origin-images/fuchuan-fixed.jpg",
    imageAlt: "枝头成熟的脐橙示意图",
    imageCredit: "图片来源：Wikimedia Commons",
    imageCreditUrl:
      "https://commons.wikimedia.org/wiki/File:Orange.jpg",
    sourceLabel: "农业农村部：富川脐橙产业报道",
    sourceUrl:
      "https://www.moa.gov.cn/xw/qg/202311/t20231120_6440872.htm",
  },
  {
    name: "琼中绿橙",
    region: "海南琼中",
    category: "海南特色地标果品",
    summary:
      "琼中绿橙很容易让人记住，山地气候、青绿色外观和长期积累下来的品牌印象，都是它的鲜明标签。",
    flavor: "外皮常带青绿色，汁水足，甜酸感清爽，第一次见到的人通常也很容易记住“绿橙”这个名字。",
    highlights: [
      "品牌传播中常出现追溯二维码和统一包装。",
      "成熟时仍可能保持偏绿外观，辨识度很强。",
      "当前已接入对应真实样本，可和澄迈做对照展示。",
    ],
    stage: "很适合放在海南板块里做第一眼就能记住的品种。",
    imageSrc: "/origin-images/qiongzhong-feature.jpg",
    imageAlt: "琼中绿橙产品展示图",
    imageCredit: "图片来源：农业农村部转载公开报道",
    imageCreditUrl:
      "https://www.moa.gov.cn/xw/qg/201805/t20180529_6144035.htm",
    sourceLabel: "农业农村部：琼中绿橙品牌与追溯",
    sourceUrl:
      "https://www.moa.gov.cn/xw/qg/201805/t20180529_6144035.htm",
  },
  {
    name: "澄迈福橙",
    region: "海南澄迈",
    category: "海南潜力专题产区",
    summary:
      "澄迈福橙既有海南产区的地方特色，也能让人看到果园建设、种植管理和产业升级这一面。",
    flavor: "相比口号式介绍，它更适合通过生态环境、果园表现和真实样本数据来认识。",
    highlights: [
      "当前已接入 199 条真实理化样本。",
      "可与琼中绿橙做海南产区风味对照。",
      "适合继续往数字化果园和样本批次方向扩展。",
    ],
    stage: "更适合通过样本表现和果园建设去认识它。",
    imageSrc: "/origin-images/chengmai-display.jpg",
    imageAlt: "绿色柑橘近景",
    imageCredit: "图片来源：海南省农业农村厅转载公开报道",
    imageCreditUrl:
      "https://agri.hainan.gov.cn/hnsnyt/ywdt/zwdt/202312/t20231214_3550095.html",
    sourceLabel: "海南省农业农村厅：澄迈产业品牌“名片”",
    sourceUrl:
      "https://agri.hainan.gov.cn/hnsnyt/ywdt/zwdt/202312/t20231214_3550095.html",
  },
];

export const gradeTiers: GradeTier[] = [
  {
    name: "特选",
    slogan: "高可信度精品果",
    badge: "适合礼盒、重点品牌展示",
    metrics: [
      "糖度（SSC）建议达到 11.5 以上",
      "糖酸比建议达到 15 以上",
      "维生素 C 与风味指标表现稳定",
      "产地匹配置信度建议达到 97% 以上",
    ],
    note: "适合作为示范样本、精品果和高端渠道果。",
  },
  {
    name: "优选",
    slogan: "主力商品果",
    badge: "适合电商和渠道稳定供货",
    metrics: [
      "糖度（SSC）建议达到 10.0 以上",
      "糖酸比建议达到 12 以上",
      "酸度处于相对舒适区间",
      "产地匹配置信度建议达到 93% 以上",
    ],
    note: "兼顾口感与出货稳定性，是页面中最适合重点展示的等级。",
  },
  {
    name: "标准",
    slogan: "可销售基础等级",
    badge: "适合常规流通与批量分选",
    metrics: [
      "糖度（SSC）建议达到 8.5 以上",
      "糖酸比建议达到 10 以上",
      "基础营养指标和外观条件达标",
      "产地匹配置信度建议达到 85% 以上",
    ],
    note: "用于满足常规销售要求，但在风味与稳定性上弱于优选果。",
  },
  {
    name: "待复检",
    slogan: "建议人工复核",
    badge: "异常样本或信息不完整",
    metrics: [
      "糖酸结构明显偏离目标区间",
      "光谱结果和产地标签不一致",
      "外观、成熟度或溯源链条存在缺口",
      "检测数据缺失或重复采样异常",
    ],
    note: "不直接否定品质，而是提示业务侧进入复检、复采或人工分拣流程。",
  },
];

export const gradeDimensions: GradeDimension[] = [
  {
    name: "内在品质",
    metric: "SSC、TA、糖酸比、VC",
    description:
      "用来解释“甜不甜、酸不酸、风味均衡不均衡”，是评级页最容易被理解的一组指标。",
  },
  {
    name: "成熟度与外观",
    metric: "果径、色泽、瑕疵、均匀度",
    description:
      "用于支撑商品化分级和包装展示，也方便和传统人工分选逻辑衔接。",
  },
  {
    name: "产地可信度",
    metric: "光谱匹配置信度、标签一致性",
    description:
      "适合用来体现网站的差异化能力，让“品质”与“溯源”形成闭环。",
  },
  {
    name: "流程完整度",
    metric: "样本信息、采集批次、检测记录",
    description:
      "当资料不全时，不强行给出高等级，避免页面看起来像拍脑袋评分。",
  },
];

export const gradingNotes = [
  "不同产区和品种可以使用不同阈值。",
  "异常样本需要进入人工复检。",
  "评级结果可结合官方标准一起查看。",
];

export const originReferenceThemes: OriginReferenceTheme[] = [
  {
    label: "标准分级",
    title: "好果子的判断，正在从经验口径变成可执行规则",
    summary:
      "公开资料里最值得看的变化，是脐橙品质开始被写进生产技术规程、质量分级和采后处理环节，访客更容易把“好吃”与“可交付”连起来理解。",
    highlights: [
      "赣州在 2025 年发布《优质赣南脐橙生产技术规程》和《脐橙质量分级》团体标准，并落到试点企业。",
      "农业农村部监管司在 2023 年工作简报中提到国家标准、采后商品化处理规程与区块链溯源做法。",
      "这类资料很适合衔接网站里的评级标准、可信溯源和果园管理叙事。",
    ],
  },
  {
    label: "地理标志与品牌",
    title: "产区不只是在讲风味，也在讲识别系统和品牌秩序",
    summary:
      "从琼中绿橙的统一包装、二维码溯源，到海南地理标志产品数量和用标主体增长，公开资料已经把“产区名片”讲成一套访客能看懂的品牌语言。",
    highlights: [
      "海南在 2022 年公开披露全省地理标志产品达 116 个，说明地理标志已成为区域品牌的重要底座。",
      "琼中绿橙在公开报道中多次出现统一包装、授权经销和二维码追溯等做法。",
      "澄迈在 2024 年继续推进地理标志运用促进工程，说明品牌建设已经延伸到产业组织层面。",
    ],
  },
  {
    label: "产区升级",
    title: "公开资料不只说明果子好不好，也说明产业有没有长期能力",
    summary:
      "当访客看到产量、产值、龙头企业、品牌矩阵和示范基地这些公开信息时，页面传递的就不再只是单个果实，而是一个产区是否具备持续供给与升级能力。",
    highlights: [
      "富川脐橙公开披露 2023 年产量约 74.39 万吨、产值约 20.08 亿元，是很强的产业规模信号。",
      "赣南脐橙品牌价值连续十一年位列水果类第一，说明品牌成熟度和市场认知都很稳定。",
      "澄迈相关公开报道开始强调品牌矩阵、特色农业和地理标志联动，适合放在海南专题页的升级叙事里。",
    ],
  },
];

export const policyDocuments: PolicyDocument[] = [
  {
    title: "赣深联合开展全国首批脐橙质量分级试点",
    category: "江西",
    date: "2025-11-24",
    source: "赣州市人民政府",
    theme: "标准分级",
    takeaway: "把优质生产规程和脐橙质量分级真正落到试点企业。",
    summary:
      "发布《优质赣南脐橙生产技术规程》和《脐橙质量分级》团体标准，并授牌首批试点企业，是理解“标准化好果”最直接的一条公开资料。",
    url: "https://www.ganzhou.gov.cn/gzszf/c100022/202511/068d6302918c43db83f9c3879e16e958.shtml",
  },
  {
    title: "江西赣州：突出绿色化、标准化、品牌化 全域打造优质脐橙生产基地",
    category: "江西",
    date: "2023-09-05",
    source: "农产品质量安全监管司",
    theme: "标准化与溯源",
    takeaway: "把国家标准、采后处理规程和区块链溯源放在同一条链路里看。",
    summary:
      "农业农村部工作简报提到《脐橙》国家标准、赣南脐橙相关标准、采后商品化处理规程以及区块链溯源做法，适合用作页面标准依据。",
    url: "https://jgs.moa.gov.cn/gzjb/202309/t20230905_6435871.htm",
  },
  {
    title: "赣南脐橙品牌价值连续十一年位列水果类第一",
    category: "江西",
    date: "2025-05-16",
    source: "赣州市人民政府",
    theme: "品牌价值",
    takeaway: "说明赣南脐橙在区域品牌传播和市场认知上的成熟度。",
    summary:
      "公开报道强调赣南脐橙品牌价值连续十一年位列水果类第一，适合用作产区名片和品牌背书材料。",
    url: "https://www.ganzhou.gov.cn/gzszf/c100022/202505/d62847b6c7c646c0974d347e26d4ce95.shtml",
  },
  {
    title: "今年广西富川脐橙产量可达74.39万吨 产值约20.08亿元",
    category: "广西",
    date: "2023-11-20",
    source: "农业农村部网站",
    theme: "产业规模",
    takeaway: "一条就能让访客感知富川脐橙的规模化生产和产业链能力。",
    summary:
      "公开资料指出富川是广西最大的脐橙生产基地之一，已形成生产、加工、营销一体的产业链，适合作为广西产区实力的公开证据。",
    url: "https://www.moa.gov.cn/xw/qg/202311/t20231120_6440872.htm",
  },
  {
    title: "为“琼中绿橙”品牌保驾护航",
    category: "海南",
    date: "2017-11-16",
    source: "农业农村部网站",
    theme: "地理标志与追溯",
    takeaway: "统一包装、二维码溯源、授权经销，是琼中绿橙最适合讲给访客听的品牌动作。",
    summary:
      "公开报道提到地理标志、统一包装、二维码溯源、果径规格与授权经销，适合放入海南专题页和溯源说明区。",
    url: "https://www.moa.gov.cn/xw/qg/201805/t20180529_6144035.htm",
  },
  {
    title: "我省地理标志产品达116个",
    category: "海南",
    date: "2022-09-15",
    source: "海南省人民政府",
    theme: "地理标志底座",
    takeaway: "说明海南已经形成较完整的地理标志产品与特色品牌基础盘。",
    summary:
      "海南省政府公开披露全省地理标志产品达 116 个，并提到用标主体数量增长和乡村振兴成效，是理解海南区域品牌底座的一条关键资料。",
    url: "https://www.hainan.gov.cn/hainan/5309/202209/1fa2151fdc804c4bbd922df44fd134b2.shtml",
  },
  {
    title: "新海南客户端 | 果然有种·琼中绿橙 | 那一年你从他乡来 扎根海南而为“琼中绿橙”",
    category: "海南",
    date: "2023-10-23",
    source: "海南省农业农村厅转载",
    theme: "品种故事",
    takeaway: "更适合放在品牌专题页里，补足琼中绿橙的人物感和记忆点。",
    summary:
      "从品种落地、产区环境与品牌成长角度讲琼中绿橙，能把访客从“看果子”带到“记住这个产区”。",
    url: "https://agri.hainan.gov.cn/hnsnyt/ywdt/zwdt/202310/t20231023_3513444.html",
  },
  {
    title: "海南日报客户端 | 海南澄迈：绘就产业品牌“名片” 打造乡村振兴“引擎”",
    category: "海南",
    date: "2023-12-14",
    source: "海南省农业农村厅转载",
    theme: "产业品牌",
    takeaway: "把澄迈从单一果品，扩展成产业品牌矩阵和县域农业名片来理解。",
    summary:
      "报道强调澄迈通过特色农业与品牌矩阵打造县域农业名片，适合用来承接澄迈福橙的展示和产业升级叙事。",
    url: "https://agri.hainan.gov.cn/hnsnyt/ywdt/zwdt/202312/t20231214_3550095.html",
  },
  {
    title: "澄迈深入推进地理标志运用促进工程，助推产业增效农民增收",
    category: "海南",
    date: "2024-03-29",
    source: "海南省人民政府",
    theme: "运用促进工程",
    takeaway: "适合说明澄迈的品牌建设已经从单品走向地理标志工程化推进。",
    summary:
      "海南省政府转载报道指出澄迈深入推进地理标志运用促进工程，把地理标志与产业增效、农民增收直接挂钩，适合放进公开资料参考的海南板块。",
    url: "https://www.hainan.gov.cn/hainan/sxian/202403/54a0a73da02f4475a6fbea560f9156db.shtml",
  },
];

export const homeQuickLinks: HomeQuickLink[] = [
  {
    title: "产区与风味",
    description: "从几个代表产区入手，先认识它们各自的风味特点和整体印象。",
    cta: "进入产区专题",
    href: "/origins",
  },
  {
    title: "分级标准",
    description: "把糖度、酸度、糖酸比和复检规则放在一起，看结果时更容易理解。",
    cta: "查看评级标准",
    href: "/grading",
  },
  {
    title: "政策资料",
    description: "把地理标志、质量分级和追溯相关的公开资料整理到一起，查起来更省事。",
    cta: "查看公开资料",
    href: "/policy",
  },
];
