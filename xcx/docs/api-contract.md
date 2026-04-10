# 微信小程序后端 API 契约

这份文档用于前后端并行开发。

- 小程序前端可以按这里直接联调
- 后端实现以这里为准
- 返回结构统一使用 JSON

基础约定：

- Base URL: `/api`
- 时间格式：ISO 8601 字符串
- 成功返回：HTTP 2xx
- 失败返回：HTTP 4xx/5xx + `message`

会话约定：

- `POST /api/auth/wechat/login` 成功后会返回 `sessionToken`
- 需要登录态的接口请在请求头中携带

```text
Authorization: Bearer <sessionToken>
```

统一错误结构：

```json
{
  "message": "Invalid request payload.",
  "issues": {}
}
```

## 1. 健康检查

### `GET /api/health`

响应：

```json
{
  "status": "ok"
}
```

## 2. 微信登录

### `POST /api/auth/wechat/login`

请求体：

```json
{
  "code": "wx-login-code",
  "nickname": "张三",
  "avatarUrl": "https://example.com/avatar.png"
}
```

说明：

- 正式环境用真实微信 `code`
- 本地开发允许传 `dev-local`

响应补充：

- 返回 `sessionToken`
- 返回 `expiresAt`

## 3. 首页与洞察

### `GET /api/home`

返回首页卡片、产地概览、质量分布和近期分析记录。

### `GET /api/insights`

返回产地排行、趋势摘要、质量分组和推荐结论。

## 4. 用户中心

### `GET /api/profile`

说明：

- 需要登录态
- 前端下载文件时请优先使用 `downloadUrl`，不要直接依赖 `storagePath`
- 当前直接根据会话身份返回当前用户

## 5. 产地与样本

### `GET /api/origins`

返回产地下拉数据。

### `GET /api/samples`

查询参数：

- `keyword`
- `originCode`
- `status`
- `page`
- `pageSize`

响应包含：

- `items`
- `pagination`
- `filters`

每条样本当前额外包含：

- `analysisCount`
- `fileCount`

### `GET /api/samples/:sampleCode`

响应包含：

- 样本基础信息
- 产地信息
- 已上传文件列表 `files`
- 最近分析结果列表 `analyses`

## 6. 文件上传

### `POST /api/files/upload`

请求类型：

- `multipart/form-data`

表单字段：

- `sampleCode` 必填
- `file` 必填
- `wavelengthStart` 可选
- `wavelengthEnd` 可选
- `bandCount` 可选

说明：

- 需要登录态

响应示例：

```json
{
  "file": {
    "id": "file_xxx",
    "fileName": "1775626000000-spectrum.csv",
    "originalName": "CM-1-spectrum.csv",
    "mimeType": "text/csv",
    "fileSize": 12840,
    "storagePath": "/uploads/1775626000000-spectrum.csv",
    "downloadUrl": "/api/files/file_xxx/download",
    "uploadedAt": "2026-04-08T05:30:00.000Z"
  }
}
```

### `GET /api/files?sampleCode=CM-1`

返回指定样本的文件列表。

说明：

- 每个文件项都会返回 `downloadUrl`
- 前端下载文件时请优先使用 `downloadUrl`

### `GET /api/files/:fileId`

返回单个文件 metadata 和所属样本信息。

说明：

- 返回中包含 `downloadUrl`
- 前端下载文件时请优先使用 `downloadUrl`

### `GET /api/files/:fileId/download`

说明：

- 需要登录态
- 当前走本地存储驱动读取文件
- 返回文件流，适合小程序端下载或预览

## 7. 模型运行时预留接口

### `GET /api/model/config`

返回当前模型运行时配置。

响应示例：

```json
{
  "provider": "PYTHON_HTTP",
  "mode": "python_http",
  "supportsFileUpload": true,
  "supportsCompareAnalysis": true,
  "supportsAsyncTasks": false,
  "version": "python-http-demo-1.0.0",
  "healthy": true,
  "endpoint": "http://127.0.0.1:8010/predict",
  "timeoutMs": 10000
}
```

### `POST /api/model/predict/preview`

请求体：

```json
{
  "sampleCode": "CM-1",
  "compareSampleCode": "QZ-1",
  "taskType": "COMPARE"
}
```

说明：

- 用于前端做“分析前预览”
- 当前会根据后端运行时配置走 `MOCK` 或 `PYTHON_HTTP`
- 当 `taskType` 为 `COMPARE` 时，必须同时传 `compareSampleCode`
- 当 `taskType` 为 `SINGLE` 时，不允许再传 `compareSampleCode`

响应示例：

```json
{
  "prediction": {
    "provider": "PYTHON_HTTP",
    "version": "python-http-demo-1.0.0",
    "taskType": "COMPARE",
    "predictedOrigin": "澄迈福橙",
    "confidence": 0.89,
    "predictedSsc": 7.35,
    "predictedTa": 0.69,
    "predictedRatio": 10.65,
    "predictedVc": 46.574,
    "aiSummary": "Python 模型对比分析完成：CM-1 与 CM-2 在糖酸结构上存在差异，建议分批管理。"
  }
}
```

## 8. 快速分析

### `POST /api/analysis/scan`

请求体：

```json
{
  "sampleCode": "CM-1",
  "userId": "user_xxx"
}
```

说明：

- 用于快速触发单样本分析
- 返回结果 ID 和任务 ID，适合详情页直接联调
- 需要登录态
- 如果请求体里继续传 `userId`，则必须与当前登录用户一致

## 9. 创建分析任务

### `POST /api/analysis/tasks`

请求体：

```json
{
  "sampleCode": "CM-1",
  "compareSampleCode": "QZ-1",
  "userId": "user_xxx",
  "taskType": "COMPARE"
}
```

说明：

- `compareSampleCode` 可选
- 不传时默认为单样本任务
- 当 `taskType` 为 `COMPARE` 时，必须同时传 `compareSampleCode`
- 当 `taskType` 为 `SINGLE` 时，不允许再传 `compareSampleCode`
- 需要登录态
- 如果请求体里继续传 `userId`，则必须与当前登录用户一致
- 当前为异步任务入口，创建成功后请根据 `taskId` 继续轮询任务详情

响应示例：

```json
{
  "taskId": "task_xxx",
  "taskNo": "TASK-1775624907601",
  "taskStatus": "PENDING",
  "progress": 0,
  "resultId": null,
  "reportId": null,
  "createdAt": "2026-04-08T05:08:27.602Z"
}
```

## 10. 历史任务列表

### `GET /api/analysis/tasks`

查询参数：

- `taskStatus`
- `taskType`
- `sampleCode`
- `page`
- `pageSize`

说明：

- 需要登录态
- 当前只返回当前登录用户自己的任务
- 列表项包含 `taskStatus`、`progress`、`errorMessage`，适合轮询状态

## 11. 任务详情

### `GET /api/analysis/tasks/:taskId`

响应包含：

- 任务基础信息
- 发起人
- 主样本与对比样本
- 结果摘要
- 关联报告 ID 列表

说明：

- 需要登录态
- 仅允许访问当前登录用户自己的任务
- 任务执行失败时可从 `errorMessage` 读取失败原因

## 12. 结果详情

### `GET /api/analysis/results/:resultId`

响应包含：

- 预测产地
- 置信度
- 预测指标
- AI 文本摘要
- 主样本与对比样本信息

说明：

- 需要登录态
- 仅允许访问当前登录用户自己的分析结果

## 13. 报告详情

### `GET /api/reports/:reportId`

响应包含：

- 报告基础信息
- 任务关联信息
- `pdfExportUrl`
- 报告内容字符串

说明：

- 需要登录态
- 仅允许访问当前登录用户自己的报告

### `GET /api/reports/:reportId/pdf`

说明：

- 按当前报告详情动态生成 PDF
- 不会改变原有 `GET /api/reports/:reportId` 的 JSON 返回语义
- 成功时返回 `application/pdf`
- 需要登录态

响应头示例：

```text
Content-Type: application/pdf
Content-Disposition: attachment; filename*=UTF-8''CM-1-single-report.pdf
```

## 14. 前端联调建议

Gemini 侧建议优先接以下接口：

1. 登录
2. 首页
3. 用户中心
4. 样本列表
5. 样本详情
6. 文件上传
7. 历史任务列表
8. 创建分析任务
9. 结果详情
10. 报告详情
11. 模型配置与预览接口
