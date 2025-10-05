#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Monitoring logs for web, api, and db deployments..."

monitor_logs() {
  local deployment=$1
  echo "Starting log monitoring for $deployment..."
  kubectl logs -f deployment/$deployment --follow &
}

monitor_logs web
monitor_logs api
monitor_logs db

echo "All log monitors started. Press Ctrl+C to stop."

wait
