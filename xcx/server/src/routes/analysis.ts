import { TaskStatus, TaskType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/auth";
import { createAsyncAnalysisTask, createCompletedAnalysisTask, getResultDetail, getTaskDetail, listTasks } from "../services/analysis";

const router = Router();

const taskSchema = z.object({
  sampleCode: z.string().trim().min(1),
  compareSampleCode: z.string().trim().optional(),
  userId: z.string().trim().optional(),
  taskType: z.nativeEnum(TaskType).optional()
});

const scanSchema = z.object({
  sampleCode: z.string().trim().min(1),
  userId: z.string().trim().optional()
});

const listTasksSchema = z.object({
  userId: z.string().trim().optional(),
  taskStatus: z.nativeEnum(TaskStatus).optional(),
  taskType: z.nativeEnum(TaskType).optional(),
  sampleCode: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(30).default(10)
});

const pathIdSchema = z.string().trim().min(1);

function createHttpError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

router.post("/analysis/scan", requireAuth, async (req, res, next) => {
  try {
    const body = scanSchema.parse(req.body);
    if (body.userId && body.userId !== req.authUser?.id) {
      throw createHttpError("Forbidden to create a task for another user.", 403);
    }

    const task = await createCompletedAnalysisTask({
      sampleCode: body.sampleCode,
      userId: req.authUser?.id,
      taskType: TaskType.SINGLE
    });

    if (!task.result) {
      throw new Error("Result generation failed.");
    }

    res.status(201).json({
      id: task.result.id,
      taskId: task.id,
      predictedOrigin: task.result.predictedOrigin,
      confidence: task.result.confidence,
      summary: task.result.aiSummary,
      createdAt: task.result.createdAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.post("/analysis/tasks", requireAuth, async (req, res, next) => {
  try {
    const body = taskSchema.parse(req.body);
    if (body.userId && body.userId !== req.authUser?.id) {
      throw createHttpError("Forbidden to create a task for another user.", 403);
    }

    const task = await createAsyncAnalysisTask({
      ...body,
      userId: req.authUser?.id
    });

    res.status(202).json({
      taskId: task.id,
      taskNo: task.taskNo,
      taskStatus: task.taskStatus,
      progress: task.progress,
      resultId: task.result?.id ?? null,
      reportId: task.reports[0]?.id ?? null,
      createdAt: task.createdAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.get("/analysis/tasks", requireAuth, async (req, res, next) => {
  try {
    const query = listTasksSchema.parse(req.query);
    if (query.userId && query.userId !== req.authUser?.id) {
      throw createHttpError("Forbidden to view another user's tasks.", 403);
    }

    const payload = await listTasks({
      ...query,
      userId: req.authUser?.id
    });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get("/analysis/tasks/:taskId", requireAuth, async (req, res, next) => {
  try {
    const taskId = pathIdSchema.parse(req.params.taskId);
    const task = await getTaskDetail(taskId);

    if (task.userId !== req.authUser?.id) {
      throw createHttpError("Forbidden to view this task.", 403);
    }

    res.json({
      task: {
        id: task.id,
        taskNo: task.taskNo,
        taskType: task.taskType,
        taskStatus: task.taskStatus,
        progress: task.progress,
        errorMessage: task.errorMessage,
        createdAt: task.createdAt.toISOString(),
        startedAt: task.startedAt?.toISOString() ?? null,
        finishedAt: task.finishedAt?.toISOString() ?? null,
        requestedBy: task.user
          ? {
              id: task.user.id,
              nickname: task.user.nickname ?? "微信用户"
            }
          : null,
        sample: {
          sampleCode: task.sample.sampleCode,
          originName: task.sample.origin.name
        },
        compareSample: task.compareSample
          ? {
              sampleCode: task.compareSample.sampleCode,
              originName: task.compareSample.origin.name
            }
          : null,
        result: task.result
          ? {
              id: task.result.id,
              predictedOrigin: task.result.predictedOrigin,
              confidence: task.result.confidence,
              aiSummary: task.result.aiSummary
            }
          : null,
        reportIds: task.reports.map((report) => report.id)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/analysis/results/:resultId", requireAuth, async (req, res, next) => {
  try {
    const resultId = pathIdSchema.parse(req.params.resultId);
    const result = await getResultDetail(resultId);

    if (result.task.userId !== req.authUser?.id) {
      throw createHttpError("Forbidden to view this result.", 403);
    }

    res.json({
      result: {
        id: result.id,
        taskId: result.taskId,
        predictedOrigin: result.predictedOrigin,
        confidence: result.confidence,
        predictedSsc: result.predictedSsc,
        predictedTa: result.predictedTa,
        predictedRatio: result.predictedRatio,
        predictedVc: result.predictedVc,
        aiSummary: result.aiSummary,
        createdAt: result.createdAt.toISOString(),
        sample: {
          sampleCode: result.sample.sampleCode,
          originName: result.sample.origin.name
        },
        compareSample: result.task.compareSample
          ? {
              sampleCode: result.task.compareSample.sampleCode,
              originName: result.task.compareSample.origin.name
            }
          : null
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as analysisRouter };
