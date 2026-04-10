# Python Model Service

这个目录是小程序后端配套的 Python 模型服务样例。

当前提供两个接口：

- `GET /health`
- `POST /predict`

## 本地启动

```bash
cd xcx/model-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8010
```

## Node 后端联动

把 [`.env.example`](D:/Projects/chengyuan-web/xcx/server/.env.example) 中这些变量配置到 `xcx/server/.env`：

```env
MODEL_PROVIDER="PYTHON_HTTP"
PYTHON_MODEL_BASE_URL="http://127.0.0.1:8010"
PYTHON_MODEL_PREDICT_PATH="/predict"
PYTHON_MODEL_HEALTH_PATH="/health"
PYTHON_MODEL_TIMEOUT_MS=10000
```

启动后端后，可通过：

- `GET /api/model/config`
- `POST /api/model/predict/preview`
- `POST /api/analysis/tasks`

验证 Node 后端到 Python 模型服务的整条调用链。
