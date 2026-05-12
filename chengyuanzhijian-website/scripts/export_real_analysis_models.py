from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from scipy.signal import savgol_filter
from sklearn.cross_decomposition import PLSRegression
from sklearn.feature_selection import RFE
from sklearn.model_selection import GridSearchCV, KFold
from sklearn.preprocessing import StandardScaler
from sklearn.svm import LinearSVR, SVC


def find_source_dir(root: Path) -> Path:
    candidates = [p for p in root.iterdir() if p.is_dir() and p.name.endswith("v2")]
    for outer in candidates:
        for inner in outer.iterdir():
            if inner.is_dir() and inner.name.endswith("v2"):
                for data_dir in inner.iterdir():
                    if data_dir.is_dir() and data_dir.name.startswith("20260420 1743"):
                        return data_dir
    raise FileNotFoundError("Could not find the orange spectral data directory.")


def find_file(data_dir: Path, prefix: str, suffix: str) -> Path:
    for path in data_dir.iterdir():
        if path.is_file() and path.name.startswith(prefix) and path.name.endswith(suffix):
            return path
    raise FileNotFoundError(f"Could not find file with prefix {prefix!r} in {data_dir}")


def read_source_tables(source_dir: Path | None, prepared_dir: Path | None) -> tuple[pd.DataFrame, pd.DataFrame]:
    if prepared_dir:
        chem = pd.read_csv(prepared_dir / "chem.csv")
        r210 = pd.read_csv(prepared_dir / "r210.csv")
        return chem, r210

    if source_dir is None:
        source_dir = find_source_dir(Path.cwd())

    chem = pd.read_excel(find_file(source_dir, "1 ", ".xlsx"))
    r210 = pd.read_excel(find_file(source_dir, "3 R210", ".xlsx"))
    return chem, r210


def align_tables(chem: pd.DataFrame, r210: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, np.ndarray, np.ndarray]:
    chem = chem.rename(columns={chem.columns[0]: "sample_id"}).copy()
    r210 = r210.rename(columns={r210.columns[0]: "sample_id"}).copy()
    chem["sample_id"] = chem["sample_id"].astype(str)
    r210["sample_id"] = r210["sample_id"].astype(str)
    chem = chem.set_index("sample_id")
    r210 = r210.set_index("sample_id")

    common = chem.index.intersection(r210.index)
    chem = chem.loc[common].copy()
    r210 = r210.loc[common].copy()

    y_origin = np.array([0 if sample_id.startswith("CM") else 1 for sample_id in common], dtype=int)
    y_sugar = chem.iloc[:, 0].to_numpy(dtype=float)
    return chem, r210, y_origin, y_sugar


def preprocess_spectrum(X: np.ndarray, deriv: int) -> np.ndarray:
    X = np.asarray(X, dtype=float)
    X_sg = savgol_filter(X, window_length=11, polyorder=2, deriv=deriv, axis=1)
    row_mean = X_sg.mean(axis=1, keepdims=True)
    row_std = X_sg.std(axis=1, keepdims=True)
    row_std = np.where(row_std == 0, 1.0, row_std)
    return (X_sg - row_mean) / row_std


def train_origin_model(X_raw: np.ndarray, y: np.ndarray, wavelengths: np.ndarray) -> dict[str, Any]:
    X = preprocess_spectrum(X_raw, deriv=1)
    selector = RFE(
        estimator=SVC(kernel="linear", random_state=42),
        n_features_to_select=20,
        step=2,
    )
    X_selected = selector.fit_transform(X, y)
    model = SVC(kernel="rbf", C=10, gamma="scale", random_state=42)
    model.fit(X_selected, y)
    selected_indices = np.flatnonzero(selector.get_support()).astype(int)
    return {
        "preprocessing": {"sgWindow": 11, "polyorder": 2, "deriv": 1, "snv": True},
        "selectedIndices": selected_indices.tolist(),
        "selectedWavelengths": wavelengths[selected_indices].round(6).tolist(),
        "classes": ["CM", "QZ"],
        "model": {
            "kind": "rbfSvm",
            "gamma": float(model._gamma),
            "supportVectors": model.support_vectors_.tolist(),
            "dualCoef": model.dual_coef_[0].tolist(),
            "intercept": float(model.intercept_[0]),
        },
        "cvMetrics": {
            "accuracy": 0.9623,
            "macroF1": 0.9623,
            "source": "docs/tables/task1_origin_ablation.csv, R210 SG+SNV + RFE20 + SVM",
        },
    }


def train_sugar_model(X_raw: np.ndarray, y: np.ndarray, wavelengths: np.ndarray) -> dict[str, Any]:
    X = preprocess_spectrum(X_raw, deriv=2)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    selector = RFE(
        estimator=LinearSVR(C=1.0, epsilon=0.10, random_state=42, max_iter=10000, dual=True),
        n_features_to_select=30,
        step=10,
    )
    X_selected = selector.fit_transform(X_scaled, y)

    candidates = [2, 4, 6, 8, 10, 12, 15, 20, 25]
    grid = GridSearchCV(
        PLSRegression(scale=False),
        param_grid={"n_components": [v for v in candidates if v <= X_selected.shape[1]]},
        scoring="r2",
        cv=KFold(n_splits=5, shuffle=True, random_state=2026),
        n_jobs=1,
        refit=True,
    )
    grid.fit(X_selected, y)
    model = grid.best_estimator_
    selected_indices = np.flatnonzero(selector.get_support()).astype(int)
    coef = np.asarray(model.coef_).reshape(-1)
    intercept = np.asarray(model.intercept_).reshape(-1)

    return {
        "preprocessing": {"sgWindow": 11, "polyorder": 2, "deriv": 2, "snv": True},
        "scaler": {
            "mean": scaler.mean_.tolist(),
            "scale": scaler.scale_.tolist(),
        },
        "selectedIndices": selected_indices.tolist(),
        "selectedWavelengths": wavelengths[selected_indices].round(6).tolist(),
        "model": {
            "kind": "plsr",
            "nComponents": int(model.n_components),
            "coef": coef.tolist(),
            "intercept": float(intercept[0]) if len(intercept) else 0.0,
        },
        "cvMetrics": {
            "r2": 0.7053,
            "rmse": 0.9279,
            "mae": 0.7109,
            "rpd": 1.8444,
            "source": "docs/tables/task2_sugar_ablation.csv, R210 SG2+SNV + RFE30 + PLSR",
        },
    }


def write_demo_csv(path: Path, r210: pd.DataFrame, chem: pd.DataFrame) -> None:
    samples = ["CM-120", "QZ-1"]
    wavelength_columns = [str(c) for c in r210.columns]
    rows = ["sample_id,ssc,ta,ratio,vc,wavelength,reflectance"]
    for sample_id in samples:
        if sample_id not in r210.index or sample_id not in chem.index:
            continue
        chem_row = chem.loc[sample_id]
        for wavelength in wavelength_columns:
            rows.append(
                ",".join(
                    [
                        sample_id,
                        f"{float(chem_row.iloc[0]):.4f}",
                        f"{float(chem_row.iloc[1]):.4f}",
                        f"{float(chem_row.iloc[2]):.4f}",
                        f"{float(chem_row.iloc[3]):.4f}",
                        wavelength,
                        f"{float(r210.loc[sample_id, wavelength]):.8f}",
                    ]
                )
            )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(rows) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path)
    parser.add_argument("--prepared-dir", type=Path)
    parser.add_argument("--output", type=Path, default=Path("public/model-artifacts/orange-real-analysis-v1.json"))
    parser.add_argument("--demo-output", type=Path, default=Path("test-data/analysis-real-r210-dual-compare.csv"))
    args = parser.parse_args()

    chem_raw, r210_raw = read_source_tables(args.source_dir, args.prepared_dir)
    chem, r210, y_origin, y_sugar = align_tables(chem_raw, r210_raw)
    wavelengths = np.array([float(c) for c in r210.columns], dtype=float)
    X_raw = r210.to_numpy(dtype=float)

    artifact = {
        "schemaVersion": 1,
        "modelVersion": "orange-real-analysis-v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "trainingSet": {
            "samples": int(X_raw.shape[0]),
            "sensor": "R210",
            "wavelengthCount": int(X_raw.shape[1]),
            "wavelengthMin": float(wavelengths.min()),
            "wavelengthMax": float(wavelengths.max()),
        },
        "wavelengths": wavelengths.round(6).tolist(),
        "models": {
            "origin": train_origin_model(X_raw, y_origin, wavelengths),
            "sugar": train_sugar_model(X_raw, y_sugar, wavelengths),
        },
        "qualityRules": {
            "requiredSensor": "R210",
            "minCoverageRatio": 0.86,
            "minValidBands": 180,
            "reviewSugarBelow": 8.5,
            "standardSugar": 8.5,
            "preferredSugar": 10.0,
            "premiumSugar": 11.5,
        },
        "notes": [
            "Origin and sugar use real R210 spectral models exported from the orange spectral data v2 project.",
            "TA, sugar-acid ratio, VC and micro-compounds are not inferred unless supplied in the uploaded file.",
        ],
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(artifact, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    write_demo_csv(args.demo_output, r210, chem)
    print(f"Wrote model artifact: {args.output}")
    print(f"Wrote demo CSV: {args.demo_output}")


if __name__ == "__main__":
    main()
