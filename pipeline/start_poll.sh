#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
nohup caffeinate -i /Users/thehyyu/Documents/EchoForge/.venv/bin/python "$SCRIPT_DIR/poll.py" \
    >> "$SCRIPT_DIR/poll.log" \
    2>> "$SCRIPT_DIR/poll.err.log" &
