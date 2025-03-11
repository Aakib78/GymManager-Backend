#!/bin/bash
set -e  # Stop on first error
exec > >(tee -a /tmp/application_stop.log) 2>&1  # Log output

echo "Stopping existing Node.js servers..."

# Check if a process is running on port 8080
if sudo lsof -i :8080; then
    echo "Port 8080 is in use, stopping process..."
    sudo fuser -k 8080/tcp || true
    pkill -f node || true
else
    echo "No process found on port 8080"
fi

echo "Application stop script completed."
