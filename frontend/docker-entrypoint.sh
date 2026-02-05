#!/bin/sh
set -e

# Generate runtime config from environment variables
envsubst < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js

echo "Runtime configuration generated:"
cat /usr/share/nginx/html/config.js

# Start nginx
exec nginx -g "daemon off;"
