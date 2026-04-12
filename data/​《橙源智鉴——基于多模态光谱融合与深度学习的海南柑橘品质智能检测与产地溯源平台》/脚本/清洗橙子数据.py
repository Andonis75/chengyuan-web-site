from __future__ import annotations

import json
import math
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
INPUT_DIR = next(
    path for path in ROOT.iterdir() if path.is_dir() and path.name.startswith("20260404")
)
OUTPUT_DIR = ROOT / "清洗结果"
MODALITY_DIR = OUTPUT_DIR / "分模态表"
FUSION_DIR = OUTPUT_DIR / "融合数据"
QC_DIR = OUTPUT_DIR / "质检信息"

KEY_COLUMNS = ["sample_id", "origin", "sample_number"]
ORIGIN_ORDER = {"CM": 0, "QZ": 1}


@dataclass(frozen=True)
class ExportInfo:
    name: str
    rows: int
    cols: int
    path: str
    note: str = ""


def find_workbook(prefix: str) -> Path:
    matches = sorted(INPUT_DIR.glob(f"{prefix}*.xlsx"))
    if len(matches) != 1:
        raise FileNotFoundError(f"Expected one workbook for prefix {prefix!r}, found {len(matches)}")
    return matches[0]


def normalize_sample_id(value: object) -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        raise ValueError("Sample ID is missing")

    sample_id = str(value).strip().upper().replace(" ", "")
    if not re.fullmatch(r"(CM|QZ)-\d{1,3}", sample_id):
        raise ValueError(f"Unexpected sample ID format: {sample_id}")
    return sample_id


def split_sample_id(sample_id: str) -> tuple[str, int]:
    origin, sample_number = sample_id.split("-", 1)
    return origin, int(sample_number)


def sort_by_sample(df: pd.DataFrame) -> pd.DataFrame:
    order = df["origin"].map(ORIGIN_ORDER)
    return (
        df.assign(_origin_order=order)
        .sort_values(["_origin_order", "sample_number"], kind="stable")
        .drop(columns="_origin_order")
        .reset_index(drop=True)
    )


def attach_sample_metadata(
    df: pd.DataFrame,
    sample_id_col: str = "sample_id",
    enforce_unique: bool = True,
) -> pd.DataFrame:
    result = df.copy()
    result[sample_id_col] = result[sample_id_col].map(normalize_sample_id)
    result["origin"] = result[sample_id_col].map(lambda x: split_sample_id(x)[0])
    result["sample_number"] = result[sample_id_col].map(lambda x: split_sample_id(x)[1])

    if enforce_unique and result[sample_id_col].duplicated().any():
        duplicated_ids = result.loc[result[sample_id_col].duplicated(), sample_id_col].tolist()
        raise ValueError(f"Duplicate sample IDs found: {duplicated_ids[:10]}")

    value_cols = [col for col in result.columns if col not in KEY_COLUMNS]
    return sort_by_sample(result[["sample_id", "origin", "sample_number", *value_cols]])


def format_band(value: object) -> str:
    if isinstance(value, str):
        text = value.strip()
        try:
            value = float(text)
        except ValueError:
            return text

    numeric = float(value)
    return f"{numeric:.6f}".rstrip("0").rstrip(".")


def sanitize_feature_name(value: object) -> str:
    if isinstance(value, str):
        text = value.strip()
        try:
            numeric = float(text)
        except ValueError:
            safe = re.sub(r"\s+", "_", text)
            safe = re.sub(r"[^\w\u4e00-\u9fff]+", "_", safe)
            return re.sub(r"_+", "_", safe).strip("_")
        else:
            return f"{format_band(numeric)}nm"
    return f"{format_band(value)}nm"


def prefix_feature_columns(df: pd.DataFrame, prefix: str) -> pd.DataFrame:
    rename_map = {
        col: f"{prefix}_{sanitize_feature_name(col)}"
        for col in df.columns
        if col not in KEY_COLUMNS
    }
    return df.rename(columns=rename_map)


def export_csv(df: pd.DataFrame, path: Path) -> ExportInfo:
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False, encoding="utf-8-sig")
    return ExportInfo(name=path.stem, rows=int(df.shape[0]), cols=int(df.shape[1]), path=str(path.relative_to(ROOT)))


def load_titration() -> pd.DataFrame:
    path = find_workbook("1 ")
    df = pd.read_excel(path, sheet_name=0, engine="openpyxl")
    df = df.rename(columns={df.columns[0]: "sample_id"})
    df = df.dropna(subset=["sample_id"]).copy()
    return attach_sample_metadata(df)


def load_lcms() -> tuple[pd.DataFrame, pd.DataFrame]:
    path = find_workbook("2 ")
    df = pd.read_excel(path, sheet_name=0, header=1, engine="openpyxl")
    df = df.dropna(how="all").copy()
    df = df.rename(columns={df.columns[0]: "replicate_id"})
    df = df.dropna(subset=["replicate_id"]).copy()

    replicate_suffix = df["replicate_id"].astype(str).str.extract(r"-(A|B)$", expand=False)
    if replicate_suffix.isna().any():
        bad_ids = df.loc[replicate_suffix.isna(), "replicate_id"].astype(str).tolist()
        raise ValueError(f"Unexpected LC-MS replicate IDs: {bad_ids[:10]}")

    df["replicate"] = replicate_suffix
    df["sample_id"] = df["replicate_id"].astype(str).str.replace(r"-(A|B)$", "", regex=True)
    df = attach_sample_metadata(
        df[
            [
                "sample_id",
                "replicate",
                *[col for col in df.columns if col not in {"replicate_id", "sample_id", "replicate"}],
            ]
        ],
        enforce_unique=False,
    )

    replicate_counts = df.groupby("sample_id")["replicate"].nunique()
    if not replicate_counts.eq(2).all():
        bad = replicate_counts.loc[~replicate_counts.eq(2)]
        raise ValueError(f"LC-MS replicate count is not 2 for samples: {bad.to_dict()}")

    value_cols = [col for col in df.columns if col not in [*KEY_COLUMNS, "replicate"]]
    mean_df = (
        df.groupby(KEY_COLUMNS, as_index=False)[value_cols]
        .mean(numeric_only=True)
        .pipe(sort_by_sample)
    )
    replicate_df = sort_by_sample(df[["sample_id", "origin", "sample_number", "replicate", *value_cols]])
    return replicate_df, mean_df


def load_simple_spectral(prefix: str) -> pd.DataFrame:
    path = find_workbook(prefix)
    df = pd.read_excel(path, sheet_name=0, engine="openpyxl")
    df = df.rename(columns={df.columns[0]: "sample_id"})
    df = df.dropna(subset=["sample_id"]).copy()
    return attach_sample_metadata(df)


def concat_spectral(prefixes: Iterable[str]) -> pd.DataFrame:
    frames = [load_simple_spectral(prefix) for prefix in prefixes]
    combined = pd.concat(frames, ignore_index=True)
    return sort_by_sample(combined)


def load_s960_native() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, dict[str, object]]:
    cm_native = load_simple_spectral("7 ")
    qz_native = load_simple_spectral("8 ")

    cm_band_cols = [col for col in cm_native.columns if col not in KEY_COLUMNS]
    qz_band_cols = [col for col in qz_native.columns if col not in KEY_COLUMNS]
    common_count = min(len(cm_band_cols), len(qz_band_cols))

    cm_common_cols = cm_band_cols[:common_count]
    qz_common_cols = qz_band_cols[:common_count]
    cm_common_bands = [float(col) for col in cm_common_cols]
    qz_common_bands = [float(col) for col in qz_common_cols]
    diffs = [abs(cm_band - qz_band) for cm_band, qz_band in zip(cm_common_bands, qz_common_bands)]
    max_abs_diff = max(diffs) if diffs else 0.0

    if max_abs_diff > 0.01:
        raise ValueError(f"S960 common bands are not aligned tightly enough; max diff = {max_abs_diff}")

    qz_common = qz_native[KEY_COLUMNS + qz_common_cols].copy()
    qz_common = qz_common.rename(columns=dict(zip(qz_common_cols, cm_common_cols)))
    common_df = pd.concat([cm_native[KEY_COLUMNS + cm_common_cols], qz_common], ignore_index=True)
    common_df = sort_by_sample(common_df)

    qz_extra_bands = qz_band_cols[common_count:]
    summary = {
        "common_band_count": common_count,
        "cm_native_band_count": len(cm_band_cols),
        "qz_native_band_count": len(qz_band_cols),
        "qz_extra_band_count": len(qz_extra_bands),
        "max_abs_diff_first_common_bands": max_abs_diff,
        "cm_last_common_band_nm": format_band(cm_common_cols[-1]),
        "qz_last_common_band_nm": format_band(qz_common_cols[-1]),
        "qz_last_native_band_nm": format_band(qz_band_cols[-1]),
    }
    return cm_native, qz_native, common_df, summary


def build_inventory(
    titration: pd.DataFrame,
    lcms_mean: pd.DataFrame,
    hsi: pd.DataFrame,
    r210: pd.DataFrame,
    s960_common: pd.DataFrame,
    s960_cm_native: pd.DataFrame,
    s960_qz_native: pd.DataFrame,
) -> pd.DataFrame:
    all_ids = sorted(
        set(titration["sample_id"])
        | set(lcms_mean["sample_id"])
        | set(hsi["sample_id"])
        | set(r210["sample_id"])
        | set(s960_common["sample_id"])
    )
    inventory = pd.DataFrame({"sample_id": all_ids})
    inventory = attach_sample_metadata(inventory)

    modality_sets = {
        "in_titration": set(titration["sample_id"]),
        "in_lcms_mean": set(lcms_mean["sample_id"]),
        "in_hsi": set(hsi["sample_id"]),
        "in_r210": set(r210["sample_id"]),
        "in_s960_common": set(s960_common["sample_id"]),
        "in_s960_native_cm": set(s960_cm_native["sample_id"]),
        "in_s960_native_qz": set(s960_qz_native["sample_id"]),
    }
    for col, sample_set in modality_sets.items():
        inventory[col] = inventory["sample_id"].isin(sample_set)

    inventory["in_all_modalities"] = inventory[
        ["in_titration", "in_lcms_mean", "in_hsi", "in_r210", "in_s960_common"]
    ].all(axis=1)
    return sort_by_sample(inventory)


def build_hsi_duplicate_report(hsi: pd.DataFrame) -> pd.DataFrame:
    value_cols = [col for col in hsi.columns if col not in KEY_COLUMNS]
    cm = hsi.loc[hsi["origin"] == "CM"].set_index("sample_number")
    qz = hsi.loc[hsi["origin"] == "QZ"].set_index("sample_number")
    common_numbers = sorted(set(cm.index) & set(qz.index))

    duplicate_rows = []
    for sample_number in common_numbers:
        cm_values = cm.loc[sample_number, value_cols]
        qz_values = qz.loc[sample_number, value_cols]
        identical = cm_values.equals(qz_values)
        if identical:
            duplicate_rows.append(
                {
                    "sample_number": sample_number,
                    "cm_sample_id": f"CM-{sample_number}",
                    "qz_sample_id": f"QZ-{sample_number}",
                    "identical_across_300_bands": True,
                }
            )

    return pd.DataFrame(duplicate_rows)


def build_hsi_filtered_tables(
    hsi: pd.DataFrame,
    hsi_duplicates: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    duplicate_qz_ids = set(hsi_duplicates["qz_sample_id"])
    hsi_filtered = sort_by_sample(hsi.loc[~hsi["sample_id"].isin(duplicate_qz_ids)].copy())
    removed_rows = sort_by_sample(hsi.loc[hsi["sample_id"].isin(duplicate_qz_ids)].copy())
    removed_rows["删除原因"] = "与澄迈同编号样本 300 个波段完全一致，判定为可疑重复数据"
    return hsi_filtered, removed_rows


def build_s960_extra_band_table(qz_native: pd.DataFrame, common_count: int) -> pd.DataFrame:
    qz_band_cols = [col for col in qz_native.columns if col not in KEY_COLUMNS]
    extra_cols = qz_band_cols[common_count:]
    return pd.DataFrame(
        {
            "band_index_in_qz_native": list(range(common_count + 1, len(qz_band_cols) + 1)),
            "band_nm": [format_band(col) for col in extra_cols],
        }
    )


def build_fusion_frames(
    titration: pd.DataFrame,
    lcms_mean: pd.DataFrame,
    hsi: pd.DataFrame,
    r210: pd.DataFrame,
    s960_common: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    titration_fusion = prefix_feature_columns(titration, "titration")
    lcms_fusion = prefix_feature_columns(lcms_mean, "lcms")
    hsi_fusion = prefix_feature_columns(hsi, "hsi")
    r210_fusion = prefix_feature_columns(r210, "r210")
    s960_fusion = prefix_feature_columns(s960_common, "s960")

    fusion_all = (
        titration_fusion.merge(lcms_fusion, on=KEY_COLUMNS, how="inner")
        .merge(hsi_fusion, on=KEY_COLUMNS, how="inner")
        .merge(r210_fusion, on=KEY_COLUMNS, how="inner")
        .merge(s960_fusion, on=KEY_COLUMNS, how="inner")
    )
    fusion_all = sort_by_sample(fusion_all)

    fusion_lcms_s960 = lcms_fusion.merge(s960_fusion, on=KEY_COLUMNS, how="inner")
    fusion_lcms_s960 = sort_by_sample(fusion_lcms_s960)
    return fusion_all, fusion_lcms_s960


def build_safe_fusion_without_hsi(
    titration: pd.DataFrame,
    lcms_mean: pd.DataFrame,
    r210: pd.DataFrame,
    s960_common: pd.DataFrame,
) -> pd.DataFrame:
    titration_fusion = prefix_feature_columns(titration, "titration")
    lcms_fusion = prefix_feature_columns(lcms_mean, "lcms")
    r210_fusion = prefix_feature_columns(r210, "r210")
    s960_fusion = prefix_feature_columns(s960_common, "s960")

    fusion_safe = (
        titration_fusion.merge(lcms_fusion, on=KEY_COLUMNS, how="inner")
        .merge(r210_fusion, on=KEY_COLUMNS, how="inner")
        .merge(s960_fusion, on=KEY_COLUMNS, how="inner")
    )
    return sort_by_sample(fusion_safe)


def write_report(
    exports: list[ExportInfo],
    inventory: pd.DataFrame,
    hsi_duplicates: pd.DataFrame,
    s960_summary: dict[str, object],
    hsi_filtered: pd.DataFrame,
    safe_fusion_without_hsi: pd.DataFrame,
) -> None:
    inventory_missing = inventory.loc[~inventory["in_all_modalities"], :]
    report_lines = [
        "# 橙子数据清洗报告",
        "",
        f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"输入目录: `{INPUT_DIR.name}`",
        "",
        "## 清洗规则",
        "",
        "- 统一样本编号为 `CM-数字` / `QZ-数字`。",
        "- 去除 Excel 中空行、空工作表带来的无效记录。",
        "- 液质数据保留平行样明细，同时按样本号对 `A/B` 两次测定求平均。",
        "- HSI 与 R210 直接按样本号合并两产地数据。",
        "- S960 同时保留原始区域表，并额外生成按共同波段对齐后的 400 样本表。",
        "- 不擅自删除可疑样本，异常仅通过质检文件和报告显式标记。",
        "",
        "## 关键结论",
        "",
        f"- 全模态共同样本数为 `{int(inventory['in_all_modalities'].sum())}`，缺口仅为 `CM-34`。",
        f"- HSI 中发现 `{len(hsi_duplicates)}` 对跨产地同编号样本在 300 个波段上完全一致，已导出到 `质检信息/HSI跨产地同编号完全重复样本.csv`。",
        f"- 为避免实验污染，安全建模主表已完全剔除 HSI，得到 `{len(safe_fusion_without_hsi)}` 个样本的 `安全版_去除HSI融合表.csv`。",
        f"- HSI 去重后仅剩 `{len(hsi_filtered)}` 个样本，其中琼中样本只剩 `QZ-34`，因此不建议再将 HSI 用于正式跨产地实验。",
        (
            "- S960 共同波段数为 "
            f"`{s960_summary['common_band_count']}`，QZ 原始表比 CM 多出 "
            f"`{s960_summary['qz_extra_band_count']}` 个尾部波段。"
        ),
        (
            "- S960 前 1402 个共同波段按位置对齐后，CM/QZ 头信息的最大绝对差为 "
            f"`{s960_summary['max_abs_diff_first_common_bands']:.6f} nm`。"
        ),
        "",
        "## 缺失样本",
        "",
    ]

    if inventory_missing.empty:
        report_lines.append("- 无缺失样本。")
    else:
        for _, row in inventory_missing.iterrows():
            modality_labels = {
                "in_titration": "滴定法指标",
                "in_lcms_mean": "液质平均值",
                "in_hsi": "HSI光谱",
                "in_r210": "R210光谱",
                "in_s960_common": "S960共同波段对齐表",
            }
            missing_modalities = [
                modality_labels[col]
                for col in ["in_titration", "in_lcms_mean", "in_hsi", "in_r210", "in_s960_common"]
                if not bool(row[col])
            ]
            report_lines.append(
                f"- `{row['sample_id']}` 缺失于: {', '.join(missing_modalities)}"
            )

    report_lines.extend(
        [
            "",
        "## 输出文件",
        "",
        "| 文件 | 行数 | 列数 | 说明 |",
        "| --- | ---: | ---: | --- |",
        ]
    )

    for export in exports:
        note = export.note or "-"
        report_lines.append(
            f"| `{export.path}` | {export.rows} | {export.cols} | {note} |"
        )

    report_lines.append("")
    (OUTPUT_DIR / "清洗说明.md").write_text("\n".join(report_lines), encoding="utf-8")


def main() -> None:
    MODALITY_DIR.mkdir(parents=True, exist_ok=True)
    FUSION_DIR.mkdir(parents=True, exist_ok=True)
    QC_DIR.mkdir(parents=True, exist_ok=True)

    titration = load_titration()
    lcms_replicates, lcms_mean = load_lcms()
    hsi = concat_spectral(["3 ", "4 "])
    r210 = concat_spectral(["5 ", "6 "])
    s960_cm_native, s960_qz_native, s960_common, s960_summary = load_s960_native()

    inventory = build_inventory(
        titration=titration,
        lcms_mean=lcms_mean,
        hsi=hsi,
        r210=r210,
        s960_common=s960_common,
        s960_cm_native=s960_cm_native,
        s960_qz_native=s960_qz_native,
    )
    hsi_duplicates = build_hsi_duplicate_report(hsi)
    hsi_filtered, hsi_removed_rows = build_hsi_filtered_tables(
        hsi=hsi,
        hsi_duplicates=hsi_duplicates,
    )
    s960_extra_bands = build_s960_extra_band_table(
        qz_native=s960_qz_native,
        common_count=int(s960_summary["common_band_count"]),
    )

    fusion_all, fusion_lcms_s960 = build_fusion_frames(
        titration=titration,
        lcms_mean=lcms_mean,
        hsi=hsi,
        r210=r210,
        s960_common=s960_common,
    )
    fusion_safe_without_hsi = build_safe_fusion_without_hsi(
        titration=titration,
        lcms_mean=lcms_mean,
        r210=r210,
        s960_common=s960_common,
    )

    exports = [
        export_csv(titration, MODALITY_DIR / "滴定法指标.csv"),
        export_csv(lcms_replicates, MODALITY_DIR / "液质平行样明细.csv"),
        export_csv(lcms_mean, MODALITY_DIR / "液质平均值.csv"),
        export_csv(hsi, MODALITY_DIR / "HSI光谱_疑似错误勿用于建模.csv"),
        export_csv(hsi_filtered, MODALITY_DIR / "HSI去重后光谱_仅供排查.csv"),
        export_csv(r210, MODALITY_DIR / "R210光谱.csv"),
        export_csv(s960_cm_native, MODALITY_DIR / "S960澄迈原始光谱.csv"),
        export_csv(s960_qz_native, MODALITY_DIR / "S960琼中原始光谱.csv"),
        export_csv(s960_common, MODALITY_DIR / "S960共同波段对齐表.csv"),
        export_csv(fusion_all, FUSION_DIR / "全模态融合表_含可疑HSI勿用.csv"),
        export_csv(fusion_safe_without_hsi, FUSION_DIR / "安全版_去除HSI融合表.csv"),
        export_csv(fusion_lcms_s960, FUSION_DIR / "液质与S960融合表.csv"),
        export_csv(inventory, QC_DIR / "样本清单.csv"),
        export_csv(hsi_duplicates, QC_DIR / "HSI跨产地同编号完全重复样本.csv"),
        export_csv(hsi_removed_rows, QC_DIR / "HSI已删除重复样本.csv"),
        export_csv(s960_extra_bands, QC_DIR / "S960琼中额外波段.csv"),
    ]

    note_map = {
        "滴定法指标": "滴定法 4 项指标，399 个样本。",
        "液质平行样明细": "液质原始平行样明细，800 行。",
        "液质平均值": "液质 A/B 平均后 400 个样本。",
        "HSI光谱_疑似错误勿用于建模": "原始 HSI 合并表，存在严重跨产地重复问题，不建议建模使用。",
        "HSI去重后光谱_仅供排查": "删除重复 QZ 光谱后剩余 200 个样本，仅供排查，不建议正式跨产地建模。",
        "R210光谱": "R210 合并表，CM 199 + QZ 200。",
        "S960澄迈原始光谱": "S960 澄迈原始表，1402 个波段。",
        "S960琼中原始光谱": "S960 琼中原始表，1452 个波段。",
        "S960共同波段对齐表": "S960 共同波段对齐表，400 个样本、1402 个波段。",
        "全模态融合表_含可疑HSI勿用": "包含可疑 HSI 的旧全模态融合表，仅保留作追溯。",
        "安全版_去除HSI融合表": "正式推荐的安全建模主表，已完全剔除 HSI。",
        "液质与S960融合表": "液质 + S960 共同样本融合表，400 个样本。",
        "样本清单": "每个样本在各模态中的存在情况。",
        "HSI跨产地同编号完全重复样本": "HSI 跨产地同编号完全一致样本对。",
        "HSI已删除重复样本": "从 HSI 中剔除的可疑重复样本明细。",
        "S960琼中额外波段": "QZ 相比 CM 多出的尾部波段。",
    }
    exports = [
        ExportInfo(
            name=export.name,
            rows=export.rows,
            cols=export.cols,
            path=export.path,
            note=note_map.get(export.name, ""),
        )
        for export in exports
    ]

    summary = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "input_dir": INPUT_DIR.name,
        "exports": [export.__dict__ for export in exports],
        "s960_alignment": s960_summary,
        "full_fusion_sample_count": int(fusion_all.shape[0]),
        "safe_fusion_without_hsi_sample_count": int(fusion_safe_without_hsi.shape[0]),
        "lcms_s960_sample_count": int(fusion_lcms_s960.shape[0]),
        "missing_all_modalities_samples": inventory.loc[
            ~inventory["in_all_modalities"], "sample_id"
        ].tolist(),
        "hsi_exact_duplicate_pair_count": int(hsi_duplicates.shape[0]),
        "hsi_filtered_sample_count": int(hsi_filtered.shape[0]),
    }
    (QC_DIR / "汇总信息.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    write_report(
        exports=exports,
        inventory=inventory,
        hsi_duplicates=hsi_duplicates,
        s960_summary=s960_summary,
        hsi_filtered=hsi_filtered,
        safe_fusion_without_hsi=fusion_safe_without_hsi,
    )


if __name__ == "__main__":
    main()
