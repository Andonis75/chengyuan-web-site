import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [, , target, ...prismaArgs] = process.argv;

if (!target || !["sqlite", "mysql"].includes(target)) {
  console.error("Usage: node scripts/prisma-target.mjs <sqlite|mysql> <prisma args...>");
  process.exit(1);
}

if (prismaArgs.length === 0) {
  console.error("Missing Prisma command arguments.");
  process.exit(1);
}

const rootDir = process.cwd();
const prismaDir = path.join(rootDir, "prisma");
const templatePath = path.join(prismaDir, "schema.template.prisma");
const generatedSchemaPath = path.join(prismaDir, ".schema.generated.prisma");
const envPath = path.join(rootDir, ".env");

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
  console.error(
    target === "mysql"
      ? "Set DATABASE_URL_MYSQL or DATABASE_URL to a valid MySQL connection string."
      : "Set DATABASE_URL_SQLITE or DATABASE_URL to a valid SQLite connection string."
  );
  process.exit(1);
}

const template = fs.readFileSync(templatePath, "utf8");
const rendered = template.replace("__DATABASE_PROVIDER__", target);
fs.writeFileSync(generatedSchemaPath, rendered, "utf8");

const finalPrismaArgs = [...prismaArgs, "--schema", generatedSchemaPath];

const prismaBin = path.join(rootDir, "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");
const child =
  process.platform === "win32"
    ? spawn("cmd.exe", ["/d", "/s", "/c", prismaBin, ...finalPrismaArgs], {
        cwd: rootDir,
        stdio: "inherit",
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl
        }
      })
    : spawn(prismaBin, finalPrismaArgs, {
        cwd: rootDir,
        stdio: "inherit",
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl
        }
      });

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
