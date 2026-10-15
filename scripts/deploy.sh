#!/usr/bin/env bash

set -Eeuo pipefail

if [[ $# -ne 2 || ! "$1" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: $0 <40-character-git-sha> <release-archive>" >&2
  exit 64
fi

readonly revision="$1"
readonly app_root="/var/www/conversation-intel"
readonly releases_dir="$app_root/releases"
readonly release_dir="$releases_dir/$revision"
readonly archive="$app_root/$2"

if [[ "$archive" != "$app_root/incoming/$revision.tar.gz" || ! -f "$archive" ]]; then
  echo "Invalid or missing release archive" >&2
  exit 66
fi

mkdir -p "$releases_dir"

if [[ ! -d "$release_dir" ]]; then
  mkdir "$release_dir"
  tar -xzf "$archive" -C "$release_dir"
fi
rm -f "$archive"

cd "$release_dir"
ln -sfn "$app_root/shared/.env.production" .env.production

npm ci --no-audit --no-fund
npm run build

ln -sfn "$release_dir" "$app_root/current.next"
mv -Tf "$app_root/current.next" "$app_root/current"

cd "$app_root/current"
pm2 startOrReload ecosystem.config.cjs --env production --update-env
pm2 save --force

curl --fail --silent --show-error \
  --retry 10 --retry-delay 2 --retry-connrefused \
  http://127.0.0.1:3000/ >/dev/null

echo "Deployed $revision"
