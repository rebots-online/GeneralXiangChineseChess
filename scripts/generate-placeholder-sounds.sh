#!/bin/bash

# Create directories if they don't exist
mkdir -p ../public/sounds/common
mkdir -p ../public/sounds/xiangqi

# Common sounds
COMMON_SOUNDS=(
  "button-click"
  "notification"
  "success"
  "error"
  "toggle"
  "copy"
  "paste"
  "dialog-open"
  "dialog-close"
)

# Xiangqi sounds
XIANGQI_SOUNDS=(
  "piece-move"
  "piece-capture"
  "check"
  "game-start"
  "game-end"
  "invalid-move"
  "piece-select"
)

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
  echo "ffmpeg is required but not installed. Please install it first."
  exit 1
fi

# Generate common sounds
for sound in "${COMMON_SOUNDS[@]}"; do
  echo "Generating placeholder for common sound: $sound"
  # Generate a simple beep sound with different frequencies for different sounds
  case "$sound" in
    "button-click")
      freq=800
      duration=0.1
      ;;
    "notification")
      freq=1000
      duration=0.3
      ;;
    "success")
      freq=1200
      duration=0.5
      ;;
    "error")
      freq=400
      duration=0.3
      ;;
    "toggle")
      freq=600
      duration=0.1
      ;;
    "copy")
      freq=900
      duration=0.1
      ;;
    "paste")
      freq=700
      duration=0.1
      ;;
    "dialog-open")
      freq=500
      duration=0.2
      ;;
    "dialog-close")
      freq=450
      duration=0.2
      ;;
    *)
      freq=500
      duration=0.2
      ;;
  esac
  
  ffmpeg -f lavfi -i "sine=frequency=$freq:duration=$duration" -c:a libmp3lame -q:a 2 "../public/sounds/common/$sound.mp3" -y
done

# Generate xiangqi sounds
for sound in "${XIANGQI_SOUNDS[@]}"; do
  echo "Generating placeholder for xiangqi sound: $sound"
  # Generate a simple beep sound with different frequencies for different sounds
  case "$sound" in
    "piece-move")
      freq=600
      duration=0.2
      ;;
    "piece-capture")
      freq=400
      duration=0.3
      ;;
    "check")
      freq=1000
      duration=0.4
      ;;
    "game-start")
      freq=800
      duration=0.5
      ;;
    "game-end")
      freq=600
      duration=0.6
      ;;
    "invalid-move")
      freq=300
      duration=0.2
      ;;
    "piece-select")
      freq=700
      duration=0.1
      ;;
    *)
      freq=500
      duration=0.2
      ;;
  esac
  
  ffmpeg -f lavfi -i "sine=frequency=$freq:duration=$duration" -c:a libmp3lame -q:a 2 "../public/sounds/xiangqi/$sound.mp3" -y
done

echo "All placeholder sounds generated successfully!"
