import { parseSpectrumPoints, parseSpectrumValues, spectrumValuesToPoints, type SpectrumPoint } from "./spectrumParser";

export type RealOrigin = "CM" | "QZ" | "REVIEW";

type SvmModel = {
  kind: "rbfSvm";
  gamma: number;
  supportVectors: number[][];
  dualCoef: number[];
  intercept: number;
};

type PlsrModel = {
  kind: "plsr";
  nComponents: number;
  coef: number[];
  intercept: number;
};

type PreprocessingSpec = {
  sgWindow: number;
  polyorder: number;
  deriv: 1 | 2;
  snv: boolean;
};

export type RealAnalysisModelArtifact = {
  modelVersion: string;
  trainingSet: {
    sensor: "R210";
    samples: number;
    wavelengthCount: number;
    wavelengthMin: number;
    wavelengthMax: number;
  };
  wavelengths: number[];
  models: {
    origin: {
      preprocessing: PreprocessingSpec;
      selectedIndices: number[];
      selectedWavelengths: number[];
      classes: ["CM", "QZ"];
      model: SvmModel;
      cvMetrics: { accuracy: number; macroF1: number; source: string };
    };
    sugar: {
      preprocessing: PreprocessingSpec;
      scaler: { mean: number[]; scale: number[] };
      selectedIndices: number[];
      selectedWavelengths: number[];
      model: PlsrModel;
      cvMetrics: { r2: number; rmse: number; mae: number; rpd: number; source: string };
    };
  };
  qualityRules: {
    minCoverageRatio: number;
    minValidBands: number;
    reviewSugarBelow: number;
    standardSugar: number;
    preferredSugar: number;
    premiumSugar: number;
  };
};

export type RealAnalysisResult = {
  modelVersion: string;
  origin: RealOrigin;
  originConfidence: number;
  predictedSugar?: number;
  coverageRatio: number;
  validBands: number;
  inputRange?: [number, number];
  modelRange: [number, number];
  qcIssues: string[];
  qcWarnings: string[];
  modelReady: boolean;
};

let modelPromise: Promise<RealAnalysisModelArtifact | null> | null = null;

export function loadRealAnalysisModel() {
  if (!modelPromise) {
    modelPromise = fetch(`${import.meta.env.BASE_URL}model-artifacts/orange-real-analysis-v1.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`Model artifact request failed: ${response.status}`);
        return response.json() as Promise<RealAnalysisModelArtifact>;
      })
      .catch(() => null);
  }
  return modelPromise;
}

export function analyzeRealR210Spectrum(text: string, artifact: RealAnalysisModelArtifact): RealAnalysisResult {
  const normalizedText = text.replace(/^\uFEFF/, "").trim();
  let points: SpectrumPoint[] = [];
  if (/^[\[{]/.test(normalizedText)) {
    const vector = parseSpectrumValues(text, artifact.wavelengths.length);
    if (vector.length >= artifact.qualityRules.minValidBands) {
      points = spectrumValuesToPoints(vector, artifact.wavelengths);
    }
  }

  if (!points.length) {
    points = parseSpectrumPoints(text);
  }

  if (points.length < artifact.qualityRules.minValidBands) {
    const vector = parseSpectrumValues(text, artifact.wavelengths.length);
    if (vector.length >= artifact.qualityRules.minValidBands) {
      points = spectrumValuesToPoints(vector, artifact.wavelengths);
    }
  }
  const modelRange: [number, number] = [artifact.trainingSet.wavelengthMin, artifact.trainingSet.wavelengthMax];
  const qcIssues: string[] = [];
  const qcWarnings: string[] = [];

  if (points.length < artifact.qualityRules.minValidBands) {
    qcIssues.push(`有效光谱点 ${points.length} 个，低于 R210 模型要求的 ${artifact.qualityRules.minValidBands} 个。`);
  }

  if (!points.length) {
    return {
      modelVersion: artifact.modelVersion,
      origin: "REVIEW",
      originConfidence: 0,
      coverageRatio: 0,
      validBands: 0,
      modelRange,
      qcIssues: ["没有识别到 wavelength/reflectance 数值列。"],
      qcWarnings,
      modelReady: false,
    };
  }

  const inputRange: [number, number] = [points[0].wavelength, points[points.length - 1].wavelength];
  const resampled = resampleToModelWavelengths(points, artifact.wavelengths);
  const coverageRatio = resampled.covered / artifact.wavelengths.length;
  if (coverageRatio < artifact.qualityRules.minCoverageRatio) {
    qcIssues.push(
      `上传光谱覆盖率 ${(coverageRatio * 100).toFixed(1)}%，未覆盖完整 R210 ${modelRange[0].toFixed(0)}-${modelRange[1].toFixed(0)} nm 区间。`,
    );
  }

  if (qcIssues.length) {
    return {
      modelVersion: artifact.modelVersion,
      origin: "REVIEW",
      originConfidence: 0,
      coverageRatio,
      validBands: points.length,
      inputRange,
      modelRange,
      qcIssues,
      qcWarnings,
      modelReady: false,
    };
  }

  const originInput = preprocessOne(resampled.values, artifact.models.origin.preprocessing);
  const originSelected = selectValues(originInput, artifact.models.origin.selectedIndices);
  const decision = rbfSvmDecision(originSelected, artifact.models.origin.model);
  const origin: RealOrigin = decision >= 0 ? "QZ" : "CM";
  const originConfidence = confidenceFromMargin(decision);

  const sugarInput = preprocessOne(resampled.values, artifact.models.sugar.preprocessing);
  const sugarScaled = sugarInput.map((value, index) => {
    const scale = artifact.models.sugar.scaler.scale[index] || 1;
    return (value - artifact.models.sugar.scaler.mean[index]) / scale;
  });
  const sugarSelected = selectValues(sugarScaled, artifact.models.sugar.selectedIndices);
  const predictedSugar = plsrPredict(sugarSelected, artifact.models.sugar.model);

  qcWarnings.push("真实模型当前输出产地与糖度；酸度、糖酸比、VC 优先使用上传文件中的实测列。");
  if (originConfidence < 72) qcWarnings.push("产地判别边界距离偏低，建议人工复核。");
  if (predictedSugar < 0 || predictedSugar > 25) {
    qcIssues.push(`预测糖度 ${predictedSugar.toFixed(2)} 超出可展示范围，建议复测或重新导出光谱。`);
  } else if (predictedSugar < artifact.qualityRules.reviewSugarBelow) {
    qcWarnings.push("预测糖度低于复检线，建议复测或人工分拣。");
  }

  if (qcIssues.length) {
    return {
      modelVersion: artifact.modelVersion,
      origin: "REVIEW",
      originConfidence,
      predictedSugar,
      coverageRatio,
      validBands: points.length,
      inputRange,
      modelRange,
      qcIssues,
      qcWarnings,
      modelReady: false,
    };
  }

  return {
    modelVersion: artifact.modelVersion,
    origin,
    originConfidence,
    predictedSugar,
    coverageRatio,
    validBands: points.length,
    inputRange,
    modelRange,
    qcIssues,
    qcWarnings,
    modelReady: true,
  };
}

function resampleToModelWavelengths(points: SpectrumPoint[], targetWavelengths: number[]) {
  const values: number[] = [];
  let covered = 0;
  let pointer = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (const target of targetWavelengths) {
    while (pointer < points.length - 2 && points[pointer + 1].wavelength < target) pointer += 1;
    if (target < first.wavelength || target > last.wavelength) {
      values.push(target < first.wavelength ? first.reflectance : last.reflectance);
      continue;
    }

    covered += 1;
    const left = points[pointer];
    const right = points[Math.min(pointer + 1, points.length - 1)];
    if (Math.abs(left.wavelength - target) < 1e-9 || left.wavelength === right.wavelength) {
      values.push(left.reflectance);
    } else {
      const ratio = (target - left.wavelength) / (right.wavelength - left.wavelength);
      values.push(left.reflectance + (right.reflectance - left.reflectance) * ratio);
    }
  }

  return { values, covered };
}

function preprocessOne(values: number[], spec: PreprocessingSpec) {
  const sg = savitzkyGolayDerivative(values, spec.sgWindow, spec.deriv);
  if (!spec.snv) return sg;
  const mean = sg.reduce((sum, value) => sum + value, 0) / sg.length;
  const variance = sg.reduce((sum, value) => sum + (value - mean) ** 2, 0) / sg.length;
  const std = Math.sqrt(variance) || 1;
  return sg.map((value) => (value - mean) / std);
}

function savitzkyGolayDerivative(values: number[], windowLength: number, deriv: 1 | 2) {
  const half = Math.floor(windowLength / 2);
  return values.map((_, index) => {
    let start = Math.max(0, index - half);
    let end = Math.min(values.length - 1, index + half);
    if (end - start + 1 < windowLength) {
      if (start === 0) end = Math.min(values.length - 1, windowLength - 1);
      else start = Math.max(0, values.length - windowLength);
    }

    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = start; i <= end; i += 1) {
      xs.push(i - index);
      ys.push(values[i]);
    }
    const coeff = fitQuadratic(xs, ys);
    return deriv === 1 ? coeff[1] : coeff[2] * 2;
  });
}

function fitQuadratic(xs: number[], ys: number[]) {
  let n = 0;
  let sx = 0;
  let sx2 = 0;
  let sx3 = 0;
  let sx4 = 0;
  let sy = 0;
  let sxy = 0;
  let sx2y = 0;

  xs.forEach((x, index) => {
    const y = ys[index];
    const x2 = x * x;
    n += 1;
    sx += x;
    sx2 += x2;
    sx3 += x2 * x;
    sx4 += x2 * x2;
    sy += y;
    sxy += x * y;
    sx2y += x2 * y;
  });

  return solve3(
    [
      [n, sx, sx2],
      [sx, sx2, sx3],
      [sx2, sx3, sx4],
    ],
    [sy, sxy, sx2y],
  );
}

function solve3(matrix: number[][], rhs: number[]) {
  const a = matrix.map((row, index) => [...row, rhs[index]]);
  for (let col = 0; col < 3; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < 3; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    [a[col], a[pivot]] = [a[pivot], a[col]];
    const divisor = a[col][col] || 1;
    for (let j = col; j < 4; j += 1) a[col][j] /= divisor;
    for (let row = 0; row < 3; row += 1) {
      if (row === col) continue;
      const factor = a[row][col];
      for (let j = col; j < 4; j += 1) a[row][j] -= factor * a[col][j];
    }
  }
  return [a[0][3], a[1][3], a[2][3]];
}

function selectValues(values: number[], indices: number[]) {
  return indices.map((index) => values[index] ?? 0);
}

function rbfSvmDecision(input: number[], model: SvmModel) {
  let decision = model.intercept;
  for (let i = 0; i < model.supportVectors.length; i += 1) {
    const support = model.supportVectors[i];
    let dist2 = 0;
    for (let j = 0; j < input.length; j += 1) {
      dist2 += (input[j] - support[j]) ** 2;
    }
    decision += model.dualCoef[i] * Math.exp(-model.gamma * dist2);
  }
  return decision;
}

function confidenceFromMargin(decision: number) {
  const confidence = 50 + (1 / (1 + Math.exp(-Math.abs(decision) * 1.8)) - 0.5) * 100;
  return Math.min(99.2, Math.max(50, confidence));
}

function plsrPredict(input: number[], model: PlsrModel) {
  return input.reduce((sum, value, index) => sum + value * (model.coef[index] ?? 0), model.intercept);
}
