#!/usr/bin/env bash
# Court Hub — VPS setup, part 1 of 2. Run as root on a fresh Ubuntu 22.04/24.04 VPS:
#   bash <(curl -fsSL https://raw.githubusercontent.com/niktheplumberking/court-hub-main-work/main/scripts/vps-setup.sh)
#
# Installs the runtime, fetches the site, and configures nginx. It does NOT
# build or start anything yet — the environment file needs the secret key
# first (part 2 does the build). Safe to re-run.
set -euo pipefail

DOMAIN="${1:-courthub.ae}"
APP_DIR="/var/www/courthub"
REPO="https://github.com/niktheplumberking/court-hub-main-work.git"

echo "==> [1/6] System packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git nginx ufw ca-certificates >/dev/null

echo "==> [2/6] Node.js 20"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -c2-3)" -lt 20 ] 2>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
echo "    node $(node -v), npm $(npm -v)"

echo "==> [3/6] Firewall (SSH + web)"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

echo "==> [4/6] Site code -> ${APP_DIR}"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" fetch --quiet origin main
  git -C "${APP_DIR}" reset --hard --quiet origin/main
else
  mkdir -p "$(dirname "${APP_DIR}")"
  git clone --quiet "${REPO}" "${APP_DIR}"
fi

echo "==> [5/6] Environment file"
if [ -f "${APP_DIR}/.env.local" ]; then
  echo "    .env.local already exists — left untouched"
else
  cat > "${APP_DIR}/.env.local" <<EOF
NEXT_PUBLIC_SUPABASE_URL=https://rtbwvbgdbxztrdcthzrb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_6iz5HpKLDVHj3kZTq4qdCQ_exxLlb4A
SUPABASE_SECRET_KEY=PASTE_SUPABASE_SECRET_KEY_HERE
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
NEXT_PUBLIC_WHATSAPP_NUMBER=971558833836
# Uncomment and fill when Stripe goes live, then: pm2 restart courthub
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
EOF
  chmod 600 "${APP_DIR}/.env.local"
  echo "    created (secret key still a placeholder)"
fi

echo "==> [6/6] nginx reverse proxy for ${DOMAIN}"
cat > /etc/nginx/sites-available/courthub <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    client_max_body_size 30m;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
ln -sf /etc/nginx/sites-available/courthub /etc/nginx/sites-enabled/courthub
rm -f /etc/nginx/sites-enabled/default
nginx -t >/dev/null 2>&1 && systemctl reload nginx

cat <<EOF

============================================================
 PART 1 DONE.  Domain: ${DOMAIN}   Server IP: $(hostname -I | awk '{print $1}')

 NEXT: put the Supabase secret key into the environment file:

   nano ${APP_DIR}/.env.local

 Replace PASTE_SUPABASE_SECRET_KEY_HERE with the real key
 (Supabase -> Settings -> API Keys -> Secret key, starts sb_secret_).
 Save with:  Ctrl+O  Enter    Exit with:  Ctrl+X

 THEN run part 2:

   bash ${APP_DIR}/scripts/vps-finish.sh ${DOMAIN}
============================================================
EOF
