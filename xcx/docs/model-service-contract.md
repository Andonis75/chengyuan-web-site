# Python 模型服务接口契约

当前小程序后端支持通过 HTTP 调用独立 Python 模型服务。

默认样例服务目录：

- [main.py](D:/Projects/chengyuan-web/xcx/model-service/app/main.py)

## 1. 健康检查

### `GET /health`

响应示例：

```json
{
  "status": "ok",
  "provider": "PYTHON_HTTP",
  "version": "python-http-demo-1.0.0"
}
```

## 2. 预测接口

### `POST /predict`

请求体示例：

```json
{
  "taskType": "COMPARE",
  "sample": {
    "sampleCode": "CM-1",
    "status": "WARNING",
    "origin": {
      "code": "CM",
      "name": "澄迈福橙",
      "region": "海南澄迈"
    },
    "metrics": {
      "ssc": 7.35,
      "ta": 0.69,
      "ratio": 10.65,
      "vc": 46.574
    },
    "collectedAt": "2026-03-01T02:00:00.000Z"
  },
  "compareSample": {
    "sampleCode": "CM-2",
    "status": "NORMAL",
    "origin": {
      "code": "CM",
      "name": "澄迈福橙",
      "region": "海南澄迈"
    },
    "metrics": {
      "ssc": 8.12,
      "ta": 0.63,
      "ratio": 12.89,
      "vc": 48.201
    },
    "collectedAt": "2026-03-02T02:00:00.000Z"
  }
}
```

响应示例：

```json
{
  "provider": "PYTHON_HTTP",
  "version": "python-http-demo-1.0.0",
  "predictedOrigin": "澄迈福橙",
  "confidence": 0.89,
  "predictedSsc": 7.35,
  "predictedTa": 0.69,
  "predictedRatio": 10.65,
  "predictedVc": 46.574,
  "aiSummary": "Python 模型对比分析完成：CM-1 与 CM-2 在糖酸结构上存在差异，建议分批管理。"
}
```

## 3. Node 后端对接变量

可参考 [`.env.example`](D:/Projects/chengyuan-web/xcx/server/.env.example)：

```env
MODEL_PROVIDER="PYTHON_HTTP"
PYTHON_MODEL_BASE_URL="http://127.0.0.1:8010"
PYTHON_MODEL_PREDICT_PATH="/predict"
PYTHON_MODEL_HEALTH_PATH="/health"
PYTHON_MODEL_TIMEOUT_MS=10000
PYTHON_MODEL_API_KEY=""
```

## 4. 设计说明

- 当前 Node 后端在 `MODEL_PROVIDER=MOCK` 时仍保持原有 mock 推理能力
- 当 `MODEL_PROVIDER=PYTHON_HTTP` 时，`/api/model/predict/preview` 与分析任务都会切到 Python 服务
- 当前样例服务用于联调验证，后续可替换为真实模型推理实现
