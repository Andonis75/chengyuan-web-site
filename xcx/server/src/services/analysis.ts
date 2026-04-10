import { Prisma, ReportType, TaskStatus, TaskType } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { runModelPrediction } from "./model-runtime";
import { buildStructuredReport } from "./report-structure";

type CreateTaskInput = {
  sampleCode: string;
  compareSampleCode?: string;
  userId?: string;
  taskType?: TaskType;
};

type ListTasksInput = {
  userId?: string;
  taskStatus?: TaskStatus;
  taskType?: TaskType;
  sampleCode?: string;
  page: number;
  pageSize: number;
};

type SampleWithOrigin = Prisma.SampleGetPayload<{
  include: {
    origin: true;
    _count: {
      select: {
        spectralFiles: true;
      };
    };
  };
}>;

type LoadedTaskInput = {
  taskType: TaskType;
  userId?: string;
  sample: SampleWithOrigin;
  compareSample?: SampleWithOrigin | null;
};

const inFlightTaskIds = new Set<string>();

export type ReportDetail = Prisma.ReportFileGetPayload<{
  include: {
    task: {
      include: {
        sample: {
          include: {
            origin: true;
          };
        };
        compareSample: {
          include: {
            origin: true;
          };
        };
        result: true;
      };
    };
    generatedBy: true;
  };
}>;

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function createHttpError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function buildTaskType(compareSampleCode?: string) {
  return compareSampleCode ? TaskType.COMPARE : TaskType.SINGLE;
}

function buildTaskNo(date: Date) {
  return `TASK-${date.getTime()}`;
}

async function findSampleByCode(sampleCode: string) {
  return prisma.sample.findUnique({
    where: {
      sampleCode
    },
    include: {
      origin: true,
      _count: {
        select: {
          spectralFiles: true
        }
      }
    }
  });
}

async function loadTaskInput(input: CreateTaskInput): Promise<LoadedTaskInput> {
  const taskType = input.taskType ?? buildTaskType(input.compareSampleCode);

  if (taskType === TaskType.COMPARE && !input.compareSampleCode) {
    throw createHttpError("compareSampleCode is required for COMPARE tasks.", 400);
  }

  if (taskType === TaskType.SINGLE && input.compareSampleCode) {
    throw createHttpError("compareSampleCode is not allowed for SINGLE tasks.", 400);
  }

  const [sample, compareSample] = await Promise.all([
    findSampleByCode(input.sampleCode),
    input.compareSampleCode ? findSampleByCode(input.compareSampleCode) : Promise.resolve(null)
  ]);

  if (!sample) {
    throw createHttpError("Sample not found.", 404);
  }

  if (sample._count.spectralFiles < 1) {
    throw createHttpError("请先为主样本上传光谱文件后再发起分析。", 400);
  }

  if (input.compareSampleCode && !compareSample) {
    throw createHttpError("Compare sample not found.", 404);
  }

  if (compareSample && compareSample._count.spectralFiles < 1) {
    throw createHttpError("请先为对比样本上传光谱文件后再发起分析。", 400);
  }

  return {
    taskType,
    userId: input.userId,
    sample,
    compareSample
  };
}

async function getTaskForExecution(taskId: string) {
  const task = await prisma.analysisTask.findUnique({
    where: {
      id: taskId
    },
    include: {
      sample: {
        include: {
          origin: true
        }
      },
      compareSample: {
        include: {
          origin: true
        }
      },
      result: true,
      reports: true
    }
  });

  if (!task) {
    throw createHttpError("Task not found.", 404);
  }

  return task;
}

async function markTaskFailed(taskId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown task execution error.";

  await prisma.analysisTask
    .update({
      where: {
        id: taskId
      },
      data: {
        taskStatus: TaskStatus.FAILED,
        progress: 100,
        finishedAt: new Date(),
        errorMessage: message
      }
    })
    .catch(() => undefined);
}

async function executeAnalysisTask(taskId: string) {
  if (inFlightTaskIds.has(taskId)) {
    return getTaskDetail(taskId);
  }

  inFlightTaskIds.add(taskId);

  try {
    const task = await getTaskForExecution(taskId);

    if (task.taskStatus === TaskStatus.SUCCESS && task.result) {
      return getTaskDetail(taskId);
    }

    const startedAt = task.startedAt ?? new Date();
    await prisma.analysisTask.update({
      where: {
        id: taskId
      },
      data: {
        taskStatus: TaskStatus.RUNNING,
        progress: 30,
        startedAt,
        errorMessage: null
      }
    });

    const prediction = await runModelPrediction({
      sample: task.sample,
      compareSample: task.compareSample,
      taskType: task.taskType
    });

    const finishedAt = new Date();

    await prisma.analysisTask.update({
      where: {
        id: taskId
      },
      data: {
        taskStatus: TaskStatus.SUCCESS,
        progress: 100,
        finishedAt,
        errorMessage: null,
        result: task.result
          ? undefined
          : {
              create: {
                sampleId: task.sampleId,
                predictedOrigin: prediction.predictedOrigin,
                confidence: prediction.confidence,
                predictedSsc: round(prediction.predictedSsc),
                predictedTa: round(prediction.predictedTa, 3),
                predictedRatio: round(prediction.predictedRatio),
                predictedVc: round(prediction.predictedVc, 3),
                aiSummary: prediction.aiSummary
              }
            },
        reports:
          task.reports.length > 0
            ? undefined
            : {
                create: {
                  reportType: ReportType.JSON,
                  fileName: `${task.sample.sampleCode}-${task.taskType.toLowerCase()}-report.json`,
                  content: JSON.stringify(
                    buildStructuredReport({
                      provider: prediction.provider,
                      version: prediction.version ?? null,
                      taskType: task.taskType,
                      sampleCode: task.sample.sampleCode,
                      sampleOriginName: task.sample.origin.name,
                      compareSampleCode: task.compareSample?.sampleCode ?? null,
                      compareSampleOriginName: task.compareSample?.origin.name ?? null,
                      predictedOrigin: prediction.predictedOrigin,
                      confidence: prediction.confidence,
                      predictedSsc: round(prediction.predictedSsc),
                      predictedTa: round(prediction.predictedTa, 3),
                      predictedRatio: round(prediction.predictedRatio),
                      predictedVc: round(prediction.predictedVc, 3),
                      aiSummary: prediction.aiSummary,
                      generatedAt: finishedAt
                    }),
                    null,
                    2
                  ),
                  generatedById: task.userId
                }
              }
      }
    });

    return getTaskDetail(taskId);
  } catch (error) {
    await markTaskFailed(taskId, error);
    throw error;
  } finally {
    inFlightTaskIds.delete(taskId);
  }
}

export async function createCompletedAnalysisTask(input: CreateTaskInput) {
  const loaded = await loadTaskInput(input);
  const createdAt = new Date();

  const task = await prisma.analysisTask.create({
    data: {
      taskNo: buildTaskNo(createdAt),
      taskType: loaded.taskType,
      taskStatus: TaskStatus.PENDING,
      progress: 0,
      userId: loaded.userId,
      sampleId: loaded.sample.id,
      compareSampleId: loaded.compareSample?.id
    }
  });

  const completedTask = await executeAnalysisTask(task.id);

  return completedTask;
}

export async function createAsyncAnalysisTask(input: CreateTaskInput) {
  const loaded = await loadTaskInput(input);
  const createdAt = new Date();

  const task = await prisma.analysisTask.create({
    data: {
      taskNo: buildTaskNo(createdAt),
      taskType: loaded.taskType,
      taskStatus: TaskStatus.PENDING,
      progress: 0,
      userId: loaded.userId,
      sampleId: loaded.sample.id,
      compareSampleId: loaded.compareSample?.id
    },
    include: {
      result: true,
      reports: true
    }
  });

  enqueueAnalysisTask(task.id);
  return task;
}

export function enqueueAnalysisTask(taskId: string) {
  if (inFlightTaskIds.has(taskId)) {
    return;
  }

  setTimeout(() => {
    void executeAnalysisTask(taskId).catch((error) => {
      console.error(`Failed to execute analysis task ${taskId}:`, error);
    });
  }, 0);
}

export async function resumePendingAnalysisTasks() {
  const tasks = await prisma.analysisTask.findMany({
    where: {
      taskStatus: {
        in: [TaskStatus.PENDING, TaskStatus.RUNNING]
      }
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true
    }
  });

  for (const task of tasks) {
    enqueueAnalysisTask(task.id);
  }
}

export async function getTaskDetail(taskId: string) {
  const task = await prisma.analysisTask.findUnique({
    where: {
      id: taskId
    },
    include: {
      user: true,
      sample: {
        include: {
          origin: true
        }
      },
      compareSample: {
        include: {
          origin: true
        }
      },
      result: true,
      reports: true
    }
  });

  if (!task) {
    throw createHttpError("Task not found.", 404);
  }

  return task;
}

export async function getResultDetail(resultId: string) {
  const result = await prisma.analysisResult.findUnique({
    where: {
      id: resultId
    },
    include: {
      sample: {
        include: {
          origin: true
        }
      },
      task: {
        include: {
          compareSample: {
            include: {
              origin: true
            }
          }
        }
      }
    }
  });

  if (!result) {
    throw createHttpError("Result not found.", 404);
  }

  return result;
}

export async function getReportDetail(reportId: string) {
  const report = await prisma.reportFile.findUnique({
    where: {
      id: reportId
    },
    include: {
      task: {
        include: {
          sample: {
            include: {
              origin: true
            }
          },
          compareSample: {
            include: {
              origin: true
            }
          },
          result: true
        }
      },
      generatedBy: true
    }
  });

  if (!report) {
    throw createHttpError("Report not found.", 404);
  }

  return report;
}

export async function listTasks(input: ListTasksInput) {
  const where: Prisma.AnalysisTaskWhereInput = {
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.taskStatus ? { taskStatus: input.taskStatus } : {}),
    ...(input.taskType ? { taskType: input.taskType } : {}),
    ...(input.sampleCode
      ? {
          OR: [
            {
              sample: {
                sampleCode: {
                  contains: input.sampleCode
                }
              }
            },
            {
              compareSample: {
                sampleCode: {
                  contains: input.sampleCode
                }
              }
            }
          ]
        }
      : {})
  };

  const [total, tasks] = await Promise.all([
    prisma.analysisTask.count({ where }),
    prisma.analysisTask.findMany({
      where,
      include: {
        sample: {
          include: {
            origin: true
          }
        },
        compareSample: {
          include: {
            origin: true
          }
        },
        result: true,
        reports: true,
        user: true
      },
      orderBy: {
        createdAt: "desc"
      },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize
    })
  ]);

  return {
    items: tasks.map((task) => ({
      id: task.id,
      taskNo: task.taskNo,
      taskType: task.taskType,
      taskStatus: task.taskStatus,
      progress: task.progress,
      errorMessage: task.errorMessage,
      createdAt: task.createdAt.toISOString(),
      startedAt: task.startedAt?.toISOString() ?? null,
      finishedAt: task.finishedAt?.toISOString() ?? null,
      sampleCode: task.sample.sampleCode,
      originName: task.sample.origin.name,
      compareSampleCode: task.compareSample?.sampleCode ?? null,
      compareOriginName: task.compareSample?.origin.name ?? null,
      requestedBy: task.user?.nickname || "微信用户",
      resultId: task.result?.id ?? null,
      reportId: task.reports[0]?.id ?? null,
      confidence: task.result?.confidence ?? null,
      summary: task.result?.aiSummary ?? null
    })),
    pagination: {
      total,
      page: input.page,
      pageSize: input.pageSize,
      hasMore: input.page * input.pageSize < total
    }
  };
}
