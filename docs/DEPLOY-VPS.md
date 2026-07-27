# Court Hub — VPS Deployment Runbook (Hostinger)

The exact, copy-paste procedure to put the site live on the Hostinger VPS with the `courthub.ae` domain. Written to be driven in a guided session: Claude dictates, you paste. Do the phases in order. Total time: ~40 minutes plus DNS wait.

## What you need before starting

- [ ] The VPS **IP address** (Hostinger → VPS → Overview, e.g. `145.223.x.x`)
- [ ] Access to the VPS terminal — either Hostinger's **Browser terminal** (VPS panel → Terminal) or SSH as `root`
- [ ] The VPS running **Ubuntu 24.04** (VPS panel → Operating System — rebuild to plain Ubuntu 24.04 if it shows anything else, e.g. a panel template)
- [ ] Access to the **domain's DNS panel** (wherever courthub.ae was registered)
- [ ] The four secret/public values ready to paste **into the server directly** (never into chat): Supabase URL, Supabase publishable key, Supabase secret key, and later the two Stripe keys

## Phase 1 — Point the domain (do first; DNS propagates while you work)

In the domain's DNS panel, create exactly these records (delete conflicting default A/CNAME records for `@` and `www` first):

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | the VPS IP | default |
| A | `www` | the VPS IP | default |

## Phase 2 — Prepare the server (paste block by block)

Open the VPS terminal as root and paste each block, waiting for it to finish:

```bash
apt-get update && apt-get upgrade -y
apt-get install -y curl git nginx ufw
```

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs
node -v   # should print v20.x
```

```bash
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable
```

## Phase 3 — Get the site onto the server

```bash
git clone https://github.com/niktheplumberking/court-hub-main-work.git /var/www/courthub
cd /var/www/courthub
```

Create the environment file (this opens an editor; paste the block, then REPLACE each `PASTE-…-HERE` with the real value from the Supabase/Stripe dashboards; save with Ctrl+O Enter, exit with Ctrl+X):

```bash
nano /var/www/courthub/.env.local
```

```ini
NEXT_PUBLIC_SUPABASE_URL=https://rtbwvbgdbxztrdcthzrb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_6iz5HpKLDVHj3kZTq4qdCQ_exxLlb4A
SUPABASE_SECRET_KEY=PASTE-SUPABASE-SECRET-KEY-HERE
NEXT_PUBLIC_SITE_URL=https://courthub.ae
NEXT_PUBLIC_WHATSAPP_NUMBER=971558833836
# Add when Stripe goes live (Phase 4 of the Launch Playbook):
# STRIPE_SECRET_KEY=PASTE-STRIPE-SECRET-KEY-HERE
# STRIPE_WEBHOOK_SECRET=PASTE-STRIPE-WEBHOOK-SECRET-HERE
```

Build and start (build takes a few minutes):

```bash
cd /var/www/courthub && npm ci && npm run build
```

```bash
npm install -g pm2
pm2 start npm --name courthub -- start
pm2 save && pm2 startup systemd -u root --hp /root
```

Check it's alive: `curl -I http://localhost:3000` should answer `200`.

## Phase 4 — Nginx + free SSL

```bash
cat > /etc/nginx/sites-available/courthub <<'EOF'
server {
    listen 80;
    server_name courthub.ae www.courthub.ae;
    client_max_body_size 30m;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
ln -sf /etc/nginx/sites-available/courthub /etc/nginx/sites-enabled/courthub
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Once the DNS from Phase 1 resolves (check: `ping courthub.ae` shows the VPS IP — can take from minutes to a few hours):

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d courthub.ae -d www.courthub.ae --redirect -m support@courthub.ae --agree-tos --no-eff-email
```

That's it — https://courthub.ae is live with auto-renewing SSL.

## Phase 5 — Smoke test (from any browser)

- [ ] https://courthub.ae loads with the padlock; http:// redirects to https://
- [ ] https://courthub.ae/ar shows the Arabic site
- [ ] https://courthub.ae/shop shows real products
- [ ] https://courthub.ae/admin login works
- [ ] A WhatsApp button opens the business WhatsApp

## Updating the site later (the whole update procedure)

```bash
cd /var/www/courthub && git pull && npm ci && npm run build && pm2 restart courthub
```

## Useful commands

| What | Command |
|---|---|
| Is the site process running? | `pm2 status` |
| Live server logs | `pm2 logs courthub --lines 100` |
| Restart the site | `pm2 restart courthub` |
| Reboot survival is configured by | `pm2 save` (already done above) |
| SSL renewal (automatic; manual test) | `certbot renew --dry-run` |

## Notes

- The old Vercel URL keeps working as a staging mirror unless you delete the project; that's harmless and useful for testing.
- After go-live, update Stripe's webhook URL and keys per the Launch Playbook Phase 4, and add the two Stripe lines to `.env.local`, then `pm2 restart courthub`.
- Tournament permanent database: when created, add its env values to `.env.local` the same way (details come with that upgrade).
