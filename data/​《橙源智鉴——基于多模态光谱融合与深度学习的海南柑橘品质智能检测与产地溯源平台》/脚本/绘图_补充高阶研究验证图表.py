import warnings
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "正式实验" / "数据集"
BASELINE_DIR = ROOT / "正式实验" / "基线结果" / "任务2_产地溯源"
OUT_DIR = ROOT / "正式实验" / "研究记录" / "高质量学术图表"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ==========================================
# 全局色系规范 (Color Palette)
# ==========================================
C_PRIMARY = "#EA580C"    # 品牌橙 (澄迈)
C_BG = "#FFF7ED"         # 全局浅暖背景
C_TEXT = "#431407"       # 深褐文本
C_GREEN = "#16A34A"      # 生态绿 (琼中)
C_RED = "#EF4444"        # 警戒红

def set_style():
    plt.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei', 'Arial']
    plt.rcParams['axes.unicode_minus'] = False
    plt.rcParams['figure.facecolor'] = C_BG
    plt.rcParams['axes.facecolor'] = C_BG
    plt.rcParams['savefig.facecolor'] = C_BG
    plt.rcParams['text.color'] = C_TEXT
    plt.rcParams['axes.labelcolor'] = C_TEXT
    plt.rcParams['xtick.color'] = C_TEXT
    plt.rcParams['ytick.color'] = C_TEXT
    plt.rcParams['axes.edgecolor'] = '#FED7AA'

# ==========================================
# 1. 多模态光谱反射率与标准差地貌图
# ==========================================
def plot_spectral_profile():
    set_style()
    print("[*] 绘制创新图4: 光谱均值与方差包络地形图...")
    
    df = pd.read_csv(DATA_DIR / "任务1_品质预测数据集.csv")
    s960_cols = [c for c in df.columns if c.startswith('s960_')]
    waves = [float(c.split('_')[1].replace('nm', '')) for c in s960_cols]
    
    fig, ax = plt.subplots(figsize=(10, 5))
    
    origins = df['origin'].unique()
    colors = {origins[0]: C_PRIMARY, origins[1]: C_GREEN} if len(origins)>1 else {origins[0]: C_PRIMARY}
    labels = {origins[0]: f"产区 A: {origins[0]}", origins[1]: f"产区 B: {origins[1]}"}
    
    for org, color in colors.items():
        subset = df[df['origin'] == org][s960_cols].values
        mean_spec = np.mean(subset, axis=0)
        std_spec = np.std(subset, axis=0)
        
        ax.plot(waves, mean_spec, color=color, linewidth=2.5, label=labels.get(org, org))
        ax.fill_between(waves, mean_spec - std_spec, mean_spec + std_spec, color=color, alpha=0.2)
        
    ax.set_title("S960近红外特征吸收波段地貌图 (均值与1σ包络)", fontsize=16, fontweight='bold', pad=15)
    ax.set_xlabel("波长 (Wavelength nm)", fontsize=13)
    ax.set_ylabel("吸光度 / 反射率 (Absorbance)", fontsize=13)
    ax.legend(frameon=True, facecolor=C_BG, edgecolor='#FED7AA', fontsize=12)
    ax.grid(True, linestyle='--', alpha=0.4, color=C_TEXT)
    
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig(OUT_DIR / "创新图4_S960光谱群体波段形态地貌图.png", dpi=300)
    plt.savefig(OUT_DIR / "创新图4_S960光谱群体波段形态地貌图.pdf", dpi=300)
    plt.close()

# ==========================================
# 2. 产地鉴权全矩阵解析图 (High-end Styled Confusion Matrix)
# ==========================================
def plot_confusion_matrix():
    set_style()
    print("[*] 绘制创新图5: 产地溯源双色高定热力混淆矩阵...")
    
    cm_path = BASELINE_DIR / "测试集混淆矩阵_R210+S960双光谱_线性SVM.csv"
    if not cm_path.exists():
        print("未找到混淆矩阵文件，跳过")
        return
    
    df_cm = pd.read_csv(cm_path, index_col=0)
    # 取数值
    cm_vals = df_cm.values
    classes = [str(c).replace("真实_", "") for c in df_cm.index]
    
    cm_sum = np.sum(cm_vals, axis=1, keepdims=True)
    cm_perc = cm_vals / cm_sum.astype(float) * 100
    
    annot_data = np.empty_like(cm_vals).astype(str)
    for i in range(cm_vals.shape[0]):
        for j in range(cm_vals.shape[1]):
            annot_data[i, j] = f"{cm_vals[i, j]}\n({cm_perc[i, j]:.1f}%)"
            
    fig, ax = plt.subplots(figsize=(6, 5))
    
    sns.heatmap(
        cm_perc, annot=annot_data, fmt='', cmap="Oranges", 
        cbar=True, cbar_kws={'label': '识别置信度 (%)'}, 
        ax=ax, annot_kws={"size": 14, "weight": "bold"},
        linewidths=2, linecolor=C_BG
    )
    
    ax.set_xticklabels(classes, fontsize=12, fontweight='bold')
    ax.set_yticklabels(classes, fontsize=12, fontweight='bold', rotation=0)
    ax.set_xlabel("AI 智能决策鉴权 (预测产地)", fontsize=13, labelpad=10)
    ax.set_ylabel("真实物理源地 (真实产地)", fontsize=13, labelpad=10)
    ax.set_title("微区块产地溯源双光谱鉴权矩阵", fontsize=16, fontweight='bold', pad=15)
    
    plt.tight_layout()
    plt.savefig(OUT_DIR / "创新图5_鉴权结果双色高级混淆矩阵.png", dpi=300)
    plt.savefig(OUT_DIR / "创新图5_鉴权结果双色高级混淆矩阵.pdf", dpi=300)
    plt.close()

if __name__ == "__main__":
    plot_spectral_profile()
    plot_confusion_matrix()
    print("\n[+] 补充顶刊级别高级科研验证图表已生成！")