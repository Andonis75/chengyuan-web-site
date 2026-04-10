from __future__ import annotations

from enum import Enum
import os
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field


MODEL_VERSION = "python-http-demo-1.0.0"
EXPECTED_API_KEY = os.getenv("MODEL_SERVICE_API_KEY", "").strip()


class TaskType(str, Enum):
    SINGLE = "SINGLE"
    COMPARE = "COMPARE"


class SampleStatus(str, Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    REVIEWED = "REVIEWED"


class OriginPayload(BaseModel):
    code: str
    name: str
    region: str


class MetricsPayload(BaseModel):
    ssc: float
    ta: float
    ratio: float
    vc: float


class SamplePayload(BaseModel):
    sampleCode: str
    status: SampleStatus
    origin: OriginPayload
    metrics: MetricsPayload
    collectedAt: str


class PredictRequest(BaseModel):
    taskType: TaskType
    sample: SamplePayload
    compareSample: Optional[SamplePayload] = None


class PredictResponse(BaseModel):
    provider: str = Field(default="PYTHON_HTTP")
    version: str = Field(default=MODEL_VERSION)
    predictedOrigin: str
    confidence: float
    predictedSsc: float
    predictedTa: float
    predictedRatio: float
    predictedVc: float
    aiSummary: str


app = FastAPI(title="chengyuan-model-service", version=MODEL_VERSION)


def authorize(authorization: Optional[str]) -> None:
    if not EXPECTED_API_KEY:
        return

    if authorization != f"Bearer {EXPECTED_API_KEY}":
        raise HTTPException(status_code=401, detail="Invalid API key.")


def round_value(value: float, digits: int = 2) -> float:
    return round(value, digits)


def build_confidence(request: PredictRequest) -> float:
    if request.taskType == TaskType.COMPARE and request.compareSample:
        statuses = {request.sample.status, request.compareSample.status}
        return 0.89 if SampleStatus.WARNING in statuses else 0.93

    return 0.86 if request.sample.status == SampleStatus.WARNING else 0.95


def build_summary(request: PredictRequest) -> str:
    if request.taskType == TaskType.COMPARE and request.compareSample:
        return (
            f"Python 模型对比分析完成：{request.sample.sampleCode} 与 "
            f"{request.compareSample.sampleCode} 在糖酸结构上存在差异，建议分批管理。"
        )

    if request.sample.status == SampleStatus.WARNING:
        return f"Python 模型判断 {request.sample.sampleCode} 存在糖度偏低风险，建议复核。"

    return f"Python 模型判断 {request.sample.sampleCode} 指标稳定，产地判别可信度较高。"


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "provider": "PYTHON_HTTP",
        "version": MODEL_VERSION,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest, authorization: Optional[str] = Header(default=None)) -> PredictResponse:
    authorize(authorization)

    metrics = request.sample.metrics
    return PredictResponse(
        predictedOrigin=request.sample.origin.name,
        confidence=build_confidence(request),
        predictedSsc=round_value(metrics.ssc),
        predictedTa=round_value(metrics.ta, 3),
        predictedRatio=round_value(metrics.ratio),
        predictedVc=round_value(metrics.vc, 3),
        aiSummary=build_summary(request),
    )
