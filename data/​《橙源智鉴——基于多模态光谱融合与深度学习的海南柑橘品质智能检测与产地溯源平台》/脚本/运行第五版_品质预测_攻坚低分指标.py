from __future__ import annotations

import time
import warnings
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from scipy.signal import savgol_filter
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.cross_decomposition import PLSRegression
from sklearn.decomposition import PCA
from sklearn.multioutput import MultiOutputRegressor
from sklearn.svm import SVR
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[1]
EXPERIMENT_DIR = ROOT / "正式实验"
DATASET_DIR = EXPERIMENT_DIR / "数据集"
SPLIT_DIR = EXPERIMENT_DIR / "划分方案"
RESULT_DIR = EXPERIMENT_DIR / "研究记录" / "进阶优化记录"

RANDOM_STATE = 20260409
META_COLS = ["sample_id", "origin", "sample_number"]

class SNV(BaseEstimator, TransformerMixin):
    def fit(self, X: np.ndarray, y: Any = None) -> SNV:
        return self
    def transform(self, X: np.ndarray) -> np.ndarray:
        mean = np.mean(X, axis=1, keepdims=True)
        std = np.std(X, axis=1, keepdims=True)
        return (X - mean) / (std + 1e-12)

class SGFilter(BaseEstimator, TransformerMixin):
    """Savitzky-Golay 平滑滤波/求导，去噪并凸显重叠的酸度等吸收峰。"""
    def __init__(self, window_length: int = 15, polyorder: int = 2, deriv: int = 1):
        self.window_length = window_length
        self.polyorder = polyorder
        self.deriv = deriv

    def fit(self, X: np.ndarray, y: Any = None) -> SGFilter:
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        return savgol_filter(X, window_length=self.window_length, polyorder=self.polyorder, deriv=self.deriv, axis=1)


def main() -> None:
    split_df = pd.read_csv(SPLIT_DIR / "统一样本划分.csv", encoding="utf-8-sig")
    quality_df = pd.read_csv(DATASET_DIR / "任务1_品质预测数据集.csv", encoding="utf-8-sig")
    quality_data = split_df.merge(quality_df, on=META_COLS, how="inner")
    
    # 针对之前落后的品质指标
    low_targets = ["titration_酸度", "titration_VC", "titration_糖酸比"]
    
    r210_cols = [c for c in quality_data.columns if c.startswith("r210_")]
    s960_cols = [c for c in quality_data.columns if c.startswith("s960_")]
    feature_cols = [*r210_cols, *s960_cols]
    
    train_df = quality_data[quality_data["split"] == "训练集"].reset_index(drop=True)
    val_df = quality_data[quality_data["split"] == "验证集"].reset_index(drop=True)
    test_df = quality_data[quality_data["split"] == "测试集"].reset_index(drop=True)
    
    X_train = train_df[feature_cols].to_numpy(dtype=float)
    X_val = val_df[feature_cols].to_numpy(dtype=float)
    X_test = test_df[feature_cols].to_numpy(dtype=float)
    y_train = train_df[low_targets].to_numpy(dtype=float)
    y_val = val_df[low_targets].to_numpy(dtype=float)
    y_test = test_df[low_targets].to_numpy(dtype=float)
    
    pipelines = {
        "传统PLS (作参照)": Pipeline([("snv", SNV()), ("scaler", StandardScaler()), ("pls", PLSRegression(n_components=10))]),
        "SG一阶导 + PLS (解光谱重叠)": Pipeline([("sg", SGFilter(15, 2, 1)), ("scaler", StandardScaler()), ("pls", PLSRegression(n_components=15))]),
        "SNV + SVR (非线性挖掘)": Pipeline([("snv", SNV()), ("scaler", StandardScaler()), ("svr", MultiOutputRegressor(SVR(C=100.0, kernel="rbf")))]),
        "SNV + PCA + RandomForest (树模型组合)": Pipeline([("snv", SNV()), ("scaler", StandardScaler()), ("pca", PCA(n_components=50, random_state=RANDOM_STATE)), ("rf", RandomForestRegressor(n_estimators=200, max_features="sqrt", random_state=RANDOM_STATE))]),
        "SNV + PCA + XGBoost (极端梯度提升)": Pipeline([("snv", SNV()), ("scaler", StandardScaler()), ("pca", PCA(n_components=50, random_state=RANDOM_STATE)), ("xgb", MultiOutputRegressor(XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.05, random_state=RANDOM_STATE)))])
    }

    results = []
    print("=== 开始针对 [酸度, VC, 糖酸比] 的困难指标攻坚实验 ===")
    
    for name, pipe in pipelines.items():
        pipe.fit(X_train, y_train)
        val_pred = pipe.predict(X_val)
        test_pred = pipe.predict(X_test)
        
        # 对于多输出结果单独计算每种指标的R2
        for idx, target in enumerate(low_targets):
            val_r2 = r2_score(y_val[:, idx], val_pred[:, idx])
            test_r2 = r2_score(y_test[:, idx], test_pred[:, idx])
            
            results.append({
                "目标指标": target,
                "攻坚方案": name,
                "验证集R2": round(val_r2, 4),
                "测试集R2": round(test_r2, 4),
            })
            
    df_res = pd.DataFrame(results).sort_values(["目标指标", "验证集R2"], ascending=[True, False])
    print("\n[ 各低分指标的最佳挽救方案排行 ]")
    
    for target in low_targets:
        print(f"\n--- {target} ---")
        print(df_res[df_res["目标指标"] == target][["攻坚方案", "验证集R2", "测试集R2"]].to_string(index=False))

if __name__ == "__main__":
    main()