# PharmaSpark

PharmaSpark — 3D Gaussian Splatting for Pharmaceutical & Biomedical Visualization

## 项目简介

PharmaSpark 是一个基于 3D Gaussian Splatting 技术的分子可视化库，专为药物发现和生物医学研究设计。它能够将蛋白质和小分子结构转换为高质量的 3D 高斯溅射数据，实现前所未有的实时渲染效果。

## 核心功能

### 分子解析
- **PDB 解析**: 支持蛋白质数据库（PDB）格式，解析原子坐标、残基、链等信息
- **SDF 解析**: 支持结构数据文件（SDF）格式，解析小分子结构和键信息
- **元素数据**: 内置元素周期表数据，包括范德华半径、颜色等属性

### 3D 高斯溅射转换
- **原子到溅射**: 将原子坐标转换为 3D 高斯溅射数据
- **分子到溅射**: 将分子结构转换为 3D 高斯溅射数据
- **键到溅射**: 将化学键转换为 3D 高斯溅射数据
- **表面生成**: 生成分子表面的 3D 高斯溅射表示
- **口袋高亮**: 高亮显示蛋白质结合口袋

### 可视化选项
- **颜色模式**: 支持多种颜色模式
  - 按元素着色
  - 按链着色
  - 按二级结构着色
  - 按 B 因子着色
  - 按疏水性着色
  - 自定义颜色函数
- **渲染参数**: 可调整半径缩放、透明度等参数
- **相机控制**: 支持鼠标拖拽、缩放等交互操作

### 数据导出
- **PLY 导出**: 将溅射数据导出为 PLY 格式
- **Blob 生成**: 生成可下载的 Blob 对象
- **URL 生成**: 生成可分享的下载 URL

### 药物库支持
- **LoD 渲染**: 支持多细节层次（Level of Detail）渲染
- **化合物库**: 支持大规模化合物库的可视化
- **对接可视化**: 支持分子对接结果的可视化

## 技术栈

### 核心技术
- **TypeScript**: 类型安全的 JavaScript 超集
- **Vite**: 现代化的前端构建工具
- **Three.js**: 3D 图形库
- **Spark.js**: GPU 加速的 3D 高斯溅射渲染器

### 开发工具
- **Biome**: 代码格式化和检查
- **Vitest**: 单元测试框架
- **Git**: 版本控制

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- 现代浏览器（支持 WebGL 2.0）

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/MoKangMedical/pharmaspark.git
cd pharmaspark
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问 Demo 页面**
打开浏览器访问 `http://localhost:8097`

### 构建库

```bash
# 构建生产版本
npm run build

# 构建开发版本
npm run build:dev

# 监听文件变化并自动构建
npm run build:watch
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听文件变化并自动运行测试
npm run test:watch
```

## 项目结构

```
pharmaspark/
├── src/                    # 源代码
│   ├── core/              # 核心功能
│   │   ├── atom-to-splat.ts    # 原子到溅射转换
│   │   ├── pdb-parser.ts       # PDB 文件解析
│   │   ├── sdf-parser.ts       # SDF 文件解析
│   │   ├── elements.ts         # 元素数据
│   │   ├── ply-export.ts       # PLY 导出
│   │   ├── drug-library.ts     # 药物库支持
│   │   └── docking.ts          # 分子对接可视化
│   ├── renderers/         # 渲染器
│   │   └── spark-bridge.ts     # Spark.js 集成
│   └── index.ts           # 主入口
├── docs/                  # 文档
├── tests/                 # 测试
├── scripts/               # 脚本
├── .github/               # GitHub 配置
├── index.html             # Demo 页面
├── package.json           # 项目配置
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
└── README.md              # 项目说明
```

## API 文档

### 核心函数

#### parsePDB(pdbText: string): Protein
解析 PDB 格式的蛋白质结构文件。

**参数:**
- `pdbText`: PDB 格式的文本内容

**返回值:**
- `Protein`: 蛋白质结构对象，包含原子、残基、链等信息

#### parseSDF(sdfText: string): Molecule
解析 SDF 格式的小分子结构文件。

**参数:**
- `sdfText`: SDF 格式的文本内容

**返回值:**
- `Molecule`: 分子结构对象，包含原子、键等信息

#### atomsToSplats(atoms: Atom[], options?: AtomToSplatOptions): SplatData
将原子数组转换为 3D 高斯溅射数据。

**参数:**
- `atoms`: 原子数组
- `options`: 转换选项
  - `colorMode`: 颜色模式（默认: "element"）
  - `radiusScale`: 半径缩放（默认: 0.5）
  - `opacity`: 透明度（默认: 0.9）
  - `includeHydrogens`: 是否包含氢原子（默认: false）
  - `customColorFn`: 自定义颜色函数

**返回值:**
- `SplatData`: 溅射数据对象，包含位置、缩放、旋转、颜色等信息

#### moleculeToSplats(molecule: Molecule, options?: MoleculeToSplatOptions): SplatData
将分子结构转换为 3D 高斯溅射数据。

**参数:**
- `molecule`: 分子结构对象
- `options`: 转换选项

**返回值:**
- `SplatData`: 溅射数据对象

### 渲染器类

#### PharmaSparkViewer
3D 高斯溅射查看器类。

**构造函数:**
```typescript
new PharmaSparkViewer(options: PharmaSparkViewerOptions)
```

**选项:**
- `container`: 容器 HTML 元素
- `width`: 宽度（默认: 容器宽度）
- `height`: 高度（默认: 容器高度）
- `backgroundColor`: 背景颜色（默认: 0x1a1a2e）
- `cameraDistance`: 相机距离（默认: 50）

**方法:**
- `addMolecule(name: string, splatData: SplatData)`: 添加分子
- `removeMolecule(name: string)`: 移除分子
- `clear()`: 清除所有分子
- `setCameraTarget(x: number, y: number, z: number)`: 设置相机目标点
- `setCameraDistance(d: number)`: 设置相机距离
- `dispose()`: 销毁查看器

## 使用示例

### 基本使用

```typescript
import { parsePDB, atomsToSplats, PharmaSparkViewer } from 'pharmaspark';

// 创建查看器
const viewer = new PharmaSparkViewer({
  container: document.getElementById('viewer'),
  backgroundColor: 0x1a1a2e,
});

// 加载 PDB 文件
const response = await fetch('https://files.rcsb.org/download/1crn.pdb');
const pdbText = await response.text();

// 解析 PDB
const protein = parsePDB(pdbText);

// 转换为溅射数据
const splatData = atomsToSplats(protein.atoms, {
  colorMode: 'element',
  radiusScale: 0.5,
  opacity: 0.9,
});

// 添加到查看器
await viewer.addMolecule('1crn', splatData);
```

### 自定义颜色

```typescript
import { parsePDB, atomsToSplats, PharmaSparkViewer } from 'pharmaspark';

// 自定义颜色函数
const customColorFn = (atom) => {
  // 根据原子类型返回不同颜色
  switch (atom.element) {
    case 'C': return [200, 200, 200]; // 灰色
    case 'N': return [0, 0, 255];     // 蓝色
    case 'O': return [255, 0, 0];     // 红色
    case 'S': return [255, 255, 0];   // 黄色
    default: return [255, 255, 255];  // 白色
  }
};

// 使用自定义颜色
const splatData = atomsToSplats(protein.atoms, {
  colorMode: 'custom',
  customColorFn,
});
```

### 分子对接可视化

```typescript
import { parseSDF, moleculeToSplats, interactionLinesToSplats, PharmaSparkViewer } from 'pharmaspark';

// 创建查看器
const viewer = new PharmaSparkViewer({
  container: document.getElementById('viewer'),
});

// 加载蛋白质和配体
const proteinResponse = await fetch('protein.pdb');
const proteinText = await proteinResponse.text();
const protein = parsePDB(proteinText);

const ligandResponse = await fetch('ligand.sdf');
const ligandText = await ligandResponse.text();
const ligand = parseSDF(ligandText);

// 转换为溅射数据
const proteinSplats = atomsToSplats(protein.atoms);
const ligandSplats = moleculeToSplats(ligand);

// 添加到查看器
await viewer.addMolecule('protein', proteinSplats);
await viewer.addMolecule('ligand', ligandSplats);

// 添加相互作用线
const interactions = [
  { type: 'hydrogen_bond', atom1: 10, atom2: 25, distance: 2.8 },
  { type: 'hydrophobic', atom1: 15, atom2: 30, distance: 3.5 },
];

const interactionSplats = interactionLinesToSplats(interactions, protein.atoms);
await viewer.addMolecule('interactions', interactionSplats);
```

## 配置说明

### 环境变量

创建 `.env` 文件并配置以下变量：

```bash
# 开发环境
VITE_API_URL=http://localhost:8000
VITE_DEBUG=true

# 生产环境
VITE_API_URL=https://api.pharmaspark.com
VITE_DEBUG=false
```

### 构建配置

在 `vite.config.ts` 中可以配置：

```typescript
export default defineConfig({
  // 开发服务器配置
  server: {
    host: '0.0.0.0',
    port: 8097,
  },
  
  // 构建配置
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'PharmaSpark',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['three', '@sparkjsdev/spark'],
    },
  },
});
```

## 部署指南

### 开发环境

```bash
# 克隆仓库
git clone https://github.com/MoKangMedical/pharmaspark.git
cd pharmaspark

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 生产环境

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 部署到静态服务器
# 将 dist 目录部署到 Nginx、Apache 或 CDN
```

### Docker 部署

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- tests/core/pdb-parser.test.ts

# 生成测试覆盖率报告
npm test -- --coverage
```

### 编写测试

```typescript
import { describe, it, expect } from 'vitest';
import { parsePDB } from '../src/core/pdb-parser';

describe('PDB Parser', () => {
  it('should parse PDB file correctly', () => {
    const pdbText = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       2.000   3.000   4.000  1.00  0.00           C
    `;
    
    const protein = parsePDB(pdbText);
    
    expect(protein.atoms).toHaveLength(2);
    expect(protein.atoms[0].element).toBe('N');
    expect(protein.atoms[1].element).toBe('C');
  });
});
```

## 贡献指南

我们欢迎任何形式的贡献！请遵循以下步骤：

1. **Fork 本仓库**
2. **创建特性分支**
```bash
git checkout -b feature/AmazingFeature
```

3. **提交更改**
```bash
git commit -m 'Add some AmazingFeature'
```

4. **推送到分支**
```bash
git push origin feature/AmazingFeature
```

5. **创建 Pull Request**

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 Biome 代码规范
- 编写单元测试
- 更新文档

### 提交规范

使用 Conventional Commits 规范：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建/工具链更新
```

## 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 联系方式

- **项目维护者**: MoKangMedical
- **邮箱**: contact@mokangmedical.com
- **项目主页**: https://github.com/MoKangMedical/pharmaspark
- **问题反馈**: https://github.com/MoKangMedical/pharmaspark/issues

## 致谢

感谢所有为这个项目做出贡献的开发者和医疗领域专家！

---

**注意**: 这是一个活跃开发中的项目，API 和功能可能会发生变化。请定期查看更新日志获取最新信息。
