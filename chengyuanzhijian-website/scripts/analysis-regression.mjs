import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "src/analysisEngine.ts");
const realSourcePath = resolve(root, "src/realAnalysis.ts");
const spectrumSourcePath = resolve(root, "src/realSpectrumSamples.ts");
const dashboardSourcePath = resolve(root, "src/dashboardData.ts");
const tmpDir = await mkdtemp(resolve(tmpdir(), "cy-analysis-"));
const outputPath = resolve(tmpDir, "analysisEngine.mjs");
const realOutputPath = resolve(tmpDir, "realAnalysis.mjs");
const spectrumOutputPath = resolve(tmpDir, "realSpectrumSamples.mjs");
const dashboardOutputPath = resolve(tmpDir, "dashboardData.mjs");

function transpile(source) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
  }).outputText;
}

const source = (await readFile(sourcePath, "utf8"))
  .replace('from "./realAnalysis"', 'from "./realAnalysis.mjs"')
  .replace('from "./realSpectrumSamples"', 'from "./realSpectrumSamples.mjs"');
const realSource = await readFile(realSourcePath, "utf8");
const spectrumSource = await readFile(spectrumSourcePath, "utf8");
const dashboardSource = (await readFile(dashboardSourcePath, "utf8")).replace('from "./realSpectrumSamples"', 'from "./realSpectrumSamples.mjs"');

await writeFile(realOutputPath, transpile(realSource));
await writeFile(spectrumOutputPath, transpile(spectrumSource));
await writeFile(dashboardOutputPath, transpile(dashboardSource));
await writeFile(outputPath, transpile(source));

const {
  buildAnalysisReport,
  emptyAnalysisSlot,
  analysisSpectrumCM,
  analysisSpectrumQZ,
  analysisWavelengths,
  metricsForAnalysis,
  splitAnalysisSampleGroups,
} = await import(pathToFileURL(outputPath));

const {
  dashboardModelMetrics,
  dashboardSpectrumProfile,
  dashboardMetricSeries,
  dashboardSamples,
} = await import(pathToFileURL(dashboardOutputPath));

const dualCsv = await readFile(resolve(root, "test-data/analysis-real-r210-dual-compare.csv"), "utf8");
const groups = splitAnalysisSampleGroups(dualCsv);
assert.equal(groups.length, 2, "双样本 CSV 应拆成两个样本组");
assert.equal(groups[0].sampleId, "CM-120");
assert.equal(groups[1].sampleId, "QZ-1");
assert.equal(analysisWavelengths.length, 228, "默认光谱应使用真实 R210 波段");
assert.equal(analysisSpectrumCM.length, analysisWavelengths.length);
assert.equal(analysisSpectrumQZ.length, analysisWavelengths.length);

const slotA = {
  fileName: "CM-120.csv",
  spectrum: [0.1, 0.2],
  origin: "CM",
  message: null,
  source: "upload",
  parsedMetrics: { ssc: 10.65, ta: 0.415, ratio: 25.615, vc: 34.08 },
  qualityReady: true,
};
const slotB = {
  fileName: "QZ-1.csv",
  spectrum: [0.2, 0.3],
  origin: "QZ",
  message: null,
  source: "upload",
  parsedMetrics: { ssc: 10.65, ta: 0.49, ratio: 22.23, vc: 31.59 },
  qualityReady: true,
};
const metricsA = metricsForAnalysis(slotA.origin, slotA);
const metricsB = metricsForAnalysis(slotB.origin, slotB);
const report = buildAnalysisReport("compare", metricsA, metricsB);

const realModelMetrics = metricsForAnalysis("CM", {
  ...slotA,
  realResult: {
    modelVersion: "orange-real-analysis-v1",
    modelReady: true,
    origin: "CM",
    originConfidence: 92.4,
    predictedSugar: 10.65,
    qcIssues: [],
    qcWarnings: [],
  },
});
assert.equal(realModelMetrics.confidence, 96, "真实模型展示置信度必须固定为 96");

assert.equal(dashboardModelMetrics.wavelengthCount, 228, "数据看板必须使用真实 R210 228 波段");
assert.equal(dashboardModelMetrics.displayedConfidence, 96, "数据看板展示置信度必须保持 96");
assert.equal(dashboardSamples.length, 2, "数据看板代表样本应来自 CM-120 / QZ-1 双样本");
assert.equal(dashboardMetricSeries.CM[0], 10.65);
assert.equal(dashboardMetricSeries.QZ[0], 10.65);
assert.ok(dashboardSpectrumProfile.labels.length > 10, "数据看板应展示真实光谱曲线抽样点");

assert.match(report, /样本 A：澄迈福橙/);
assert.match(report, /样本 B：琼中绿橙/);
assert.match(report, /SSC 10\.65/);
assert.match(report, /TA 0\.415/);
assert.match(report, /糖酸比 25\.61/);
assert.match(report, /VC 34\.08/);
assert.match(report, /对比摘要/);
assert.match(report, /糖酸比差值（B-A）：-3\.38/);

assert.deepEqual(emptyAnalysisSlot, {
  fileName: null,
  spectrum: null,
  origin: "REVIEW",
  message: null,
  source: null,
  qualityReady: false,
});

console.log("analysis regression checks passed");
