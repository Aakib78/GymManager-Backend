#!/bin/bash

# Stopping existing Node.js servers
echo "Stopping any existing node servers"

# Suppress error if no Node process is found
pkill node || echo "No Node.js process was running"
