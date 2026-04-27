# PharmaSpark

PharmaSpark — 3D Gaussian Splatting for Pharmaceutical & Biomedical Visualization

## 项目简介

PharmaSpark 是一个基于 3D Gaussian Splatting 技术的分子可视化平台，专为药物发现和生物医学研究设计。它能够将蛋白质和小分子结构转换为高质量的 3D 高斯溅射数据，实现前所未有的实时渲染效果。

## 核心功能

### 分子解析
- **PDB 解析**: 支持蛋白质数据库（PDB）格式
- **SDF 解析**: 支持结构数据文件（SDF）格式
- **MOL2 解析**: 支持 Tripos MOL2 格式
- **XYZ 解析**: 支持 XYZ 坐标格式
- **PQR 解析**: 支持 PQR 格式（含电荷和半径）

### 3D 高斯溅射转换
- **原子到溅射**: 将原子坐标转换为 3D 高斯溅射数据
- **分子到溅射**: 将分子结构转换为 3D 高斯溅射数据
- **键到溅射**: 将化学键转换为 3D 高斯溅射数据
- **表面生成**: 生成分子表面的 3D 高斯溅射表示
- **口袋高亮**: 高亮显示蛋白质结合口袋

### 可视化选项
- **14种可视化模式**: standard, spacefill, surface, cartoon, backbone, wireframe, licorice, sphere, electrostatic, hydrophobicity, b-factor, chain, residue, element
- **10种颜色方案**: element, chain, residue, secondary, b-factor, hydrophobicity, electrostatic, rainbow, gradient, custom
- **性能优化**: 批量处理、空间分区、颜色缓存、LOD支持

### 用户系统
- **用户注册和登录**: 支持邮箱注册、密码登录
- **JWT认证**: 安全的令牌认证
- **个人中心**: 用户信息管理
- **API配额管理**: 免费/专业/企业层级

### 分子管理
- **保存分子**: 将分子保存到服务器
- **分子列表**: 查看所有保存的分子
- **分子详情**: 查看分子详细信息
- **分子更新**: 更新分子信息
- **分子删除**: 删除不需要的分子
- **公开/私有**: 控制分子可见性
- **分子标签**: 为分子添加标签

### 分析功能
- **基础分析**: 原子数、残基数、链数统计
- **Splat转换分析**: 3D高斯溅射转换结果
- **表面分析**: 分子表面积和体积估算
- **分析历史**: 查看历史分析记录

### 导出功能
- **PLY导出**: 导出为PLY格式
- **图片导出**: 导出为PNG/JPG图片
- **视频导出**: 导出为MP4视频
- **报告导出**: 生成分析报告

## 技术栈

### 前端
- **TypeScript**: 类型安全的 JavaScript 超集
- **Vite**: 现代化的前端构建工具
- **Three.js**: 3D 图形库
- **Spark.js**: GPU 加速的 3D 高斯溅射渲染器

### 后端
- **Express.js**: Web 应用框架
- **better-sqlite3**: SQLite 数据库
- **JWT**: JSON Web Token 认证
- **bcrypt**: 密码哈希
- **multer**: 文件上传处理

### 部署
- **Docker**: 容器化部署
- **GitHub Actions**: CI/CD 流程
- **GitHub Pages**: 静态资源托管

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- Docker (可选)

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/MoKangMedical/pharmaspark.git
cd pharmaspark
```

2. **安装依赖**
```bash
pnpm install
cd server && pnpm install && cd ..
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量
```

4. **启动开发服务器**
```bash
# 启动前端和后端
pnpm start

# 或分别启动
pnpm dev      # 前端 (端口 8097)
pnpm server   # 后端 (端口 8000)
```

5. **访问应用**
- 前端: http://localhost:8097
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/

### Docker 部署

1. **构建镜像**
```bash
docker build -t pharmaspark .
```

2. **运行容器**
```bash
docker run -d -p 8000:8000 --name pharmaspark pharmaspark
```

3. **使用 Docker Compose**
```bash
docker-compose up -d
```

## API 文档

### 认证端点

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

#### 获取用户信息
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### 分子端点

#### 获取分子列表
```http
GET /api/molecules
Authorization: Bearer <token>
```

#### 获取分子详情
```http
GET /api/molecules/:id
Authorization: Bearer <token>
```

#### 创建分子
```http
POST /api/molecules
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Molecule Name",
  "format": "pdb",
  "data": "PDB file content",
  "isPublic": false,
  "tags": ["tag1", "tag2"]
}
```

#### 更新分子
```http
PUT /api/molecules/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "isPublic": true,
  "tags": ["new-tag"]
}
```

#### 删除分子
```http
DELETE /api/molecules/:id
Authorization: Bearer <token>
```

### 分析端点

#### 分析分子
```http
POST /api/analysis
Authorization: Bearer <token>
Content-Type: application/json

{
  "moleculeId": "molecule-id",
  "type": "basic",
  "options": {
    "colorMode": "element",
    "radiusScale": 0.5
  }
}
```

#### 获取分析列表
```http
GET /api/analysis
Authorization: Bearer <token>
```

#### 获取分析详情
```http
GET /api/analysis/:id
Authorization: Bearer <token>
```

## 项目结构

```
pharmaspark/
├── src/                    # 前端源代码
│   ├── core/              # 核心功能
│   │   ├── atom-to-splat.ts
│   │   ├── atom-to-splat-optimized.ts
│   │   ├── visualization-options.ts
│   │   ├── file-formats.ts
│   │   ├── pdb-parser.ts
│   │   ├── sdf-parser.ts
│   │   ├── elements.ts
│   │   ├── ply-export.ts
│   │   ├── drug-library.ts
│   │   └── docking.ts
│   ├── renderers/         # 渲染器
│   │   └── spark-bridge.ts
│   └── index.ts           # 主入口
├── server/                # 后端源代码
│   ├── index.ts           # Express服务器
│   ├── database.ts        # SQLite数据库
│   └── package.json       # 后端依赖
├── tests/                 # 测试文件
│   └── core/
│       ├── pdb-parser.test.ts
│       ├── sdf-parser.test.ts
│       └── atom-to-splat.test.ts
├── docs/                  # 文档
├── .github/               # GitHub配置
│   └── workflows/
│       └── ci.yml
├── index.html             # 前端Demo页面
├── package.json           # 前端依赖
├── vite.config.ts         # Vite配置
├── vitest.config.ts       # Vitest配置
├── Dockerfile             # Docker配置
├── docker-compose.yml     # Docker Compose配置
├── .env.example           # 环境变量示例
├── CHANGELOG.md           # 更新日志
├── CONTRIBUTING.md        # 贡献指南
└── README.md              # 项目说明
```

## 订阅层级

### 免费用户
- 1,000 次 API 调用/月
- 基础分子解析
- 基础可视化选项
- 社区支持

### 专业用户 ($29/月)
- 10,000 次 API 调用/月
- 高级分子解析
- 所有可视化选项
- 分子保存和管理
- 分析功能
- 邮件支持

### 企业用户 ($99/月)
- 无限 API 调用
- 所有功能
- 自定义部署
- 优先支持
- SLA保障

## 部署指南

### 生产环境部署

1. **配置环境变量**
```bash
export JWT_SECRET=your-production-secret
export DB_PATH=/var/lib/pharmaspark/pharmaspark.db
export NODE_ENV=production
```

2. **构建生产版本**
```bash
pnpm build
cd server && pnpm build && cd ..
```

3. **启动服务**
```bash
cd server && node dist/index.js
```

### 使用 PM2 部署

1. **安装 PM2**
```bash
npm install -g pm2
```

2. **启动服务**
```bash
pm2 start server/dist/index.js --name pharmaspark
```

3. **设置开机自启**
```bash
pm2 startup
pm2 save
```

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name pharmaspark.example.com;

    location / {
        root /path/to/pharmaspark/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 监控和日志

### 健康检查
```bash
curl http://localhost:8000/health
```

### 日志文件
- 应用日志: `/var/log/pharmaspark/app.log`
- 错误日志: `/var/log/pharmaspark/error.log`
- 访问日志: `/var/log/pharmaspark/access.log`

### 监控指标
- API 响应时间
- 错误率
- 用户活跃度
- 分子处理数量

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
