# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(r"D:\Projects\chengyuan-web")
PROJECT_PLAN_DIR = ROOT / "project_plan"
BASE_DOCM_PATH = PROJECT_PLAN_DIR / "橙源智鉴_挑战杯格式版_v27.docm"
OUTPUT_DOCM_PATH = PROJECT_PLAN_DIR / "橙源智鉴_挑战杯格式版_v29.docm"

REPLACEMENTS: dict[str, str] = {
    "本项目核心团队由海南师范大学跨学科优秀人才组成，深度聚焦高光谱成像技术、人工智能算法、食品安全检测、市场营销与财务管理等关键领域，兼具技术研发实力、项目落地能力与商业运营思维。团队成员均为所在学科的佼佼者，曾斩获多项国家级、省级科创竞赛奖项，积累了丰富的技术开发、项目管理与市场实践经验。": "本项目核心团队由海南师范大学跨学科成员组成，围绕高光谱成像、人工智能算法、农产品数字化分析、平台开发、市场运营与财务管理等关键方向协同推进，服务橙类产品等级识别、产地溯源、品质分析和报告输出等核心任务。团队成员具备较强的技术研发能力、工程落地能力和项目执行能力，并在多项国家级、省级科创竞赛中积累了丰富的开发与实战经验。",
    '团队依托海南师范大学信息科学技术学院重点实验室、科技园孵化器及产学研合作平台等优质资源，构建起"技术研发—产品落地—商业运营"的完整能力体系。核心成员分工明确、协作高效，形成了从实验室技术到商业化落地的全链条支撑能力。与此同时，团队聘请校内外行业资深专家担任技术顾问与商业顾问，深度绑定学术与产业资源，为项目发展提供专业指导与战略支持，实现"产学研"的有机融合。': '团队依托海南师范大学信息科学技术学院重点实验室、科技园孵化器及产学研合作平台等优质资源，构建起“样本采集标注—模型训练优化—平台部署应用—试点反馈迭代”的完整能力体系。核心成员分工明确、协作高效，能够把高光谱样本、分析模型、平台系统与场景试点连续打通；同时，团队聘请校内外专家担任技术顾问与商业顾问，持续引入学术与产业资源，为项目后续扩样、试点和落地提供专业支撑。',
    "技术部是项目核心研发与技术落地的主体部门，承担从算法研发到系统集成再到技术支持的全链条职责。具体而言，技术部负责高光谱数据处理算法的设计与持续迭代优化，深度学习检测模型的构建、训练与性能调优；负责检测系统软硬件集成方案设计、多终端设备适配及运行稳定性保障；同时为内部运营团队和外部客户提供全流程技术支持、操作培训与定制化解决方案开发，确保技术成果从实验室环境向商业化场景的无缝迁移与高效落地。": "技术部是项目核心研发与技术落地的主体部门，承担从算法研发到平台集成再到技术支持的全链条职责。具体而言，技术部负责高光谱数据处理算法的设计与持续迭代优化，完成橙类等级识别、产地溯源与品质分析模型的构建、训练与性能调优；负责上传分析平台、移动查询端和报告输出链路的集成设计、多终端适配及运行稳定性保障；同时为内部运营团队和外部试点对象提供技术支持、操作培训与定制化方案开发，确保技术成果能够稳定进入果园、合作社、分选中心和品牌方等真实场景。",
    '市场营销部负责项目的市场布局、品牌推广与客户生态建设，是连接技术产品与目标市场的关键纽带。核心职责包括：开展饮料检测行业市场调研、竞争格局分析与目标客户画像梳理，为产品定位与商业策略提供数据依据；制定品牌推广方案、渠道拓展路径与产品定价策略，组织落地行业展会、线上营销、客户对接等获客行动；维护客户关系，推进合作洽谈、合同签署与交付后的服务跟进，逐步搭建"硬件设备+软件系统+检测服务"的商业变现链路，实现项目的持续商业价值输出。': "市场营销部负责项目的市场布局、品牌推广与客户生态建设，是连接产品能力与目标场景的关键纽带。核心职责包括：围绕橙类产品分级、验货、溯源和品牌表达开展行业调研、竞品分析与目标客户画像梳理，为产品定位与商业策略提供依据；制定品牌传播方案、试点拓展路径与服务定价策略，组织产区走访、客户对接、路演展示和合作洽谈等行动；维护果园、合作社、品牌方、渠道采购方与区域服务机构等客户关系，逐步搭建“平台系统+分析服务+报告交付”的商业转化链路。",
    "财务部统筹项目全生命周期的财务规划与资金管理，是项目稳健运营的重要保障。核心职责涵盖：编制研发、运营、市场拓展各阶段的预算方案与成本控制计划，确保资金使用的合理性与效益最大化；负责日常资金收付、账务核算、税务筹划与财务报表编制；积极对接创新创业基金、孵化资金、科创赛事奖金等多元融资渠道，做好资金分配规划与使用监控；同时为项目重大商业决策提供财务数据支撑与风险评估，保障项目在资金层面的可持续发展能力。财务部还将借助编程技术实现项目经费的精细化与自动化管理，提升财务工作的效率与准确性。": "财务部统筹项目全生命周期的财务规划与资金管理，是项目稳健运营的重要保障。核心职责涵盖：编制样本采集、理化标定、模型训练、平台运维、试点实施等阶段的预算方案与成本控制计划，确保资金使用的合理性与效益最大化；负责日常资金收付、账务核算与财务报表编制；积极对接创新创业基金、孵化资金、科创赛事奖金等多元渠道，做好资金分配规划与使用监控；同时为项目的试点报价、年度服务定价和扩张节奏提供财务支撑，保障项目在资金层面的可持续发展能力。",
    "行政部作为团队运营的综合保障部门，承担内外部资源协调、流程管控与团队运营管理等职责。核心工作包括：制定并执行团队日常运营管理制度，统筹办公场地、设备物资、资质申报等行政事务；负责团队人员考勤、跨部门协作沟通与项目进度跟踪管理，推进各环节文档编制、归档与质量把控；协调高校实验室、产业园区、行业协会等外部资源，确保团队研发、运营、商务活动的顺利开展；在项目冲刺阶段，行政部还承担各类竞赛申报材料的组织与质量审核工作，保障项目对外展示的规范性与专业性。": "行政部作为团队运营的综合保障部门，承担内外部资源协调、流程管控与团队运营管理等职责。核心工作包括：制定并执行团队日常运营管理制度，统筹设备物资、资料归档、资质申报和试点文书等行政事务；负责团队人员协作沟通、项目进度跟踪管理与过程材料整理，推进各环节文档编制、归档与质量把控；协调高校实验室、产区资源、合作单位等外部资源，确保团队研发、试点、商务和竞赛申报工作的顺利开展。",
    '团队依托海南师范大学信息科学技术学院与经济与管理学院的优质师资资源，聘请三位在人工智能、计算机科学及经济管理领域深耕多年的资深专家担任项目高级顾问，覆盖技术研发、深度学习、商业落地与战略规划等核心维度，实现"产学研"的深度融合，为项目发展提供坚实的学术支撑与行业指导。': "团队依托海南师范大学信息科学技术学院与经济与管理学院的优质师资资源，聘请三位在人工智能、计算机科学及经济管理领域深耕多年的资深专家担任项目高级顾问，覆盖高光谱数据建模、深度学习优化、商业落地与战略规划等核心维度，为橙类产品等级识别、产地溯源、平台落地和区域合作提供持续的学术支撑与行业指导。",
    "顾问职责：刘波老师将充分发挥其在复杂数据建模与AI算法领域的深厚积累，为本项目AI算法优化、高光谱数据建模提供全程学术指导，重点协助团队攻克复杂饮料基质抗干扰处理、特征波长精准筛选等核心技术难题。同时，他将协助对接海南师范大学重点实验室资源，为项目技术研发提供实验设备保障与学术支撑，有力推动项目技术成果的持续深化与迭代升级。": "顾问职责：刘波老师将充分发挥其在复杂数据建模与AI算法领域的深厚积累，为本项目高光谱数据建模、产地溯源识别和等级划分算法优化提供全程学术指导，重点协助团队攻克跨批次样本干扰处理、关键波段筛选和模型稳健性提升等核心技术难题。同时，他将协助对接海南师范大学重点实验室资源，为项目技术研发提供实验设备保障与学术支撑，推动项目技术成果持续深化与迭代升级。",
    "顾问职责：龙海侠教授将凭借其在深度学习模型研发与AI产业化方面的丰富经验，为本项目深度学习检测模型的架构设计、训练策略与技术路线规划提供战略层面的高水平指导。同时，她将积极协助项目对接行业资源与产业合作平台，为项目商业化落地路径、行业标准对接与知识产权布局提供专业建议，全面提升项目的技术竞争力与商业转化潜力。": "顾问职责：龙海侠教授将凭借其在深度学习模型研发与AI产业化方面的丰富经验，为本项目等级识别、产地溯源和品质分析模型的架构设计、训练策略与技术路线规划提供高水平指导。同时，她将协助项目对接行业资源与产业合作平台，为平台迭代、知识产权布局和后续场景落地提供专业建议，全面提升项目的技术竞争力与商业转化潜力。",
    "顾问职责：​ 程明雄副教授将结合其在供应链管理与区域经济领域的专业积累，为本项目商业化落地的市场布局规划、供应链体系搭建与县域及区域市场拓展策略提供专业指导，并协助开展项目财务规划与经济效益分析。依托其对海南本土产业生态与政策环境的深刻理解，助力团队优化商业推广路径与产业落地策略，推动项目实现高效的市场化与产业化进程。": "顾问职责：程明雄副教授将结合其在供应链管理与区域经济领域的专业积累，为本项目在果园、合作社、分选中心、品牌运营方和渠道采购方等场景中的商业化落地提供专业指导，并协助开展项目财务规划与经济效益分析。依托其对海南本土产业生态与政策环境的深刻理解，助力团队优化区域合作路径、供应链协同方案和产业落地策略，推动项目实现高效的市场化与产业化进程。",
    "团队核心成员均来自海南师范大学相关专业，以人工智能、软件工程、计算机科学与技术为专业背景，兼具算法研发、工程开发、市场运营、财务管理等多元能力。成员平均拥有2项以上学科竞赛国家级/省级奖项，部分核心成员曾参与企业级AI应用落地、大数据处理等实战项目，具备扎实的理论基础与丰富的实践经验。团队成员优势互补、凝聚力强，深耕高光谱与食品安全检测交叉领域，对行业痛点与技术转化需求有深刻理解，为项目研发与商业化落地提供坚实的人才支撑。": "团队核心成员均来自海南师范大学相关专业，以人工智能、软件工程、计算机科学与技术为专业背景，兼具算法研发、工程开发、市场运营、财务管理等多元能力。成员平均拥有2项以上学科竞赛国家级/省级奖项，部分核心成员曾参与企业级AI应用落地、大数据处理等实战项目，具备扎实的理论基础与丰富的实践经验。团队成员优势互补、凝聚力强，围绕高光谱分析、农产品数字化与平台化交付持续协同，为橙源智鉴的研发、试点与后续落地提供坚实的人才支撑。",
    '在本项目中，他结合AI基础设施预研与多源数据处理的实战经验，全面负责项目战略规划与团队统筹管理，同时主导基于高光谱技术的底层算法构建与智能检测逻辑开发，致力于攻克非结构化光谱数据解析难题，实现饮料色素的精准识别与自动化分析。他秉持"以技术驱动创新"的理念，立志在软件工程与人工智能交叉领域持续深耕探索。': "在本项目中，他结合AI基础设施预研与多源数据处理的实战经验，全面负责项目战略规划与团队统筹管理，同时主导基于高光谱技术的底层算法构建与智能分析逻辑开发，重点推进橙类产品等级识别、产地溯源和品质分析等核心能力落地，推动平台从样本数据走向实际场景应用。",
    "他精通Python、C++、Java等多门编程语言，具备良好的算法思维与工程实现能力，擅长将理论知识融入实际专业场景。在本项目中，他发挥算法实现与后端开发方面的核心优势，主要负责高光谱数据的特征提取与物理模型转化工作，通过高效严谨的逻辑编写，确保检测系统在处理复杂饮料成分时的稳定性与识别准确性，为项目技术核心提供坚实支撑。": "他精通Python、C++、Java等多门编程语言，具备良好的算法思维与工程实现能力，擅长将理论知识融入实际专业场景。在本项目中，他发挥算法实现与后端开发方面的核心优势，主要负责高光谱数据的特征提取、指标建模与分析服务开发，通过高效严谨的逻辑编写，确保系统在处理不同产地、不同批次橙类样本时保持稳定性与识别准确性，为项目技术核心提供坚实支撑。",
    "在本项目中，他主要负责系统各功能模块的集成开发与前端功能实现，利用其全栈开发基础确保高光谱采集终端与后端分析系统的高效对接，重点保障系统在实际检测场景中的流畅运行与功能完整闭环。他希望通过持续的项目实践不断积累软件开发经验，向更高阶的工程能力迈进。": "在本项目中，他主要负责系统各功能模块的集成开发与前端功能实现，利用其全栈开发基础推进上传分析、结果展示、历史回看和报告导出等功能的高效衔接，重点保障平台在试点场景中的流畅运行与功能完整闭环。他希望通过持续的项目实践不断积累软件开发经验，向更高阶的工程能力迈进。",
    "在技术方向上，他掌握Java、Python等编程语言，熟悉前后端全栈开发，并具备UE虚拟交互与AR增强现实技术的开发能力，技术栈覆盖面广。在本项目中，他利用出色的执行力与跨平台开发经验，主导检测平台的全栈架构设计与数据可视化交互界面开发，致力于通过虚拟交互技术优化高光谱检测结果的呈现方式，提升用户的操作体验与系统易用性，立志在前沿技术领域持续深耕。": "在技术方向上，他掌握Java、Python等编程语言，熟悉前后端全栈开发，并具备UE虚拟交互与AR增强现实技术的开发能力，技术栈覆盖面广。在本项目中，他利用出色的执行力与跨平台开发经验，主导平台的全栈架构设计与数据可视化交互界面开发，致力于通过更直观的结果呈现方式优化橙类样本分析、产地对比和品质报告展示效果，提升用户操作体验与系统易用性。",
    "在本项目中，她负责市场调研与商业推广策略的制定，结合高光谱检测技术的应用前景，深入开展针对饮料生产企业及食品监管部门的需求分析，精准识别目标客户的核心痛点与采购决策逻辑。她致力于通过系统化的品牌传播与渠道拓展行动，提升项目的市场影响力与商业转化潜力，在实践中持续提升自身的综合业务水平。": "在本项目中，她负责市场调研与商业推广策略的制定，围绕果园、合作社、分选中心、品牌运营方和渠道采购方等目标客户开展需求分析，精准识别橙类产品在分级、验货、溯源和品牌表达中的核心痛点与决策逻辑。她致力于通过系统化的品牌传播与渠道拓展行动，提升项目的市场影响力与商业转化潜力，在实践中持续提升自身的综合业务水平。",
    "在本项目中，他主要负责底层算法的调优与逻辑验证工作，协助项目负责人攻克高光谱数据在不同饮料介质下的识别精度难题。通过持续的技术实践与迭代测试，他致力于提升系统的技术深度，确保色素智能检测逻辑的严密性与科学性，为系统整体检测精度的提升做出贡献。": "在本项目中，他主要负责底层算法的调优与逻辑验证工作，协助项目负责人提升高光谱数据在不同产地、不同批次橙类样本下的识别精度与模型稳健性。通过持续的技术实践与迭代测试，他致力于提升系统的技术深度，确保等级识别和产地溯源逻辑的严密性与科学性，为系统整体分析精度的提升做出贡献。",
    '在本项目中，他负责团队的日常运营管理、项目进度跟踪及文档质量把控，协调各部门间的沟通协作，确保信息传递畅通、任务推进有序。通过精准的流程管理与细致的行政支持，他致力于保障高光谱检测项目按计划节点稳步推进，同时负责各类申报材料的规范整理与质量审核，为项目对外展示与竞赛评审提供有力支撑。': "在本项目中，他负责团队的日常运营管理、项目进度跟踪及文档质量把控，协调各部门间的沟通协作，确保信息传递畅通、任务推进有序。通过精准的流程管理与细致的行政支持，他致力于保障橙源智鉴项目按计划节点稳步推进，同时负责各类申报材料、试点文档和对外展示材料的规范整理与质量审核，为项目落地与竞赛评审提供有力支撑。",
    "在本项目中，他负责项目的财务规划、成本控制及资源对接工作，结合编程技术实现项目经费的精细化与自动化管理，有效提升财务工作效率与数据透明度。他秉持热心学习的态度，通过保障项目研发资金的高效运作，协助团队完成各项竞赛申报与商业落地的资金准备工作。": "在本项目中，他负责项目的财务规划、成本控制及资源对接工作，围绕样本采集、理化标定、平台运维和试点实施等环节推进经费的精细化管理，有效提升财务工作效率与数据透明度。他秉持热心学习的态度，通过保障项目研发与试点资金的高效运作，协助团队完成竞赛申报、样本补强和后续落地所需的资金准备工作。",
    "团队成员涵盖AI算法、全栈开发、高光谱数据处理、市场运营、财务管理、行政统筹等多元专业能力，精准匹配高光谱AI检测项目“技术研发—商业落地—运营保障”全流程需求。各模块成员在专业背景上形成有效互补，在项目推进中实现高效协同联动，充分发挥“1+1>2”的团队协作效应。": "团队成员涵盖AI算法、全栈开发、高光谱数据处理、市场运营、财务管理、行政统筹等多元专业能力，能够完整覆盖橙源智鉴“样本采集—模型训练—平台开发—试点交付—运营保障”的全流程需求。各模块成员在专业背景上形成有效互补，在项目推进中实现高效协同联动，充分发挥团队协作优势。",
    "依托海南师范大学信息科学技术学院的优质师资与实验室资源，刘波、龙海侠、程明雄等专家教授全程参与指导，从AI算法优化到商业化策略制定，覆盖项目发展的核心维度。团队同步对接高校重点实验室、创新创业基金、科技园孵化器等多元资源，为技术研发提供实验设备保障、学术支撑与资金保障，有效加速技术成果从实验室到商业化场景的转化落地。": "依托海南师范大学信息科学技术学院的优质师资与实验室资源，刘波、龙海侠、程明雄等专家教授全程参与指导，从高光谱数据建模到商业化策略制定，覆盖项目发展的核心维度。团队同步对接高校重点实验室、创新创业基金、科技园孵化器等多元资源，为样本建设、模型训练、平台迭代和试点落地提供实验设备保障、学术支撑与资金保障。",
    "核心成员均拥有学科竞赛国家级/省级奖项，部分成员具备企业级AI项目实战经验，能够精准把握行业痛点与技术转化需求。在算法研发、系统开发、商业策划等方面具备较强的创新能力与问题解决能力，适配初创项目快速迭代、灵活响应的发展节奏，能够在资源有限的条件下高效推动项目向前推进。": "核心成员均拥有学科竞赛国家级/省级奖项，部分成员具备企业级AI项目实战经验，能够较好把握场景痛点与技术转化需求。在算法研发、系统开发、商业策划等方面具备较强的创新能力与问题解决能力，适配橙类智能分析项目快速迭代、灵活响应的发展节奏，能够在资源有限的条件下高效推动项目向前推进。",
    "团队扎根海南，深刻理解海南自贸港热带饮料产业（椰子汁、芒果汁、茶饮等）的发展特点与检测痛点，能够针对性优化检测算法与产品方案，使技术解决方案更贴近本地市场的实际应用场景。同时，团队依托海南师范大学科技园孵化器、海口市数字经济协会等本土资源，具备快速对接海南本地饮料企业与食品监管机构的渠道优势，为项目本土化深度落地与后续全国复制推广奠定坚实基础。": "团队扎根海南，较为熟悉本地特色果品产业的发展特点与数字化需求，能够围绕澄迈福橙、琼中绿橙等对象持续优化样本策略、分析模型与产品方案，使技术解决方案更贴近本地市场的实际应用场景。同时，团队依托海南师范大学科技园孵化器及相关本土资源，具备快速对接产区、合作社、品牌主体与区域服务机构的条件，为项目本土化落地与后续复制推广奠定基础。",
}


def build_from_base() -> Path:
    if not BASE_DOCM_PATH.exists():
        raise FileNotFoundError(f"Base docm not found: {BASE_DOCM_PATH}")

    OUTPUT_DOCM_PATH.unlink(missing_ok=True)
    shutil.copy2(BASE_DOCM_PATH, OUTPUT_DOCM_PATH)

    with tempfile.TemporaryDirectory(prefix="chengyuan_docm_") as tmpdir:
        tmpdir_path = Path(tmpdir)
        replacements_path = tmpdir_path / "chapter8_replacements.json"
        replacements_path.write_text(
            json.dumps(REPLACEMENTS, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        expected = len(REPLACEMENTS)
        patch_script_path = tmpdir_path / "patch_chapter8.ps1"
        powershell = f"""
$ErrorActionPreference = "Stop"
$outputPath = '{str(OUTPUT_DOCM_PATH)}'
$mapPath = '{str(replacements_path)}'
$expected = {expected}

function Normalize-ParagraphText([string]$text) {{
    if ($null -eq $text) {{
        return ""
    }}

    $normalized = $text.Replace("`r", "").Replace([string][char]7, "")
    $normalized = $normalized.Replace([string][char]11, "").Replace([string][char]12, "")
    $normalized = $normalized.Replace([string][char]160, " ").Replace([string][char]8203, "")
    $normalized = $normalized.Replace([string][char]65279, "")
    $normalized = $normalized.Replace([string][char]0x201C, [string][char]34)
    $normalized = $normalized.Replace([string][char]0x201D, [string][char]34)
    $normalized = $normalized.Replace([string][char]0x2018, [string][char]39)
    $normalized = $normalized.Replace([string][char]0x2019, [string][char]39)
    $normalized = [regex]::Replace($normalized, "\\s+", " ").Trim()
    return $normalized
}}

function Apply-ParagraphStyle(
    $range,
    [string]$fontName,
    [double]$fontSize,
    [int]$bold,
    [double]$firstLineIndent,
    [double]$leftIndent,
    [double]$spaceBefore,
    [double]$spaceAfter,
    [int]$alignment,
    [int]$lineSpacingRule,
    [double]$lineSpacing
) {{
    $font = $range.Font
    $paragraphFormat = $range.ParagraphFormat
    $font.Name = $fontName
    $font.NameFarEast = $fontName
    $font.Size = $fontSize
    $font.Bold = $bold
    $font.Italic = 0
    $paragraphFormat.FirstLineIndent = $firstLineIndent
    $paragraphFormat.LeftIndent = $leftIndent
    $paragraphFormat.SpaceBefore = $spaceBefore
    $paragraphFormat.SpaceAfter = $spaceAfter
    $paragraphFormat.Alignment = $alignment
    $paragraphFormat.LineSpacingRule = $lineSpacingRule
    $paragraphFormat.LineSpacing = $lineSpacing
}}

$sourceMap = Get-Content -LiteralPath $mapPath -Raw -Encoding UTF8 | ConvertFrom-Json
$map = @{{}}
foreach ($property in $sourceMap.PSObject.Properties) {{
    $normalizedKey = Normalize-ParagraphText([string]$property.Name)
    if ($map.ContainsKey($normalizedKey)) {{
        throw "Duplicate normalized replacement key detected: $normalizedKey"
    }}
    $map[$normalizedKey] = [string]$property.Value
}}

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$document = $null
$replaced = 0
$matched = New-Object 'System.Collections.Generic.HashSet[string]'
$chapter8Started = $false
try {{
    $document = $word.Documents.Open($outputPath, $false, $false)
    foreach ($para in $document.Paragraphs) {{
        $text = Normalize-ParagraphText([string]$para.Range.Text)
        if (-not $text) {{
            continue
        }}

        if (-not $chapter8Started) {{
            if ($text -eq "：团队介绍" -or $text -eq "第八章：团队介绍") {{
                $chapter8Started = $true
            }}
            continue
        }}

        if ($text -eq "第九章：财务预测") {{
            break
        }}

        if ($map.ContainsKey($text)) {{
            $range = $para.Range.Duplicate
            if ($range.End -gt $range.Start) {{
                $range.End = $range.End - 1
            }}
            $range.Text = $map[$text]
            $replaced++
            $matched.Add($text) | Out-Null
        }}
    }}

    $missing = @()
    foreach ($key in $map.Keys) {{
        if (-not $matched.Contains($key)) {{
            $missing += $key
        }}
    }}

    if ($replaced -ne $expected -or $missing.Count -ne 0) {{
        Write-Output "REPLACED=$replaced"
        Write-Output "EXPECTED=$expected"
        foreach ($item in $missing) {{
            Write-Output "MISSING::$item"
        }}
        throw "Chapter 8 replacement incomplete."
    }}

    $chapter8Started = $false
    foreach ($para in $document.Paragraphs) {{
        $text = Normalize-ParagraphText([string]$para.Range.Text)
        if (-not $text) {{
            continue
        }}

        if (-not $chapter8Started) {{
            if ($text -eq "：团队介绍" -or $text -eq "第八章：团队介绍") {{
                $chapter8Started = $true
            }}
            else {{
                continue
            }}
        }}

        if ($text -eq "第九章：财务预测") {{
            break
        }}

        $range = $para.Range.Duplicate
        if ($range.End -gt $range.Start) {{
            $range.End = $range.End - 1
        }}

        if ($text -eq "：团队介绍" -or $text -eq "第八章：团队介绍") {{
            $range.Text = "第八章：团队介绍"
            Apply-ParagraphStyle $para.Range "黑体" 16 0 0 0 0 8 0 1 18
            continue
        }}

        if ($text -match '^8\\.\\d+\\s') {{
            Apply-ParagraphStyle $para.Range "黑体" 15 0 28 0 0 8 0 1 18
            continue
        }}

        if ($text -match '^8\\.\\d+\\.\\d+\\s' -or $text -match '^（\\d+）') {{
            Apply-ParagraphStyle $para.Range "黑体" 14 0 28 0 0 8 0 1 18
            continue
        }}

        if ($text -eq '图8-1 组织架构' -or $text -eq '/') {{
            continue
        }}

        if ([double]$para.Range.Font.Size -ge 13.5) {{
            Apply-ParagraphStyle $para.Range "宋体" 14 0 28 0 0 8 3 1 18
        }}
    }}

    $document.Save()
}}
finally {{
    if ($document -ne $null) {{
        $document.Close()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($document) | Out-Null
    }}
    if ($word -ne $null) {{
        $word.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    }}
}}
"""
        patch_script_path.write_text(powershell, encoding="utf-8-sig")
        try:
            subprocess.run(
                [
                    "powershell",
                    "-NoProfile",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-File",
                    str(patch_script_path),
                ],
                check=True,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
            )
        except subprocess.CalledProcessError as exc:
            raise RuntimeError(
                "PowerShell patch failed.\n"
                f"stdout:\n{exc.stdout}\n"
                f"stderr:\n{exc.stderr}"
            ) from exc

    return OUTPUT_DOCM_PATH


def main() -> None:
    output = build_from_base()
    print(output)


if __name__ == "__main__":
    main()
