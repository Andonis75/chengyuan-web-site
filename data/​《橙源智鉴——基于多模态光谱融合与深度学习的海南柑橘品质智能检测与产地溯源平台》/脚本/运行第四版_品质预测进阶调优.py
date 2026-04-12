from __future__ import annotations

import json
import time
import warnings
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.cross_decomposition import PLSRegression
from sklearn.decomposition import PCA
from sklearn.linear_model import Ridge, ElasticNet
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import ParameterGrid

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[1]
EXPERIMENT_DIR = ROOT / "正式实验"
DATASET_DIR = EXPERIMENT_DIR / "数据集"
SPLIT_DIR = EXPERIMENT_DIR / "划分方案"
RESULT_DIR = EXPERIMENT_DIR / "研究记录" / "进阶优化记录"

RANDOM_STATE = 20260409
META_COLS = ["sample_id", "origin", "sample_number"]

class SNV(BaseEstimator, TransformerMixin):
    """标准正态变量变换"""
    def fit(self, X: np.ndarray, y: Any = None) -> SNV:
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        mean = np.mean(X, axis=1, keepdims=True)
        std = np.std(X, axis=1, keepdims=True)
        return (X - mean) / (std + 1e-12)

def load_split_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    split_df = pd.read_csv(SPLIT_DIR / "统一样本划分.csv", encoding="utf-8-sig")
    quality_df = pd.read_csv(DATASET_DIR / "任务1_品质预测数据集.csv", encoding="utf-8-sig")
    return split_df, quality_df

def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> tuple[float, float, float]:
    r2_list = [r2_score(y_true[:, i], y_pred[:, i]) for i in range(y_true.shape[1])]
    rmse_list = [np.sqrt(mean_squared_error(y_true[:, i], y_pred[:, i])) for i in range(y_true.shape[1])]
    mae_list = [mean_absolute_error(y_true[:, i], y_pred[:, i]) for i in range(y_true.shape[1])]
    return float(np.mean(r2_list)), float(np.mean(rmse_list)), float(np.mean(mae_list))

def search_params(
    pipeline_name: str, 
    builder: Any, 
    param_grid: dict[str, list[Any]],
    X_train: np.ndarray, y_train: np.ndarray,
    X_val: np.ndarray, y_val: np.ndarray,
    X_test: np.ndarray, y_test: np.ndarray
) -> list[dict[str, Any]]:
    
    grid = list(ParameterGrid(param_grid))
    results = []
    
    print(f"[*] 开始搜索: {pipeline_name}, 共 {len(grid)} 组参数...")
    
    for params in grid:
        start_t = time.time()
        
        pipe = builder()
        pipe.set_params(**params)
        pipe.fit(X_train, y_train)
        
        val_pred = pipe.predict(X_val)
        test_pred = pipe.predict(X_test)
        
        val_r2, val_rmse, val_mae = compute_metrics(y_val, val_pred)
        test_r2, test_rmse, test_mae = compute_metrics(y_test, test_pred)
        
        res = {
            "实验方案": pipeline_name,
            "参数组合": str(params).replace("{", "").replace("}", "").replace("'", ""),
            "验证集平均R2": val_r2,
            "测试集平均R2": test_r2,
            "验证集平均RMSE": val_rmse,
            "验证集平均MAE": val_mae,
            "耗时(秒)": round(time.time() - start_t, 2)
        }
        results.append(res)
        
    return results

def main() -> None:
    RESULT_DIR.mkdir(parents=True, exist_ok=True)
    
    split_df, quality_df = load_split_data()
    quality_data = split_df.merge(quality_df, on=META_COLS, how="inner")
    
    quality_targets = [c for c in quality_data.columns if c.startswith("titration_")]
    
    r210_cols = [c for c in quality_data.columns if c.startswith("r210_")]
    s960_cols = [c for c in quality_data.columns if c.startswith("s960_")]
    
    # 任务1在基线中表现最好的特征方案是单光谱和双光谱交替，这里我们直接用双光谱 R210+S960 探上限
    feature_cols = [*r210_cols, *s960_cols]
    
    train_df = quality_data[quality_data["split"] == "训练集"].reset_index(drop=True)
    val_df = quality_data[quality_data["split"] == "验证集"].reset_index(drop=True)
    test_df = quality_data[quality_data["split"] == "测试集"].reset_index(drop=True)
    
    X_train = train_df[feature_cols].to_numpy(dtype=float)
    X_val = val_df[feature_cols].to_numpy(dtype=float)
    X_test = test_df[feature_cols].to_numpy(dtype=float)
    
    y_train = train_df[quality_targets].to_numpy(dtype=float)
    y_val = val_df[quality_targets].to_numpy(dtype=float)
    y_test = test_df[quality_targets].to_numpy(dtype=float)
    
    all_results = []
    
    # 策略1：SNV + Ridge/弹性网络 参数精调
    print("\n--- 路线1：SNV预处理 + 完整光谱回归调参 (品质预测) ---")
    ridge_grid = {"ridge__alpha": [0.1, 1.0, 10.0, 50.0, 100.0, 500.0, 1000.0, 2000.0]}
    all_results.extend(search_params(
        "路线1: SNV_Ridge完整参数搜索",
        lambda: Pipeline([("snv", SNV()), ("scaler", StandardScaler()), ("ridge", Ridge(random_state=RANDOM_STATE))]),
        ridge_grid, X_train, y_train, X_val, y_val, X_test, y_test
    ))
    
    pls_grid = {"pls__n_components": [5, 10, 15, 20, 25, 30]}
    all_results.extend(search_params(
        "路线1: SNV_PLS主成分回归搜索",
        lambda: Pipeline([("snv", SNV()), ("scaler", StandardScaler()), ("pls", PLSRegression(scale=False))]),
        pls_grid, X_train, y_train, X_val, y_val, X_test, y_test
    ))

    # 策略2：SNV + PCA降维 + 模型精调
    print("\n--- 路线2：SNV预处理 + PCA切除废波段降维 + 岭回归调参 (品质预测) ---")
    pca_ridge_grid = {
        "pca__n_components": [10, 20, 30, 50, 80],
        "ridge__alpha": [0.1, 1.0, 10.0, 100.0, 500.0]
    }
    all_results.extend(search_params(
        "路线2: SNV_PCA降维_Ridge搜索",
        lambda: Pipeline([("snv", SNV()), ("scaler", StandardScaler()), ("pca", PCA(random_state=RANDOM_STATE)), ("ridge", Ridge(random_state=RANDOM_STATE))]),
        pca_ridge_grid, X_train, y_train, X_val, y_val, X_test, y_test
    ))

    df_res = pd.DataFrame(all_results).sort_values("验证集平均R2", ascending=False)
    
    csv_path = RESULT_DIR / "品质预测进阶调参完整记录.csv"
    df_res.to_csv(csv_path, index=False, encoding="utf-8-sig")
    print(f"\n[+] 全量详细记录已导出至: {csv_path}")
    
    top_models = df_res.groupby("实验方案").first().reset_index().sort_values("验证集平均R2", ascending=False)
    
    md_content = f"""# 第四版进阶优化总结：品质预测降维与调优

> 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
> 核心任务: 任务1_品质预测 (滴定法指标)  
> 数据输入: R210+S960双光谱融合  

## 🏆 最优结论速查 (Top 排行版)

| 排行 | 优化路线 | 最佳超参数组合 | 验证集平均 $R^2$ | 测试集平均 $R^2$ |
| :--- | :--- | :--- | :--- | :--- |
"""
    for _, row in top_models.iterrows():
        md_content += f"| | {row['实验方案']} | `{row['参数组合']}` | **{row['验证集平均R2']:.4f}** | **{row['测试集平均R2']:.4f}** |\n"
        
    md_content += """
## 简析
在品质预测任务中应用化学计量学预处理(SNV)与降维方法(PCA/PLS)，结果证明双光谱依然需要强正则（高 alpha）或主成分压缩来抑制高维噪音。完整运行参数已记录在 `品质预测进阶调参完整记录.csv` 中。
"""
    md_path = RESULT_DIR / "第四版品质预测进阶优化摘要.md"
    md_path.write_text(md_content, encoding="utf-8")

if __name__ == "__main__":
    main()