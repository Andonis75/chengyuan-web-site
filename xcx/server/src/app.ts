import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { apiRouter, errorHandler } from "./routes";

const app = express();

app.use(
  cors({
    origin: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "chengyuan-xcx-server",
    status: "ok",
    apiBaseUrl: `http://localhost:${env.PORT}/api`
  });
});

app.use("/api", apiRouter);
app.use(errorHandler);

export { app };
