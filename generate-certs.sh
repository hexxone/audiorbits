#!/bin/sh
if ! command -v mkcert &> /dev/null; then
    echo "mkcert not found. Run: brew install mkcert"
    exit 1
fi
mkcert -install
mkcert localhost 127.0.0.1 ::1
