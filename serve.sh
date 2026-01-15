#!/bin/bash
# Lokalni HTTP server pro vyvoj
# Spusti: ./serve.sh

PORT=${1:-8080}
echo "Spoustim server na http://localhost:$PORT"
echo "Pro ukonceni stiskni Ctrl+C"
python3 -m http.server $PORT
