import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/auth";
import { getReportDetail } from "../services/analysis";
import { generateReportPdfBuffer } from "../services/report-pdf";
import { buildStructuredReport } from "../services/report-structure";

const router = Router();

function createHttpError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

const pathIdSchema = z.string().trim().min(1);

function isStructuredReport(payload: unknown) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "grade" in payload &&
      "metrics" in payload &&
      Array.isArray((payload as { metrics?: unknown[] }).metrics)
  );
}

function parseStructuredContent(content: string) {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return isStructuredReport(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

router.get("/reports/:reportId/pdf", requireAuth, async (req, res, next) => {
  try {
    const reportId = pathIdSchema.parse(req.params.reportId);
    const report = await getReportDetail(reportId);

    if (report.task.userId !== req.authUser?.id) {
      throw createHttpError("Forbidden to view this report.", 403);
    }

    const pdf = await generateReportPdfBuffer(report);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(pdf.fileName)}`);
    res.setHeader("Cache-Control", "no-store");
    res.send(pdf.buffer);
  } catch (error) {
    next(error);
  }
});

router.get("/reports/:reportId", requireAuth, async (req, res, next) => {
  try {
    const reportId = pathIdSchema.parse(req.params.reportId);
    const report = await getReportDetail(reportId);

    if (report.task.userId !== req.authUser?.id) {
      throw createHttpError("Forbidden to view this report.", 403);
    }

    const structuredContent =
      parseStructuredContent(report.content) ??
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

    res.json({
      report: {
        id: report.id,
        reportType: report.reportType,
        fileName: report.fileName,
        createdAt: report.createdAt.toISOString(),
        generatedBy: report.generatedBy
          ? {
              id: report.generatedBy.id,
              nickname: report.generatedBy.nickname ?? "微信用户"
            }
          : null,
        task: {
          id: report.task.id,
          taskNo: report.task.taskNo,
          sampleCode: report.task.sample.sampleCode,
          compareSampleCode: report.task.compareSample?.sampleCode ?? null
        },
        structuredContent,
        pdfExportUrl: `/api/reports/${report.id}/pdf`,
        content: report.content
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as reportRouter };
