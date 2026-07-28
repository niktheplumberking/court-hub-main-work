#!/usr/bin/env bash
# Court Hub — VPS setup, part 2 of 2. Run as root AFTER the secret key is in
# /var/www/courthub/.env.local:
#   bash /var/www/courthub/scripts/vps-finish.sh courthub.ae
#
# Builds the site, starts it under pm2 (survives reboots), and offers SSL.
# Safe to re-run — this is also the "update the site" script.
set -euo pipefail

DOMAIN="${1:-courthub.ae}"
APP_DIR="/var/www/courthub"
cd "${APP_DIR}"

if grep -q "PASTE_SUPABASE_SECRET_KEY_HERE" .env.local; then
  echo "STOP: the Supabase secret key is still a placeholder."
  echo "Run:  nano ${APP_DIR}/.env.local   then re-run this script."
  exit 1
fi

echo "==> [1/4] Installing dependencies (a few minutes)"
npm ci --no-audit --no-fund

echo "==> [2/4] Building the site (a few minutes)"
npm run build

echo "==> [3/4] Starting the site with pm2"
npm install -g pm2 --silent >/dev/null 2>&1 || true
if pm2 describe courthub >/dev/null 2>&1; then
  pm2 restart courthub --update-env
else
  pm2 start npm --name courthub -- start
fi
pm2 save >/dev/null
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

sleep 3
if curl -fsS -o /dev/null -w '%{http_code}' http://127.0.0.1:3000 | grep -q 200; then
  echo "    site is answering on port 3000"
else
  echo "    WARNING: no answer on port 3000 yet — check: pm2 logs courthub"
fi

echo "==> [4/4] SSL certificate"
if ! command -v certbot >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
fi
SERVER_IP="$(hostname -I | awk '{print $1}')"
DNS_IP="$(getent hosts "${DOMAIN}" | awk '{print $1}' | head -1 || true)"
if [ "${DNS_IP}" = "${SERVER_IP}" ]; then
  certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" --redirect \
    -m support@"${DOMAIN}" --agree-tos --no-eff-email --non-interactive
  echo "    HTTPS is on: https://${DOMAIN}"
else
  echo "    Skipped: ${DOMAIN} points to '${DNS_IP:-nothing}', server is ${SERVER_IP}."
  echo "    DNS has not propagated yet. Once it has, run this to finish SSL:"
  echo "      certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --redirect -m support@${DOMAIN} --agree-tos --no-eff-email"
fi

cat <<EOF

============================================================
 DONE. The site is running and will restart automatically
 after a reboot.

 Check it:      https://${DOMAIN}   (or http://${SERVER_IP} before DNS)
 Live logs:     pm2 logs courthub --lines 50
 Status:        pm2 status
 Update later:  bash ${APP_DIR}/scripts/vps-finish.sh ${DOMAIN}
                (after: git -C ${APP_DIR} pull)
============================================================
EOF
