from __future__ import annotations

import json
import time
import warnings
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

import numpy as np
import pandas as pd
from scipy.signal import savgol_filter
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.cross_decomposition import PLSRegression
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[1]
EXPERIMENT_DIR = ROOT / "正式实验"
DATASET_DIR = EXPERIMENT_DIR / "数据集"
SPLIT_DIR = EXPERIMENT_DIR / "划分方案"
RESULT_DIR = EXPERIMENT_DIR / "基线结果"

RANDOM_STATE = 20260409
META_COLS = ["sample_id", "origin", "sample_number"]

class SNV(BaseEstimator, TransformerMixin):
    """标准正态变量变换 (Standard Normal Variate)，消除样本表面散射引起的基线漂移。逐样本处理。"""
    def fit(self, X: np.ndarray, y: Any = None) -> SNV:
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        mean = np.mean(X, axis=1, keepdims=True)
        std = np.std(X, axis=1, keepdims=True)
        return (X - mean) / (std + 1e-12)

class SGFilter(BaseEstimator, TransformerMixin):
    """Savitzky-Golay 平滑滤波/求导，去噪并凸显吸收峰。"""
    def __init__(self, window_length: int = 15, polyorder: int = 2, deriv: int = 0):
        self.window_length = window_length
        self.polyorder = polyorder
        self.deriv = deriv

    def fit(self, X: np.ndarray, y: Any = None) -> SGFilter:
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        return savgol_filter(X, window_length=self.window_length, polyorder=self.polyorder, deriv=self.deriv, axis=1)

@dataclass(frozen=True)
class PreprocessSpec:
    name: str
    builder: Callable[[], list[Any]]

def load_split_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    split_df = pd.read_csv(SPLIT_DIR / "统一样本划分.csv", encoding="utf-8-sig")
    quality_df = pd.read_csv(DATASET_DIR / "任务1_品质预测数据集.csv", encoding="utf-8-sig")
    origin_df = pd.read_csv(DATASET_DIR / "任务2_产地溯源数据集.csv", encoding="utf-8-sig")
    lcms_df = pd.read_csv(DATASET_DIR / "任务3_液质成分预测数据集.csv", encoding="utf-8-sig")
    return split_df, quality_df, origin_df, lcms_df

def merge_with_split(df: pd.DataFrame, split_df: pd.DataFrame) -> pd.DataFrame:
    return split_df.merge(df, on=META_COLS, how="inner")

def preprocess_specs() -> list[PreprocessSpec]:
    return [
        PreprocessSpec("1_无预处理(Scaler)", lambda: [("scaler", StandardScaler())]),
        PreprocessSpec("2_SNV", lambda: [("snv", SNV()), ("scaler", StandardScaler())]),
        PreprocessSpec("3_SG平滑", lambda: [("sg", SGFilter(window_length=15, polyorder=2, deriv=0)), ("scaler", StandardScaler())]),
        PreprocessSpec("4_SG一阶导数", lambda: [("sg", SGFilter(window_length=15, polyorder=2, deriv=1)), ("scaler", StandardScaler())]),
        PreprocessSpec("5_SNV+SG一阶导", lambda: [("snv", SNV()), ("sg", SGFilter(window_length=15, polyorder=2, deriv=1)), ("scaler", StandardScaler())]),
    ]

def main() -> None:
    split_df, quality_df, _, lcms_df = load_split_data()
    lcms_data = merge_with_split(lcms_df, split_df)
    
    # 锁定第一版选出的最佳 11 个目标物质
    core_lcms = [
        "lcms_Isocitric_acid", "lcms_Shikimic_acid", "lcms_E_1_Propene_1_2_3_Tricarboxylic_Acid",
        "lcms_Cls_Aconitic_acid", "lcms_Phe", "lcms_yiaweisuan", "lcms_蔗糖",
        "lcms_His", "lcms_Tyr", "lcms_L_KangHuaiXueSuan", "lcms_Asp"
    ]
    lcms_targets = [c for c in core_lcms if c in lcms_data.columns]
    
    # 获取特征
    r210_cols = [c for c in quality_df.columns if c.startswith("r210_")]
    s960_cols = [c for c in quality_df.columns if c.startswith("s960_")]
    feature_sets = {"R210+S960双光谱": [*r210_cols, *s960_cols]}

    train_df = lcms_data[lcms_data["split"] == "训练集"].reset_index(drop=True)
    val_df = lcms_data[lcms_data["split"] == "验证集"].reset_index(drop=True)
    test_df = lcms_data[lcms_data["split"] == "测试集"].reset_index(drop=True)

    summary_rows = []
    
    specs = preprocess_specs()
    
    for feat_name, feat_cols in feature_sets.items():
        X_train = train_df[feat_cols].to_numpy(dtype=float)
        X_val = val_df[feat_cols].to_numpy(dtype=float)
        X_test = test_df[feat_cols].to_numpy(dtype=float)
        y_train = train_df[lcms_targets].to_numpy(dtype=float)
        y_val = val_df[lcms_targets].to_numpy(dtype=float)
        y_test = test_df[lcms_targets].to_numpy(dtype=float)

        for prep_spec in specs:
            start = time.time()
            # 测试岭回归在不同预处理下的表现
            pipeline = Pipeline([
                *prep_spec.builder(),
                ("ridge", Ridge(alpha=10.0, random_state=RANDOM_STATE))
            ])
            pipeline.fit(X_train, y_train)
            test_pred = pipeline.predict(X_test)
            val_pred = pipeline.predict(X_val)
            
            # 计算平均R2
            val_r2 = float(np.mean([r2_score(y_val[:, i], val_pred[:, i]) for i in range(len(lcms_targets))]))
            test_r2 = float(np.mean([r2_score(y_test[:, i], test_pred[:, i]) for i in range(len(lcms_targets))]))
            
            summary_rows.append({
                "预处理方案": prep_spec.name,
                "模型": "岭回归",
                "验证集平均R2": round(val_r2, 4),
                "测试集平均R2": round(test_r2, 4),
                "耗时": round(time.time() - start, 2)
            })

    output_df = pd.DataFrame(summary_rows).sort_values("测试集平均R2", ascending=False)
    print("=== 光谱预处理对比 (基于岭回归，预测 11 种核心物质) ===")
    print(output_df.to_string(index=False))

if __name__ == "__main__":
    main()
