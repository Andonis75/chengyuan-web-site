import { Router } from "express";
import { z } from "zod";

import { loginWithWechat } from "../services/wechat";

const router = Router();

const loginSchema = z.object({
  code: z.string().trim().optional(),
  nickname: z.string().trim().max(40).optional(),
  avatarUrl: z.string().trim().url().optional().or(z.literal(""))
});

router.post("/wechat/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginWithWechat(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };
