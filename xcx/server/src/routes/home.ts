import { Router } from "express";

import { buildHomePayload, buildInsightsPayload } from "../services/dashboard";

const router = Router();

router.get("/home", async (_req, res, next) => {
  try {
    const payload = await buildHomePayload();
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get("/insights", async (_req, res, next) => {
  try {
    const payload = await buildInsightsPayload();
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export { router as homeRouter };
