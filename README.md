# PharmaSpark 🧬✨

**3D Gaussian Splatting for Pharmaceutical & Biomedical Visualization**

基于 [Spark 2.0](https://github.com/sparkjsdev/spark) 架构的医药领域 3D 可视化引擎。将分子结构、蛋白质表面、药物-受体对接结果渲染为 3D 高斯溅射（3DGS），在浏览器中实现超大规模生物医学数据的实时交互。

## 核心能力

| 模块 | 功能 | 技术 |
|------|------|------|
| **分子渲染** | 原子→splat 映射，CPK 着色，范德华半径缩放 | 坐标映射 + 元素属性库 |
| **蛋白质表面** | 去除埋藏点的分子表面 splat 云 | Fibonacci 球采样 + 碰撞检测 |
| **结合口袋** | 靶点区域高亮，外围区域淡化 | 距离着色 + 透明度调制 |
| **药物库 LoD** | 百万化合物库渐进式流加载 | 3D 网格 + 三级 LoD |
| **对接可视化** | 药物-受体相互作用线，药效团特征 | 分子间距离 + 类型着色 |
| **多格式支持** | PDB、SDF/MOL 解析与导出 | 标准格式解析器 |

## 快速开始

```bash
# 安装
npm install pharmaspark

# 或从源码构建
git clone https://github.com/MoKangMedical/pharmaspark
cd pharmaspark
npm install
npm run dev
```

### 浏览器中渲染一个分子

```typescript
import { parsePDB, atomsToSplats, PharmaSparkViewer } from "pharmaspark";

// 解析 PDB 文件
const response = await fetch("/protein.pdb");
const protein = parsePDB(await response.text());

// 转换为 splat 数据
const splats = atomsToSplats(protein.atoms, {
  colorMode: "element",
  radiusScale: 0.5,
});

// 渲染
const viewer = new PharmaSparkViewer({
  container: document.getElementById("viewer")!,
});
await viewer.addMolecule("my-protein", splats);
```

### 药物库浏览

```typescript
import { DrugLibraryRenderer } from "pharmaspark";

const library = new DrugLibraryRenderer({
  compounds: myCompounds,
  gridSize: [10, 10, 10],
  spacing: 30,
  lodLevels: 3,
});

// 根据相机位置动态加载
const splats = library.generateLoDSplats(
  2,                    // LoD level
  [0, 0, 0],           // camera position
  100                   // view radius
);
```

## 架构

```
pharmaspark/
├── src/
│   ├── core/
│   │   ├── pdb-parser.ts       # PDB 文件解析
│   │   ├── sdf-parser.ts       # SDF/MOL 分子解析
│   │   ├── elements.ts         # 元素属性库（CPK 色、vdW 半径）
│   │   ├── atom-to-splat.ts    # 原子→splat 核心转换
│   │   ├── drug-library.ts     # 药物库 LoD 渲染
│   │   ├── docking.ts          # 对接可视化 + 药效团
│   │   └── ply-export.ts       # PLY 导出（兼容 Spark）
│   ├── renderers/
│   │   └── spark-bridge.ts     # Spark 集成层（Three.js + SplatMesh）
│   └── index.ts                # 统一导出
├── examples/
│   ├── molecule-viewer/        # 分子查看器 demo
│   ├── protein-surface/        # 蛋白质表面 demo
│   ├── docking-viz/            # 对接可视化 demo
│   └── drug-library/           # 药物库浏览 demo
├── cli/                        # 命令行工具
└── test/                       # 测试
```

## 与 Spark 的关系

PharmaSpark 是 Spark 2.0 的**垂直领域应用层**：
- **Spark** 提供通用 3DGS 渲染引擎（LoD、流式加载、虚拟内存）
- **PharmaSpark** 提供医药领域的数据转换层（分子→splat、蛋白质表面、对接可视化）
- 两者通过 PLY 格式桥接：PharmaSpark 输出标准 PLY，Spark 负责 GPU 渲染

## 应用场景

- 🔬 **药物发现** — 浏览百万化合物库，快速定位活性分子
- 🧬 **结构生物学** — 蛋白质结构、结合口袋、突变位点的 3D 交互
- 💊 **药物设计** — 药效团可视化、分子对接结果分析
- 🏥 **医学教育** — 分子机制的沉浸式教学
- 🌐 **Web 协作** — 浏览器端分享 3D 分子结构，无需安装插件

## License

MIT
