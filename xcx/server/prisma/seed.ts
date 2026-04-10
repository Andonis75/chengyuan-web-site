import { PrismaClient, ReportType, SampleStatus, TaskStatus, TaskType } from "@prisma/client";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type ChemRecord = {
  id: string;
  ssc: number;
  ta: number;
  ratio: number;
  vc: number;
};

const prisma = new PrismaClient();

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

async function loadChemData() {
  const mockDataPath = path.resolve(process.cwd(), "..", "..", "src", "lib", "mockData.json");
  const raw = await readFile(mockDataPath, "utf-8");
  const parsed = JSON.parse(raw) as { chemData: ChemRecord[] };
  return parsed.chemData;
}

async function main() {
  const chemData = await loadChemData();
  const uploadsDir = path.resolve(process.cwd(), "uploads");

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, "seed-cm-1.csv"), "wavelength,intensity\n389.04,12.57\n391.35,10.40\n");
  await writeFile(path.join(uploadsDir, "seed-qz-1.csv"), "wavelength,intensity\n389.04,12.57\n391.35,10.40\n");
  await writeFile(path.join(uploadsDir, "seed-cm-2.hdr"), "ENVI\nsamples = 100\nbands = 100\n");

  await prisma.reportFile.deleteMany();
  await prisma.analysisResult.deleteMany();
  await prisma.analysisTask.deleteMany();
  await prisma.spectralFile.deleteMany();
  await prisma.sample.deleteMany();
  await prisma.origin.deleteMany();
  await prisma.user.deleteMany();

  const [cmOrigin, qzOrigin] = await Promise.all([
    prisma.origin.create({
      data: {
        code: "CM",
        name: "澄迈福橙",
        region: "海南澄迈",
        harvestSeason: "2026 春季",
        description: "果园主产区样本，甜酸比稳定，适合作为主力对照组。"
      }
    }),
    prisma.origin.create({
      data: {
        code: "QZ",
        name: "琼中绿橙",
        region: "海南琼中",
        harvestSeason: "2026 春季",
        description: "山地样本，维生素 C 与糖酸平衡表现更突出。"
      }
    })
  ]);

  const cmSamples = chemData.map((item, index) => ({
    sampleCode: `CM-${index + 1}`,
    externalCode: item.id,
    category: "chemical",
    status: item.ssc >= 8 ? SampleStatus.NORMAL : SampleStatus.WARNING,
    ssc: round(item.ssc),
    ta: round(item.ta, 3),
    ratio: round(item.ratio),
    vc: round(item.vc, 3),
    collectedAt: new Date(Date.UTC(2026, 2, index + 1, 2, 0, 0)),
    originId: cmOrigin.id
  }));

  const qzSamples = chemData.map((item, index) => {
    const ssc = round(item.ssc + 0.8 + (index % 3) * 0.12);
    const ta = round(Math.max(0.35, item.ta - 0.08 + (index % 2 === 0 ? 0.02 : -0.01)), 3);
    const ratio = round(ssc / ta);
    const vc = round(item.vc + 3.6 - (index % 4) * 0.45, 3);

    return {
      sampleCode: `QZ-${index + 1}`,
      externalCode: `QZ-${index + 1}`,
      category: "chemical",
      status: ssc >= 8.5 ? SampleStatus.NORMAL : SampleStatus.REVIEWED,
      ssc,
      ta,
      ratio,
      vc,
      collectedAt: new Date(Date.UTC(2026, 2, index + 1, 6, 0, 0)),
      originId: qzOrigin.id
    };
  });

  await prisma.sample.createMany({
    data: [...cmSamples, ...qzSamples]
  });

  const demoUser = await prisma.user.create({
    data: {
      openId: "dev-openid-demo",
      nickname: "演示用户",
      avatarUrl: ""
    }
  });

  const samples = await prisma.sample.findMany({
    include: {
      origin: true
    },
    orderBy: {
      collectedAt: "asc"
    }
  });

  const sampleByCode = Object.fromEntries(samples.map((sample) => [sample.sampleCode, sample]));

  await prisma.spectralFile.createMany({
    data: [
      {
        sampleId: sampleByCode["CM-1"].id,
        fileName: "seed-cm-1.csv",
        originalName: "CM-1-spectrum.csv",
        mimeType: "text/csv",
        fileSize: 12840,
        storagePath: "/uploads/seed-cm-1.csv",
        wavelengthStart: 389.04,
        wavelengthEnd: 607.99,
        bandCount: 100
      },
      {
        sampleId: sampleByCode["QZ-1"].id,
        fileName: "seed-qz-1.csv",
        originalName: "QZ-1-spectrum.csv",
        mimeType: "text/csv",
        fileSize: 13210,
        storagePath: "/uploads/seed-qz-1.csv",
        wavelengthStart: 389.04,
        wavelengthEnd: 607.99,
        bandCount: 100
      },
      {
        sampleId: sampleByCode["CM-2"].id,
        fileName: "seed-cm-2.hdr",
        originalName: "CM-2-spectrum.hdr",
        mimeType: "application/octet-stream",
        fileSize: 4096,
        storagePath: "/uploads/seed-cm-2.hdr",
        wavelengthStart: 389.04,
        wavelengthEnd: 607.99,
        bandCount: 100
      }
    ]
  });

  const seededTasks = samples.slice(-12).map((sample, index) => {
    const createdAt = new Date(Date.UTC(2026, 2, 18 + index, 8, 30, 0));
    const confidence = round(0.88 + (index % 4) * 0.025, 3);
    const aiSummary =
      sample.status === SampleStatus.WARNING
        ? `${sample.sampleCode} 糖度偏低，建议复核采后分级与批次标签。`
        : `${sample.sampleCode} 指标稳定，产地特征与历史样本相符。`;

    return {
      taskNo: `TASK-202603-${String(index + 1).padStart(3, "0")}`,
      taskType: TaskType.SINGLE,
      taskStatus: TaskStatus.SUCCESS,
      progress: 100,
      createdAt,
      updatedAt: createdAt,
      startedAt: createdAt,
      finishedAt: new Date(createdAt.getTime() + 40 * 1000),
      userId: demoUser.id,
      sampleId: sample.id,
      result: {
        create: {
          sampleId: sample.id,
          predictedOrigin: sample.origin.name,
          confidence,
          predictedSsc: round(sample.ssc),
          predictedTa: round(sample.ta, 3),
          predictedRatio: round(sample.ratio),
          predictedVc: round(sample.vc, 3),
          aiSummary,
          createdAt,
          updatedAt: createdAt
        }
      },
      reports: {
        create: {
          reportType: ReportType.JSON,
          fileName: `${sample.sampleCode}-report.json`,
          content: JSON.stringify(
            {
              sampleCode: sample.sampleCode,
              predictedOrigin: sample.origin.name,
              confidence,
              aiSummary
            },
            null,
            2
          ),
          createdAt,
          generatedById: demoUser.id
        }
      }
    };
  });

  for (const task of seededTasks) {
    await prisma.analysisTask.create({
      data: task
    });
  }

  await prisma.analysisTask.create({
    data: {
      taskNo: "TASK-COMPARE-001",
      taskType: TaskType.COMPARE,
      taskStatus: TaskStatus.SUCCESS,
      progress: 100,
      createdAt: new Date(Date.UTC(2026, 2, 30, 9, 0, 0)),
      updatedAt: new Date(Date.UTC(2026, 2, 30, 9, 0, 0)),
      startedAt: new Date(Date.UTC(2026, 2, 30, 9, 0, 0)),
      finishedAt: new Date(Date.UTC(2026, 2, 30, 9, 1, 10)),
      userId: demoUser.id,
      sampleId: sampleByCode["CM-1"].id,
      compareSampleId: sampleByCode["QZ-10"].id,
      result: {
        create: {
          sampleId: sampleByCode["CM-1"].id,
          predictedOrigin: sampleByCode["CM-1"].origin.name,
          confidence: 0.91,
          predictedSsc: round(sampleByCode["CM-1"].ssc),
          predictedTa: round(sampleByCode["CM-1"].ta, 3),
          predictedRatio: round(sampleByCode["CM-1"].ratio),
          predictedVc: round(sampleByCode["CM-1"].vc, 3),
          aiSummary: "对比分析显示两地样本糖酸结构存在明显差异，适合分别建档管理。",
          createdAt: new Date(Date.UTC(2026, 2, 30, 9, 1, 10)),
          updatedAt: new Date(Date.UTC(2026, 2, 30, 9, 1, 10))
        }
      },
      reports: {
        create: {
          reportType: ReportType.JSON,
          fileName: "compare-report.json",
          content: JSON.stringify(
            {
              mode: "compare",
              primarySampleCode: sampleByCode["CM-1"].sampleCode,
              compareSampleCode: sampleByCode["QZ-10"].sampleCode,
              summary: "对比分析显示两地样本糖酸结构存在明显差异，适合分别建档管理。"
            },
            null,
            2
          ),
          createdAt: new Date(Date.UTC(2026, 2, 30, 9, 1, 10)),
          generatedById: demoUser.id
        }
      }
    }
  });

  console.log(`Seeded ${samples.length} samples, ${seededTasks.length + 1} tasks, 3 spectral files, and reports.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
