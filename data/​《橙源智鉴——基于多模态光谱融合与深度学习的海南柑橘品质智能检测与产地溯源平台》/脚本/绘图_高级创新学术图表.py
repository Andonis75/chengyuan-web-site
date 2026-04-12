import warnings
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "正式实验" / "数据集"
SPLIT_DIR = ROOT / "正式实验" / "划分方案"
OUT_DIR = ROOT / "正式实验" / "研究记录" / "高质量学术图表"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ==========================================
# 全局色系规范 (Color Palette)
# ==========================================
C_PRIMARY = "#EA580C"    # 品牌橙
C_BG = "#FFF7ED"         # 全局浅暖背景
C_TEXT = "#431407"       # 深褐文本
C_GREEN = "#16A34A"      # 生态绿
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

class SNV(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None): return self
    def transform(self, X):
        mean = np.mean(X, axis=1, keepdims=True)
        std = np.std(X, axis=1, keepdims=True)
        return (X - mean) / (std + 1e-12)

# ==========================================
# 创新图 1: 带有误差热力的预测联合分布图
# ==========================================
def plot_joint_scatter():
    set_style()
    print("[*] 绘制创新图1: 误差热力回归联合散点图...")
    
    # 调取数据
    df_split = pd.read_csv(SPLIT_DIR / "统一样本划分.csv", encoding="utf-8-sig")
    df_data = pd.read_csv(DATA_DIR / "任务1_品质预测数据集.csv", encoding="utf-8-sig")
    df = pd.merge(df_split, df_data, on=["sample_id", "origin", "sample_number"])
    
    train_df = df[df['split'] == '训练集']
    test_df = df[df['split'] == '验证集'] # 画验证集的性能
    
    feats = [c for c in df.columns if c.startswith('r210_') or c.startswith('s960_')]
    target = 'titration_糖度'
    
    # 用我们在第四版确定的最优特征管线来推断
    pipe = Pipeline([('snv', SNV()), ('ridge', Ridge(alpha=50.0, random_state=42))])
    pipe.fit(train_df[feats].to_numpy(float), train_df[target].to_numpy(float))
    
    y_true = test_df[target].to_numpy(float)
    y_pred = pipe.predict(test_df[feats].to_numpy(float))
    
    # 求误差梯度用于着色
    abs_error = np.abs(y_true - y_pred)
    plot_df = pd.DataFrame({'Observed': y_true, 'Predicted': y_pred, 'Error': abs_error})
    
    # 利用 JointGrid 拼接顶侧与右侧的密度图
    g = sns.JointGrid(data=plot_df, x='Observed', y='Predicted', space=0, height=8, ratio=5)
    
    # 边缘密度图 KDE
    sns.kdeplot(plot_df['Observed'], fill=True, color=C_PRIMARY, alpha=0.6, ax=g.ax_marg_x, linewidth=2)
    sns.kdeplot(y=plot_df['Predicted'], fill=True, color=C_GREEN, alpha=0.6, ax=g.ax_marg_y, linewidth=2)
    
    # 中心散点：利用误差进行桔色系颜色渐变映射
    scatter = g.ax_joint.scatter(
        plot_df['Observed'], plot_df['Predicted'], 
        c=plot_df['Error'], cmap='Oranges', 
        s=100, alpha=0.9, edgecolor='w', linewidth=0.8
    )
    
    # 中心完美拟合线 y=x
    min_val = min(y_true.min(), y_pred.min()) - 0.5
    max_val = max(y_true.max(), y_pred.max()) + 0.5
    g.ax_joint.plot([min_val, max_val], [min_val, max_val], color=C_GREEN, linestyle='--', linewidth=2.5, zorder=0)
    
    g.fig.suptitle("双光谱高阶融合糖度预测 (误差热力联合分布)", fontsize=18, fontweight='bold', y=1.03)
    g.ax_joint.set_xlabel("实验室真实糖度 (Brix %)", fontsize=13)
    g.ax_joint.set_ylabel("多模态 AI 预测糖度", fontsize=13)
    g.ax_joint.grid(True, linestyle='--', alpha=0.4, color=C_TEXT)
    
    # 隐藏无用边框
    g.ax_joint.spines['top'].set_visible(False)
    g.ax_joint.spines['right'].set_visible(False)
    
    plt.savefig(OUT_DIR / "创新图1_联合误差热力回归散点.pdf", dpi=300, bbox_inches='tight')
    plt.savefig(OUT_DIR / "创新图1_联合误差热力回归散点.png", dpi=300, bbox_inches='tight')
    plt.close()


# ==========================================
# 创新图 2: 多维品质化学面貌雷达图
# ==========================================
def plot_radar_profile():
    set_style()
    print("[*] 绘制创新图2: 产地双色多维品质雷达图...")
    
    df = pd.read_csv(DATA_DIR / "任务1_品质预测数据集.csv", encoding="utf-8-sig")
    targets = ["titration_糖度", "titration_VC", "titration_酸度", "titration_糖酸比"]
    labels = ["综合糖度", "维C抗坏血酸", "滴定总酸度", "固酸比(风味)"]
    
    # 归一化极轨轴范围，保证绘制在同一个雷达图下
    df_scaled = df.copy()
    df_scaled[targets] = MinMaxScaler().fit_transform(df[targets])
    
    means_scaled = df_scaled.groupby('origin')[targets].mean()
    origins = means_scaled.index.tolist()
    
    num_vars = len(labels)
    angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
    angles += angles[:1]  # 闭合曲线
    
    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
    
    colors = [C_PRIMARY, C_GREEN]
    for i, origin in enumerate(origins):
        values = means_scaled.loc[origin].tolist()
        values += values[:1]
        
        ax.plot(angles, values, color=colors[i % 2], linewidth=3, label=origin)
        ax.fill(angles, values, color=colors[i % 2], alpha=0.25)
        
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels, fontsize=13, fontweight='bold')
    
    # 隐去半径网格刻度和最外层圆边
    ax.set_yticks([]) 
    ax.spines['polar'].set_color('#FED7AA')
    ax.spines['polar'].set_linewidth(1.5)
    
    ax.set_title("海南柑橘地理理化标志 (产地微观特性画像)", fontsize=18, pad=30, fontweight='bold')
    plt.legend(loc='upper right', bbox_to_anchor=(1.2, 1.1), facecolor=C_BG, edgecolor='#FED7AA', fontsize=12)
    
    plt.savefig(OUT_DIR / "创新图2_双色生化特性雷达画像.pdf", dpi=300, bbox_inches='tight')
    plt.savefig(OUT_DIR / "创新图2_双色生化特性雷达画像.png", dpi=300, bbox_inches='tight')
    plt.close()


# ==========================================
# 创新图 3: 带有底层散落点的地形山脊密度图 (Raincloud替代)
# ==========================================
def plot_density_stripplot():
    set_style()
    print("[*] 绘制创新图3: 产地糖度概率山脊与分布散点图...")
    
    df = pd.read_csv(DATA_DIR / "任务1_品质预测数据集.csv", encoding="utf-8-sig")
    unique_org = df['origin'].unique()
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # 上半部分：山脊密度云图 (KDE)
    palette = {unique_org[0]: C_PRIMARY, unique_org[1]: C_GREEN} if len(unique_org) > 1 else {unique_org[0]: C_PRIMARY}
    
    sns.kdeplot(
        data=df, x="titration_糖度", hue="origin", 
        fill=True, palette=palette, alpha=0.5, linewidth=2.5, ax=ax
    )
    
    # 下半部分：个体的降雨散点 (Strip plot)
    sns.stripplot(
        data=df, x="titration_糖度", hue="origin", y="origin",
        palette=palette, alpha=0.6, jitter=0.15, size=5, orient='h', ax=ax
    )
    
    ax.set_title("不同产地组分天然分层现象 (KDE + 聚落散点)", fontsize=16, fontweight='bold', pad=20)
    ax.set_xlabel("糖度 (Brix %)", fontsize=13)
    ax.set_ylabel("样本群生态位", fontsize=13)
    
    # 使地貌看起来更干净
    ax.grid(axis='x', linestyle='--', alpha=0.4, color=C_TEXT)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig(OUT_DIR / "创新图3_地貌山脊糖度云雨式分布.pdf", dpi=300)
    plt.savefig(OUT_DIR / "创新图3_地貌山脊糖度云雨式分布.png", dpi=300)
    plt.close()


if __name__ == "__main__":
    plot_joint_scatter()
    plot_radar_profile()
    plot_density_stripplot()
    print("\n[+] 进阶版 SCI 学术创新图表生成完毕！")