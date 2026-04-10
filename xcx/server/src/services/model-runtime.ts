import { ModelProvider, Prisma, SampleStatus, TaskType } from "@prisma/client";
import { z } from "zod";

import { env } from "../config/env";

type SampleWithOrigin = Prisma.SampleGetPayload<{
  include: {
    origin: true;
  };
}>;

export type PredictionInput = {
  sample: SampleWithOrigin;
  compareSample?: SampleWithOrigin | null;
  taskType: TaskType;
};

export type PredictionOutput = {
  provider: ModelProvider;
  taskType: TaskType;
  predictedOrigin: string;
  confidence: number;
  predictedSsc: number;
  predictedTa: number;
  predictedRatio: number;
  predictedVc: number;
  aiSummary: string;
  version?: string;
};

const pythonResponseSchema = z.object({
  provider: z.nativeEnum(ModelProvider).optional(),
  version: z.string().optional(),
  predictedOrigin: z.string().min(1),
  confidence: z.coerce.number(),
  predictedSsc: z.coerce.number(),
  predictedTa: z.coerce.number(),
  predictedRatio: z.coerce.number(),
  predictedVc: z.coerce.number(),
  aiSummary: z.string().min(1)
});

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function createHttpError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function normalizePath(pathname: string) {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function resolveModelBaseUrl() {
  return env.PYTHON_MODEL_BASE_URL?.replace(/\/+$/, "") ?? "";
}

function buildServiceUrl(pathname: string) {
  const baseUrl = resolveModelBaseUrl();

  if (!baseUrl) {
    throw createHttpError("PYTHON_MODEL_BASE_URL is required when MODEL_PROVIDER=PYTHON_HTTP.", 500);
  }

  return `${baseUrl}${normalizePath(pathname)}`;
}

function buildHeaders() {
  return {
    "Content-Type": "application/json",
    ...(env.PYTHON_MODEL_API_KEY ? { Authorization: `Bearer ${env.PYTHON_MODEL_API_KEY}` } : {})
  };
}

function serializeSample(sample: SampleWithOrigin) {
  return {
    sampleCode: sample.sampleCode,
    status: sample.status,
    origin: {
      code: sample.origin.code,
      name: sample.origin.name,
      region: sample.origin.region
    },
    metrics: {
      ssc: sample.ssc,
      ta: sample.ta,
      ratio: sample.ratio,
      vc: sample.vc
    },
    collectedAt: sample.collectedAt.toISOString()
  };
}

function buildSummary(taskType: TaskType, sample: SampleWithOrigin, compareSample?: SampleWithOrigin | null) {
  if (taskType === TaskType.COMPARE && compareSample) {
    return `对比分析完成：${sample.sampleCode} 与 ${compareSample.sampleCode} 在糖酸结构上存在明显差异，建议分别管理并持续跟踪。`;
  }

  if (sample.status === SampleStatus.WARNING) {
    return `${sample.sampleCode} 存在糖度偏低风险，建议结合光谱原始数据再次确认。`;
  }

  return `${sample.sampleCode} 产地判别稳定，品质指标落在推荐区间。`;
}

function buildConfidence(taskType: TaskType, sample: SampleWithOrigin, compareSample?: SampleWithOrigin | null) {
  if (taskType === TaskType.COMPARE && compareSample) {
    return sample.status === SampleStatus.WARNING || compareSample.status === SampleStatus.WARNING ? 0.89 : 0.92;
  }

  return sample.status === SampleStatus.WARNING ? 0.86 : 0.94;
}

function buildMockPrediction(input: PredictionInput): PredictionOutput {
  const confidence = buildConfidence(input.taskType, input.sample, input.compareSample);
  const aiSummary = buildSummary(input.taskType, input.sample, input.compareSample);

  return {
    provider: ModelProvider.MOCK,
    taskType: input.taskType,
    predictedOrigin: input.sample.origin.name,
    confidence,
    predictedSsc: round(input.sample.ssc),
    predictedTa: round(input.sample.ta, 3),
    predictedRatio: round(input.sample.ratio),
    predictedVc: round(input.sample.vc, 3),
    aiSummary,
    version: "mock-1.0.0"
  };
}

async function requestPythonPrediction(input: PredictionInput): Promise<PredictionOutput> {
  let response: Response;

  try {
    response = await fetch(buildServiceUrl(env.PYTHON_MODEL_PREDICT_PATH), {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        taskType: input.taskType,
        sample: serializeSample(input.sample),
        compareSample: input.compareSample ? serializeSample(input.compareSample) : null
      }),
      signal: AbortSignal.timeout(env.PYTHON_MODEL_TIMEOUT_MS)
    });
  } catch (error) {
    throw createHttpError(
      `Python model service is unavailable: ${error instanceof Error ? error.message : "Unknown error."}`,
      502
    );
  }

  const text = await response.text();
  let payload: unknown = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = {
        message: text
      };
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : typeof payload === "object" && payload !== null && "detail" in payload && typeof payload.detail === "string"
          ? payload.detail
        : "Python model service returned an error.";
    throw createHttpError(message, 502);
  }

  const parsed = pythonResponseSchema.parse(payload);

  return {
    provider: parsed.provider ?? ModelProvider.PYTHON_HTTP,
    taskType: input.taskType,
    predictedOrigin: parsed.predictedOrigin,
    confidence: parsed.confidence,
    predictedSsc: parsed.predictedSsc,
    predictedTa: parsed.predictedTa,
    predictedRatio: parsed.predictedRatio,
    predictedVc: parsed.predictedVc,
    aiSummary: parsed.aiSummary,
    version: parsed.version
  };
}

async function probePythonHealth() {
  try {
    const response = await fetch(buildServiceUrl(env.PYTHON_MODEL_HEALTH_PATH), {
      headers: env.PYTHON_MODEL_API_KEY ? { Authorization: `Bearer ${env.PYTHON_MODEL_API_KEY}` } : undefined,
      signal: AbortSignal.timeout(Math.min(env.PYTHON_MODEL_TIMEOUT_MS, 3000))
    });

    if (!response.ok) {
      return {
        healthy: false,
        version: null as string | null
      };
    }

    const payload = (await response.json()) as { version?: string };
    return {
      healthy: true,
      version: payload.version ?? null
    };
  } catch {
    return {
      healthy: false,
      version: null as string | null
    };
  }
}

export async function getModelRuntimeConfig() {
  if (env.MODEL_PROVIDER === ModelProvider.PYTHON_HTTP) {
    const health = resolveModelBaseUrl() ? await probePythonHealth() : { healthy: false, version: null };

    return {
      provider: ModelProvider.PYTHON_HTTP,
      mode: "python_http",
      supportsFileUpload: true,
      supportsCompareAnalysis: true,
      supportsAsyncTasks: false,
      version: health.version ?? "python-http",
      healthy: health.healthy,
      endpoint: resolveModelBaseUrl() ? buildServiceUrl(env.PYTHON_MODEL_PREDICT_PATH) : null,
      timeoutMs: env.PYTHON_MODEL_TIMEOUT_MS
    };
  }

  return {
    provider: ModelProvider.MOCK,
    mode: "mock",
    supportsFileUpload: true,
    supportsCompareAnalysis: true,
    supportsAsyncTasks: false,
    version: "mock-1.0.0",
    healthy: true,
    endpoint: null,
    timeoutMs: env.PYTHON_MODEL_TIMEOUT_MS
  };
}

export async function runModelPrediction(input: PredictionInput): Promise<PredictionOutput> {
  if (env.MODEL_PROVIDER === ModelProvider.PYTHON_HTTP) {
    return requestPythonPrediction(input);
  }

  return buildMockPrediction(input);
}
