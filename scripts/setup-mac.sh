#!/bin/bash
# macOS 一键修复脚本
# 解决：Node 版本旧、npm 权限不足、Vercel CLI 安装

set -e

echo "=========================================="
echo "macOS 环境修复 + Vercel 配置"
echo "=========================================="

# 1. 安装 nvm（如果未安装）
if [ ! -d "$HOME/.nvm" ]; then
  echo "[1/6] 安装 nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
  echo "[1/6] nvm 已安装"
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# 2. 安装 Node 20
echo "[2/6] 安装 Node.js 20..."
nvm install 20
nvm use 20
node -v

# 3. 安装 Vercel CLI（使用 npx 避免权限问题）
echo "[3/6] 安装 Vercel CLI..."
npm install -g vercel

# 4. 登录 Vercel
echo "[4/6] 登录 Vercel..."
echo "请在弹出的浏览器中完成登录"
vercel login

# 5. 运行环境变量配置脚本
echo "[5/6] 配置环境变量..."
bash scripts/setup-vercel-env.sh

# 6. 部署
echo "[6/6] 部署到生产环境..."
vercel --prod

echo ""
echo "=========================================="
echo "完成！"
echo "数据库迁移将在 Vercel 构建时自动执行"
echo "=========================================="
