import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function parseSpectrumCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
  const wavelengthIndex = headers.indexOf("wavelength");
  const reflectanceIndex = headers.indexOf("reflectance");
  if (wavelengthIndex < 0 || reflectanceIndex < 0) {
    throw new Error("CSV must include wavelength and reflectance columns");
  }

  return lines.slice(1).map((line) => {
    const columns = line.split(",");
    return {
      wavelength: Number(Number(columns[wavelengthIndex]).toFixed(3)),
      reflectance: Number(Number(columns[reflectanceIndex]).toFixed(8)),
    };
  });
}

const cm = parseSpectrumCsv(await readFile(resolve(root, "test-data/analysis-real-r210-single-cm120.csv"), "utf8"));
const qz = parseSpectrumCsv(await readFile(resolve(root, "test-data/analysis-real-r210-single-qz1.csv"), "utf8"));

const source = `// Generated from test-data/analysis-real-r210-single-*.csv by scripts/export_real_spectrum_samples.mjs.
export const realSpectrumSampleMeta = {
  CM: "CM-120 R210",
  QZ: "QZ-1 R210",
} as const;

export const realSpectrumWavelengths = ${JSON.stringify(cm.map((point) => point.wavelength))};

export const realSpectrumCM = ${JSON.stringify(cm.map((point) => point.reflectance))};

export const realSpectrumQZ = ${JSON.stringify(qz.map((point) => point.reflectance))};
`;

await writeFile(resolve(root, "src/realSpectrumSamples.ts"), source);
console.log(`exported ${cm.length} CM bands and ${qz.length} QZ bands`);
