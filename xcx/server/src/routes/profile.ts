import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import { getProfilePayload } from "../services/profile";

const router = Router();

router.get("/profile", requireAuth, async (req, res, next) => {
  try {
    const payload = await getProfilePayload(req.authUser?.id);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export { router as profileRouter };
