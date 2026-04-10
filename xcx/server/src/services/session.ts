import crypto from "node:crypto";

import { env } from "../config/env";

type SessionPayload = {
  userId: string;
  issuedAt: string;
  expiresAt: string;
};

function createHttpError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecret() {
  if (env.SESSION_SECRET) {
    return env.SESSION_SECRET;
  }

  if (env.NODE_ENV === "production") {
    throw createHttpError("SESSION_SECRET is required in production.", 500);
  }

  return "dev-session-secret";
}

function signPayload(encodedPayload: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("hex");
}

export function createSessionToken(userId: string) {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);
  const payload: SessionPayload = {
    userId,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return {
    sessionToken: `${encodedPayload}.${signature}`,
    expiresAt: payload.expiresAt
  };
}

export function verifySessionToken(sessionToken: string): SessionPayload {
  const [encodedPayload, signature] = sessionToken.split(".");

  if (!encodedPayload || !signature) {
    throw createHttpError("Invalid session token.", 401);
  }

  const expectedSignature = signPayload(encodedPayload);
  const providedSignature = Buffer.from(signature, "hex");
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "hex");

  if (
    providedSignature.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)
  ) {
    throw createHttpError("Invalid session token.", 401);
  }

  let payload: SessionPayload;

  try {
    payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
  } catch {
    throw createHttpError("Invalid session token payload.", 401);
  }

  if (!payload.userId || !payload.expiresAt || !payload.issuedAt) {
    throw createHttpError("Invalid session token payload.", 401);
  }

  if (Date.parse(payload.expiresAt) <= Date.now()) {
    throw createHttpError("Session token has expired.", 401);
  }

  return payload;
}

