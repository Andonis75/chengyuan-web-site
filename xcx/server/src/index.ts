import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { resumePendingAnalysisTasks } from "./services/analysis";

const server = app.listen(env.PORT, () => {
  console.log(`XCX server listening on http://localhost:${env.PORT}`);
  void resumePendingAnalysisTasks().catch((error) => {
    console.error("Failed to resume pending analysis tasks:", error);
  });
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
