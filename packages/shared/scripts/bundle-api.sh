#!/bin/bash
# Wrapper script to run redocly bundle and filter out npm deprecation warnings
set -o pipefail
redocly bundle ./src/openapi/openapi.json --output ./src/openapi.json --dereferenced 2>&1 | grep -v 'npm warn Unknown env config' || true
exit "${PIPESTATUS[0]}"
