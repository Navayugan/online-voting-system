#!/usr/bin/env bash
# Prevent accidental commit of any .env file containing real secrets
# Allowed: .env.example, server/.env.example, client/.env.example

staged_env_files=$(git diff --cached --name-only | grep -E '(^|/)\.env($|\..*)' | grep -v '\.example$' || true)

if [ -n "$staged_env_files" ]; then
  echo "❌ PRE-COMMIT ERROR: Staging .env files with potential secrets is blocked:"
  echo "$staged_env_files"
  echo "Please unstage with: git reset HEAD <file>"
  exit 1
fi

exit 0
