#!/bin/bash
# Wrapper script to run redocly bundle and filter out npm deprecation warnings
redocly bundle ./src/openapi/openapi.json --output ./src/openapi.json 2>&1 | grep -v 'npm warn Unknown env config' || true

