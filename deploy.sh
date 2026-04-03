#!/bin/bash
# ============================================================
#  卡路里大作战 - 一键部署脚本
#  适用于 Ubuntu/Debian 系统
#  用法: bash deploy.sh
# ============================================================

set -e

# ---------- 颜色 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ---------- 配置 ----------
APP_DIR="/opt/calorie-battle"
DB_NAME="calorie_battle"
DB_USER="calorie"
DB_PASS="Calorie2026!@#"
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
SERVER_PORT=3001
NGINX_PORT=8080

# ---------- 1. 系统更新 ----------
info "更新系统包..."
apt-get update -qq

# ---------- 2. 安装基础工具 ----------
info "安装基础工具..."
apt-get install -y -qq curl wget git unzip sshpass > /dev/null 2>&1

# ---------- 3. 安装 Node.js 20 ----------
if command -v node &>/dev/null && node -v | grep -q "v20"; then
    info "Node.js $(node -v) 已安装"
else
    info "安装 Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
    info "Node.js $(node -v) 安装完成"
fi

# ---------- 4. 安装 MySQL 8 ----------
if command -v mysql &>/dev/null; then
    info "MySQL 已安装"
else
    info "安装 MySQL 8.0..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get install -y -qq mysql-server > /dev/null 2>&1
    # 启动 MySQL
    service mysql start 2>/dev/null || systemctl start mysql 2>/dev/null || true
    sleep 3
fi

# 确保 MySQL 在运行
service mysql start 2>/dev/null || systemctl start mysql 2>/dev/null || true
sleep 2

# ---------- 5. 配置 MySQL ----------
info "配置 MySQL 数据库..."
mysql -u root <<EOF
-- 创建数据库和用户
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
info "数据库 ${DB_NAME} 创建完成"

# ---------- 6. 安装 PM2 ----------
if command -v pm2 &>/dev/null; then
    info "PM2 已安装"
else
    info "安装 PM2..."
    npm install -g pm2 > /dev/null 2>&1
fi

# ---------- 7. 安装 Nginx ----------
if command -v nginx &>/dev/null; then
    info "Nginx 已安装"
else
    info "安装 Nginx..."
    apt-get install -y -qq nginx > /dev/null 2>&1
fi

# ---------- 8. 克隆代码 ----------
if [ -d "$APP_DIR" ]; then
    info "更新代码..."
    cd "$APP_DIR"
    git pull origin main
else
    info "克隆代码到 $APP_DIR ..."
    git clone https://github.com/Yogdunana/calorie-battle.git "$APP_DIR"
    cd "$APP_DIR"
fi

# ---------- 9. 安装后端依赖 ----------
info "安装后端依赖..."
cd "$APP_DIR/calorie-battle-server"
npm install --production 2>&1 | tail -1

# ---------- 10. 配置后端环境变量 ----------
info "配置环境变量..."
cat > "$APP_DIR/calorie-battle-server/.env" <<EOF
PORT=${SERVER_PORT}
NODE_ENV=production

# MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Upload
UPLOAD_DIR=${APP_DIR}/calorie-battle-server/uploads
MAX_FILE_SIZE=10485760
EOF

# ---------- 11. 构建前端 ----------
info "构建前端 (这可能需要几分钟)..."
cd "$APP_DIR/calorie-battle-web"
npm install --legacy-peer-deps 2>&1 | tail -1
npx vite build 2>&1 | tail -3

# ---------- 12. 创建上传目录 ----------
mkdir -p "$APP_DIR/calorie-battle-server/uploads"

# ---------- 13. 用 PM2 启动后端 ----------
info "启动后端服务..."
cd "$APP_DIR/calorie-battle-server"
pm2 delete calorie-battle 2>/dev/null || true
pm2 start server.js --name calorie-battle --env production
pm2 save
pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null || true

# ---------- 14. 配置 Nginx ----------
info "配置 Nginx..."
cat > /etc/nginx/sites-available/calorie-battle <<'EOF'
server {
    listen 8080;
    server_name _;

    # 前端静态文件
    location / {
        root /opt/calorie-battle/calorie-battle-web/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        client_max_body_size 10M;
    }

    # 上传文件访问
    location /uploads/ {
        alias /opt/calorie-battle/calorie-battle-server/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用站点配置
ln -sf /etc/nginx/sites-available/calorie-battle /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# 测试 Nginx 配置
nginx -t 2>&1
service nginx restart 2>/dev/null || systemctl restart nginx 2>/dev/null || true

# ---------- 15. 防火墙放行 ----------
if command -v ufw &>/dev/null; then
    ufw allow 8080/tcp 2>/dev/null || true
fi

# ---------- 16. 验证部署 ----------
echo ""
echo "============================================"
info "验证部署状态..."
echo "============================================"

sleep 3

# 检查 PM2
if pm2 pid calorie-battle > /dev/null 2>&1; then
    info "PM2 进程运行中 (PID: $(pm2 pid calorie-battle))"
else
    warn "PM2 进程未运行，请检查日志: pm2 logs calorie-battle"
fi

# 检查 Nginx
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/ | grep -q "200"; then
    info "Nginx 运行正常"
else
    warn "Nginx 可能未正常启动"
fi

# 检查 API
API_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${SERVER_PORT}/api/v1/health 2>/dev/null || echo "000")
if [ "$API_CHECK" = "200" ]; then
    info "后端 API 正常"
else
    warn "后端 API 返回 HTTP ${API_CHECK}，请检查: pm2 logs calorie-battle"
fi

echo ""
echo "============================================"
echo -e "${GREEN}  🎉 部署完成！${NC}"
echo "============================================"
echo ""
echo "  访问地址:  http://$(curl -s ifconfig.me 2>/dev/null || echo '你的服务器IP'):8080"
echo "  管理员账号: admin"
echo "  管理员密码: admin123456"
echo ""
echo "  常用命令:"
echo "    pm2 logs calorie-battle    # 查看日志"
echo "    pm2 restart calorie-battle # 重启服务"
echo "    pm2 stop calorie-battle    # 停止服务"
echo ""
echo "  数据库信息:"
echo "    数据库名: ${DB_NAME}"
echo "    用户名:   ${DB_USER}"
echo "    密码:     ${DB_PASS}"
echo ""
echo "============================================"
