#!/usr/bin/env bash
# Fresh test world → build → serve → load test → tear down.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"

cleanup() {
  powershell -NoProfile -Command "Get-Process postgrest,postgres,initdb -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue; Get-NetTCPConnection -LocalPort 3105,54331,12111 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force -ErrorAction SilentlyContinue }" >/dev/null 2>&1
}
cleanup
sleep 2
rm -rf "$HERE/infra-data"

cd "$HERE" && node infra.mjs > infra.log 2>&1 &
for i in $(seq 1 90); do grep -q READY "$HERE/infra.log" 2>/dev/null && break; sleep 2; done
grep -q READY "$HERE/infra.log" || { echo "infra failed"; tail -20 "$HERE/infra.log"; cleanup; exit 1; }
echo "infra up"

export NEXT_PUBLIC_SUPABASE_URL=http://localhost:54331 NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-test \
  SUPABASE_SECRET_KEY=secret-test STRIPE_SECRET_KEY=sk_test_fake STRIPE_WEBHOOK_SECRET=whsec_loadtest \
  STRIPE_API_BASE=http://127.0.0.1:12111 NEXT_PUBLIC_SITE_URL=http://localhost:3105
cd "$REPO"
if [ "${SKIP_BUILD:-0}" != 1 ]; then
  rm -rf .next && npx next build > "$HERE/build.log" 2>&1 || { echo "build failed"; tail -30 "$HERE/build.log"; cleanup; exit 1; }
  echo "build ok"
fi
npx next start -p 3105 > "$HERE/next.log" 2>&1 &
for i in $(seq 1 60); do grep -q Ready "$HERE/next.log" 2>/dev/null && break; sleep 1; done
echo "site up"

cd "$HERE" && node load.mjs
echo "---- server log (errors) ----"
grep -iE "error|fail|\[checkout\]|\[fulfill\]|\[release\]|\[sweep\]" "$HERE/next.log" | sort | uniq -c | head -20
cleanup
rm -rf "$REPO/.next"   # test build has test settings baked in; never leave it behind
