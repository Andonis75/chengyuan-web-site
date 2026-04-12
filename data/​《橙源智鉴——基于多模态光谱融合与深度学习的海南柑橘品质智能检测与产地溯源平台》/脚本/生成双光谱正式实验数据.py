from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
SAFE_SOURCE = next((ROOT / "清洗结果" / "融合数据").glob("*安全版_去除HSI融合表.csv"))
EXPERIMENT_DIR = ROOT / "正式实验"
DATASET_DIR = EXPERIMENT_DIR / "数据集"
SPLIT_DIR = EXPERIMENT_DIR / "划分方案"
RECORD_DIR = EXPERIMENT_DIR / "研究记录"
DISABLED_DIR = EXPERIMENT_DIR / "停用数据说明"

META_COLS = ["sample_id", "origin", "sample_number"]
SPLIT_SEED = 20260409


@dataclass(frozen=True)
class ExportInfo:
    name: str
    rows: int
    cols: int
    path: str
    note: str = ""


def export_csv(df: pd.DataFrame, path: Path, note: str = "") -> ExportInfo:
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False, encoding="utf-8-sig")
    return ExportInfo(
        name=path.stem,
        rows=int(df.shape[0]),
        cols=int(df.shape[1]),
        path=str(path.relative_to(ROOT)),
        note=note,
    )


def build_split_table(df: pd.DataFrame) -> pd.DataFrame:
    rng = np.random.default_rng(SPLIT_SEED)
    split_rows: list[dict[str, object]] = []

    # 399 samples -> CM: 139/30/30, QZ: 140/30/30
    split_plan = {
        "CM": (139, 30, 30),
        "QZ": (140, 30, 30),
    }

    for origin, (train_n, val_n, test_n) in split_plan.items():
        group = df.loc[df["origin"] == origin, META_COLS].sort_values("sample_number").reset_index(drop=True)
        indices = rng.permutation(len(group))
        shuffled = group.iloc[indices].reset_index(drop=True)

        train_part = shuffled.iloc[:train_n].assign(split="训练集")
        val_part = shuffled.iloc[train_n : train_n + val_n].assign(split="验证集")
        test_part = shuffled.iloc[train_n + val_n : train_n + val_n + test_n].assign(split="测试集")

        split_rows.extend(train_part.to_dict("records"))
        split_rows.extend(val_part.to_dict("records"))
        split_rows.extend(test_part.to_dict("records"))

    split_df = pd.DataFrame(split_rows)
    split_order = {"训练集": 0, "验证集": 1, "测试集": 2}
    split_df = (
        split_df.assign(
            _origin_order=split_df["origin"].map({"CM": 0, "QZ": 1}),
            _split_order=split_df["split"].map(split_order),
        )
        .sort_values(["_split_order", "_origin_order", "sample_number"], kind="stable")
        .drop(columns=["_origin_order", "_split_order"])
        .reset_index(drop=True)
    )
    return split_df


def split_dataset(df: pd.DataFrame, split_df: pd.DataFrame) -> dict[str, pd.DataFrame]:
    merged = split_df.merge(df, on=META_COLS, how="inner")
    return {
        split_name: merged.loc[merged["split"] == split_name].drop(columns="split").reset_index(drop=True)
        for split_name in ["训练集", "验证集", "测试集"]
    }


def write_markdown(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main() -> None:
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    SPLIT_DIR.mkdir(parents=True, exist_ok=True)
    RECORD_DIR.mkdir(parents=True, exist_ok=True)
    DISABLED_DIR.mkdir(parents=True, exist_ok=True)

    safe_df = pd.read_csv(SAFE_SOURCE)
    titration_cols = [col for col in safe_df.columns if col.startswith("titration_")]
    lcms_cols = [col for col in safe_df.columns if col.startswith("lcms_")]
    r210_cols = [col for col in safe_df.columns if col.startswith("r210_")]
    s960_cols = [col for col in safe_df.columns if col.startswith("s960_")]
    feature_cols = [*r210_cols, *s960_cols]

    master_df = safe_df[META_COLS + titration_cols + lcms_cols + feature_cols].copy()
    quality_df = safe_df[META_COLS + titration_cols + feature_cols].copy()
    origin_df = safe_df[META_COLS + feature_cols].copy()
    lcms_pred_df = safe_df[META_COLS + lcms_cols + feature_cols].copy()

    split_df = build_split_table(master_df)

    quality_splits = split_dataset(quality_df, split_df)
    origin_splits = split_dataset(origin_df, split_df)
    lcms_splits = split_dataset(lcms_pred_df, split_df)

    exports: list[ExportInfo] = [
        export_csv(master_df, DATASET_DIR / "双光谱安全主表.csv", "正式实验唯一主表，只含 R210 与 S960 双光谱。"),
        export_csv(quality_df, DATASET_DIR / "任务1_品质预测数据集.csv", "用于预测糖度、酸度、糖酸比、VC。"),
        export_csv(origin_df, DATASET_DIR / "任务2_产地溯源数据集.csv", "用于预测 origin。"),
        export_csv(lcms_pred_df, DATASET_DIR / "任务3_液质成分预测数据集.csv", "用于预测 36 项液质成分。"),
        export_csv(split_df, SPLIT_DIR / "统一样本划分.csv", "固定随机种子 20260409 的统一划分。"),
    ]

    split_label_map = {
        "训练集": "训练集",
        "验证集": "验证集",
        "测试集": "测试集",
    }
    for split_name, split_df_part in quality_splits.items():
        exports.append(
            export_csv(
                split_df_part,
                SPLIT_DIR / f"任务1_品质预测_{split_label_map[split_name]}.csv",
                "品质预测任务分割子集。",
            )
        )
    for split_name, split_df_part in origin_splits.items():
        exports.append(
            export_csv(
                split_df_part,
                SPLIT_DIR / f"任务2_产地溯源_{split_label_map[split_name]}.csv",
                "产地溯源任务分割子集。",
            )
        )
    for split_name, split_df_part in lcms_splits.items():
        exports.append(
            export_csv(
                split_df_part,
                SPLIT_DIR / f"任务3_液质成分预测_{split_label_map[split_name]}.csv",
                "液质成分预测任务分割子集。",
            )
        )

    research_record = f"""# 双光谱正式研究顺序记录

生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
正式实验目录: `正式实验`
唯一正式主表: `数据集/双光谱安全主表.csv`

## 研究边界

- 正式实验只允许使用 `R210` 和 `S960` 双光谱。
- `HSI` 已判定存在严重跨产地重复问题，不进入任何正式模型训练、验证或测试。
- 所有任务统一使用 `划分方案/统一样本划分.csv`，严禁每个任务单独随机拆分。

## 正式任务

1. 任务1：品质预测
   目标变量：`糖度`、`酸度`、`糖酸比`、`VC`
   数据文件：`数据集/任务1_品质预测数据集.csv`
2. 任务2：产地溯源
   目标变量：`origin`
   数据文件：`数据集/任务2_产地溯源数据集.csv`
3. 任务3：液质成分预测
   目标变量：36 项 `lcms_` 前缀成分
   数据文件：`数据集/任务3_液质成分预测数据集.csv`

## 推荐实验顺序

1. 先完成任务1的单光谱基线：`R210`、`S960`
2. 再完成任务1的双光谱融合：`R210 + S960`
3. 然后做任务2的单光谱与双光谱对比
4. 最后做任务3，用来证明双光谱对内部成分预测的能力
5. 所有任务都先做传统机器学习基线，再考虑更复杂模型

## 推荐基线模型

- 回归任务：`PLSR`、`SVR`、`RandomForestRegressor`、`XGBoost`
- 分类任务：`SVM`、`RandomForestClassifier`、`XGBoost`

## 严格约束

- 不允许把 `titration_` 或 `lcms_` 列当作输入特征再去预测它们自己，避免数据泄漏。
- 不允许重新把 `HSI` 拼回主表。
- 不允许跳过统一划分直接随机切分。
- 所有模型结果都必须保留 `R210`、`S960`、`R210+S960` 三组对比。

## 当前样本规模

- 正式主表样本数：{len(master_df)}
- 品质预测样本数：{len(quality_df)}
- 产地溯源样本数：{len(origin_df)}
- 液质成分预测样本数：{len(lcms_pred_df)}
- 特征数：R210 = {len(r210_cols)}，S960 = {len(s960_cols)}，合计 = {len(feature_cols)}
- 统一划分：训练集 = {int((split_df['split'] == '训练集').sum())}，验证集 = {int((split_df['split'] == '验证集').sum())}，测试集 = {int((split_df['split'] == '测试集').sum())}
"""
    write_markdown(RECORD_DIR / "双光谱正式研究顺序记录.md", research_record)

    disabled_record = """# 停用与不纳入正式实验的数据说明

## 明确停用

- `清洗结果/分模态表/HSI光谱_疑似错误勿用于建模.csv`
- `清洗结果/分模态表/HSI去重后光谱_仅供排查.csv`
- `清洗结果/质检信息/HSI跨产地同编号完全重复样本.csv`
- `清洗结果/质检信息/HSI已删除重复样本.csv`
- `清洗结果/融合数据/全模态融合表_含可疑HSI勿用.csv`

## 历史输出

- 根目录下旧的 `cleaned_data`、`scripts`、以及 `清洗结果` 目录中的英文子目录 `fusion`、`modality_tables`、`qc` 都属于历史派生结果，不纳入正式实验流程。

## 当前原则

- 正式实验只看 `正式实验` 目录。
- 旧文件保留仅为追溯，不代表可继续使用。
"""
    write_markdown(DISABLED_DIR / "停用与历史输出说明.md", disabled_record)

    summary = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "safe_source": str(SAFE_SOURCE.relative_to(ROOT)),
        "sample_count": int(len(master_df)),
        "feature_count": int(len(feature_cols)),
        "r210_feature_count": int(len(r210_cols)),
        "s960_feature_count": int(len(s960_cols)),
        "titration_target_count": int(len(titration_cols)),
        "lcms_target_count": int(len(lcms_cols)),
        "split_seed": SPLIT_SEED,
        "split_counts": split_df["split"].value_counts().to_dict(),
        "exports": [export.__dict__ for export in exports],
    }
    (RECORD_DIR / "正式实验概览.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
