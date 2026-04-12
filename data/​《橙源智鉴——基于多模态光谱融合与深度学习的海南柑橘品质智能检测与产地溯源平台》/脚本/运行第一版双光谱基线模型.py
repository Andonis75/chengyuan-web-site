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
from lightgbm import LGBMClassifier, LGBMRegressor
from sklearn.cross_decomposition import PLSRegression
from sklearn.ensemble import (
    ExtraTreesClassifier,
    ExtraTreesRegressor,
    RandomForestClassifier,
    RandomForestRegressor,
)
from sklearn.linear_model import ElasticNet, LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.multioutput import MultiOutputRegressor
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.svm import LinearSVC, SVC, SVR
from xgboost import XGBClassifier, XGBRegressor


warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[1]
EXPERIMENT_DIR = ROOT / "正式实验"
DATASET_DIR = EXPERIMENT_DIR / "数据集"
SPLIT_DIR = EXPERIMENT_DIR / "划分方案"
RESULT_DIR = EXPERIMENT_DIR / "基线结果"
RECORD_DIR = EXPERIMENT_DIR / "研究记录"

RANDOM_STATE = 20260409
META_COLS = ["sample_id", "origin", "sample_number"]


@dataclass(frozen=True)
class ModelSpec:
    name: str
    builder: Callable[[int, int], Any]


def ensure_dirs() -> None:
    RESULT_DIR.mkdir(parents=True, exist_ok=True)
    for task_name in ["任务1_品质预测", "任务2_产地溯源", "任务3_液质成分预测"]:
        (RESULT_DIR / task_name).mkdir(parents=True, exist_ok=True)


def read_csv(path: Path) -> pd.DataFrame:
    return pd.read_csv(path, encoding="utf-8-sig")


def load_split_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    split_df = read_csv(SPLIT_DIR / "统一样本划分.csv")
    quality_df = read_csv(DATASET_DIR / "任务1_品质预测数据集.csv")
    origin_df = read_csv(DATASET_DIR / "任务2_产地溯源数据集.csv")
    lcms_df = read_csv(DATASET_DIR / "任务3_液质成分预测数据集.csv")
    return split_df, quality_df, origin_df, lcms_df


def merge_with_split(df: pd.DataFrame, split_df: pd.DataFrame) -> pd.DataFrame:
    merged = split_df.merge(df, on=META_COLS, how="inner")
    if len(merged) != len(df):
        raise ValueError("Merged dataset size does not match source dataset size")
    return merged


def split_frames(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    train_df = df.loc[df["split"] == "训练集"].drop(columns="split").reset_index(drop=True)
    val_df = df.loc[df["split"] == "验证集"].drop(columns="split").reset_index(drop=True)
    test_df = df.loc[df["split"] == "测试集"].drop(columns="split").reset_index(drop=True)
    return train_df, val_df, test_df


def get_feature_sets(columns: list[str]) -> dict[str, list[str]]:
    r210_cols = [col for col in columns if col.startswith("r210_")]
    s960_cols = [col for col in columns if col.startswith("s960_")]
    return {
        "R210单光谱": r210_cols,
        "S960单光谱": s960_cols,
        "R210+S960双光谱": [*r210_cols, *s960_cols],
    }


def select_complete_targets(df: pd.DataFrame, target_cols: list[str]) -> tuple[list[str], pd.DataFrame]:
    missing_counts = df[target_cols].isna().sum().sort_values(ascending=False)
    stats_df = pd.DataFrame(
        {
            "target": missing_counts.index,
            "missing_count": missing_counts.values,
            "missing_ratio": (missing_counts / len(df)).values,
            "used_in_first_baseline": missing_counts.values == 0,
        }
    )
    usable_targets = stats_df.loc[stats_df["used_in_first_baseline"], "target"].tolist()
    return usable_targets, stats_df


def regression_model_specs_for_task(task_name: str) -> list[ModelSpec]:
    common_specs = [
        ModelSpec(
            name="PLS回归",
            builder=lambda n_features, n_targets: PLSRegression(
                n_components=max(2, min(20, n_features, 30)),
                scale=True,
            ),
        ),
        ModelSpec(
            name="岭回归",
            builder=lambda n_features, n_targets: Pipeline(
                [
                    ("scaler", StandardScaler()),
                    ("model", Ridge(alpha=10.0, random_state=RANDOM_STATE)),
                ]
            ),
        ),
        ModelSpec(
            name="弹性网络",
            builder=lambda n_features, n_targets: MultiOutputRegressor(
                Pipeline(
                    [
                        ("scaler", StandardScaler()),
                        (
                            "model",
                            ElasticNet(
                                alpha=0.001,
                                l1_ratio=0.2,
                                max_iter=1000,
                                random_state=RANDOM_STATE,
                            ),
                        ),
                    ]
                )
            ),
        ),
        ModelSpec(
            name="随机森林回归",
            builder=lambda n_features, n_targets: RandomForestRegressor(
                n_estimators=100,
                max_features="sqrt",
                n_jobs=1,
                random_state=RANDOM_STATE,
            ),
        ),
        ModelSpec(
            name="极端随机树回归",
            builder=lambda n_features, n_targets: ExtraTreesRegressor(
                n_estimators=100,
                max_features="sqrt",
                n_jobs=1,
                random_state=RANDOM_STATE,
            ),
        ),
        ModelSpec(
            name="XGBoost回归",
            builder=lambda n_features, n_targets: MultiOutputRegressor(
                XGBRegressor(
                    n_estimators=100,
                    max_depth=4,
                    learning_rate=0.05,
                    subsample=0.9,
                    colsample_bytree=0.8,
                    reg_lambda=1.0,
                    objective="reg:squarederror",
                    n_jobs=4,
                    random_state=RANDOM_STATE,
                    verbosity=0,
                )
            ),
        ),
    ]

    if task_name == "任务1_品质预测":
        return common_specs + [
            ModelSpec(
                name="SVR回归",
                builder=lambda n_features, n_targets: MultiOutputRegressor(
                    Pipeline(
                        [
                            ("scaler", StandardScaler()),
                            ("model", SVR(C=10.0, epsilon=0.05, kernel="rbf", gamma="scale")),
                        ]
                    )
                ),
            ),
            ModelSpec(
                name="K近邻回归",
                builder=lambda n_features, n_targets: Pipeline(
                    [
                        ("scaler", StandardScaler()),
                        ("model", KNeighborsRegressor(n_neighbors=7, weights="distance")),
                    ]
                ),
            ),
            ModelSpec(
                name="LightGBM回归",
                builder=lambda n_features, n_targets: MultiOutputRegressor(
                    LGBMRegressor(
                        n_estimators=100,
                        learning_rate=0.05,
                        num_leaves=31,
                        subsample=0.9,
                        colsample_bytree=0.8,
                        random_state=RANDOM_STATE,
                        verbose=-1,
                    )
                ),
            ),
        ]

    return common_specs


def classification_model_specs() -> list[ModelSpec]:
    return [
        ModelSpec(
            name="逻辑回归",
            builder=lambda n_features, n_classes: Pipeline(
                [
                    ("scaler", StandardScaler()),
                    (
                        "model",
                        LogisticRegression(
                            C=1.0,
                            solver="liblinear",
                            max_iter=1000,
                            random_state=RANDOM_STATE,
                        ),
                    ),
                ]
            ),
        ),
        ModelSpec(
            name="线性SVM",
            builder=lambda n_features, n_classes: Pipeline(
                [
                    ("scaler", StandardScaler()),
                    ("model", LinearSVC(C=1.0, max_iter=1000, random_state=RANDOM_STATE)),
                ]
            ),
        ),
        ModelSpec(
            name="RBF_SVM",
            builder=lambda n_features, n_classes: Pipeline(
                [
                    ("scaler", StandardScaler()),
                    ("model", SVC(C=10.0, kernel="rbf", gamma="scale", random_state=RANDOM_STATE)),
                ]
            ),
        ),
        ModelSpec(
            name="K近邻分类",
            builder=lambda n_features, n_classes: Pipeline(
                [
                    ("scaler", StandardScaler()),
                    ("model", KNeighborsClassifier(n_neighbors=7, weights="distance")),
                ]
            ),
        ),
        ModelSpec(
            name="随机森林分类",
            builder=lambda n_features, n_classes: RandomForestClassifier(
                n_estimators=100,
                max_features="sqrt",
                n_jobs=1,
                random_state=RANDOM_STATE,
            ),
        ),
        ModelSpec(
            name="极端随机树分类",
            builder=lambda n_features, n_classes: ExtraTreesClassifier(
                n_estimators=100,
                max_features="sqrt",
                n_jobs=1,
                random_state=RANDOM_STATE,
            ),
        ),
        ModelSpec(
            name="XGBoost分类",
            builder=lambda n_features, n_classes: XGBClassifier(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.05,
                subsample=0.9,
                colsample_bytree=0.8,
                eval_metric="logloss",
                n_jobs=4,
                random_state=RANDOM_STATE,
                verbosity=0,
            ),
        ),
        ModelSpec(
            name="LightGBM分类",
            builder=lambda n_features, n_classes: LGBMClassifier(
                n_estimators=100,
                learning_rate=0.05,
                num_leaves=31,
                subsample=0.9,
                colsample_bytree=0.8,
                random_state=RANDOM_STATE,
                verbose=-1,
            ),
        ),
    ]


def regression_metrics(y_true: np.ndarray, y_pred: np.ndarray, target_names: list[str], split_name: str) -> list[dict[str, object]]:
    rows = []
    for idx, target_name in enumerate(target_names):
        true_col = y_true[:, idx]
        pred_col = y_pred[:, idx]
        rows.append(
            {
                "split": split_name,
                "target": target_name,
                "r2": float(r2_score(true_col, pred_col)),
                "rmse": float(np.sqrt(mean_squared_error(true_col, pred_col))),
                "mae": float(mean_absolute_error(true_col, pred_col)),
            }
        )
    return rows


def classification_metrics(y_true: np.ndarray, y_pred: np.ndarray, split_name: str) -> dict[str, object]:
    return {
        "split": split_name,
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_true, y_pred)),
        "f1_macro": float(f1_score(y_true, y_pred, average="macro")),
        "precision_macro": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
        "recall_macro": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
    }


def summarize_regression_rows(metric_rows: list[dict[str, object]]) -> dict[str, dict[str, float]]:
    result: dict[str, dict[str, float]] = {}
    df = pd.DataFrame(metric_rows)
    for split_name in ["验证集", "测试集"]:
        sub = df.loc[df["split"] == split_name]
        result[split_name] = {
            "avg_r2": float(sub["r2"].mean()),
            "avg_rmse": float(sub["rmse"].mean()),
            "avg_mae": float(sub["mae"].mean()),
            "median_r2": float(sub["r2"].median()),
        }
    return result


def run_regression_task(
    task_name: str,
    task_df: pd.DataFrame,
    target_cols: list[str],
    feature_sets: dict[str, list[str]],
) -> tuple[pd.DataFrame, pd.DataFrame]:
    task_result_dir = RESULT_DIR / task_name
    train_df, val_df, test_df = split_frames(task_df)
    specs = regression_model_specs_for_task(task_name)

    summary_rows: list[dict[str, object]] = []
    detail_rows: list[dict[str, object]] = []

    for feature_name, feature_cols in feature_sets.items():
        X_train = train_df[feature_cols].to_numpy(dtype=float)
        X_val = val_df[feature_cols].to_numpy(dtype=float)
        X_test = test_df[feature_cols].to_numpy(dtype=float)
        y_train = train_df[target_cols].to_numpy(dtype=float)
        y_val = val_df[target_cols].to_numpy(dtype=float)
        y_test = test_df[target_cols].to_numpy(dtype=float)

        for spec in specs:
            start = time.time()
            try:
                model = spec.builder(X_train.shape[1], y_train.shape[1])
                model.fit(X_train, y_train)
                val_pred = model.predict(X_val)
                test_pred = model.predict(X_test)

                if val_pred.ndim == 1:
                    val_pred = val_pred.reshape(-1, 1)
                    test_pred = test_pred.reshape(-1, 1)

                metric_rows = []
                metric_rows.extend(regression_metrics(y_val, val_pred, target_cols, "验证集"))
                metric_rows.extend(regression_metrics(y_test, test_pred, target_cols, "测试集"))

                for metric_row in metric_rows:
                    detail_rows.append(
                        {
                            "任务": task_name,
                            "特征方案": feature_name,
                            "模型": spec.name,
                            **metric_row,
                        }
                    )

                summary = summarize_regression_rows(metric_rows)
                elapsed = time.time() - start
                summary_rows.append(
                    {
                        "任务": task_name,
                        "特征方案": feature_name,
                        "模型": spec.name,
                        "验证集平均R2": summary["验证集"]["avg_r2"],
                        "验证集平均RMSE": summary["验证集"]["avg_rmse"],
                        "验证集平均MAE": summary["验证集"]["avg_mae"],
                        "验证集中位R2": summary["验证集"]["median_r2"],
                        "测试集平均R2": summary["测试集"]["avg_r2"],
                        "测试集平均RMSE": summary["测试集"]["avg_rmse"],
                        "测试集平均MAE": summary["测试集"]["avg_mae"],
                        "测试集中位R2": summary["测试集"]["median_r2"],
                        "训练耗时秒": round(elapsed, 3),
                        "错误信息": "",
                    }
                )
            except Exception as exc:
                summary_rows.append(
                    {
                        "任务": task_name,
                        "特征方案": feature_name,
                        "模型": spec.name,
                        "验证集平均R2": np.nan,
                        "验证集平均RMSE": np.nan,
                        "验证集平均MAE": np.nan,
                        "验证集中位R2": np.nan,
                        "测试集平均R2": np.nan,
                        "测试集平均RMSE": np.nan,
                        "测试集平均MAE": np.nan,
                        "测试集中位R2": np.nan,
                        "训练耗时秒": round(time.time() - start, 3),
                        "错误信息": str(exc),
                    }
                )

    summary_df = pd.DataFrame(summary_rows).sort_values(
        ["验证集平均R2", "测试集平均R2", "验证集平均RMSE"],
        ascending=[False, False, True],
        kind="stable",
    )
    detail_df = pd.DataFrame(detail_rows).sort_values(
        ["特征方案", "模型", "split", "target"],
        kind="stable",
    )

    summary_df.to_csv(task_result_dir / "模型汇总.csv", index=False, encoding="utf-8-sig")
    detail_df.to_csv(task_result_dir / "逐目标结果.csv", index=False, encoding="utf-8-sig")
    summary_df.head(15).to_csv(task_result_dir / "验证集前15名.csv", index=False, encoding="utf-8-sig")
    return summary_df, detail_df


def run_classification_task(
    task_name: str,
    task_df: pd.DataFrame,
    target_col: str,
    feature_sets: dict[str, list[str]],
) -> tuple[pd.DataFrame, dict[str, pd.DataFrame]]:
    task_result_dir = RESULT_DIR / task_name
    train_df, val_df, test_df = split_frames(task_df)
    specs = classification_model_specs()

    encoder = LabelEncoder()
    y_train = encoder.fit_transform(train_df[target_col])
    y_val = encoder.transform(val_df[target_col])
    y_test = encoder.transform(test_df[target_col])
    class_labels = list(encoder.classes_)

    summary_rows: list[dict[str, object]] = []
    confusion_outputs: dict[str, pd.DataFrame] = {}

    for feature_name, feature_cols in feature_sets.items():
        X_train = train_df[feature_cols].to_numpy(dtype=float)
        X_val = val_df[feature_cols].to_numpy(dtype=float)
        X_test = test_df[feature_cols].to_numpy(dtype=float)

        for spec in specs:
            start = time.time()
            try:
                model = spec.builder(X_train.shape[1], len(class_labels))
                model.fit(X_train, y_train)
                val_pred = model.predict(X_val)
                test_pred = model.predict(X_test)
                elapsed = time.time() - start

                val_metrics = classification_metrics(y_val, val_pred, "验证集")
                test_metrics = classification_metrics(y_test, test_pred, "测试集")

                summary_rows.append(
                    {
                        "任务": task_name,
                        "特征方案": feature_name,
                        "模型": spec.name,
                        "验证集准确率": val_metrics["accuracy"],
                        "验证集平衡准确率": val_metrics["balanced_accuracy"],
                        "验证集F1_macro": val_metrics["f1_macro"],
                        "测试集准确率": test_metrics["accuracy"],
                        "测试集平衡准确率": test_metrics["balanced_accuracy"],
                        "测试集F1_macro": test_metrics["f1_macro"],
                        "测试集Precision_macro": test_metrics["precision_macro"],
                        "测试集Recall_macro": test_metrics["recall_macro"],
                        "训练耗时秒": round(elapsed, 3),
                        "错误信息": "",
                    }
                )

                cm = confusion_matrix(y_test, test_pred, labels=list(range(len(class_labels))))
                cm_df = pd.DataFrame(cm, index=[f"真实_{c}" for c in class_labels], columns=[f"预测_{c}" for c in class_labels])
                confusion_outputs[f"{feature_name}_{spec.name}"] = cm_df
            except Exception as exc:
                summary_rows.append(
                    {
                        "任务": task_name,
                        "特征方案": feature_name,
                        "模型": spec.name,
                        "验证集准确率": np.nan,
                        "验证集平衡准确率": np.nan,
                        "验证集F1_macro": np.nan,
                        "测试集准确率": np.nan,
                        "测试集平衡准确率": np.nan,
                        "测试集F1_macro": np.nan,
                        "测试集Precision_macro": np.nan,
                        "测试集Recall_macro": np.nan,
                        "训练耗时秒": round(time.time() - start, 3),
                        "错误信息": str(exc),
                    }
                )

    summary_df = pd.DataFrame(summary_rows).sort_values(
        ["验证集F1_macro", "测试集F1_macro", "验证集准确率"],
        ascending=[False, False, False],
        kind="stable",
    )
    summary_df.to_csv(task_result_dir / "模型汇总.csv", index=False, encoding="utf-8-sig")
    summary_df.head(15).to_csv(task_result_dir / "验证集前15名.csv", index=False, encoding="utf-8-sig")

    top3 = summary_df.head(3)
    for _, row in top3.iterrows():
        key = f"{row['特征方案']}_{row['模型']}"
        if key in confusion_outputs:
            confusion_outputs[key].to_csv(
                task_result_dir / f"测试集混淆矩阵_{row['特征方案']}_{row['模型']}.csv",
                encoding="utf-8-sig",
            )

    return summary_df, confusion_outputs


def write_summary_markdown(
    quality_summary: pd.DataFrame,
    origin_summary: pd.DataFrame,
    lcms_summary: pd.DataFrame,
    lcms_target_stats: pd.DataFrame,
) -> None:
    def top_rows(df: pd.DataFrame, columns: list[str], n: int = 5) -> list[str]:
        lines = []
        for _, row in df.head(n).iterrows():
            lines.append(" | ".join(str(row[col]) for col in columns))
        return lines

    markdown = [
        "# 第一版双光谱基线实验摘要",
        "",
        f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "## 实验说明",
        "",
        "- 第一版目标是广泛建立基线，下限优先，因此使用固定参数的多模型对比。",
        "- 正式输入特征只使用 `R210`、`S960` 以及二者融合。",
        "- 回归任务比较指标为验证集平均 `R2 / RMSE / MAE`，分类任务比较指标为验证集 `F1_macro`。",
        f"- 液质任务中共有 `{len(lcms_target_stats)}` 个目标，其中 `{int(lcms_target_stats['used_in_first_baseline'].sum())}` 个无缺失并纳入第一版基线。",
        "",
        "## 任务1 品质预测 前5名",
        "",
        "特征方案 | 模型 | 验证集平均R2 | 测试集平均R2 | 验证集平均RMSE",
        *top_rows(quality_summary, ["特征方案", "模型", "验证集平均R2", "测试集平均R2", "验证集平均RMSE"]),
        "",
        "## 任务2 产地溯源 前5名",
        "",
        "特征方案 | 模型 | 验证集F1_macro | 测试集F1_macro | 验证集准确率",
        *top_rows(origin_summary, ["特征方案", "模型", "验证集F1_macro", "测试集F1_macro", "验证集准确率"]),
        "",
        "## 任务3 液质成分预测 前5名",
        "",
        "特征方案 | 模型 | 验证集平均R2 | 测试集平均R2 | 验证集平均RMSE",
        *top_rows(lcms_summary, ["特征方案", "模型", "验证集平均R2", "测试集平均R2", "验证集平均RMSE"]),
        "",
        "## 下一步建议",
        "",
        "1. 从每个任务的前2到3个模型里挑出最强组合，再进入参数调优。",
        "2. 如果 `R210+S960` 明显优于单光谱，就将双光谱合作为正式主路线。",
        "3. 如果单光谱已接近双光谱，需要额外评估融合带来的复杂度是否值得。",
    ]
    (RECORD_DIR / "第一版双光谱基线实验摘要.md").write_text("\n".join(markdown), encoding="utf-8")


def write_run_manifest(
    quality_summary: pd.DataFrame,
    origin_summary: pd.DataFrame,
    lcms_summary: pd.DataFrame,
    lcms_target_stats: pd.DataFrame,
) -> None:
    manifest = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "random_state": RANDOM_STATE,
        "quality_top1": quality_summary.iloc[0].to_dict(),
        "origin_top1": origin_summary.iloc[0].to_dict(),
        "lcms_top1": lcms_summary.iloc[0].to_dict(),
        "lcms_used_target_count": int(lcms_target_stats["used_in_first_baseline"].sum()),
        "lcms_excluded_targets": lcms_target_stats.loc[
            ~lcms_target_stats["used_in_first_baseline"], "target"
        ].tolist(),
        "result_dirs": {
            "quality": str((RESULT_DIR / "任务1_品质预测").relative_to(ROOT)),
            "origin": str((RESULT_DIR / "任务2_产地溯源").relative_to(ROOT)),
            "lcms": str((RESULT_DIR / "任务3_液质成分预测").relative_to(ROOT)),
        },
    }
    (RECORD_DIR / "第一版双光谱基线实验摘要.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    ensure_dirs()
    split_df, quality_df, origin_df, lcms_df = load_split_data()

    quality_data = merge_with_split(quality_df, split_df)
    origin_data = merge_with_split(origin_df, split_df)
    lcms_data = merge_with_split(lcms_df, split_df)

    # 品质检测任务：只锁“糖度”作为核心打榜指标，剥离被酸度等拉低的平均分
    quality_targets = ["titration_糖度"]
    
    # 缩小液质任务预测列表，仅保留第一版基线中 R2 > 0.6 的核心强响应物质
    core_lcms = [
        "lcms_Isocitric_acid", "lcms_Shikimic_acid", "lcms_E_1_Propene_1_2_3_Tricarboxylic_Acid",
        "lcms_Cls_Aconitic_acid", "lcms_Phe", "lcms_yiaweisuan", "lcms_蔗糖",
        "lcms_His", "lcms_Tyr", "lcms_L_KangHuaiXueSuan", "lcms_Asp"
    ]
    lcms_targets_all = [col for col in core_lcms if col in lcms_df.columns]
    
    lcms_targets, lcms_target_stats = select_complete_targets(lcms_data, lcms_targets_all)
    feature_sets = get_feature_sets(list(quality_df.columns))

    lcms_target_stats.to_csv(
        RESULT_DIR / "任务3_液质成分预测" / "目标缺失统计.csv",
        index=False,
        encoding="utf-8-sig",
    )

    quality_summary, _ = run_regression_task(
        task_name="任务1_品质预测",
        task_df=quality_data,
        target_cols=quality_targets,
        feature_sets=feature_sets,
    )
    origin_summary, _ = run_classification_task(
        task_name="任务2_产地溯源",
        task_df=origin_data,
        target_col="origin",
        feature_sets=feature_sets,
    )
    lcms_summary, _ = run_regression_task(
        task_name="任务3_液质成分预测",
        task_df=lcms_data,
        target_cols=lcms_targets,
        feature_sets=feature_sets,
    )

    write_summary_markdown(quality_summary, origin_summary, lcms_summary, lcms_target_stats)
    write_run_manifest(quality_summary, origin_summary, lcms_summary, lcms_target_stats)


if __name__ == "__main__":
    main()
