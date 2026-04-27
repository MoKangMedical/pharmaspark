#!/bin/bash
# PharmaSpark 一键部署脚本
# 3D分子可视化引擎
PORT=${1:-8093}
echo "🧬 PharmaSpark 部署中..."
echo "   端口: $PORT"

cd "$(dirname "$0")"
npm install 2>/dev/null || true
npm run dev -- --port $PORT 2>/dev/null || npx serve dist -l $PORT 2>/dev/null || python3 -m http.server $PORT

echo "✅ PharmaSpark 已启动: http://localhost:$PORT"
