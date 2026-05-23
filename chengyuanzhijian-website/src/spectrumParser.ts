export type SpectrumPoint = {
  wavelength: number;
  reflectance: number;
};

const MIN_VECTOR_LENGTH = 60;
const DEFAULT_VECTOR_LENGTH = 260;

function cleanCell(part: string) {
  return part.trim().replace(/^"|"$/g, "");
}

function splitDelimitedLine(line: string) {
  return line.split(/,|\t|;/).map(cleanCell);
}

function numericCells(cells: string[]) {
  return cells.map((part) => Number(part)).filter(Number.isFinite);
}

function normalizeSpectrumVector(values: number[], preferredLength = DEFAULT_VECTOR_LENGTH) {
  let cleaned = values.filter(Number.isFinite);
  if (!cleaned.length) return [];

  const leadingReflectance = [];
  for (const value of cleaned) {
    if (Math.abs(value) > 2) break;
    leadingReflectance.push(value);
  }
  if (leadingReflectance.length >= MIN_VECTOR_LENGTH && leadingReflectance.length < cleaned.length) cleaned = leadingReflectance;

  return cleaned.slice(0, preferredLength);
}

function collectJsonVector(value: unknown, preferredLength: number): number[] {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "number" && Number.isFinite(item))) {
      return normalizeSpectrumVector(value, preferredLength);
    }

    for (const item of value) {
      const nested = collectJsonVector(item, preferredLength);
      if (nested.length >= MIN_VECTOR_LENGTH) return nested;
    }
  }

  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    const preferredKeys = ["spectrum", "reflectance", "reflectances", "values", "data"];
    for (const key of preferredKeys) {
      const nested = collectJsonVector(object[key], preferredLength);
      if (nested.length >= MIN_VECTOR_LENGTH) return nested;
    }

    for (const nestedValue of Object.values(object)) {
      const nested = collectJsonVector(nestedValue, preferredLength);
      if (nested.length >= MIN_VECTOR_LENGTH) return nested;
    }
  }

  return [];
}

export function parseSpectrumValues(text: string, preferredLength = DEFAULT_VECTOR_LENGTH) {
  const normalizedText = text.replace(/^\uFEFF/, "").trim();
  if (!normalizedText) return [];

  if (/^[\[{]/.test(normalizedText)) {
    try {
      const fromJson = collectJsonVector(JSON.parse(normalizedText), preferredLength);
      if (fromJson.length >= MIN_VECTOR_LENGTH) return fromJson;
    } catch {
      // Fall through to delimited parsing.
    }
  }

  const rows = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(splitDelimitedLine);

  const widestNumericRow = rows
    .map(numericCells)
    .filter((values) => values.length >= MIN_VECTOR_LENGTH)
    .sort((a, b) => b.length - a.length)[0];
  if (widestNumericRow) return normalizeSpectrumVector(widestNumericRow, preferredLength);

  const values: number[] = [];
  for (const row of rows) {
    if (row.some((cell) => /wavelength|reflectance|band|波长|反射率|编号|sample/i.test(cell))) continue;
    const numeric = numericCells(row);
    if (numeric.length === 1) values.push(numeric[0]);
    else if (numeric.length >= 2) values.push(numeric[numeric.length - 1]);
  }

  return normalizeSpectrumVector(values, preferredLength);
}

export function parseSpectrumPoints(text: string) {
  const rows = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(splitDelimitedLine);
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.toLowerCase());
  const wavelengthIndex = headers.findIndex((header) => /wavelength|wave|band|波长/.test(header));
  const reflectanceIndex = headers.findIndex((header) => /reflectance|反射率|intensity|value/.test(header));
  const pointsByWavelength = new Map<number, number[]>();

  for (const row of rows.slice(1)) {
    const numeric = row.map((part) => Number(part));
    let wavelength: number;
    let reflectance: number;

    if (wavelengthIndex >= 0 && reflectanceIndex >= 0) {
      wavelength = numeric[wavelengthIndex];
      reflectance = numeric[reflectanceIndex];
    } else {
      const values = numeric.filter(Number.isFinite);
      if (values.length !== 2) continue;
      wavelength = values[0];
      reflectance = values[1];
    }

    if (!Number.isFinite(wavelength) || !Number.isFinite(reflectance)) continue;
    const list = pointsByWavelength.get(wavelength) ?? [];
    list.push(reflectance);
    pointsByWavelength.set(wavelength, list);
  }

  return Array.from(pointsByWavelength.entries())
    .map(([wavelength, values]) => ({
      wavelength,
      reflectance: values.reduce((sum, value) => sum + value, 0) / values.length,
    }))
    .sort((a, b) => a.wavelength - b.wavelength);
}

export function spectrumValuesToPoints(values: number[], wavelengths: number[]): SpectrumPoint[] {
  return values.slice(0, wavelengths.length).map((reflectance, index) => ({
    wavelength: wavelengths[index],
    reflectance,
  }));
}
