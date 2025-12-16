#!/bin/bash

# Download free notification sounds for the app
# Using freesound.org Creative Commons 0 (public domain) sounds

SOUNDS_DIR="public/sounds"

echo "📥 Downloading notification sounds..."

# Bell sound - classic notification bell
curl -L -o "$SOUNDS_DIR/bell.mp3" "https://freesound.org/data/previews/415/415510_5121236-lq.mp3"

# Chime sound - soft chime
curl -L -o "$SOUNDS_DIR/chime.mp3" "https://freesound.org/data/previews/320/320655_5260872-lq.mp3"

# Ding sound - single ding tone
curl -L -o "$SOUNDS_DIR/ding.mp3" "https://freesound.org/data/previews/203/203121_777645-lq.mp3"

# Pop sound - bubble pop
curl -L -o "$SOUNDS_DIR/pop.mp3" "https://freesound.org/data/previews/381/381629_5121236-lq.mp3"

# Create empty file for "none" option
touch "$SOUNDS_DIR/none.mp3"

echo "✅ Sound files downloaded successfully!"
echo ""
echo "Sound attribution (Creative Commons 0):"
echo "  - bell.mp3: Notification bell by Breviceps"
echo "  - chime.mp3: Soft chime by Fupicat"
echo "  - ding.mp3: Ding sound by Aldenroth2"
echo "  - pop.mp3: Pop sound by Breviceps"
echo ""
echo "All sounds from freesound.org - Creative Commons 0 License"
