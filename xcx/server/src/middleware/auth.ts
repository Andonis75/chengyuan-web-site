import type { RequestHandler } from "express";

import { prisma } from "../lib/prisma";
import { verifySessionToken } from "../services/session";

function createHttpError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function readBearerToken(authorization?: string) {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token.trim();
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = readBearerToken(req.headers.authorization);

    if (!token) {
      throw createHttpError("Authorization token is required.", 401);
    }

    const session = verifySessionToken(token);
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId
      }
    });

    if (!user) {
      throw createHttpError("Authenticated user not found.", 401);
    }

    req.auth = session;
    req.authUser = {
      id: user.id,
      openId: user.openId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl
    };
    next();
  } catch (error) {
    next(error);
  }
};

