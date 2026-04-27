# 更新日志

所有项目的更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- 无

## [0.2.0] - 2026-04-27

### 新增
- 用户系统
  - 用户注册和登录
  - JWT认证
  - 个人中心
  - API配额管理
- 分子管理
  - 保存分子到服务器
  - 分子列表和详情
  - 分子更新和删除
  - 公开/私有分子
  - 分子标签
- 分析功能
  - 基础分析（原子数、残基数、链数）
  - Splat转换分析
  - 表面分析
  - 分析历史记录
- API文档
  - 完整的REST API文档
  - 认证端点
  - 分子端点
  - 分析端点
- 前端更新
  - 用户登录/注册界面
  - 保存分子功能
  - 用户状态显示

### 技术细节
- 使用JWT进行用户认证
- 使用bcrypt进行密码哈希
- 使用uuid生成唯一ID
- 内存数据库（可替换为真实数据库）
- API配额限制（免费用户1000次/月）

### API端点
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息
- `GET /api/molecules` - 获取分子列表
- `GET /api/molecules/:id` - 获取分子详情
- `POST /api/molecules` - 创建分子
- `PUT /api/molecules/:id` - 更新分子
- `DELETE /api/molecules/:id` - 删除分子
- `POST /api/analysis` - 分析分子
- `GET /api/analysis` - 获取分析列表
- `GET /api/analysis/:id` - 获取分析详情

### 订阅层级
- 免费用户：1000次API调用/月
- 专业用户：10000次API调用/月
- 企业用户：无限API调用

## [0.1.5] - 2026-04-27

### 新增
- 添加更多文件格式支持模块 (src/core/file-formats.ts)
  - MOL2 文件解析器
  - XYZ 文件解析器
  - PQR 文件解析器
  - 文件格式自动检测
  - 格式转换函数

## [0.1.4] - 2026-04-27

### 新增
- 添加高级可视化选项模块 (src/core/visualization-options.ts)
  - 多种可视化模式
  - 多种颜色方案
  - 高级可视化函数

## [0.1.3] - 2026-04-27

### 新增
- 添加性能优化模块 (src/core/atom-to-splat-optimized.ts)
  - 批量处理
  - 空间分区
  - 颜色缓存
  - Level of Detail (LOD)
  - 性能监控

## [0.1.2] - 2026-04-27

### 新增
- 添加后端 API 服务 (server/index.ts)
  - PDB 文件上传和解析接口
  - SDF 文件上传和解析接口
  - 示例分子数据接口
  - 健康检查接口

## [0.1.1] - 2026-04-27

### 新增
- 添加前端 Demo 页面（index.html）
- 支持多种颜色模式
- 支持示例分子加载
- 添加交互式控制面板
- 更新 README.md 文档
- 添加 GitHub Actions 工作流
- 添加测试用例

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
| 0.2.x | ✅ 支持 | 当前稳定版本 |
| 0.1.x | ✅ 支持 | 旧版本 |
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
