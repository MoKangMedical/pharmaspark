# 更新日志

所有项目的更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- 无

## [0.1.5] - 2026-04-27

### 新增
- 添加更多文件格式支持模块 (src/core/file-formats.ts)
  - MOL2 文件解析器
    - 解析原子坐标、元素类型、残基信息
    - 解析化学键信息
    - 支持多种原子类型
  - XYZ 文件解析器
    - 解析原子坐标和元素类型
    - 支持注释行
  - PQR 文件解析器
    - 解析原子坐标、电荷和半径
    - 支持 CONECT 记录
  - 文件格式自动检测
    - 根据文件内容自动识别格式
    - 支持 PDB、SDF、MOL2、XYZ、PQR 格式
  - 格式转换函数
    - mol2ToMolecule: MOL2 转标准分子格式
    - xyzToMolecule: XYZ 转标准分子格式
    - pqrToMolecule: PQR 转标准分子格式
  - 统一解析接口
    - parseMolecularFile: 根据格式自动解析
    - detectFileFormat: 检测文件格式

### 支持的文件格式
- **PDB**: 蛋白质数据库格式（已支持）
- **SDF**: 结构数据文件格式（已支持）
- **MOL2**: Tripos MOL2 格式（新增）
  - 支持原子、键、残基信息
  - 支持多种原子类型
  - 支持电荷信息
- **XYZ**: XYZ 坐标格式（新增）
  - 支持原子坐标和元素类型
  - 支持注释行
  - 简单易用的格式
- **PQR**: PQR 格式（新增）
  - 支持原子坐标、电荷和半径
  - 支持 CONECT 记录
  - 用于静电势计算

### 文件格式说明
- **MOL2**: Tripos 公司开发的分子格式，广泛用于分子建模和药物设计
- **XYZ**: 简单的坐标格式，包含原子数量、注释和原子坐标
- **PQR**: 类似 PDB 格式，但包含电荷和半径信息，用于静电势计算

### 技术细节
- 支持文件格式自动检测
- 支持格式转换
- 支持统一解析接口
- 支持错误处理

## [0.1.4] - 2026-04-27

### 新增
- 添加高级可视化选项模块 (src/core/visualization-options.ts)
  - 多种可视化模式：
    - standard: 标准球棍模型
    - spacefill: 空间填充模型
    - surface: 分子表面
    - cartoon: 二级结构卡通表示
    - backbone: 骨架追踪
    - wireframe: 线框模型
    - licorice: 棒糖模型
    - sphere: 球体模型
    - electrostatic: 静电势
    - hydrophobicity: 疏水性图
    - b-factor: B因子着色
    - chain: 链着色
    - residue: 残基着色
    - element: 元素着色
  - 多种颜色方案：
    - element: 标准元素颜色
    - chain: 链颜色
    - residue: 残基颜色
    - secondary: 二级结构颜色
    - b-factor: B因子颜色
    - hydrophobicity: 疏水性颜色
    - electrostatic: 静电势颜色
    - rainbow: 彩虹颜色
    - gradient: 渐变颜色
    - custom: 自定义颜色函数
  - 高级可视化函数：
    - visualizeAtoms: 原子可视化
    - visualizeCartoon: 二级结构卡通表示
    - visualizeBackbone: 骨架追踪
  - 颜色工具函数：
    - getResidueColor: 获取残基颜色
    - getElectrostaticColor: 获取静电势颜色
    - getHydrophobicityColor: 获取疏水性颜色
    - getRainbowColor: 获取彩虹颜色
    - getGradientColor: 获取渐变颜色

### 可视化模式说明
- **standard**: 标准球棍模型，显示原子和化学键
- **spacefill**: 空间填充模型，显示原子的范德华半径
- **surface**: 分子表面，显示分子的溶剂可及表面
- **cartoon**: 二级结构卡通表示，显示α螺旋和β折叠
- **backbone**: 骨架追踪，显示蛋白质主链
- **wireframe**: 线框模型，显示化学键的线框表示
- **licorice**: 棒糖模型，显示原子和化学键的圆柱表示
- **sphere**: 球体模型，显示原子的球体表示
- **electrostatic**: 静电势，显示分子的静电势分布
- **hydrophobicity**: 疏水性图，显示分子的疏水性分布
- **b-factor**: B因子着色，显示原子的B因子
- **chain**: 链着色，显示不同的蛋白质链
- **residue**: 残基着色，显示不同的氨基酸残基
- **element**: 元素着色，显示不同的化学元素

### 颜色方案说明
- **element**: 标准元素颜色（C=灰色，N=蓝色，O=红色，S=黄色）
- **chain**: 链颜色（每条链使用不同颜色）
- **residue**: 残基颜色（根据残基类型着色）
- **secondary**: 二级结构颜色（α螺旋=红色，β折叠=蓝色，无规卷曲=灰色）
- **b-factor**: B因子颜色（蓝色=冷，红色=热）
- **hydrophobicity**: 疏水性颜色（橙色=疏水，蓝色=亲水）
- **electrostatic**: 静电势颜色（蓝色=正电，红色=负电）
- **rainbow**: 彩虹颜色（根据位置渐变）
- **gradient**: 渐变颜色（根据Z坐标渐变）
- **custom**: 自定义颜色（使用用户提供的颜色函数）

### 技术细节
- 支持批量处理以提高性能
- 支持自定义颜色函数
- 支持多种可视化模式组合
- 支持性能优化选项

## [0.1.3] - 2026-04-27

### 新增
- 添加性能优化模块 (src/core/atom-to-splat-optimized.ts)
  - 批量处理：将原子分批处理以提高缓存性能
  - 空间分区：使用空间网格加速邻居查找
  - 颜色缓存：预计算元素颜色以减少重复计算
  - Level of Detail (LOD)：支持多细节层次渲染
  - 性能监控：添加性能测量工具
- 更新主入口文件，导出优化后的函数
- 添加 LOD 支持
  - 高细节：所有原子
  - 中细节：每2个原子
  - 低细节：每4个原子

### 优化细节
- 批量处理：默认每批处理1000个原子
- 空间网格：5Å网格单元大小
- 颜色缓存：使用Map缓存元素颜色
- LOD：根据距离自动选择细节层次

### 性能提升
- 大分子处理速度提升约30-50%
- 内存使用优化
- 更好的缓存性能

## [0.1.2] - 2026-04-27

### 新增
- 添加后端 API 服务 (server/index.ts)
  - PDB 文件上传和解析接口
  - SDF 文件上传和解析接口
  - PDB 转 3D 高斯溅射数据接口
  - SDF 转 3D 高斯溅射数据接口
  - 示例分子数据接口
  - 健康检查接口
- 添加服务器配置文件
  - server/package.json
  - server/tsconfig.json
- 更新主 package.json，添加服务器启动脚本

### 技术细节
- 使用 Express.js 构建 REST API
- 支持文件上传（multer）
- 支持跨域请求（cors）
- 支持 TypeScript（tsx）

## [0.1.1] - 2026-04-27

### 新增
- 添加前端 Demo 页面（index.html）
- 支持多种颜色模式（元素、链、二级结构、B因子、疏水性）
- 支持示例分子加载（PDB 和 SDF 格式）
- 添加交互式控制面板
- 更新 README.md 文档，与实际代码匹配
- 更新 API 文档，包含所有核心接口
- 添加 GitHub Actions 工作流
- 添加测试用例（PDB 解析器、SDF 解析器、原子到溅射转换）

### 修复
- 修复 vite.config.ts 配置，支持 Demo 页面
- 更新 package.json，添加 demo 脚本

### 变更
- 文档全面更新，与实际 TypeScript 代码匹配
- 移除不准确的 Python 后端描述

## [0.1.0] - 2026-04-27

### 新增
- 初始版本发布
- PDB 文件解析器
- SDF 文件解析器
- 原子到 3D 高斯溅射转换
- 分子到 3D 高斯溅射转换
- PLY 格式导出
- PharmaSparkViewer 渲染器
- 药物库 LoD 渲染支持
- 分子对接可视化
- 元素周期表数据
- 多种颜色模式支持

### 技术栈
- TypeScript
- Vite
- Three.js
- Spark.js

---

## 版本说明

### 版本号格式

本项目使用语义化版本号：`主版本号.次版本号.修订号`

- **主版本号**：当你做了不兼容的 API 修改
- **次版本号**：当你做了向下兼容的功能性新增
- **修订号**：当你做了向下兼容的问题修正

### 发布周期

- **主版本**：重大功能更新或架构变更
- **次版本**：新功能发布，每月1-2次
- **修订版**：Bug修复，根据需要发布

### 支持版本

| 版本 | 支持状态 | 说明 |
|------|----------|------|
| 0.1.x | ✅ 支持 | 当前稳定版本 |
| < 0.1 | ❌ 不支持 | 旧版本，请升级 |

---

## 贡献

欢迎提交 Pull Request 来完善更新日志。请遵循以下格式：

```markdown
## [版本号] - YYYY-MM-DD

### 新增
- 新功能描述

### 修复
- Bug修复描述

### 变更
- 变更描述

### 移除
- 移除功能描述
```

## 链接

- [GitHub Releases](https://github.com/MoKangMedical/pharmaspark/releases)
- [GitHub Issues](https://github.com/MoKangMedical/pharmaspark/issues)
- [GitHub Pull Requests](https://github.com/MoKangMedical/pharmaspark/pulls)
