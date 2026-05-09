#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PREVIEW_ROOT="/home/kosta/projects/dev/.tapcup-preview-worktrees"
CURRENT_LINK="${PREVIEW_ROOT}/current"
CURRENT_BRANCH="$(git -C "$ROOT_DIR" symbolic-ref --short HEAD)"
SAFE_BRANCH="$(printf '%s' "$CURRENT_BRANCH" | sed 's#[^A-Za-z0-9._-]\+#--#g')"
TARGET_PATH="${PREVIEW_ROOT}/${SAFE_BRANCH}"

mkdir -p "$PREVIEW_ROOT"

if [ ! -d "$TARGET_PATH" ]; then
  git -C "$ROOT_DIR" worktree add --force "$TARGET_PATH" "$CURRENT_BRANCH"
fi

if [ ! -e "${TARGET_PATH}/node_modules" ]; then
  ln -s "${ROOT_DIR}/node_modules" "${TARGET_PATH}/node_modules"
fi

rm -rf "$CURRENT_LINK"
ln -s "$TARGET_PATH" "$CURRENT_LINK"

printf 'Prepared TapCup preview worktree:\n'
printf '  branch: %s\n' "$CURRENT_BRANCH"
printf '  target: %s\n' "$TARGET_PATH"
printf '  current: %s\n' "$CURRENT_LINK"
