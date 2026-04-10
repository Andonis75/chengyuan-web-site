import { TaskType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { getModelRuntimeConfig, runModelPrediction } from "../services/model-runtime";

const router = Router();

const previewSchema = z.object({
  sampleCode: z.string().trim().min(1),
  compareSampleCode: z.string().trim().optional(),
  taskType: z.nativeEnum(TaskType).optional()
});

router.get("/model/config", async (_req, res, next) => {
  try {
    const config = await getModelRuntimeConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

router.post("/model/predict/preview", async (req, res, next) => {
  try {
    const body = previewSchema.parse(req.body);
    const taskType = body.taskType ?? (body.compareSampleCode ? TaskType.COMPARE : TaskType.SINGLE);

    if (taskType === TaskType.COMPARE && !body.compareSampleCode) {
      res.status(400).json({
        message: "compareSampleCode is required for COMPARE preview."
      });
      return;
    }

    if (taskType === TaskType.SINGLE && body.compareSampleCode) {
      res.status(400).json({
        message: "compareSampleCode is not allowed for SINGLE preview."
      });
      return;
    }

    const [sample, compareSample] = await Promise.all([
      prisma.sample.findUnique({
        where: {
          sampleCode: body.sampleCode
        },
        include: {
          origin: true
        }
      }),
      body.compareSampleCode
        ? prisma.sample.findUnique({
            where: {
              sampleCode: body.compareSampleCode
            },
            include: {
              origin: true
            }
          })
        : Promise.resolve(null)
    ]);

    if (!sample) {
      res.status(404).json({
        message: "Sample not found."
      });
      return;
    }

    if (body.compareSampleCode && !compareSample) {
      res.status(404).json({
        message: "Compare sample not found."
      });
      return;
    }

    const prediction = await runModelPrediction({
      sample,
      compareSample,
      taskType
    });

    res.json({
      prediction
    });
  } catch (error) {
    next(error);
  }
});

export { router as modelRouter };
