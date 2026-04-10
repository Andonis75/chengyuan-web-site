# 小程序后端阶段进度

更新时间：2026-04-08

## 已完成

- 完成 `xcx/server` 独立后端工程初始化。
- 完成 Prisma 数据模型与本地 SQLite 开发库打通。
- 完成种子数据导入，当前已落入样本、分析任务、分析结果、报告和光谱文件数据。
- 完成微信登录占位接口，支持开发模式回退。
- 完成首页总览、洞察、产地、样本列表、样本详情接口。
- 完成分析任务创建、分析结果查询、报告读取接口。
- 完成用户中心基础接口。
- 完成历史任务列表接口，支持分页与条件筛选。
- 完成本地文件上传接口，支持将光谱文件写入 `uploads/` 并落库 metadata。
- 完成模型运行时预留层，当前使用 mock provider，后续可切换到 Python HTTP 模型服务。
- 完成后端本地构建、建库、seed 与接口联调验证。
- 完成模型预览与文件上传链路的阶段性验收，已覆盖成功和异常分支。
- 完成报告 PDF 导出接口，支持按既有报告动态生成并下载 PDF。
- 完成 Prisma SQLite / MySQL 双目标切换脚本，补齐 MySQL 初始化命令与使用说明。
- 完成目标库感知的 seed 流程，切换 SQLite / MySQL 时会先生成对应 Prisma Client。
- 完成 Python HTTP 模型服务接入，支持 Node 后端切换到独立 Python 推理服务。
- 完成 `xcx/model-service` Python 服务样例，补齐健康检查与预测接口。
- 完成基础鉴权与会话校验，登录后可获得签名 `sessionToken`。
- 完成用户归属访问控制，用户中心、分析任务、分析结果、报告、文件上传已要求登录并校验归属。
- 完成异步任务状态流转，`POST /api/analysis/tasks` 已支持 `PENDING -> RUNNING -> SUCCESS/FAILED`。
- 完成服务启动后的任务恢复机制，可自动重试未完成的 `PENDING / RUNNING` 任务。
- 完成本地文件存储抽象层首版，文件下载已切换为带鉴权的后端接口。
- 完成文件下载地址下发，文件列表、文件详情、样本详情已返回 `downloadUrl`。
- 完成小程序端分析流程升级：分析页已补充光谱文件上传入口，并在未上传文件时禁止直接发起分析。
- 完成小程序端独立“分析中”页面，支持动画展示与任务轮询，分析完成后自动跳转结果页。
- 完成报告结构升级：新生成报告已包含产地结论、核心指标推荐区间、综合评级与分析建议，报告页与 PDF 导出同步适配。

## 当前接口范围

- `POST /api/auth/wechat/login`
- `GET /api/home`
- `GET /api/insights`
- `GET /api/profile`
- `GET /api/origins`
- `GET /api/samples`
- `GET /api/samples/:sampleCode`
- `POST /api/analysis/scan`
- `POST /api/analysis/tasks`
- `GET /api/analysis/tasks`
- `GET /api/analysis/tasks/:taskId`
- `GET /api/analysis/results/:resultId`
- `GET /api/reports/:reportId`
- `GET /api/reports/:reportId/pdf`
- `GET /api/model/config`
- `POST /api/model/predict/preview`
- `POST /api/files/upload`
- `GET /api/files`
- `GET /api/files/:fileId`
- `GET /api/files/:fileId/download`

## 当前状态判断

第一阶段目标已完成：

- 数据库表已明确并落地为 Prisma schema
- 后端基础工程已搭建完成
- 认证、样本、洞察、分析主链路接口已可用
- 种子数据已建立并验证成功

第二阶段后端支撑已完成：

- 用户中心接口已补齐
- 历史任务接口已补齐
- 已具备给前端并行联调的基础条件

第三阶段后端预研已启动：

- 文件上传接口已可用
- 模型服务调用层已抽象
- 已支持通过 `MODEL_PROVIDER=PYTHON_HTTP` 切换到 Python 服务
- 当前仍是同步调用模式，后续可继续演进为异步真实模型服务
- 报告 PDF 导出链路已补齐，当前为动态生成模式
- MySQL 切换脚本与命令已补齐，当前默认开发环境仍保持 SQLite

第四阶段后端安全收口已完成首版：

- 微信登录后可返回带过期时间的会话 token
- `Authorization: Bearer <sessionToken>` 已接入用户中心、分析、报告、上传接口
- 已补齐跨用户任务、结果、报告访问限制

第五阶段任务执行机制已完成首版：

- `POST /api/analysis/tasks` 已改为异步受理，创建时返回 `202`
- 任务详情与任务列表可用于轮询 `taskStatus`、`progress`、`errorMessage`
- `analysis/scan` 仍保留同步快捷分析能力，兼容详情页快速触发场景

第六阶段文件访问控制已完成首版：

- 已移除公开 `/uploads` 静态暴露
- 已增加 `GET /api/files/:fileId/download`
- 文件上传与文件下载均已接入登录校验

第七阶段小程序分析闭环升级已完成首版：

- 分析页已支持查看当前样本已上传文件数量
- 分析前已要求先完成光谱文件上传
- 任务提交后会进入独立“分析中”动画页，而不是停留在原页 Toast 轮询
- 结果页已补充 A/B/C 综合评级与指标推荐区间
- 报告页已升级为结构化分析报告展示，不再只显示原始 JSON 文本

### 2026-04-08 阶段验收记录

- `npx prisma generate --no-engine` 通过
- `npx prisma db push` 通过
- `npm run db:seed` 通过
- `npm run build` 通过
- `GET /api/model/config` 联调通过
- `POST /api/model/predict/preview` 联调通过，已验证单样本、对比样本、缺少对比样本、单样本误传对比样本、对比样本不存在等分支
- `POST /api/files/upload` 联调通过，已验证有效上传与无效样本上传失败清理
- `GET /api/files` 与 `GET /api/files/:fileId` 联调通过
- `GET /api/samples/:sampleCode` 已确认返回文件列表与最新上传结果
- `GET /api/reports/:reportId/pdf` 联调通过，已验证 PDF 响应头、文件签名与导出文件生成
- `npm run prisma:generate`、`npm run db:push` 在 SQLite 目标下验证通过
- `npm run db:seed` 在 SQLite 目标下验证通过，当前样本 / 任务 / 报告种子数据恢复正常
- `npm run prisma:generate:mysql` 已在 MySQL 目标 schema 下验证通过，且不会改写仓库默认的 SQLite `schema.prisma`
- Python 模型服务样例已完成 `python -m compileall` 验证
- `MODEL_PROVIDER=PYTHON_HTTP` 下已联调通过 `GET /api/model/config`
- `MODEL_PROVIDER=PYTHON_HTTP` 下已联调通过 `POST /api/model/predict/preview`
- `MODEL_PROVIDER=PYTHON_HTTP` 下已联调通过 `POST /api/analysis/tasks` 与任务详情读取
- 登录接口已联调通过，已验证 `sessionToken` 与 `expiresAt` 返回
- 未登录访问 `GET /api/profile` 会返回 `401`
- 已登录访问 `GET /api/profile`、`POST /api/analysis/tasks`、`GET /api/reports/:reportId`、`POST /api/files/upload` 已联调通过
- 已验证跨用户访问任务、结果、报告时返回 `403`
- 已验证未登录上传返回 `401`，登录上传返回 `201`
- `POST /api/analysis/tasks` 已联调通过，当前返回 `202 + PENDING`
- 已验证任务详情轮询可读取异步任务的终态 `SUCCESS` 与生成后的 `resultId/reportId`
- 已验证任务列表可返回 `taskStatus`、`progress`、`errorMessage`
- 已验证公开 `/uploads/...` 访问返回 `404`
- `GET /api/files/:fileId/download` 已验证未登录返回 `401`
- `GET /api/files/:fileId/download` 已验证登录下载成功
- `GET /api/files`、`GET /api/files/:fileId`、`GET /api/samples/:sampleCode` 已验证返回 `downloadUrl`

## 待继续项

- 若进入生产部署，可继续把进程内异步执行升级为独立 worker / 队列
- 若进入生产部署，可继续把本地文件存储驱动升级为对象存储

## 联调说明

当前后端已经适合先和前端并行联调页面与交互。

如果前端由 Gemini 开发，建议优先接：

1. 登录
2. 首页
3. 用户中心
4. 样本列表
5. 样本详情
6. 文件上传
7. 历史任务列表
8. 分析任务创建
9. 结果详情与报告详情
10. 模型配置与预览接口
