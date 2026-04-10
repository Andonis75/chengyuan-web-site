import { TaskType } from "@prisma/client";

import { prisma } from "../lib/prisma";

function createHttpError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

async function resolveUser(userId?: string) {
  if (userId) {
    return prisma.user.findUnique({
      where: {
        id: userId
      }
    });
  }

  return prisma.user.findFirst({
    orderBy: {
      createdAt: "asc"
    }
  });
}

export async function getProfilePayload(userId?: string) {
  const user = await resolveUser(userId);

  if (!user) {
    throw createHttpError("User not found.", 404);
  }

  const [taskCount, reportCount, compareCount, recentTasks] = await Promise.all([
    prisma.analysisTask.count({
      where: {
        userId: user.id
      }
    }),
    prisma.reportFile.count({
      where: {
        generatedById: user.id
      }
    }),
    prisma.analysisTask.count({
      where: {
        userId: user.id,
        taskType: TaskType.COMPARE
      }
    }),
    prisma.analysisTask.findMany({
      where: {
        userId: user.id
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
        result: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 5
    })
  ]);

  return {
    user: {
      id: user.id,
      openId: user.openId,
      nickname: user.nickname || "微信用户",
      avatarUrl: user.avatarUrl || "",
      joinedAt: user.createdAt.toISOString()
    },
    summary: {
      taskCount,
      reportCount,
      compareCount
    },
    recentTasks: recentTasks.map((task) => ({
      id: task.id,
      taskNo: task.taskNo,
      taskType: task.taskType,
      taskStatus: task.taskStatus,
      sampleCode: task.sample.sampleCode,
      sampleOriginName: task.sample.origin.name,
      compareSampleCode: task.compareSample?.sampleCode ?? null,
      compareOriginName: task.compareSample?.origin.name ?? null,
      confidence: task.result?.confidence ?? null,
      createdAt: task.createdAt.toISOString()
    }))
  };
}
