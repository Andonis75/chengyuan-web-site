import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [, , target] = process.argv;

if (!target || !["sqlite", "mysql"].includes(target)) {
  console.error("Usage: node scripts/seed-target.mjs <sqlite|mysql>");
  process.exit(1);
}

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env");
const prismaTargetScriptPath = path.join(rootDir, "scripts", "prisma-target.mjs");

function parseEnvFile(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((acc, line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        return acc;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      acc[key] = value;
      return acc;
    }, {});
}

function resolveDatabaseUrl() {
  const fileEnv = fs.existsSync(envPath) ? parseEnvFile(fs.readFileSync(envPath, "utf8")) : {};
  const envKey = target === "mysql" ? "DATABASE_URL_MYSQL" : "DATABASE_URL_SQLITE";

  return process.env[envKey] || fileEnv[envKey] || process.env.DATABASE_URL || fileEnv.DATABASE_URL || "";
}

const databaseUrl = resolveDatabaseUrl();

if (!databaseUrl) {
  console.error(`Missing database URL for target "${target}".`);
  process.exit(1);
}

const childEnv = {
  ...process.env,
  DATABASE_URL: databaseUrl
};

function spawnCommand(command, args) {
  return process.platform === "win32"
    ? spawn("cmd.exe", ["/d", "/s", "/c", command, ...args], {
        cwd: rootDir,
        stdio: "inherit",
        env: childEnv
      })
    : spawn(command, args, {
        cwd: rootDir,
        stdio: "inherit",
        env: childEnv
      });
}

const generateCommand = spawn(process.execPath, [prismaTargetScriptPath, target, "generate"], {
  cwd: rootDir,
  stdio: "inherit",
  env: childEnv
});

generateCommand.on("exit", (generateCode) => {
  if (generateCode !== 0) {
    process.exit(generateCode ?? 1);
    return;
  }

  const tsxBin = path.join(rootDir, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
  const seedCommand = spawnCommand(tsxBin, ["prisma/seed.ts"]);

  seedCommand.on("exit", (seedCode) => {
    process.exit(seedCode ?? 1);
  });
});
