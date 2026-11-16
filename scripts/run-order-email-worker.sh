#!/usr/bin/env bash
set -euo pipefail
cd /var/www/courthub
# Load only the server's protected environment, without putting secrets in argv or logs.
exec flock -n /var/lib/courthub/order-emails.worker.lock node --env-file=.env.local .next/order-email-worker/worker.js
