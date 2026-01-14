#!/bin/bash
# Railway startup script for Music Bingo API

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install -e .

# Start the server
uvicorn musicbingo_api.main:app --host 0.0.0.0 --port $PORT
