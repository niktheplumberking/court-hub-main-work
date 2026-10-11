#!/usr/bin/env bash
# Court Hub — server hardening. Run as root on the VPS (safe to re-run):
#   bash /var/www/courthub/scripts/vps-harden.sh
#
# What it does (nothing here can lock you out of the server):
#  1. fail2ban        — bans IPs that keep guessing the SSH password
#  2. auto-updates    — Ubuntu security patches install themselves daily
#  3. nginx           — hides version numbers, flood/slow-attack limits
#                       (rolled back automatically if nginx rejects them)
#  4. secrets         — .env.local readable by root only
#  5. firewall check  — only SSH + web open; app port 3000 never public
set -uo pipefail

APP_DIR="/var/www/courthub"
export DEBIAN_FRONTEND=noninteractive

echo "==> [1/5] fail2ban (SSH brute-force protection)"
apt-get update -qq
apt-get install -y -qq fail2ban unattended-upgrades >/dev/null
cat > /etc/fail2ban/jail.d/courthub.local <<'EOF'
[sshd]
enabled  = true
maxretry = 6
findtime = 10m
bantime  = 1h
EOF
systemctl enable --now fail2ban >/dev/null 2>&1
systemctl restart fail2ban
echo "    fail2ban: $(systemctl is-active fail2ban)"

echo "==> [2/5] Automatic security updates"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
systemctl enable --now unattended-upgrades >/dev/null 2>&1
echo "    unattended-upgrades: $(systemctl is-active unattended-upgrades)"

echo "==> [3/5] nginx hardening"
CONF=/etc/nginx/conf.d/courthub-security.conf
cat > "$CONF" <<'EOF'
# Court Hub security settings (scripts/vps-harden.sh)
server_tokens off;

# Per-visitor flood limits. Generous on purpose: many UAE mobile users share
# one public IP (carrier NAT), and one page load fetches dozens of files.
limit_req_zone  $binary_remote_addr zone=courthub_req:10m rate=30r/s;
limit_req       zone=courthub_req burst=150 nodelay;
limit_req_status 429;
limit_conn_zone $binary_remote_addr zone=courthub_conn:10m;
limit_conn      courthub_conn 60;

# Drop "slowloris" connections that dribble bytes to tie up the server.
client_header_timeout 15s;
client_body_timeout   15s;
send_timeout          30s;
EOF
if nginx -t >/dev/null 2>&1; then
  systemctl reload nginx
  echo "    applied (nginx config test passed)"
else
  echo "    nginx rejected the settings — rolling back, site untouched:"
  nginx -t 2>&1 | tail -3
  rm -f "$CONF"
  nginx -t >/dev/null 2>&1 && systemctl reload nginx
fi

echo "==> [4/5] Secret file permissions"
if [ -f "${APP_DIR}/.env.local" ]; then
  chown root:root "${APP_DIR}/.env.local"
  chmod 600 "${APP_DIR}/.env.local"
  echo "    .env.local: $(stat -c '%A %U' "${APP_DIR}/.env.local")"
fi

echo "==> [5/5] Firewall"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true
ufw status | sed 's/^/    /'
if ss -ltn 2>/dev/null | grep -qE '0\.0\.0\.0:3000|\[::\]:3000|\*:3000'; then
  echo "    note: app listens on all interfaces; firewall blocks 3000 from outside."
  echo "          (the next deploy switches it to 127.0.0.1 only)"
else
  echo "    app port 3000: local only"
fi

echo
echo "============================================================"
echo " HARDENING DONE. Quick check: open https://courthub.ae"
echo " Banned IPs any time:  fail2ban-client status sshd"
echo "============================================================"
