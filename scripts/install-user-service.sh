#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_SOURCE="$ROOT_DIR/ops/tapcup-local.service"
USER_UNIT_DIR="${HOME}/.config/systemd/user"
USER_UNIT_PATH="${USER_UNIT_DIR}/tapcup-local.service"

mkdir -p "$USER_UNIT_DIR"
cp "$UNIT_SOURCE" "$USER_UNIT_PATH"
rm -rf "${USER_UNIT_DIR}/tapcup-local.service.d"

systemctl --user daemon-reload
systemctl --user enable --now tapcup-local.service
systemctl --user status tapcup-local.service --no-pager --lines=20
