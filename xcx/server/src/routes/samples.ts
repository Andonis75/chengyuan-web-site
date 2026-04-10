import { Prisma, SampleStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { serializeSpectralFile } from "../services/files";

const router = Router();

const listQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  originCode: z.string().trim().optional(),
  status: z.nativeEnum(SampleStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(30).default(10)
});

type ListQuery = z.infer<typeof listQuerySchema>;

router.get("/origins", async (_req, res, next) => {
  try {
    const origins = await prisma.origin.findMany({
      orderBy: {
        code: "asc"
      }
    });

    res.json({
      items: origins.map((origin) => ({
        id: origin.id,
        code: origin.code,
        name: origin.name,
        region: origin.region
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.get("/samples", async (req, res, next) => {
  try {
    const query: ListQuery = listQuerySchema.parse(req.query);

    const where: Prisma.SampleWhereInput = {
      ...(query.keyword
        ? {
            OR: [
              {
                sampleCode: {
                  contains: query.keyword
                }
              },
              {
                externalCode: {
                  contains: query.keyword
                }
              }
            ]
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.originCode
        ? {
            origin: {
              code: query.originCode
            }
          }
        : {})
    };

    const [total, origins, items] = await Promise.all([
      prisma.sample.count({ where }),
      prisma.origin.findMany({
        orderBy: {
          code: "asc"
        }
      }),
      prisma.sample.findMany({
        where,
        include: {
          origin: true,
          _count: {
            select: {
              analysisResults: true,
              spectralFiles: true
            }
          }
        },
        orderBy: {
          collectedAt: "desc"
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      })
    ]);

    res.json({
      items: items.map((item) => ({
        sampleCode: item.sampleCode,
        externalCode: item.externalCode,
        status: item.status,
        ssc: item.ssc,
        ta: item.ta,
        ratio: item.ratio,
        vc: item.vc,
        collectedAt: item.collectedAt.toISOString(),
        originCode: item.origin.code,
        originName: item.origin.name,
        analysisCount: item._count.analysisResults,
        fileCount: item._count.spectralFiles
      })),
      pagination: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        hasMore: query.page * query.pageSize < total
      },
      filters: {
        origins: origins.map((origin) => ({
          code: origin.code,
          name: origin.name
        })),
        statuses: Object.values(SampleStatus)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/samples/:sampleCode", async (req, res, next) => {
  try {
    const sample = await prisma.sample.findUnique({
      where: {
        sampleCode: req.params.sampleCode
      },
      include: {
        origin: true,
        spectralFiles: {
          orderBy: {
            uploadedAt: "desc"
          }
        },
        analysisResults: {
          include: {
            task: {
              include: {
                user: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 10
        }
      }
    });

    if (!sample) {
      res.status(404).json({
        message: "Sample not found."
      });
      return;
    }

    res.json({
      sample: {
        sampleCode: sample.sampleCode,
        externalCode: sample.externalCode,
        category: sample.category,
        status: sample.status,
        ssc: sample.ssc,
        ta: sample.ta,
        ratio: sample.ratio,
        vc: sample.vc,
        collectedAt: sample.collectedAt.toISOString(),
        origin: {
          code: sample.origin.code,
          name: sample.origin.name,
          region: sample.origin.region,
          harvestSeason: sample.origin.harvestSeason,
          description: sample.origin.description
        },
        files: sample.spectralFiles.map((file) => ({
          ...serializeSpectralFile(file)
        })),
        analyses: sample.analysisResults.map((analysis) => ({
          id: analysis.id,
          taskId: analysis.taskId,
          predictedOrigin: analysis.predictedOrigin,
          confidence: analysis.confidence,
          summary: analysis.aiSummary,
          createdAt: analysis.createdAt.toISOString(),
          operator: analysis.task.user?.nickname || "系统"
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as sampleRouter };
