#!/usr/bin/env bash
# Converts Apple Wallet certificates into the base64 values for Vercel env vars.
# Guide: docs/04-engineering/wallet-setup.md
#
#   bash scripts/wallet-certs.sh ~/Downloads/pass.p12 ~/Downloads/AppleWWDRCAG4.cer
#
# Output goes to ./wallet-secrets/ (git-ignored). Never commit these files.
set -euo pipefail

P12="${1:?Usage: bash scripts/wallet-certs.sh <pass.p12> <AppleWWDRCAG4.cer>}"
WWDR="${2:?Usage: bash scripts/wallet-certs.sh <pass.p12> <AppleWWDRCAG4.cer>}"
OUT="wallet-secrets"
mkdir -p "$OUT"
chmod 700 "$OUT"

read -r -s -p "Пароль от .p12 (который задали при экспорте из «Связки ключей»): " PASS
echo

# OpenSSL 3 needs -legacy for .p12 files exported by macOS Keychain; fall back without it for LibreSSL.
p12() { openssl pkcs12 -legacy "$@" -passin "pass:$PASS" 2>/dev/null || openssl pkcs12 "$@" -passin "pass:$PASS"; }

p12 -in "$P12" -clcerts -nokeys -out "$OUT/signerCert.pem"
p12 -in "$P12" -nocerts -nodes -out "$OUT/signerKey.pem"
openssl x509 -inform der -in "$WWDR" -out "$OUT/wwdr.pem"

base64 < "$OUT/signerCert.pem" | tr -d '\n' > "$OUT/WALLET_SIGNER_CERT_B64.txt"
base64 < "$OUT/signerKey.pem" | tr -d '\n' > "$OUT/WALLET_SIGNER_KEY_B64.txt"
base64 < "$OUT/wwdr.pem" | tr -d '\n' > "$OUT/WALLET_WWDR_CERT_B64.txt"
openssl rand -base64 32 | tr -d '\n' > "$OUT/WALLET_LINK_SECRET.txt"
chmod 600 "$OUT"/*

echo
echo "Готово. В папке $OUT/ четыре файла .txt — содержимое каждого вставьте в Vercel"
echo "(Settings → Environment Variables) под тем же именем, что у файла:"
ls -1 "$OUT"/*.txt
echo
echo "Ещё две переменные — без файлов:"
echo "  WALLET_PASS_TYPE_ID = pass.am.smartcontacts.card"
echo "  WALLET_TEAM_ID      = ваш Team ID (developer.apple.com → Membership)"
echo
echo "После этого удалите папку $OUT/ (rm -rf $OUT) и сделайте Redeploy в Vercel."
