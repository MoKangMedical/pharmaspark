# PharmaSpark API 文档

## 概述

PharmaSpark 是一个基于 3D Gaussian Splatting 技术的分子可视化库。本文档描述了其核心 API 接口和使用方法。

## 安装

```bash
npm install pharmaspark
```

或

```bash
yarn add pharmaspark
```

## 快速开始

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

## 核心 API

### 分子解析

#### parsePDB(pdbText: string): Protein

解析 PDB 格式的蛋白质结构文件。

**参数:**
- `pdbText`: PDB 格式的文本内容

**返回值:**
- `Protein`: 蛋白质结构对象

**Protein 接口:**
```typescript
interface Protein {
  atoms: Atom[];
  residues: Residue[];
  chains: Chain[];
  helices: Helix[];
  sheets: Sheet[];
}
```

**Atom 接口:**
```typescript
interface Atom {
  serial: number;
  name: string;
  altLoc: string;
  resName: string;
  chainID: string;
  resSeq: number;
  iCode: string;
  x: number;
  y: number;
  z: number;
  occupancy: number;
  tempFactor: number;
  element: string;
  charge: string;
  color: [number, number, number];
  vdWRadius: number;
}
```

**Residue 接口:**
```typescript
interface Residue {
  name: string;
  seq: number;
  chainID: string;
  atoms: Atom[];
}
```

**Chain 接口:**
```typescript
interface Chain {
  id: string;
  residues: Residue[];
}
```

**示例:**
```typescript
const pdbText = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       2.000   3.000   4.000  1.00  0.00           C
`;

const protein = parsePDB(pdbText);

console.log(protein.atoms.length); // 2
console.log(protein.atoms[0].element); // 'N'
console.log(protein.residues.length); // 1
console.log(protein.chains.length); // 1
```

#### parseSDF(sdfText: string): Molecule

解析 SDF 格式的小分子结构文件。

**参数:**
- `sdfText`: SDF 格式的文本内容

**返回值:**
- `Molecule`: 分子结构对象

**Molecule 接口:**
```typescript
interface Molecule {
  name: string;
  atoms: MoleculeAtom[];
  bonds: MoleculeBond[];
}
```

**MoleculeAtom 接口:**
```typescript
interface MoleculeAtom {
  x: number;
  y: number;
  z: number;
  element: string;
  color: [number, number, number];
  vdWRadius: number;
}
```

**MoleculeBond 接口:**
```typescript
interface MoleculeBond {
  atom1: number;
  atom2: number;
  order: number;
}
```

**示例:**
```typescript
const sdfText = `
     RDKit          3D

  3  2  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    1.5000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0
  1  3  1  0
M  END
`;

const molecule = parseSDF(sdfText);

console.log(molecule.atoms.length); // 3
console.log(molecule.bonds.length); // 2
```

### 3D 高斯溅射转换

#### atomsToSplats(atoms: Atom[], options?: AtomToSplatOptions): SplatData

将原子数组转换为 3D 高斯溅射数据。

**参数:**
- `atoms`: 原子数组
- `options`: 转换选项

**AtomToSplatOptions 接口:**
```typescript
interface AtomToSplatOptions {
  colorMode?: ColorMode;
  radiusScale?: number;
  opacity?: number;
  includeHydrogens?: boolean;
  customColorFn?: (atom: Atom) => [number, number, number];
}
```

**ColorMode 类型:**
```typescript
type ColorMode = "element" | "chain" | "secondary" | "b-factor" | "hydrophobicity" | "custom";
```

**SplatData 接口:**
```typescript
interface SplatData {
  positions: Float32Array;   // xyz per splat (length = n * 3)
  scales: Float32Array;      // xyz scale per splat (length = n * 3)
  rotations: Float32Array;   // quaternion per splat (length = n * 4)
  colors: Float32Array;      // rgba per splat (length = n * 4)
  count: number;
}
```

**示例:**
```typescript
const splatData = atomsToSplats(protein.atoms, {
  colorMode: 'element',
  radiusScale: 0.5,
  opacity: 0.9,
  includeHydrogens: false,
});

console.log(splatData.count); // 原子数量
console.log(splatData.positions.length); // count * 3
console.log(splatData.colors.length); // count * 4
```

#### moleculeToSplats(molecule: Molecule, options?: MoleculeToSplatOptions): SplatData

将分子结构转换为 3D 高斯溅射数据。

**参数:**
- `molecule`: 分子结构对象
- `options`: 转换选项

**MoleculeToSplatOptions 接口:**
```typescript
interface MoleculeToSplatOptions {
  colorMode?: ColorMode;
  radiusScale?: number;
  opacity?: number;
  includeHydrogens?: boolean;
  customColorFn?: (atom: MoleculeAtom) => [number, number, number];
}
```

**示例:**
```typescript
const splatData = moleculeToSplats(molecule, {
  colorMode: 'element',
  radiusScale: 0.5,
  opacity: 0.9,
});
```

#### bondsToSplats(atoms: Atom[], bonds: Bond[], options?: BondToSplatOptions): SplatData

将化学键转换为 3D 高斯溅射数据。

**参数:**
- `atoms`: 原子数组
- `bonds`: 键数组
- `options`: 转换选项

**Bond 接口:**
```typescript
interface Bond {
  atom1: number;
  atom2: number;
  order: number;
}
```

**BondToSplatOptions 接口:**
```typescript
interface BondToSplatOptions {
  radius?: number;
  color?: [number, number, number];
  opacity?: number;
}
```

**示例:**
```typescript
const bondSplats = bondsToSplats(atoms, bonds, {
  radius: 0.1,
  color: [200, 200, 200],
  opacity: 0.8,
});
```

#### generateSurfaceSplats(atoms: Atom[], options?: SurfaceOptions): SplatData

生成分子表面的 3D 高斯溅射表示。

**参数:**
- `atoms`: 原子数组
- `options`: 表面选项

**SurfaceOptions 接口:**
```typescript
interface SurfaceOptions {
  probeRadius?: number;
  resolution?: number;
  color?: [number, number, number];
  opacity?: number;
}
```

**示例:**
```typescript
const surfaceSplats = generateSurfaceSplats(atoms, {
  probeRadius: 1.4,
  resolution: 0.5,
  color: [100, 200, 255],
  opacity: 0.3,
});
```

#### highlightPocket(atoms: Atom[], pocketAtoms: number[], options?: PocketOptions): SplatData

高亮显示蛋白质结合口袋。

**参数:**
- `atoms`: 原子数组
- `pocketAtoms`: 口袋原子索引数组
- `options`: 口袋选项

**PocketOptions 接口:**
```typescript
interface PocketOptions {
  highlightColor?: [number, number, number];
  dimColor?: [number, number, number];
  highlightOpacity?: number;
  dimOpacity?: number;
}
```

**示例:**
```typescript
const pocketSplats = highlightPocket(atoms, [10, 11, 12, 15, 20], {
  highlightColor: [255, 100, 100],
  dimColor: [100, 100, 100],
  highlightOpacity: 1.0,
  dimOpacity: 0.3,
});
```

### 数据导出

#### splatsToPLY(splatData: SplatData): string

将溅射数据导出为 PLY 格式。

**参数:**
- `splatData`: 溅射数据对象

**返回值:**
- `string`: PLY 格式的文本内容

**示例:**
```typescript
const plyText = splatsToPLY(splatData);
console.log(plyText); // PLY 格式的文本
```

#### splatsToBlob(splatData: SplatData): Blob

将溅射数据导出为 Blob 对象。

**参数:**
- `splatData`: 溅射数据对象

**返回值:**
- `Blob`: Blob 对象

**示例:**
```typescript
const blob = splatsToBlob(splatData);
const url = URL.createObjectURL(blob);
```

#### splatsToDownloadURL(splatData: SplatData): string

将溅射数据导出为可下载的 URL。

**参数:**
- `splatData`: 溅射数据对象

**返回值:**
- `string`: 可下载的 URL

**示例:**
```typescript
const url = splatsToDownloadURL(splatData);
const a = document.createElement('a');
a.href = url;
a.download = 'molecule.ply';
a.click();
```

### 药物库支持

#### DrugLibraryRenderer

药物库渲染器类，支持大规模化合物库的可视化。

**构造函数:**
```typescript
new DrugLibraryRenderer(config: DrugLibraryConfig)
```

**DrugLibraryConfig 接口:**
```typescript
interface DrugLibraryConfig {
  maxCompounds: number;
  lodLevels: LoDLevel[];
  batchSize: number;
}
```

**LoDLevel 接口:**
```typescript
interface LoDLevel {
  distance: number;
  detail: number;
}
```

**方法:**
- `addCompound(entry: CompoundEntry)`: 添加化合物
- `removeCompound(id: string)`: 移除化合物
- `updateLOD(cameraDistance: number)`: 更新细节层次
- `getVisibleCompounds()`: 获取可见化合物

**CompoundEntry 接口:**
```typescript
interface CompoundEntry {
  id: string;
  name: string;
  molecule: Molecule;
  position: [number, number, number];
  metadata?: Record<string, any>;
}
```

**示例:**
```typescript
const library = new DrugLibraryRenderer({
  maxCompounds: 1000,
  lodLevels: [
    { distance: 100, detail: 1.0 },
    { distance: 500, detail: 0.5 },
    { distance: 1000, detail: 0.1 },
  ],
  batchSize: 50,
});

library.addCompound({
  id: 'aspirin',
  name: 'Aspirin',
  molecule: aspirinMolecule,
  position: [0, 0, 0],
});
```

### 分子对接可视化

#### interactionLinesToSplats(interactions: MolecularInteraction[], atoms: Atom[]): SplatData

将分子相互作用转换为 3D 高斯溅射数据。

**参数:**
- `interactions`: 相互作用数组
- `atoms`: 原子数组

**MolecularInteraction 接口:**
```typescript
interface MolecularInteraction {
  type: 'hydrogen_bond' | 'hydrophobic' | 'ionic' | 'pi_stacking' | 'vdw';
  atom1: number;
  atom2: number;
  distance: number;
}
```

**返回值:**
- `SplatData`: 溅射数据对象

**示例:**
```typescript
const interactions = [
  { type: 'hydrogen_bond', atom1: 10, atom2: 25, distance: 2.8 },
  { type: 'hydrophobic', atom1: 15, atom2: 30, distance: 3.5 },
];

const interactionSplats = interactionLinesToSplats(interactions, atoms);
```

#### pharmacophoreToSplats(features: PharmacophoreFeature[]): SplatData

将药效团特征转换为 3D 高斯溅射数据。

**参数:**
- `features`: 药效团特征数组

**PharmacophoreFeature 接口:**
```typescript
interface PharmacophoreFeature {
  type: 'donor' | 'acceptor' | 'hydrophobic' | 'positive' | 'negative' | 'aromatic';
  position: [number, number, number];
  radius: number;
  direction?: [number, number, number];
}
```

**返回值:**
- `SplatData`: 溅射数据对象

**示例:**
```typescript
const features = [
  { type: 'donor', position: [1.0, 2.0, 3.0], radius: 1.5 },
  { type: 'acceptor', position: [4.0, 5.0, 6.0], radius: 1.5 },
];

const pharmacophoreSplats = pharmacophoreToSplats(features);
```

### 渲染器

#### PharmaSparkViewer

3D 高斯溅射查看器类。

**构造函数:**
```typescript
new PharmaSparkViewer(options: PharmaSparkViewerOptions)
```

**PharmaSparkViewerOptions 接口:**
```typescript
interface PharmaSparkViewerOptions {
  container: HTMLElement;
  width?: number;
  height?: number;
  backgroundColor?: number;
  cameraDistance?: number;
}
```

**方法:**

##### addMolecule(name: string, splatData: SplatData): Promise<void>

添加分子到查看器。

**参数:**
- `name`: 分子名称
- `splatData`: 溅射数据对象

**示例:**
```typescript
await viewer.addMolecule('1crn', splatData);
```

##### removeMolecule(name: string): void

从查看器中移除分子。

**参数:**
- `name`: 分子名称

**示例:**
```typescript
viewer.removeMolecule('1crn');
```

##### clear(): void

清除所有分子。

**示例:**
```typescript
viewer.clear();
```

##### setCameraTarget(x: number, y: number, z: number): void

设置相机目标点。

**参数:**
- `x`: X 坐标
- `y`: Y 坐标
- `z`: Z 坐标

**示例:**
```typescript
viewer.setCameraTarget(0, 0, 0);
```

##### setCameraDistance(d: number): void

设置相机距离。

**参数:**
- `d`: 距离

**示例:**
```typescript
viewer.setCameraDistance(100);
```

##### dispose(): void

销毁查看器，释放资源。

**示例:**
```typescript
viewer.dispose();
```

### 元素数据

#### ELEMENTS

元素周期表数据。

**类型:**
```typescript
const ELEMENTS: Map<string, ElementProperties>;
```

**ElementProperties 接口:**
```typescript
interface ElementProperties {
  symbol: string;
  name: string;
  atomicNumber: number;
  atomicMass: number;
  color: [number, number, number];
  vdWRadius: number;
  electronegativity: number;
}
```

**示例:**
```typescript
const carbon = ELEMENTS.get('C');
console.log(carbon.color); // [200, 200, 200]
console.log(carbon.vdWRadius); // 1.7
```

#### getElement(element: string): ElementProperties | undefined

获取元素属性。

**参数:**
- `element`: 元素符号

**返回值:**
- `ElementProperties | undefined`: 元素属性

**示例:**
```typescript
const oxygen = getElement('O');
if (oxygen) {
  console.log(oxygen.name); // 'Oxygen'
}
```

#### AA_HYDROPHOBICITY

氨基酸疏水性数据。

**类型:**
```typescript
const AA_HYDROPHOBICITY: Map<string, number>;
```

**示例:**
```typescript
const hydrophobicity = AA_HYDROPHOBICITY.get('ALA');
console.log(hydrophobicity); // 1.8
```

#### SS_COLORS

二级结构颜色数据。

**类型:**
```typescript
const SS_COLORS: Map<string, [number, number, number]>;
```

**示例:**
```typescript
const helixColor = SS_COLORS.get('H');
console.log(helixColor); // [255, 0, 0]
```

## 错误处理

### 常见错误

#### 解析错误

```typescript
try {
  const protein = parsePDB(invalidPDB);
} catch (error) {
  if (error.message.includes('Invalid PDB format')) {
    console.error('PDB 格式无效');
  }
}
```

#### 渲染错误

```typescript
try {
  await viewer.addMolecule('test', splatData);
} catch (error) {
  if (error.message.includes('WebGL not supported')) {
    console.error('浏览器不支持 WebGL');
  }
}
```

## 性能优化

### 大分子处理

对于大分子（>10,000 原子），建议：

1. **关闭氢原子**: 设置 `includeHydrogens: false`
2. **降低分辨率**: 使用较大的 `radiusScale`
3. **使用 LoD**: 实现多细节层次渲染

```typescript
const splatData = atomsToSplats(atoms, {
  includeHydrogens: false,
  radiusScale: 1.0,
});
```

### 内存管理

及时销毁不再使用的查看器：

```typescript
// 使用完毕后销毁查看器
viewer.dispose();
```

### 批量处理

使用 `DrugLibraryRenderer` 进行批量处理：

```typescript
const library = new DrugLibraryRenderer({
  maxCompounds: 1000,
  batchSize: 50,
});

// 批量添加化合物
for (const compound of compounds) {
  library.addCompound(compound);
}
```

## 浏览器兼容性

### 支持的浏览器

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

### WebGL 要求

- WebGL 2.0
- 支持浮点纹理
- 支持顶点数组对象

### 检测支持

```typescript
function checkWebGLSupport(): boolean {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  return gl !== null;
}

if (!checkWebGLSupport()) {
  console.error('浏览器不支持 WebGL 2.0');
}
```

## 更新日志

### v0.1.0

- 初始版本发布
- PDB 解析器
- SDF 解析器
- 原子到溅射转换
- PLY 导出
- PharmaSparkViewer 渲染器
- 药物库支持
- 分子对接可视化

## 许可证

MIT License

## 联系方式

- 项目维护者: MoKangMedical
- 邮箱: contact@mokangmedical.com
- 项目主页: https://github.com/MoKangMedical/pharmaspark
