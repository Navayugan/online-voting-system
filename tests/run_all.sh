#!/usr/bin/env bash
# Runs the complete acceptance suite against a freshly reset database.
# Prereqs: MySQL running, `mysql` CLI, Node 18+, Python 3 + `pip install playwright && playwright install chromium`,
#          server deps installed, client built:  (cd client && REACT_APP_API_URL=http://127.0.0.1:8000 npm run build)
# Env: MYSQL_PWD (root password), optional MYSQL_HOST/MYSQL_USER/DB_NAME/API_BASE/WEB_BASE
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}" MYSQL_USER="${MYSQL_USER:-root}" DB_NAME="${DB_NAME:-employee_voting_system}"
export API_BASE="${API_BASE:-http://127.0.0.1:8000}" WEB_BASE="${WEB_BASE:-http://localhost:3000}"
export TZ=Asia/Kolkata   # the timezone bugs only show up away from UTC
reset_db() {
  mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" < "$ROOT/server/database/schema.sql" && mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" < "$ROOT/server/database/seed.sql"
}
start_stack() {
  (cd "$ROOT/server" && DB_HOST="$MYSQL_HOST" DB_USER="$MYSQL_USER" DB_PASSWORD="${MYSQL_PWD:-}" DB_NAME="$DB_NAME" JWT_SECRET="test-secret-at-least-32-chars-long-ovms-jwt" FRONTEND_URL="$WEB_BASE" node src/server.js >/tmp/ovms_api.log 2>&1 & echo $! > /tmp/ovms_api.pid)
  (cd "$ROOT/tests" && node spa_server.js >/tmp/ovms_web.log 2>&1 & echo $! > /tmp/ovms_web.pid)
  sleep 3
}
stop_stack() {
  [ -f /tmp/ovms_api.pid ] && kill -9 "$(cat /tmp/ovms_api.pid)" 2>/dev/null || true
  [ -f /tmp/ovms_web.pid ] && kill -9 "$(cat /tmp/ovms_web.pid)" 2>/dev/null || true
  pkill -9 -f "src/server.js" 2>/dev/null || true
  pkill -9 -f "spa_server.js" 2>/dev/null || true
}
trap stop_stack EXIT
FAIL=0
for step in "api:node $ROOT/tests/api/api_e2e.js" "ui-roles:python3 $ROOT/tests/ui/ui_e2e_roles.py" "ui-flows:python3 $ROOT/tests/ui/ui_e2e_flows.py"; do
  name="${step%%:*}"; cmd="${step#*:}"
  echo; echo "=============== $name ==============="
  reset_db; start_stack
  $cmd || FAIL=1
  stop_stack; sleep 1
done
exit $FAIL
