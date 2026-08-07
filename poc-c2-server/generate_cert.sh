#!/usr/bin/env bash
# Generate a self-signed TLS cert/key for the isolated lab C2 server.
# Never commit the output (lab_cert.pem / lab_key.pem) — .gitignore excludes them.
set -euo pipefail

openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout lab_key.pem -out lab_cert.pem -days 30 \
    -subj "/CN=poc-c2-server.lab"

echo "Generated lab_cert.pem / lab_key.pem (valid 30 days, lab-only)."
