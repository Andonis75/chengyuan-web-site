declare namespace Express {
  interface Request {
    auth?: {
      userId: string;
      issuedAt: string;
      expiresAt: string;
    };
    authUser?: {
      id: string;
      openId: string;
      nickname: string | null;
      avatarUrl: string | null;
    };
  }
}
