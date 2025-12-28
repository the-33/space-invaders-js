#!/bin/sh
echo "Space Invaders - Local Server"

# === CONFIG ===
PORT=8000
URL="http://localhost:$PORT"

# === CHECK PYTHON ===
if command -v python3 >/dev/null 2>&1; then
    PYTHON=python3
elif command -v python >/dev/null 2>&1; then
    PYTHON=python
else
    echo "Python is neither installed nor added to the path."
    echo "Install python from https://www.python.org/"
    exit 1
fi

# === START SERVER ===
echo "Starting server in $URL"

# Open browser (Linux / macOS)
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL"
elif command -v open >/dev/null 2>&1; then
    open "$URL"
else
    echo "Could not open browser automatically."
fi

# === PYTHON COMMAND ===
$PYTHON -m http.server $PORT