import fs from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";

import { env } from "../config/env";
import type { ReportDetail } from "./analysis";
import { buildStructuredReport, type StructuredReport } from "./report-structure";

const fontCandidates = [
  env.PDF_FONT_PATH,
  "C:\\Windows\\Fonts\\simhei.ttf",
  "C:\\Windows\\Fonts\\simkai.ttf",
  "C:\\Windows\\Fonts\\simfang.ttf",
  "/System/Library/Fonts/STHeiti Medium.ttc",
  "/System/Library/Fonts/PingFang.ttc",
  "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
  "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"
].filter((value): value is string => Boolean(value));

function resolveFontPath() {
  const fontPath = fontCandidates.find((candidate) => fs.existsSync(candidate));

  if (!fontPath) {
    const error = new Error("No supported PDF font found. Set PDF_FONT_PATH to a Chinese-capable font file.") as Error & {
      status?: number;
    };
    error.status = 500;
    throw error;
  }

  return fontPath;
}

function formatDate(value: Date) {
  return value.toISOString().replace("T", " ").slice(0, 19);
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (typeof value !== "number") {
    return "-";
  }

  return value.toFixed(digits);
}

function isStructuredReport(payload: unknown): payload is StructuredReport {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "grade" in payload &&
      "metrics" in payload &&
      Array.isArray((payload as { metrics?: unknown[] }).metrics)
  );
}

function parseReportContent(content: string) {
  try {
    const parsed = JSON.parse(content) as StructuredReport;
    return isStructuredReport(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeKeyValue(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.fontSize(11).fillColor("#1f2937").text(`${label}：${value}`, {
    lineGap: 4
  });
}

function writeSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.7);
  doc.fontSize(15).fillColor("#111827").text(title);
  doc.moveDown(0.2);
}

export async function generateReportPdfBuffer(report: ReportDetail) {
  const fontPath = resolveFontPath();
  const fileName = report.fileName.replace(/\.[^.]+$/, "") + ".pdf";
  const payload =
    parseReportContent(report.content) ??
    (report.task.result
      ? buildStructuredReport({
          provider: "UNKNOWN",
          version: null,
          taskType: report.task.taskType,
          sampleCode: report.task.sample.sampleCode,
          sampleOriginName: report.task.sample.origin.name,
          compareSampleCode: report.task.compareSample?.sampleCode ?? null,
          compareSampleOriginName: report.task.compareSample?.origin.name ?? null,
          predictedOrigin: report.task.result.predictedOrigin,
          confidence: report.task.result.confidence,
          predictedSsc: report.task.result.predictedSsc,
          predictedTa: report.task.result.predictedTa,
          predictedRatio: report.task.result.predictedRatio,
          predictedVc: report.task.result.predictedVc,
          aiSummary: report.task.result.aiSummary,
          generatedAt: report.createdAt
        })
      : null);

  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: {
      Title: fileName,
      Author: "chengyuan-xcx-server",
      Subject: "Analysis report export"
    }
  });

  doc.font(fontPath);

  const chunks: Buffer[] = [];
  const bufferPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);
  });

  doc.fontSize(20).fillColor("#111827").text("橙源分析报告", {
    align: "center"
  });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#4b5563").text(`导出时间：${formatDate(new Date())}`, {
    align: "center"
  });

  writeSectionTitle(doc, "报告信息");
  writeKeyValue(doc, "报告编号", report.id);
  writeKeyValue(doc, "原始报告类型", report.reportType);
  writeKeyValue(doc, "报告文件名", report.fileName);
  writeKeyValue(doc, "创建时间", formatDate(report.createdAt));
  writeKeyValue(doc, "生成人", report.generatedBy?.nickname ?? "微信用户");

  writeSectionTitle(doc, "任务信息");
  writeKeyValue(doc, "任务编号", report.task.taskNo);
  writeKeyValue(doc, "任务类型", report.task.taskType);
  writeKeyValue(doc, "主样本", report.task.sample.sampleCode);
  writeKeyValue(doc, "主样本产地", report.task.sample.origin.name);
  writeKeyValue(doc, "对比样本", report.task.compareSample?.sampleCode ?? "-");
  writeKeyValue(doc, "对比样本产地", report.task.compareSample?.origin.name ?? "-");

  writeSectionTitle(doc, "分析结果");
  writeKeyValue(doc, "预测产地", report.task.result?.predictedOrigin ?? "-");
  writeKeyValue(doc, "置信度", formatNumber(report.task.result?.confidence, 2));
  writeKeyValue(doc, "预测 SSC", formatNumber(report.task.result?.predictedSsc, 2));
  writeKeyValue(doc, "预测 TA", formatNumber(report.task.result?.predictedTa, 3));
  writeKeyValue(doc, "预测糖酸比", formatNumber(report.task.result?.predictedRatio, 2));
  writeKeyValue(doc, "预测维 C", formatNumber(report.task.result?.predictedVc, 3));
  writeKeyValue(doc, "AI 摘要", report.task.result?.aiSummary ?? String(payload?.aiSummary ?? "-"));

  if (payload) {
    writeSectionTitle(doc, "综合评级");
    writeKeyValue(doc, "等级", `${payload.grade.level} / ${payload.grade.label}`);
    writeKeyValue(doc, "评分", String(payload.grade.score));
    writeKeyValue(doc, "评级说明", payload.grade.summary);

    writeSectionTitle(doc, "产地结论");
    writeKeyValue(doc, "预测产地", payload.originConclusion.predictedOrigin);
    writeKeyValue(doc, "置信度", payload.originConclusion.confidencePercent);
    writeKeyValue(doc, "样本登记产地", payload.originConclusion.sampleOriginName);
    writeKeyValue(doc, "对比样本产地", payload.originConclusion.compareSampleOriginName ?? "-");

    writeSectionTitle(doc, "指标解读");
    for (const metric of payload.metrics) {
      writeKeyValue(
        doc,
        metric.label,
        `${metric.displayValue}${metric.unit ? ` ${metric.unit}` : ""}，推荐区间 ${metric.recommendedRange}，${metric.comment}`
      );
    }

    writeSectionTitle(doc, "建议");
    for (const recommendation of payload.recommendations) {
      doc.fontSize(11).fillColor("#1f2937").text(`- ${recommendation}`, {
        lineGap: 4
      });
    }
  } else {
    writeSectionTitle(doc, "原始报告内容");
    doc.fontSize(11).fillColor("#1f2937").text(report.content, {
      lineGap: 4
    });
  }

  doc.end();

  return {
    buffer: await bufferPromise,
    fileName
  };
}
