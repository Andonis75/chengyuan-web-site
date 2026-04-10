import type { ErrorRequestHandler } from "express";
import { Router } from "express";
import { ZodError } from "zod";

import { analysisRouter } from "./analysis";
import { authRouter } from "./auth";
import { filesRouter } from "./files";
import { homeRouter } from "./home";
import { modelRouter } from "./model";
import { profileRouter } from "./profile";
import { reportRouter } from "./reports";
import { sampleRouter } from "./samples";

const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok"
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use(homeRouter);
apiRouter.use(modelRouter);
apiRouter.use(profileRouter);
apiRouter.use(sampleRouter);
apiRouter.use(analysisRouter);
apiRouter.use(filesRouter);
apiRouter.use(reportRouter);

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Invalid request payload.",
      issues: error.flatten()
    });
    return;
  }

  console.error(error);
  const status =
    typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
      ? error.status
      : 500;
  const message =
    typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
      ? error.message
      : "Internal server error.";

  res.status(status).json({
    message
  });
};

export { apiRouter, errorHandler };
