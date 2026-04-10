import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { createSessionToken } from "./session";

type LoginInput = {
  code?: string;
  nickname?: string;
  avatarUrl?: string;
};

type WechatIdentity = {
  openId: string;
  unionId?: string;
  mode: "live" | "dev";
};

async function resolveWechatIdentity(code?: string): Promise<WechatIdentity> {
  const trimmedCode = code?.trim();

  if (!env.WECHAT_APP_ID || !env.WECHAT_APP_SECRET || !trimmedCode || trimmedCode.startsWith("dev-")) {
    return {
      openId: `dev-openid-${trimmedCode || "guest"}`,
      mode: "dev"
    };
  }

  const search = new URLSearchParams({
    appid: env.WECHAT_APP_ID,
    secret: env.WECHAT_APP_SECRET,
    js_code: trimmedCode,
    grant_type: "authorization_code"
  });

  const response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${search.toString()}`);
  const payload = (await response.json()) as {
    errcode?: number;
    errmsg?: string;
    openid?: string;
    unionid?: string;
  };

  if (!response.ok || payload.errcode || !payload.openid) {
    throw new Error(payload.errmsg || "Failed to exchange WeChat code.");
  }

  return {
    openId: payload.openid,
    unionId: payload.unionid,
    mode: "live"
  };
}

export async function loginWithWechat(input: LoginInput) {
  const identity = await resolveWechatIdentity(input.code);

  const user = await prisma.user.upsert({
    where: {
      openId: identity.openId
    },
    update: {
      unionId: identity.unionId,
      nickname: input.nickname || undefined,
      avatarUrl: input.avatarUrl || undefined
    },
    create: {
      openId: identity.openId,
      unionId: identity.unionId,
      nickname: input.nickname || "微信用户",
      avatarUrl: input.avatarUrl || ""
    }
  });

  const session = createSessionToken(user.id);

  return {
    sessionToken: session.sessionToken,
    expiresAt: session.expiresAt,
    mode: identity.mode,
    user: {
      id: user.id,
      openId: user.openId,
      nickname: user.nickname || "微信用户",
      avatarUrl: user.avatarUrl || ""
    }
  };
}
